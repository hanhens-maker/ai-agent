import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from scripts.official_publications_sru import build_search_url, parse_search_response


FIXTURE = Path(__file__).parent / "fixtures" / "official_publications_response.xml"


class OfficialPublicationsSruTest(unittest.TestCase):
    def test_build_search_url_uses_sru_2(self) -> None:
        url = build_search_url('dt.identifier=="stcrt-2026-4089"', maximum_records=5)
        params = parse_qs(urlparse(url).query)
        self.assertEqual(params["operation"], ["searchRetrieve"])
        self.assertEqual(params["version"], ["2.0"])
        self.assertEqual(params["maximumRecords"], ["5"])

    def test_parse_official_publication(self) -> None:
        parsed = parse_search_response(
            FIXTURE.read_bytes(),
            query='dt.identifier=="stcrt-2026-4089"',
            source_url="https://example.test/sru",
        )
        self.assertEqual(parsed["total_records"], 1)
        record = parsed["records"][0]
        self.assertEqual(record["identifier"], "stcrt-2026-4089")
        self.assertEqual(record["publication_name"], "Staatscourant")
        self.assertEqual(record["publication_date"], "2026-02-20")
        self.assertEqual(record["item_urls"]["pdf"], "https://repository.overheid.nl/stcrt-2026-4089.pdf")


if __name__ == "__main__":
    unittest.main()
