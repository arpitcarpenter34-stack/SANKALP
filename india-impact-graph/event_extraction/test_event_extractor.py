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

if __name__ == '__main__':
    unittest.main()
