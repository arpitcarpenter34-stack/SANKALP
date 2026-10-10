"""Unit tests for Graph, Path Finding, and Evidence Pydantic schemas."""

import unittest
from pydantic import ValidationError
from app.schemas.graph import (
    Node,
    Edge,
    ReceiptDefinition,
    PathResultSchema,
    EvidenceResultSchema
)

class TestGraphSchemas(unittest.TestCase):
    def test_valid_receipt_definition(self):
        data = {
            "source_title": "MoSPI HCES",
            "verification_status": "[VERIFIED]"
        }
        receipt = ReceiptDefinition(**data)
        self.assertEqual(receipt.source_title, "MoSPI HCES")
        self.assertEqual(receipt.verification_status, "[VERIFIED]")
        self.assertIsNone(receipt.source_url)

    def test_invalid_receipt_missing_required(self):
        with self.assertRaises(ValidationError):
            ReceiptDefinition(source_title="Missing status")

    def test_valid_node(self):
        data = {
            "id": "N1",
            "type": "commodity",
            "label": "Test Node"
        }
        node = Node(**data)
        self.assertEqual(node.id, "N1")

    def test_valid_edge(self):
        data = {
            "id": "E1",
            "from": "N1",
            "to": "N2",
            "relation_type": "increases_input_cost",
            "kind": "observed",
            "confidence": "high",
            "evidence_text": "text",
            "receipt": {
                "source_title": "Source",
                "verification_status": "[VERIFIED]"
            }
        }
        edge = Edge(**data)
        self.assertEqual(edge.id, "E1")
        self.assertEqual(edge.from_node, "N1")
        self.assertEqual(edge.to_node, "N2")

    def test_valid_path_result_schema(self):
        data = {
            "nodes": ["N1", "N2"],
            "edges": ["E1"],
            "length": 1,
            "min_confidence_score": 3,
            "observed_ratio": 1.0,
            "edge_metadata": []
        }
        path = PathResultSchema(**data)
        self.assertEqual(path.length, 1)

    def test_evidence_result_schema(self):
        data = {
            "status": "VALID_EVIDENCE",
            "target_id": "N1",
            "target_type": "node",
            "receipts": []
        }
        evidence = EvidenceResultSchema(**data)
        self.assertEqual(evidence.status, "VALID_EVIDENCE")

if __name__ == '__main__':
    unittest.main()
