import unittest
from evidence_service import EvidenceService, EvidenceStatus
from graph.path_finder import PathResult

class TestEvidenceService(unittest.TestCase):
    def setUp(self):
        # Synthetic graph fixture
        self.graph_data = {
            "nodes": [
                {
                    "id": "N1", 
                    "type": "commodity", 
                    "label": "Node 1",
                    "receipt": {
                        "source_title": "Node 1 Source",
                        "verification_status": "[VERIFIED]"
                    }
                },
                {
                    "id": "N2", 
                    "type": "commodity", 
                    "label": "Node 2",
                    "receipt": {
                        "source_title": "", # Incomplete
                        "verification_status": "[VERIFIED]"
                    }
                },
                {
                    "id": "N3", 
                    "type": "commodity", 
                    "label": "Node 3" # No receipt
                }
            ],
            "edges": [
                {
                    "id": "E1",
                    "source_node": "N1",
                    "target_node": "N2",
                    "kind": "observed",
                    "receipt": {
                        "source_title": "Edge 1 Source",
                        "verification_status": "[VERIFIED]",
                        "year_or_date": "2024"
                    }
                },
                {
                    "id": "E2",
                    "source_node": "N2",
                    "target_node": "N3",
                    "kind": "inferred",
                    "receipt": {
                        "source_title": "Edge 2 Source",
                        "verification_status": "[INFERENCE]",
                    }
                },
                {
                    "id": "E3", # Duplicate receipt as E1
                    "source_node": "N1",
                    "target_node": "N3",
                    "kind": "observed",
                    "receipt": {
                        "source_title": "Edge 1 Source",
                        "verification_status": "[VERIFIED]",
                        "year_or_date": "2024"
                    }
                },
                {
                    "id": "E4",
                    "source_node": "N3",
                    "target_node": "N1",
                    "kind": "observed",
                    "receipt": "invalid_string_not_dict"
                }
            ]
        }
        self.service = EvidenceService(self.graph_data)

    def test_valid_node_receipt(self):
        res = self.service.get_node_evidence("N1")
        self.assertEqual(res.status, EvidenceStatus.VALID)
        self.assertEqual(len(res.receipts), 1)
        self.assertEqual(res.receipts[0]["source_title"], "Node 1 Source")
        self.assertEqual(res.receipts[0]["_associated_node_id"], "N1")

    def test_incomplete_node_receipt(self):
        res = self.service.get_node_evidence("N2")
        self.assertEqual(res.status, EvidenceStatus.INCOMPLETE)
        self.assertEqual(len(res.receipts), 0)

    def test_no_node_receipt(self):
        res = self.service.get_node_evidence("N3")
        self.assertEqual(res.status, EvidenceStatus.NONE)
        self.assertEqual(len(res.receipts), 0)

    def test_unknown_node(self):
        res = self.service.get_node_evidence("UNKNOWN")
        self.assertEqual(res.status, EvidenceStatus.NOT_FOUND)

    def test_valid_edge_receipt_preserves_kind(self):
        res = self.service.get_edge_evidence("E2")
        self.assertEqual(res.status, EvidenceStatus.VALID)
        self.assertEqual(len(res.receipts), 1)
        self.assertEqual(res.receipts[0]["_associated_edge_id"], "E2")
        self.assertEqual(res.receipts[0]["_edge_kind"], "inferred")

    def test_invalid_edge_structure(self):
        res = self.service.get_edge_evidence("E4")
        self.assertEqual(res.status, EvidenceStatus.INVALID)
        self.assertEqual(len(res.receipts), 0)

    def test_path_aggregation_and_deduplication(self):
        # Path: N1 -> E1 -> N2 -> E2 -> N3
        path = PathResult(
            nodes=["N1", "N2", "N3"],
            edges=["E1", "E2"],
            length=2,
            min_confidence_score=3,
            observed_ratio=0.5,
            edge_metadata=[]
        )
        res = self.service.get_path_evidence(path)
        
        # N2 is incomplete, so aggregate status becomes INCOMPLETE (but valid receipts are still collected)
        self.assertEqual(res.status, EvidenceStatus.INCOMPLETE)
        
        # N1 is valid (1), E1 is valid (1), E2 is valid (1)
        self.assertEqual(len(res.receipts), 3)
        titles = [r["source_title"] for r in res.receipts]
        self.assertIn("Node 1 Source", titles)
        self.assertIn("Edge 1 Source", titles)
        self.assertIn("Edge 2 Source", titles)

    def test_path_deduplication(self):
        # Path: N1 -> E3 -> N3 -> E4 (fails)
        # We will use N1 -> E1 -> N2 and N1 -> E3 -> N3 to show dedup, but paths are linear.
        # Let's say path N1 -> E1 -> N2 (and N2 has same receipt as E1)
        graph = {
            "nodes": [
                {"id": "A", "receipt": {"source_title": "SRC", "verification_status": "[VERIFIED]"}},
                {"id": "B", "receipt": {"source_title": "SRC", "verification_status": "[VERIFIED]"}}
            ],
            "edges": []
        }
        svc = EvidenceService(graph)
        path = PathResult(nodes=["A", "B"], edges=[], length=0, min_confidence_score=0, observed_ratio=0, edge_metadata=[])
        res = svc.get_path_evidence(path)
        self.assertEqual(res.status, EvidenceStatus.VALID)
        self.assertEqual(len(res.receipts), 1) # deduplicated

    def test_input_mutation(self):
        # Ensure we don't mutate the underlying graph dict
        res = self.service.get_node_evidence("N1")
        self.assertIn("_associated_node_id", res.receipts[0])
        
        # Original graph data must remain untouched
        self.assertNotIn("_associated_node_id", self.graph_data["nodes"][0]["receipt"])

    def test_invalid_path_type(self):
        res = self.service.get_path_evidence("NotAPath")
        self.assertEqual(res.status, EvidenceStatus.INVALID)


if __name__ == '__main__':
    unittest.main()
