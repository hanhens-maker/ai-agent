#!/usr/bin/env python3
"""Collect trawa's scoped Dutch energy compliance source documents."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

if __package__:
    from scripts.bwb_sru import SruError, search_bwb
    from scripts.official_publications_sru import (
        OfficialPublicationsError,
        search_official_publications,
    )
    from scripts.source_http import SourceHttpError, fetch_url
else:
    from bwb_sru import SruError, search_bwb
    from official_publications_sru import (
        OfficialPublicationsError,
        search_official_publications,
    )
    from source_http import SourceHttpError, fetch_url


DEFAULT_SCOPE = Path("config/compliance_sources.json")


def _clean_text(value: str) -> str:
    value = re.sub(r"\(externe website\)", "", value, flags=re.IGNORECASE)
    return " ".join(value.split()).strip()


def _normalized_title(value: str) -> str:
    return _clean_text(value).casefold()


def _code_is_in_scope(title: str, energy_carrier: str) -> bool:
    normalized = _normalized_title(title)
    if energy_carrier == "electricity":
        return "gas" not in normalized or "elektriciteit" in normalized
    return True


def _cql_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


class AcmIndexParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.current_h2 = ""
        self.links: list[dict[str, str]] = []
        self._heading_buffer: list[str] | None = None
        self._anchor_href: str | None = None
        self._anchor_buffer: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "h2":
            self._heading_buffer = []
        elif tag == "a" and attributes.get("href"):
            self._anchor_href = attributes["href"]
            self._anchor_buffer = []

    def handle_data(self, data: str) -> None:
        if self._heading_buffer is not None:
            self._heading_buffer.append(data)
        if self._anchor_buffer is not None:
            self._anchor_buffer.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "h2" and self._heading_buffer is not None:
            self.current_h2 = _clean_text("".join(self._heading_buffer))
            self._heading_buffer = None
        elif tag == "a" and self._anchor_href and self._anchor_buffer is not None:
            text = _clean_text("".join(self._anchor_buffer))
            if text:
                self.links.append(
                    {"section": self.current_h2, "title": text, "url": self._anchor_href}
                )
            self._anchor_href = None
            self._anchor_buffer = None


class AcmPublicationParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.modified_date: str | None = None
        self.json_ld: list[str] = []
        self.pdf_links: list[str] = []
        self.visible_text: list[str] = []
        self._json_buffer: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "meta" and attributes.get("name") == "dcterms.modified":
            self.modified_date = attributes.get("content")
        elif tag == "script" and attributes.get("type") == "application/ld+json":
            self._json_buffer = []
        elif tag == "a" and attributes.get("href", "").lower().endswith(".pdf"):
            self.pdf_links.append(attributes["href"])

    def handle_data(self, data: str) -> None:
        if self._json_buffer is not None:
            self._json_buffer.append(data)
        if data.strip():
            self.visible_text.append(data.strip())

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._json_buffer is not None:
            self.json_ld.append("".join(self._json_buffer))
            self._json_buffer = None


def discover_acm_index(html: bytes, base_url: str) -> dict[str, list[dict[str, str]]]:
    parser = AcmIndexParser()
    parser.feed(html.decode("utf-8", errors="replace"))
    codes: list[dict[str, str]] = []
    guidance: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()

    for link in parser.links:
        section = link["section"].casefold()
        absolute_url = urljoin(base_url, link["url"])
        host = urlparse(absolute_url).hostname or ""
        key = (_normalized_title(link["title"]), absolute_url)
        if key in seen:
            continue
        if section == "codes energie" and "code" in link["title"].casefold():
            if host.endswith("officielebekendmakingen.nl") or host == "wetten.overheid.nl":
                codes.append({"title": link["title"], "url": absolute_url})
                seen.add(key)
        elif "beleidsregels en richtsnoeren" in section:
            if host == "acm.nl" or host.endswith(".acm.nl"):
                guidance.append({"title": link["title"], "url": absolute_url})
                seen.add(key)
    return {"codes": codes, "guidance": guidance}


def _schema_article(json_ld_blocks: list[str]) -> dict[str, Any]:
    for block in json_ld_blocks:
        try:
            value = json.loads(block)
        except json.JSONDecodeError:
            continue
        candidates = value.get("@graph", []) if isinstance(value, dict) else []
        if isinstance(value, dict) and value.get("@type"):
            candidates = [value, *candidates]
        for candidate in candidates:
            if isinstance(candidate, dict) and candidate.get("@type") in {
                "Article",
                "NewsArticle",
            }:
                return candidate
    return {}


def _iso_publication_date(value: str | None) -> str | None:
    if not value:
        return None
    iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", value)
    if iso_match:
        return iso_match.group(1)
    dutch_match = re.search(r"\b(\d{2})/(\d{2})/(\d{4})\b", value)
    if dutch_match:
        day, month, year = dutch_match.groups()
        return f"{year}-{month}-{day}"
    return None


def parse_acm_publication(html: bytes, url: str, link_title: str) -> dict[str, Any]:
    parser = AcmPublicationParser()
    parser.feed(html.decode("utf-8", errors="replace"))
    article = _schema_article(parser.json_ld)
    title = _clean_text(str(article.get("headline") or article.get("name") or link_title))
    publication_date = _iso_publication_date(article.get("datePublished"))
    modified_date = _iso_publication_date(article.get("dateModified")) or parser.modified_date
    pdf_links = sorted({urljoin(url, link) for link in parser.pdf_links})
    keyword_text = " ".join(
        [title, link_title, " ".join(pdf_links), " ".join(parser.visible_text)]
    ).casefold()
    if "handreiking" in title.casefold() or "handreiking" in link_title.casefold():
        kind = "guidance"
    elif "beleidsregel" in keyword_text:
        kind = "policy"
    elif "handreiking" in keyword_text:
        kind = "guidance"
    else:
        kind = None
    return {
        "title": title,
        "url": url,
        "publication_date": publication_date,
        "modified_at_source": modified_date,
        "document_kind": kind,
        "document_urls": pdf_links,
    }


def _current_record(records: list[dict[str, Any]], as_of: date) -> dict[str, Any] | None:
    as_of_iso = as_of.isoformat()
    current = [
        record
        for record in records
        if (record.get("valid_from") or "0001-01-01") <= as_of_iso
        and (record.get("valid_to") or "9999-12-31") >= as_of_iso
    ]
    return max(current, key=lambda record: record.get("valid_from") or "", default=None)


def _stable_hash(document: dict[str, Any]) -> str:
    stable = {key: value for key, value in document.items() if key not in {"checked_at", "content_hash"}}
    encoded = json.dumps(stable, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def _finish_document(document: dict[str, Any], checked_at: str) -> dict[str, Any]:
    document["checked_at"] = checked_at
    document["content_hash"] = _stable_hash(document)
    return document


def _bwb_document(
    record: dict[str, Any], document_kind: str, checked_at: str
) -> dict[str, Any]:
    identifier = record["identifier"]
    return _finish_document(
        {
            "source": "bwb",
            "source_identifier": identifier,
            "title": record["title"],
            "document_kind": document_kind,
            "version_key": record.get("state_uri") or record.get("law_xml_url"),
            "source_url": f"https://wetten.overheid.nl/{identifier}",
            "document_url": record.get("law_xml_url"),
            "publication_date": record.get("version_created"),
            "modified_at_source": record.get("modified_at_source"),
            "valid_from": record.get("valid_from"),
            "valid_to": record.get("valid_to"),
            "metadata": record,
        },
        checked_at,
    )


def _official_document(
    record: dict[str, Any], title: str, checked_at: str
) -> dict[str, Any]:
    return _finish_document(
        {
            "source": "officiele_publicaties",
            "source_identifier": record["identifier"],
            "title": title,
            "document_kind": "acm_code",
            "version_key": record.get("document_url") or record["identifier"],
            "source_url": record.get("preferred_url"),
            "document_url": record.get("document_url"),
            "publication_date": record.get("publication_date") or record.get("available_from"),
            "modified_at_source": record.get("modified_at_source"),
            "valid_from": None,
            "valid_to": None,
            "metadata": record,
        },
        checked_at,
    )


def _acm_document(record: dict[str, Any], checked_at: str) -> dict[str, Any]:
    return _finish_document(
        {
            "source": "acm",
            "source_identifier": record["url"],
            "title": record["title"],
            "document_kind": record["document_kind"],
            "version_key": record.get("modified_at_source") or record.get("publication_date"),
            "source_url": record["url"],
            "document_url": (record["document_urls"] or [record["url"]])[0],
            "publication_date": record.get("publication_date"),
            "modified_at_source": record.get("modified_at_source"),
            "valid_from": None,
            "valid_to": None,
            "metadata": {"document_urls": record["document_urls"]},
        },
        checked_at,
    )


def _load_scope(path: Path) -> dict[str, Any]:
    scope = json.loads(path.read_text(encoding="utf-8"))
    required = {"bwb_regulations", "acm_energy_index_url", "acm_publications_not_before"}
    missing = required - scope.keys()
    if missing:
        raise ValueError(f"scope is missing: {', '.join(sorted(missing))}")
    return scope


def collect_sources(scope: dict[str, Any], as_of: date, timeout: float = 30.0) -> dict[str, Any]:
    checked_at = datetime.now(timezone.utc).isoformat()
    index_url = scope["acm_energy_index_url"]
    index_html = fetch_url(index_url, timeout, accept="text/html")
    discovered = discover_acm_index(index_html, index_url)
    documents: list[dict[str, Any]] = []
    unresolved: list[dict[str, str]] = []

    regulation_ids = [item["identifier"] for item in scope["bwb_regulations"]]
    regulation_query = " OR ".join(
        f"dcterms.identifier=={identifier}" for identifier in regulation_ids
    )
    regulation_result = search_bwb(regulation_query, 1000, timeout=timeout)
    for target in scope["bwb_regulations"]:
        matching = [
            record
            for record in regulation_result["records"]
            if record.get("identifier") == target["identifier"]
        ]
        current = _current_record(matching, as_of)
        if current:
            documents.append(_bwb_document(current, "regulation", checked_at))
        else:
            unresolved.append({"title": target["title"], "reason": "no current BWB version"})

    energy_carrier = scope.get("market_scope", {}).get("energy_carrier", "electricity")
    scoped_codes = [
        item
        for item in discovered["codes"]
        if _code_is_in_scope(item["title"], energy_carrier)
    ]
    code_titles = [item["title"] for item in scoped_codes]
    code_result = {"records": []}
    if code_titles:
        code_query = " OR ".join(f"titel={_cql_quote(title)}" for title in code_titles)
        code_result = search_bwb(code_query, 1000, timeout=timeout)

    missing_codes = []
    for target in scoped_codes:
        exact = [
            record
            for record in code_result["records"]
            if _normalized_title(record.get("title") or "") == _normalized_title(target["title"])
        ]
        current = _current_record(exact, as_of)
        if current:
            documents.append(_bwb_document(current, "acm_code", checked_at))
        else:
            missing_codes.append(target)

    fallback_by_id: dict[str, dict[str, str]] = {}
    for target in missing_codes:
        match = re.search(r"(stcrt-\d{4}-\d+)", target["url"], flags=re.IGNORECASE)
        if match:
            fallback_by_id[match.group(1).lower()] = target
        else:
            unresolved.append({"title": target["title"], "reason": "no Staatscourant id"})

    if fallback_by_id:
        identifier_clause = " OR ".join(
            f"dt.identifier=={_cql_quote(identifier)}" for identifier in fallback_by_id
        )
        query = (
            'c.product-area=="officielepublicaties" '
            'AND w.publicatienaam=="Staatscourant" '
            f"AND ({identifier_clause})"
        )
        fallback_result = search_official_publications(query, 1000, timeout=timeout)
        records_by_id = {
            (record.get("identifier") or "").lower(): record
            for record in fallback_result["records"]
        }
        for identifier, target in fallback_by_id.items():
            record = records_by_id.get(identifier)
            if record:
                documents.append(_official_document(record, target["title"], checked_at))
            else:
                unresolved.append(
                    {"title": target["title"], "reason": "not found in Staatscourant SRU"}
                )

    guidance_targets: dict[str, dict[str, str]] = {
        link["url"]: link
        for link in [*discovered["guidance"], *scope.get("acm_publications", [])]
    }
    guidance_records: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        future_links = {
            executor.submit(
                fetch_url, link["url"], timeout, accept="text/html"
            ): link
            for link in guidance_targets.values()
        }
        for future in as_completed(future_links):
            link = future_links[future]
            try:
                guidance_records.append(
                    parse_acm_publication(future.result(), link["url"], link["title"])
                )
            except SourceHttpError as error:
                unresolved.append({"title": link["title"], "reason": str(error)})

    cutoff = scope["acm_publications_not_before"]
    for record in guidance_records:
        if record["document_kind"] not in {"guidance", "policy"}:
            continue
        if not record.get("publication_date") or record["publication_date"] < cutoff:
            continue
        documents.append(_acm_document(record, checked_at))

    documents.sort(key=lambda item: (item["document_kind"], item["title"].casefold()))
    return {
        "checked_at": checked_at,
        "as_of": as_of.isoformat(),
        "scope": scope,
        "stats": {
            "documents": len(documents),
            "regulations": sum(item["document_kind"] == "regulation" for item in documents),
            "acm_codes": sum(item["document_kind"] == "acm_code" for item in documents),
            "guidance_and_policies": sum(
                item["document_kind"] in {"guidance", "policy"} for item in documents
            ),
            "discovered_code_titles": len(discovered["codes"]),
            "in_scope_code_titles": len(scoped_codes),
            "checked_acm_publications": len(guidance_targets),
            "unresolved": len(unresolved),
        },
        "unresolved": unresolved,
        "documents": documents,
    }


def write_supabase(documents: list[dict[str, Any]], timeout: float = 30.0) -> None:
    base_url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not base_url or not service_key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
    url = (
        f"{base_url.rstrip('/')}/rest/v1/compliance_source_documents"
        "?on_conflict=source,source_identifier,content_hash"
    )
    body = json.dumps(documents, ensure_ascii=False).encode("utf-8")
    fetch_url(
        url,
        timeout,
        accept="application/json",
        method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        body=body,
    )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Collect trawa compliance source documents.")
    parser.add_argument("--scope", type=Path, default=DEFAULT_SCOPE)
    parser.add_argument("--as-of", type=date.fromisoformat, default=date.today())
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--output", type=Path)
    parser.add_argument(
        "--write-supabase",
        action="store_true",
        help="Upsert the snapshot using service-role credentials from the environment",
    )
    return parser


def main() -> int:
    args = _parser().parse_args()
    try:
        result = collect_sources(_load_scope(args.scope), args.as_of, args.timeout)
        if args.write_supabase:
            write_supabase(result["documents"], args.timeout)
    except (
        OSError,
        ValueError,
        json.JSONDecodeError,
        SruError,
        OfficialPublicationsError,
        SourceHttpError,
    ) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    print(json.dumps(result["stats"], ensure_ascii=False), file=sys.stderr)
    return 2 if result["unresolved"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
