import unittest
from pathlib import Path

from scripts.collect_compliance_sources import (
    _code_is_in_scope,
    discover_acm_index,
    parse_acm_publication,
)


FIXTURES = Path(__file__).parent / "fixtures"


class ComplianceSourceCollectorTest(unittest.TestCase):
    def test_electricity_scope_excludes_gas_only_codes(self) -> None:
        self.assertFalse(_code_is_in_scope("Transportcode gas TSB", "electricity"))
        self.assertTrue(
            _code_is_in_scope("Informatiecode elektriciteit en gas", "electricity")
        )

    def test_discovers_codes_and_acm_guidance_from_scoped_sections(self) -> None:
        discovered = discover_acm_index(
            (FIXTURES / "acm_energy_index.html").read_bytes(),
            "https://www.acm.nl/nl/energie/wetten-en-regels-voor-de-energiemarkt",
        )
        self.assertEqual(len(discovered["codes"]), 1)
        self.assertEqual(discovered["codes"][0]["title"], "Systeemcode elektriciteit 2026")
        self.assertEqual(len(discovered["guidance"]), 1)
        self.assertTrue(discovered["guidance"][0]["url"].startswith("https://www.acm.nl/"))

    def test_parses_acm_policy_and_publication_date(self) -> None:
        record = parse_acm_publication(
            (FIXTURES / "acm_policy.html").read_bytes(),
            "https://www.acm.nl/nl/publicaties/example",
            "Eisen financiële positie energieleveranciers nader ingevuld",
        )
        self.assertEqual(record["publication_date"], "2026-04-10")
        self.assertEqual(record["modified_at_source"], "2026-09-07")
        self.assertEqual(record["document_kind"], "policy")
        self.assertEqual(len(record["document_urls"]), 1)


if __name__ == "__main__":
    unittest.main()
