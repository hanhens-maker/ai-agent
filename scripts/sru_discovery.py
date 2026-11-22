#!/usr/bin/env python3
"""Discover live SRU indexes and official-publications collections."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from xml.etree import ElementTree as ET

if __package__:
    from scripts.source_http import SourceHttpError, fetch_url
else:
    from source_http import SourceHttpError, fetch_url


BWB_EXPLAIN = (
    "https://zoekservice.overheid.nl/sru/Search?"
    + urlencode({"x-connection": "BWB", "operation": "explain", "version": "1.2"})
)
PUBLICATIONS_EXPLAIN = "https://repository.overheid.nl/sru?operation=explain&version=2.0"
PUBLICATIONS_COLLECTIONS = (
    "https://repository.overheid.nl/sru?"
    + urlencode(
        {
            "operation": "scan",
            "version": "2.0",
            "scanClause": "c.product-area",
            "maximumTerms": 100,
        }
    )
)


def _local_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def parse_explain_indexes(xml: bytes) -> list[str]:
    root = ET.fromstring(xml)
    indexes: set[str] = set()
    for index in root.iter():
        if _local_name(index) != "index":
            continue
        index_id = index.attrib.get("id")
        if index_id:
            indexes.add(index_id)
            continue
        for child in index.iter():
            if _local_name(child) == "name" and child.text and child.text.strip():
                prefix = child.attrib.get("set")
                indexes.add(f"{prefix}.{child.text.strip()}" if prefix else child.text.strip())
                break
    return sorted(indexes)


def parse_scan_terms(xml: bytes) -> list[dict[str, int | str]]:
    root = ET.fromstring(xml)
    terms = []
    for term in root.iter():
        if _local_name(term) != "term":
            continue
        values = {
            _local_name(child): (child.text or "").strip()
            for child in term
        }
        if values.get("value"):
            terms.append(
                {
                    "value": values["value"],
                    "number_of_records": int(values.get("numberOfRecords") or 0),
                }
            )
    return terms


def discover(timeout: float = 30.0) -> dict[str, object]:
    return {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "bwb": {
            "explain_url": BWB_EXPLAIN,
            "indexes": parse_explain_indexes(fetch_url(BWB_EXPLAIN, timeout)),
        },
        "official_publications": {
            "explain_url": PUBLICATIONS_EXPLAIN,
            "indexes": parse_explain_indexes(fetch_url(PUBLICATIONS_EXPLAIN, timeout)),
            "collections": parse_scan_terms(fetch_url(PUBLICATIONS_COLLECTIONS, timeout)),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timeout", type=float, default=30.0)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        result = discover(args.timeout)
    except (ET.ParseError, SourceHttpError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1
    rendered = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
