#!/usr/bin/env python3
"""Query and parse the current official-publications SRU 2.0 service."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

if __package__:
    from scripts.source_http import SourceHttpError, fetch_url
else:
    from source_http import SourceHttpError, fetch_url


DEFAULT_ENDPOINT = "https://repository.overheid.nl/sru"

NS = {
    "sru": "http://docs.oasis-open.org/ns/search-ws/sruResponse",
    "diag": "http://docs.oasis-open.org/ns/search-ws/diagnostic",
    "gzd": "http://standaarden.overheid.nl/sru",
    "dcterms": "http://purl.org/dc/terms/",
    "w": "http://standaarden.overheid.nl/wetgeving/",
    "c": "http://standaarden.overheid.nl/collectie/",
}


class OfficialPublicationsError(RuntimeError):
    """Raised when the official-publications SRU cannot answer a query."""


def build_search_url(
    query: str,
    maximum_records: int = 100,
    start_record: int = 1,
    *,
    endpoint: str = DEFAULT_ENDPOINT,
) -> str:
    if not query.strip():
        raise ValueError("query must not be empty")
    if maximum_records < 1 or maximum_records > 1000:
        raise ValueError("maximum_records must be between 1 and 1000")
    if start_record < 1:
        raise ValueError("start_record must be at least 1")
    return f"{endpoint}?{urlencode({
        'operation': 'searchRetrieve',
        'version': '2.0',
        'startRecord': start_record,
        'maximumRecords': maximum_records,
        'query': query,
    })}"


def _local_elements(root: ET.Element, name: str) -> list[ET.Element]:
    return [element for element in root.iter() if element.tag.rsplit("}", 1)[-1] == name]


def _local_text(root: ET.Element, name: str) -> str | None:
    elements = _local_elements(root, name)
    if elements and elements[0].text and elements[0].text.strip():
        return elements[0].text.strip()
    return None


def _text(element: ET.Element, path: str) -> str | None:
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


def _raise_for_diagnostics(root: ET.Element) -> None:
    diagnostics = _local_elements(root, "diagnostic")
    if not diagnostics:
        return
    messages = []
    for diagnostic in diagnostics:
        uri = _local_text(diagnostic, "uri") or "unknown diagnostic"
        message = _local_text(diagnostic, "message") or "no message"
        details = _local_text(diagnostic, "details")
        messages.append(f"{uri}: {message}" + (f" ({details})" if details else ""))
    raise OfficialPublicationsError("; ".join(messages))


def _parse_record(record: ET.Element) -> dict[str, Any]:
    has_version = record.find(".//dcterms:hasVersion", NS)
    item_urls = {}
    for item in record.findall(".//gzd:itemUrl", NS):
        if item.text and item.text.strip():
            item_urls[item.attrib.get("manifestation", "unknown")] = item.text.strip()

    return {
        "position": _text(record, "sru:recordPosition"),
        "identifier": _text(record, ".//dcterms:identifier"),
        "title": _text(record, ".//dcterms:title"),
        "document_type": _text(record, ".//dcterms:type"),
        "language": _text(record, ".//dcterms:language"),
        "creator": _text(record, ".//dcterms:creator"),
        "modified_at_source": _text(record, ".//dcterms:modified"),
        "available_from": _text(record, ".//dcterms:available"),
        "publication_date": _text(record, ".//dcterms:date"),
        "subjects": _texts(record, ".//dcterms:subject"),
        "product_area": _text(record, ".//c:product-area"),
        "content_area": _text(record, ".//c:content-area"),
        "publication_name": _text(record, ".//w:publicatienaam"),
        "publication_year": _text(record, ".//w:jaargang"),
        "publication_number": _text(record, ".//w:publicatienummer"),
        "preferred_url": _text(record, ".//gzd:preferredUrl")
        or (has_version.attrib.get("resourceIdentifier") if has_version is not None else None),
        "document_url": _text(record, ".//gzd:url"),
        "item_urls": item_urls,
    }


def parse_search_response(xml: bytes, *, query: str, source_url: str) -> dict[str, Any]:
    try:
        root = ET.fromstring(xml)
    except ET.ParseError as error:
        raise OfficialPublicationsError(f"response is not valid XML: {error}") from error
    _raise_for_diagnostics(root)
    records = [_parse_record(record) for record in _local_elements(root, "record")]
    return {
        "source": source_url,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "query": query,
        "sru_version": _local_text(root, "version"),
        "total_records": int(_local_text(root, "numberOfRecords") or 0),
        "next_record_position": _local_text(root, "nextRecordPosition"),
        "returned_records": len(records),
        "records": records,
    }


def search_official_publications(
    query: str,
    maximum_records: int = 100,
    start_record: int = 1,
    *,
    timeout: float = 30.0,
) -> dict[str, Any]:
    url = build_search_url(query, maximum_records, start_record)
    try:
        xml = fetch_url(url, timeout)
    except SourceHttpError as error:
        raise OfficialPublicationsError(f"SRU {error}") from error
    return parse_search_response(xml, query=query, source_url=url)
