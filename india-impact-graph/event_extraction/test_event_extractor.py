import unittest
from event_extractor import (
    FinancialEventExtractor, FakeDeterministicProvider,
    InvalidInputError, SchemaValidationError, ExtractionProviderError
)

class TestFinancialEventExtractor(unittest.TestCase):
    def setUp(self):
        self.provider = FakeDeterministicProvider()
        self.extractor = FinancialEventExtractor(self.provider)

    # 1. Valid provider result becomes a schema-valid structured event.
    def test_valid_article_extraction(self):
        text = "ARTICLE: Report shows inflation is high."
        result = self.extractor.extract(text)
        self.assertEqual(result["event_id"], "rbi-inflation-report")
        self.assertEqual(result["event_type"], "macroeconomic_indicator_release")
        self.assertFalse(result["is_scenario"])
        self.assertEqual(result["event_date"], "2024-05-10")
        
        # 2. Valid article-reported event preserves its available provenance.
        self.assertEqual(len(result["evidence_snippets"]), 1)
        self.assertEqual(result["evidence_snippets"][0]["source_title"], "Financial Times")
        self.assertEqual(result["evidence_snippets"][0]["publication_date"], "2024-05-11")

    # 3. Explicit hypothetical scenario retains the correct classification.
    def test_hypothetical_scenario(self):
        text = "SCENARIO: +12% crude oil shock globally"
        result = self.extractor.extract(text)
        self.assertTrue(result["is_scenario"])
        self.assertEqual(result["event_type"], "commodity_price_shock")
        self.assertEqual(result["magnitude"]["direction"], "increase")
        self.assertEqual(result["magnitude"]["value"], 12)

    # 4. Empty input is rejected or produces the documented unavailable result.
    def test_empty_input(self):
        with self.assertRaises(InvalidInputError):
            self.extractor.extract("")
        with self.assertRaises(InvalidInputError):
            self.extractor.extract("   \n  ")

    # 5. Malformed JSON / Invalid Provider Response
    def test_malformed_json_from_provider(self):
        with self.assertRaises(ExtractionProviderError):
            self.extractor.extract("BAD_JSON here")

    # 6. Missing required fields in extraction
    def test_missing_required_fields(self):
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.extract("MISSING_REQUIRED")
        self.assertIn("Missing required field", str(cm.exception))

    # 7. Unsupported event types and enumerations
    def test_invalid_event_type(self):
        # We manually inject a bad event to test the validator directly
        bad_event = {
            "event_id": "test",
            "event_type": "INVALID_TYPE",
            "is_scenario": False,
            "entities": [],
            "evidence_snippets": []
        }
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.validate_event(bad_event)
        self.assertIn("Invalid event_type", str(cm.exception))

    # 8. Date format validation
    def test_invalid_date_format(self):
        bad_event = {
            "event_id": "test",
            "event_type": "geopolitical_conflict",
            "is_scenario": False,
            "event_date": "10-05-2024", # Invalid ISO
            "entities": [],
            "evidence_snippets": []
        }
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.validate_event(bad_event)
        self.assertIn("event_date must be in YYYY-MM-DD", str(cm.exception))

    # 9. Invalid magnitude direction
    def test_invalid_magnitude_direction(self):
        bad_event = {
            "event_id": "test",
            "event_type": "geopolitical_conflict",
            "is_scenario": False,
            "magnitude": {"direction": "upwards"}, # Invalid enum
            "entities": [],
            "evidence_snippets": []
        }
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.validate_event(bad_event)
        self.assertIn("Invalid magnitude direction", str(cm.exception))
        
    # 10. Missing entity required fields
    def test_invalid_entity_fields(self):
        bad_event = {
            "event_id": "test",
            "event_type": "geopolitical_conflict",
            "is_scenario": False,
            "entities": [{"name": "Missing ID"}],
            "evidence_snippets": []
        }
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.validate_event(bad_event)
        self.assertIn("Entity missing required field", str(cm.exception))

    # 11. Acceptance test: free-text headline extraction with recognized indicator, direction, percentage
    def test_free_text_acceptance_crude_oil_surge(self):
        text = "Crude oil surges by 15% amid geopolitical tensions"
        result = self.extractor.extract(text)
        self.assertEqual(result["event_id"], "crude-oil-increase-15pct")
        self.assertEqual(result["event_type"], "commodity_price_shock")
        self.assertFalse(result["is_scenario"])
        self.assertEqual(result["headline"], "Crude oil surges by 15% amid geopolitical tensions")
        self.assertEqual(result["magnitude"]["direction"], "increase")
        self.assertEqual(result["magnitude"]["value"], 15.0)
        self.assertEqual(result["magnitude"]["unit"], "%")
        self.assertEqual(len(result["entities"]), 1)
        self.assertEqual(result["entities"][0]["entity_id"], "crude_oil")
        self.assertEqual(result["entities"][0]["name"], "Crude Oil")
        self.assertEqual(result["entities"][0]["entity_type"], "commodity")
        self.assertEqual(result["entities"][0]["mention_text"], "Crude oil")
        self.assertEqual(len(result["evidence_snippets"]), 1)
        self.assertEqual(result["evidence_snippets"][0]["quote"], text)
        self.assertEqual(result["evidence_snippets"][0]["source_title"], "Input Text")

    # 12. Free-text diesel drop with percentage
    def test_free_text_diesel_drop(self):
        text = "Diesel prices drop by 3% following excise cut"
        result = self.extractor.extract(text)
        self.assertEqual(result["event_id"], "diesel-decrease-3pct")
        self.assertEqual(result["event_type"], "commodity_price_shock")
        self.assertEqual(result["magnitude"]["direction"], "decrease")
        self.assertEqual(result["magnitude"]["value"], 3.0)
        self.assertEqual(result["magnitude"]["unit"], "%")
        self.assertEqual(len(result["entities"]), 1)
        self.assertEqual(result["entities"][0]["entity_id"], "diesel")

    # 13. Free-text repo rate hike in basis points
    def test_free_text_repo_rate_hike(self):
        text = "RBI hikes repo rate by 50 bps"
        result = self.extractor.extract(text)
        self.assertEqual(result["event_id"], "rbi-repo-rate-increase-50bps")
        self.assertEqual(result["event_type"], "central_bank_policy_rate")
        self.assertEqual(result["magnitude"]["direction"], "increase")
        self.assertEqual(result["magnitude"]["value"], 50.0)
        self.assertEqual(result["magnitude"]["unit"], "bps")
        self.assertEqual(len(result["entities"]), 1)
        self.assertEqual(result["entities"][0]["entity_id"], "rbi_repo_rate")

    # 14. Free-text retail inflation rise
    def test_free_text_retail_inflation_rise(self):
        text = "Retail inflation rises by 0.5% in March"
        result = self.extractor.extract(text)
        self.assertEqual(result["event_id"], "retail-inflation-increase-0_5pct")
        self.assertEqual(result["event_type"], "macroeconomic_indicator_release")
        self.assertEqual(result["magnitude"]["direction"], "increase")
        self.assertEqual(result["magnitude"]["value"], 0.5)
        self.assertEqual(result["magnitude"]["unit"], "%")
        self.assertEqual(len(result["entities"]), 1)
        self.assertEqual(result["entities"][0]["entity_id"], "retail_inflation")

    # 15. Ambiguous direction raises SchemaValidationError
    def test_free_text_ambiguous_direction(self):
        text = "Crude oil surges initially but drops by 4% later"
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.extract(text)
        self.assertIn("Ambiguous direction", str(cm.exception))

    # 16. Ambiguous magnitude raises SchemaValidationError
    def test_free_text_ambiguous_magnitude(self):
        text = "Crude oil prices rise by 10% or 15%"
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.extract(text)
        self.assertIn("Ambiguous magnitude", str(cm.exception))

    # 17. Unsupported non-financial text raises SchemaValidationError
    def test_free_text_unsupported_non_financial(self):
        text = "National sports team wins championship title"
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.extract(text)
        self.assertIn("Unsupported text", str(cm.exception))

    # 18. Unsupported text without direction or magnitude raises SchemaValidationError
    def test_free_text_unsupported_no_direction_or_magnitude(self):
        text = "General background discussion regarding crude oil"
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.extract(text)
        self.assertIn("Unsupported text", str(cm.exception))

    # 19. Conflicting event types raise SchemaValidationError
    def test_free_text_conflicting_event_types(self):
        text = "Crude oil surges by 10% while repo rate hikes by 25 bps"
        with self.assertRaises(SchemaValidationError) as cm:
            self.extractor.extract(text)
        self.assertIn("Multiple conflicting event types", str(cm.exception))


if __name__ == '__main__':
    unittest.main()
