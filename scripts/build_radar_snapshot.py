"""Project a complete collector run and selected supplier passages into dashboard JSON."""
import json
import sys
from pathlib import Path
from xml.etree import ElementTree

from source_http import fetch_url


def build(report):
    if report["unresolved"] or not report["documents"]:
        raise ValueError("Incomplete collection. Keeping the previous dashboard snapshot.")
    sources = []
    passages = []
    for doc in report["documents"]:
        url = doc["source_url"]
        if not url or not doc["checked_at"]:
            raise ValueError("Missing source provenance")
        sources.append({key: doc[key] for key in (
            "title", "source_url", "document_kind", "checked_at", "valid_from", "valid_to"
        )})
        if doc["source_identifier"] != "BWBR0050714":
            continue
        root = ElementTree.fromstring(fetch_url(doc["document_url"]))
        for article in root.iter("artikel"):
            number = article.findtext("kop/nr")
            if number not in {"2.5", "2.17", "2.32"}:
                continue
            paragraph = article.find("lid/al")
            if paragraph is None:
                paragraph = article.find("al")
            if paragraph is None:
                raise ValueError(f"No opening paragraph for article {number}")
            quote = "".join(paragraph.itertext()).strip()
            if not quote:
                raise ValueError(f"Empty quote for article {number}")
            passages.append(dict(article=number, title=article.findtext("kop/titel"),
                                 quote=quote, url=doc["document_url"], checked=doc["checked_at"]))
    if {p["article"] for p in passages} != {"2.5", "2.17", "2.32"}:
        raise ValueError("Expected Energiewet supplier articles missing")
    return dict(asOf=report["as_of"], sources=sources, passages=passages)


if __name__ == "__main__":
    data = build(json.loads(Path(sys.argv[1]).read_text()))
    target = Path("supabase/seed/radar-snapshot.json")
    temporary = target.with_suffix(".tmp")
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    temporary.replace(target)
