import unittest

from scripts.sru_discovery import parse_explain_indexes, parse_scan_terms


class SruDiscoveryTest(unittest.TestCase):
    def test_parses_index_names_from_explain(self) -> None:
        xml = b"""<explainResponse xmlns='http://docs.oasis-open.org/ns/search-ws/sruResponse'>
          <record><recordData><explain xmlns='http://explain.z3950.org/dtd/2.0/'>
            <indexInfo><index id='dt.title'/><index id='c.product-area'/></indexInfo>
          </explain></recordData></record>
        </explainResponse>"""
        self.assertEqual(parse_explain_indexes(xml), ["c.product-area", "dt.title"])

    def test_parses_collection_scan(self) -> None:
        xml = b"""<scanResponse xmlns='http://docs.oasis-open.org/ns/search-ws/scan'>
          <terms><term><value>officielepublicaties</value><numberOfRecords>42</numberOfRecords></term></terms>
        </scanResponse>"""
        self.assertEqual(
            parse_scan_terms(xml),
            [{"value": "officielepublicaties", "number_of_records": 42}],
        )


if __name__ == "__main__":
    unittest.main()
