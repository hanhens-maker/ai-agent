import unittest
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from scripts.bwb_sru import SruError, build_search_url, parse_search_response


FIXTURE = Path(__file__).parent / "fixtures" / "bwb_search_response.xml"


class BwbSruTest(unittest.TestCase):
    def test_build_search_url_encodes_cql_and_uses_bwb(self) -> None:
        url = build_search_url('titel="Energiewet"', maximum_records=5, start_record=2)
        params = parse_qs(urlparse(url).query)

        self.assertEqual(params["x-connection"], ["BWB"])
        self.assertEqual(params["version"], ["1.2"])
        self.assertEqual(params["query"], ['titel="Energiewet"'])
        self.assertEqual(params["maximumRecords"], ["5"])
        self.assertEqual(params["startRecord"], ["2"])

    def test_parse_search_response_normalizes_bwb_record(self) -> None:
        parsed = parse_search_response(
            FIXTURE.read_bytes(),
            query='titel="Energieregeling"',
            source_url="https://example.test/sru",
        )

        self.assertEqual(parsed["total_records"], 1)
        self.assertEqual(parsed["returned_records"], 1)
        record = parsed["records"][0]
        self.assertEqual(record["identifier"], "BWBR0051774")
        self.assertEqual(record["title"], "Energieregeling")
        self.assertEqual(record["authority"], "Klimaat en Groene Groei")
        self.assertEqual(record["legal_areas"], ["Ondernemingspraktijk"])
        self.assertEqual(record["valid_from"], "2026-07-01")
        self.assertTrue(record["law_xml_url"].endswith("BWBR0051774_2026-07-01_0.xml"))

    def test_parse_search_response_raises_sru_diagnostic(self) -> None:
        xml = b"""<?xml version='1.0'?>
        <diagnostics xmlns='http://docs.oasis-open.org/ns/search-ws/sruResponse'>
          <diagnostic xmlns='http://docs.oasis-open.org/ns/search-ws/diagnostic'>
            <uri>info:srw/diagnostic/1/7</uri>
            <details>x-connection</details>
            <message>Mandatory parameter not supplied</message>
          </diagnostic>
        </diagnostics>"""

        with self.assertRaisesRegex(SruError, "Mandatory parameter not supplied"):
            parse_search_response(xml, query="anything", source_url="https://example.test/sru")


if __name__ == "__main__":
    unittest.main()
