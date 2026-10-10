import unittest
from graph_builder import (
    ImpactGraphBuilder, Node, Edge, Receipt, 
    DuplicateNodeError, MissingEndpointError, ValidationError
)

class TestGraphBuilder(unittest.TestCase):
    def setUp(self):
        self.builder = ImpactGraphBuilder()
        self.valid_receipt = Receipt(
            source_title="Synthetic Test Data",
            verification_status="[VERIFIED]"
        )
        self.node1 = Node(id="crude_oil", type="commodity", label="Crude Oil")
        self.node2 = Node(id="diesel", type="commodity", label="Diesel")
        self.edge1 = Edge(
            id="e1", 
            source_node="crude_oil", 
            target_node="diesel", 
            relation_type="increases_input_cost",
            kind="observed",
            confidence="high",
            evidence_text="Testing evidence",
            receipt=self.valid_receipt
        )

    # 1. Valid graph containing multiple nodes and edges
    def test_valid_graph(self):
        self.builder.add_node(self.node1)
        self.builder.add_node(self.node2)
        self.builder.add_edge(self.edge1)
        graph = self.builder.get_graph()
        self.assertEqual(len(graph["nodes"]), 2)
        self.assertEqual(len(graph["edges"]), 1)
        self.assertEqual(graph["nodes"][0]["id"], "crude_oil") # deterministic sort by id

    # 2. Empty input behaviour
    def test_empty_graph(self):
        graph = self.builder.get_graph()
        self.assertEqual(graph["nodes"], [])
        self.assertEqual(graph["edges"], [])

    # 3. Duplicate node identifiers
    def test_duplicate_node(self):
        self.builder.add_node(self.node1)
        with self.assertRaises(DuplicateNodeError):
            self.builder.add_node(self.node1)

    # 4 & 5. Edge referencing a missing source/target node
    def test_missing_endpoints(self):
        self.builder.add_node(self.node1) # Only add one node
        with self.assertRaises(MissingEndpointError) as cm:
            self.builder.add_edge(self.edge1)
        self.assertIn("Target node 'diesel' does not exist", str(cm.exception))

        edge2 = Edge("e2", "missing_node", "crude_oil", "rel", "observed", "high", "text", self.valid_receipt)
        with self.assertRaises(MissingEndpointError) as cm:
            self.builder.add_edge(edge2)
        self.assertIn("Source node 'missing_node' does not exist", str(cm.exception))

    # 6. Invalid node fields and data types
    def test_invalid_node_type(self):
        bad_node = Node("n1", "invalid_type", "Label")
        with self.assertRaises(ValidationError):
            self.builder.add_node(bad_node)

    # 7. Invalid relationship kind or direction
    def test_invalid_edge_enums(self):
        self.builder.add_node(self.node1)
        self.builder.add_node(self.node2)
        
        bad_kind_edge = Edge("e2", "crude_oil", "diesel", "rel", "bad_kind", "high", "text", self.valid_receipt)
        with self.assertRaises(ValidationError):
            self.builder.add_edge(bad_kind_edge)
            
        bad_dir_edge = Edge("e3", "crude_oil", "diesel", "rel", "observed", "high", "text", self.valid_receipt, direction="bad_dir")
        with self.assertRaises(ValidationError):
            self.builder.add_edge(bad_dir_edge)

    # 9. Missing required source/year provenance (Receipt)
    def test_missing_receipt(self):
        self.builder.add_node(self.node1)
        self.builder.add_node(self.node2)
        
        # Edge without receipt should fail (if we construct it manually bypassing type hints or passing None)
        edge_no_receipt = Edge("e2", "crude_oil", "diesel", "rel", "observed", "high", "text", receipt=None)
        with self.assertRaises(ValidationError):
            self.builder.add_edge(edge_no_receipt)
            
        # Receipt with bad verification_status
        bad_receipt = Receipt("Title", "INVALID_STATUS")
        edge_bad_receipt = Edge("e3", "crude_oil", "diesel", "rel", "observed", "high", "text", receipt=bad_receipt)
        with self.assertRaises(ValidationError):
            self.builder.add_edge(edge_bad_receipt)

    # 10 & 11. Observed/Inferred edges retain their status
    def test_kind_retention(self):
        self.builder.add_node(self.node1)
        self.builder.add_node(self.node2)
        self.builder.add_edge(self.edge1) # observed
        
        edge2 = Edge("e2", "diesel", "crude_oil", "rel", "inferred", "high", "text", self.valid_receipt)
        self.builder.add_edge(edge2)
        
        graph = self.builder.get_graph()
        self.assertEqual(graph["edges"][0]["kind"], "observed") # e1
        self.assertEqual(graph["edges"][1]["kind"], "inferred") # e2

    # 12. Node and edge metadata is preserved
    def test_metadata_preservation(self):
        node = Node("n1", "commodity", "L1", description="Desc", budget_share=5.0)
        self.builder.add_node(node)
        graph = self.builder.get_graph()
        self.assertEqual(graph["nodes"][0]["description"], "Desc")
        self.assertEqual(graph["nodes"][0]["budget_share"], 5.0)

    # 13 & 14. Deterministic output and no unexpected mutation
    def test_determinism_and_mutation(self):
        # Adding in reverse order
        self.builder.add_node(self.node2)
        self.builder.add_node(self.node1)
        graph = self.builder.get_graph()
        
        # Output should be sorted by ID: crude_oil then diesel
        self.assertEqual(graph["nodes"][0]["id"], "crude_oil")
        self.assertEqual(graph["nodes"][1]["id"], "diesel")
        
        # Original objects unchanged
        self.assertEqual(self.node1.id, "crude_oil")

if __name__ == '__main__':
    unittest.main()
