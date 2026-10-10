import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestGraphAPI(unittest.TestCase):
    def setUp(self):
        self.valid_graph = {
            "nodes": [
                {
                    "id": "N1",
                    "type": "commodity",
                    "label": "Test Node 1",
                    "receipt": {
                        "source_title": "Source 1",
                        "verification_status": "[VERIFIED]"
                    }
                },
                {
                    "id": "N2",
                    "type": "commodity",
                    "label": "Test Node 2",
                    "receipt": {
                        "source_title": "Source 2",
                        "verification_status": "[INFERENCE]"
                    }
                }
            ],
            "edges": [
                {
                    "id": "E1",
                    "from": "N1",
                    "to": "N2",
                    "relation_type": "increases_cost",
                    "kind": "observed",
                    "confidence": "high",
                    "evidence_text": "Sample text",
                    "receipt": {
                        "source_title": "Source 1",
                        "verification_status": "[VERIFIED]"
                    }
                }
            ]
        }

    def test_build_graph_valid(self):
        response = client.post("/api/graph/build", json=self.valid_graph)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["nodes"]), 2)
        self.assertEqual(len(data["edges"]), 1)

    def test_build_graph_invalid_missing_node(self):
        invalid_graph = {
            "nodes": [],
            "edges": self.valid_graph["edges"]
        }
        response = client.post("/api/graph/build", json=invalid_graph)
        self.assertEqual(response.status_code, 422) # Should fail either from Pydantic or GraphBuilderError
        # Actually, graph builder checks if endpoint nodes exist. So it should return 422.

    def test_find_paths(self):
        req = {
            "graph": self.valid_graph,
            "source_id": "N1",
            "target_id": "N2",
            "max_depth": 5,
            "limit": 3
        }
        response = client.post("/api/graph/paths", json=req)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["length"], 1)

    def test_get_node_evidence(self):
        req = {
            "graph": self.valid_graph,
            "node_id": "N1"
        }
        response = client.post("/api/graph/evidence/node", json=req)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "VALID_EVIDENCE")
        self.assertEqual(data["target_id"], "N1")

    def test_get_edge_evidence(self):
        req = {
            "graph": self.valid_graph,
            "edge_id": "E1"
        }
        response = client.post("/api/graph/evidence/edge", json=req)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "VALID_EVIDENCE")

    def test_get_path_evidence(self):
        # We need a path result
        path_result = {
            "nodes": ["N1", "N2"],
            "edges": ["E1"],
            "length": 1,
            "min_confidence_score": 3,
            "observed_ratio": 1.0,
            "edge_metadata": []
        }
        req = {
            "graph": self.valid_graph,
            "path": path_result
        }
        response = client.post("/api/graph/evidence/path", json=req)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "VALID_EVIDENCE")
        # Should deduplicate source 1, wait N1 and E1 both use "Source 1" but diff verification status?
        # In setup, N1 has Source 1, E1 has Source 1. 
        self.assertTrue(len(data["receipts"]) >= 1)

    def test_extract_event_valid(self):
        req = {"text": "SCENARIO: +12% crude oil"}
        response = client.post("/api/events/extract", json=req)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["event_id"], "crude-oil-shock-12pct")

    def test_extract_event_invalid(self):
        req = {"text": "MISSING_REQUIRED"}
        response = client.post("/api/events/extract", json=req)
        self.assertEqual(response.status_code, 422)

if __name__ == '__main__':
    unittest.main()
