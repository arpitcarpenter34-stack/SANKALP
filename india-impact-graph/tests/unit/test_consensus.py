import unittest
from graph.consensus import NewsConsensusService, ArticleClaim

class TestNewsConsensusService(unittest.TestCase):
    def setUp(self):
        self.service = NewsConsensusService()
        
        self.base_event = {
            "event_id": "test-event",
            "event_type": "commodity_price_shock",
            "magnitude": {"value": 10, "direction": "increase"}
        }

    def test_agreement_three_articles(self):
        claims = [
            ArticleClaim(article_id="1", source_url="url1", publisher="pub1", publication_date="2026-01-01", extracted_event=self.base_event),
            ArticleClaim(article_id="2", source_url="url2", publisher="pub2", publication_date="2026-01-01", extracted_event=self.base_event),
            ArticleClaim(article_id="3", source_url="url3", publisher="pub3", publication_date="2026-01-01", extracted_event=self.base_event)
        ]
        result = self.service.compare_claims("test-event", claims)
        self.assertEqual(result.status, "AGREEMENT")
        self.assertEqual(result.source_count, 3)

    def test_disagreement_direction(self):
        event2 = self.base_event.copy()
        event2["magnitude"] = {"value": 10, "direction": "decrease"}
        claims = [
            ArticleClaim(article_id="1", source_url="url1", publisher="pub1", publication_date="2026-01-01", extracted_event=self.base_event),
            ArticleClaim(article_id="2", source_url="url2", publisher="pub2", publication_date="2026-01-01", extracted_event=event2)
        ]
        result = self.service.compare_claims("test-event", claims)
        self.assertEqual(result.status, "DISAGREEMENT")

    def test_disagreement_magnitude_variance(self):
        event2 = self.base_event.copy()
        event2["magnitude"] = {"value": 15, "direction": "increase"} # >20% difference from 10
        claims = [
            ArticleClaim(article_id="1", source_url="url1", publisher="pub1", publication_date="2026-01-01", extracted_event=self.base_event),
            ArticleClaim(article_id="2", source_url="url2", publisher="pub2", publication_date="2026-01-01", extracted_event=event2)
        ]
        result = self.service.compare_claims("test-event", claims)
        self.assertEqual(result.status, "DISAGREEMENT")
        
    def test_unique_claim(self):
        claims = [
            ArticleClaim(article_id="1", source_url="url1", publisher="pub1", publication_date="2026-01-01", extracted_event=self.base_event)
        ]
        result = self.service.compare_claims("test-event", claims)
        self.assertEqual(result.status, "UNIQUE_CLAIM")
        self.assertEqual(result.source_count, 1)

    def test_insufficient_evidence_missing_metadata(self):
        claims = []
        result = self.service.compare_claims("test-event", claims)
        self.assertEqual(result.status, "INSUFFICIENT_EVIDENCE")
        self.assertEqual(result.source_count, 0)
        
    def test_duplicate_publisher_deduplication(self):
        claims = [
            ArticleClaim(article_id="1", source_url="url1", publisher="pub1", publication_date="2026-01-01", extracted_event=self.base_event),
            ArticleClaim(article_id="2", source_url="url2", publisher="pub1", publication_date="2026-01-01", extracted_event=self.base_event) # Same publisher
        ]
        result = self.service.compare_claims("test-event", claims)
        # Should be deduplicated to 1 source -> UNIQUE_CLAIM
        self.assertEqual(result.status, "UNIQUE_CLAIM")
        self.assertEqual(result.source_count, 1)

if __name__ == '__main__':
    unittest.main()
