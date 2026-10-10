import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestConsensusAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        
        self.base_event = {
            "event_id": "test-event",
            "event_type": "commodity_price_shock",
            "magnitude": {"value": 10, "direction": "increase"}
        }

    def test_evaluate_consensus_agreement(self):
        payload = {
            "event_id": "test-event",
            "claims": [
                {
                    "article_id": "1",
                    "source_url": "url1",
                    "publisher": "pub1",
                    "publication_date": "2026-01-01",
                    "extracted_event": self.base_event
                },
                {
                    "article_id": "2",
                    "source_url": "url2",
                    "publisher": "pub2",
                    "publication_date": "2026-01-01",
                    "extracted_event": self.base_event
                }
            ]
        }
        
        response = self.client.post("/api/v1/consensus/", json=payload)
        # Wait, the endpoint is just /consensus/ or /api/v1/consensus/? Let's check `backend/app/main.py`. Wait, it's just /consensus based on my previous check.
        # Oh, earlier I replaced `/api/v1/time-series` with `/time-series`. So it should be `/consensus/`.
        response = self.client.post("/consensus/", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "AGREEMENT")
        self.assertEqual(data["source_count"], 2)

    def test_evaluate_consensus_empty(self):
        payload = {
            "event_id": "test-event",
            "claims": []
        }
        response = self.client.post("/consensus/", json=payload)
        self.assertEqual(response.status_code, 400)
        
    def test_evaluate_consensus_disagreement(self):
        event2 = self.base_event.copy()
        event2["magnitude"] = {"value": 10, "direction": "decrease"}
        payload = {
            "event_id": "test-event",
            "claims": [
                {
                    "article_id": "1",
                    "source_url": "url1",
                    "publisher": "pub1",
                    "publication_date": "2026-01-01",
                    "extracted_event": self.base_event
                },
                {
                    "article_id": "2",
                    "source_url": "url2",
                    "publisher": "pub2",
                    "publication_date": "2026-01-01",
                    "extracted_event": event2
                }
            ]
        }
        response = self.client.post("/consensus/", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "DISAGREEMENT")
        self.assertEqual(data["source_count"], 2)

if __name__ == '__main__':
    unittest.main()
