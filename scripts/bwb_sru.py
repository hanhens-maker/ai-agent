#!/usr/bin/env python3
"""Query and parse the Dutch Basiswettenbestand (BWB) SRU service.

The script has no third-party dependencies. It returns normalized JSON so the
next pipeline step can decide which records are relevant before any database
write is introduced.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

if __package__:
    from scripts.source_http import SourceHttpError, fetch_url
else:
    from source_http import SourceHttpError, fetch_url


DEFAULT_ENDPOINT = "https://zoekservice.overheid.nl/sru/Search"
DEFAULT_VERSION = "1.2"

NS = {
    "srw": "http://www.loc.gov/zing/srw/",
    "sru2": "http://docs.oasis-open.org/ns/search-ws/sruResponse",
    "diag": "http://www.loc.gov/zing/srw/diagnostic/",
    "diag2": "http://docs.oasis-open.org/ns/search-ws/diagnostic",
    "dcterms": "http://purl.org/dc/terms/",
    "overheid": "http://standaarden.overheid.nl/owms/terms/",
    "bwb": "http://standaarden.overheid.nl/bwb/terms/",
}


class SruError(RuntimeError):
    """Raised when the SRU endpoint returns a diagnostic or invalid response."""


def build_search_url(
    query: str,
    maximum_records: int = 10,
    start_record: int = 1,
    *,
    endpoint: str = DEFAULT_ENDPOINT,
    version: str = DEFAULT_VERSION,
) -> str:
    if not query.strip():
        raise ValueError("query must not be empty")
    if maximum_records < 1 or maximum_records > 1000:
        raise ValueError("maximum_records must be between 1 and 1000")
    if start_record < 1:
        raise ValueError("start_record must be at least 1")

    params = {
        "x-connection": "BWB",
        "operation": "searchRetrieve",
        "version": version,
        "startRecord": start_record,
        "maximumRecords": maximum_records,
        "query": query,
    }
    return f"{endpoint}?{urlencode(params)}"


def fetch_search_response(url: str, timeout: float = 30.0) -> bytes:
    try:
        return fetch_url(url, timeout)
    except SourceHttpError as error:
        raise SruError(f"SRU {error}") from error


def _text(element: ET.Element, *paths: str) -> str | None:
    for path in paths:
        found = element.find(path, NS)
        if found is not None and found.text and found.text.strip():
            return found.text.strip()
    return None


def _texts(element: ET.Element, path: str) -> list[str]:
    return [
        found.text.strip()
        for found in element.findall(path, NS)
        if found.text and found.text.strip()
    ]


def _findall(root: ET.Element, local_name: str) -> list[ET.Element]:
    """Find SRU 1.2 or 2.0 elements without coupling callers to the version."""
    return [element for element in root.iter() if element.tag.rsplit("}", 1)[-1] == local_name]


def _first_local_text(root: ET.Element, local_name: str) -> str | None:
    elements = _findall(root, local_name)
    if elements and elements[0].text and elements[0].text.strip():
        return elements[0].text.strip()
    return None


def _raise_for_diagnostics(root: ET.Element) -> None:
    diagnostics = _findall(root, "diagnostic")
    if not diagnostics:
        return

    messages = []
    for diagnostic in diagnostics:
        uri = _first_local_text(diagnostic, "uri") or "unknown diagnostic"
        message = _first_local_text(diagnostic, "message") or "no message"
        details = _first_local_text(diagnostic, "details")
        suffix = f" ({details})" if details else ""
        messages.append(f"{uri}: {message}{suffix}")
    raise SruError("; ".join(messages))


def _parse_record(record: ET.Element) -> dict[str, Any]:
    return {
        "position": _text(record, "srw:recordPosition", "sru2:recordPosition"),
        "schema": _text(record, "srw:recordSchema", "sru2:recordSchema"),
        "identifier": _text(record, ".//dcterms:identifier"),
        "title": _text(record, ".//dcterms:title"),
        "document_type": _text(record, ".//dcterms:type"),
        "language": _text(record, ".//dcterms:language"),
        "authority": _text(record, ".//overheid:authority"),
        "creator": _text(record, ".//dcterms:creator"),
        "modified_at_source": _text(record, ".//dcterms:modified"),
        "version_created": _text(record, ".//dcterms:created"),
        "legal_areas": _texts(record, ".//bwb:rechtsgebied"),
        "government_domains": _texts(record, ".//bwb:overheidsdomein"),
        "valid_from": _text(record, ".//bwb:geldigheidsperiode_startdatum"),
        "valid_to": _text(record, ".//bwb:geldigheidsperiode_einddatum"),
        "visible_from": _text(record, ".//bwb:zichtperiode_startdatum"),
        "visible_to": _text(record, ".//bwb:zichtperiode_einddatum"),
        "state_uri": _text(record, ".//bwb:toestand"),
        "law_xml_url": _text(record, ".//bwb:locatie_toestand"),
        "wti_url": _text(record, ".//bwb:locatie_wti"),
        "manifest_url": _text(record, ".//bwb:locatie_manifest"),
    }


def parse_search_response(xml: bytes, *, query: str, source_url: str) -> dict[str, Any]:
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as error:
        raise SruError(f"SRU response is not valid XML: {error}") from error

    _raise_for_diagnostics(root)
    records = [_parse_record(record) for record in _findall(root, "record")]

    return {
        "source": source_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "sru_version": _first_local_text(root, "version"),
        "total_records": int(_first_local_text(root, "numberOfRecords") or 0),
        "next_record_position": _first_local_text(root, "nextRecordPosition"),
        "returned_records": len(records),
        "records": records,
    }


def search_bwb(
    query: str,
    maximum_records: int = 10,
    start_record: int = 1,
    *,
    endpoint: str = DEFAULT_ENDPOINT,
    version: str = DEFAULT_VERSION,
    timeout: float = 30.0,
) -> dict[str, Any]:
    url = build_search_url(
        query,
        maximum_records,
        start_record,
        endpoint=endpoint,
        version=version,
    )
    xml = fetch_search_response(url, timeout)
    return parse_search_response(xml, query=query, source_url=url)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Query Dutch national legislation in the official BWB SRU service."
    )
    parser.add_argument(
        "--query",
        required=True,
        help='CQL query, for example: dcterms.identifier==BWBR0050714',
    )
    parser.add_argument("--maximum-records", type=int, default=10)
    parser.add_argument("--start-record", type=int, default=1)
    parser.add_argument("--version", default=DEFAULT_VERSION)
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--output", type=Path, help="Write JSON to this file instead of stdout")
    return parser


def main() -> int:
    args = _parser().parse_args()
    try:
        result = search_bwb(
            args.query,
            args.maximum_records,
            args.start_record,
            version=args.version,
            timeout=args.timeout,
        )
    except (SruError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
        print(
            f"Wrote {result['returned_records']} of {result['total_records']} records "
            f"to {args.output}",
            file=sys.stderr,
        )
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
