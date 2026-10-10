import unittest
from path_finder import (
    ImpactPathFinder, PathResult, InvalidGraphError, NodeNotFoundError, InvalidParameterError
)

class TestPathFinder(unittest.TestCase):
    def setUp(self):
        # Build a synthetic test graph
        self.graph_data = {
            "nodes": [
                {"id": "A", "type": "commodity", "label": "Node A"},
                {"id": "B", "type": "commodity", "label": "Node B"},
                {"id": "C", "type": "commodity", "label": "Node C"},
                {"id": "D", "type": "commodity", "label": "Node D"}
            ],
            "edges": [
                {
                    "id": "e1", "source_node": "A", "target_node": "B",
                    "kind": "observed", "confidence": "high", "receipt": {"title": "X"}
                },
                {
                    "id": "e2", "source_node": "B", "target_node": "C",
                    "kind": "observed", "confidence": "medium", "receipt": {"title": "Y"}
                },
                {
                    "id": "e3", "source_node": "A", "target_node": "C",
                    "kind": "inferred", "confidence": "high", "receipt": {"title": "Z"}
                },
                {
                    "id": "e4", "source_node": "C", "target_node": "A", # Cycle
                    "kind": "observed", "confidence": "low", "receipt": {"title": "W"}
                },
                {
                    "id": "e5", "source_node": "C", "target_node": "D",
                    "kind": "observed", "confidence": "high", "receipt": {"title": "V"}
                }
            ]
        }
        self.finder = ImpactPathFinder(self.graph_data)

    # 1. Valid path between connected nodes
    # 2. Multiple valid paths between a source and target
    def test_valid_paths(self):
        paths = self.finder.find_paths("A", "C")
        self.assertEqual(len(paths), 2)
        # Paths should be A->B->C and A->C
        
        # Let's check ranking
        # Path 1: A->C (length 1, inferred=0 observed, conf=high (3). min conf=3, obs=0.0, len=1
        # Path 2: A->B->C (length 2, observed=2. conf=high, medium. min conf=2, obs=1.0, len=2
        # Ranking criteria 1: higher minimum confidence (3 vs 2). So A->C wins.
        self.assertEqual(paths[0].nodes, ["A", "C"])
        self.assertEqual(paths[1].nodes, ["A", "B", "C"])

    # 3. Correct node and edge ordering
    def test_ordering(self):
        paths = self.finder.find_paths("A", "D", limit=10)
        # A->C->D, A->B->C->D
        path_abc = [p for p in paths if len(p.nodes) == 4][0]
        self.assertEqual(path_abc.nodes, ["A", "B", "C", "D"])
        self.assertEqual(path_abc.edges, ["e1", "e2", "e5"])

    # 4. Unknown source node
    def test_unknown_source(self):
        with self.assertRaises(NodeNotFoundError):
            self.finder.find_paths("UNKNOWN", "C")

    # 5. Unknown target node
    def test_unknown_target(self):
        with self.assertRaises(NodeNotFoundError):
            self.finder.find_paths("A", "UNKNOWN")

    # 6. Graph with no available path
    def test_no_path(self):
        paths = self.finder.find_paths("D", "A") # D has no outgoing edges
        self.assertEqual(paths, [])

    # 7. Cyclic graph termination
    def test_cycles(self):
        # A->B->C->A
        paths = self.finder.find_paths("A", target_id=None, limit=10, max_depth=10)
        # Ensure 'A' doesn't appear twice in any path
        for p in paths:
            self.assertEqual(len(p.nodes), len(set(p.nodes)))

    # 8. Maximum depth limits
    def test_max_depth(self):
        paths = self.finder.find_paths("A", "D", max_depth=2)
        # A->C->D is length 2. A->B->C->D is length 3.
        self.assertEqual(len(paths), 1)
        self.assertEqual(paths[0].nodes, ["A", "C", "D"])

    # 9, 10. Max results
    def test_limits(self):
        paths = self.finder.find_paths("A", target_id=None, limit=2)
        self.assertEqual(len(paths), 2)

    # 11. Invalid depth / limit
    def test_invalid_params(self):
        with self.assertRaises(InvalidParameterError):
            self.finder.find_paths("A", "B", max_depth=0)
        with self.assertRaises(InvalidParameterError):
            self.finder.find_paths("A", "B", limit=-1)

    # 13. Ranking by observed proportion
    def test_observed_ranking(self):
        # Let's make an alternate graph
        graph = {
            "nodes": [{"id":"S"},{"id":"T"},{"id":"X"}],
            "edges": [
                {"id":"e1", "source_node":"S", "target_node":"X", "kind":"observed", "confidence":"high"},
                {"id":"e2", "source_node":"X", "target_node":"T", "kind":"observed", "confidence":"high"},
                {"id":"e3", "source_node":"S", "target_node":"T", "kind":"inferred", "confidence":"high"}
            ]
        }
        finder = ImpactPathFinder(graph)
        paths = finder.find_paths("S", "T")
        # Path 1: S->T (inferred 100%, min conf high, len 1)
        # Path 2: S->X->T (observed 100%, min conf high, len 2)
        # Ranking: Both have min_conf = 3. 
        # Obs ratio: S->X->T = 1.0. S->T = 0.0. 
        # So S->X->T wins because observed_ratio is higher.
        self.assertEqual(paths[0].nodes, ["S", "X", "T"])
        self.assertEqual(paths[1].nodes, ["S", "T"])
        
    # 14. Shorter path preference
    def test_shorter_path_preference(self):
        graph = {
            "nodes": [{"id":"S"},{"id":"T"},{"id":"X"}],
            "edges": [
                {"id":"e1", "source_node":"S", "target_node":"X", "kind":"observed", "confidence":"high"},
                {"id":"e2", "source_node":"X", "target_node":"T", "kind":"observed", "confidence":"high"},
                {"id":"e3", "source_node":"S", "target_node":"T", "kind":"observed", "confidence":"high"}
            ]
        }
        finder = ImpactPathFinder(graph)
        paths = finder.find_paths("S", "T")
        # S->T and S->X->T have same min_conf (3) and same obs ratio (1.0).
        # S->T is shorter, so it should win.
        self.assertEqual(paths[0].nodes, ["S", "T"])
        self.assertEqual(paths[1].nodes, ["S", "X", "T"])

    # 15. Stable tie breaking
    def test_stable_tie_break(self):
        graph = {
            "nodes": [{"id":"S"},{"id":"T"}],
            "edges": [
                {"id":"edge_B", "source_node":"S", "target_node":"T", "kind":"observed", "confidence":"high"},
                {"id":"edge_A", "source_node":"S", "target_node":"T", "kind":"observed", "confidence":"high"}
            ]
        }
        finder = ImpactPathFinder(graph)
        paths = finder.find_paths("S", "T")
        # Tie on all ranks. Should sort alphabetically by nodes and edges strings (S,T|edge_A vs S,T|edge_B)
        self.assertEqual(paths[0].edges, ["edge_A"])
        self.assertEqual(paths[1].edges, ["edge_B"])

    # 16, 17. Preservation of evidence and status
    def test_metadata_preservation(self):
        paths = self.finder.find_paths("A", "B")
        edge_meta = paths[0].edge_metadata[0]
        self.assertEqual(edge_meta["id"], "e1")
        self.assertEqual(edge_meta["kind"], "observed")
        self.assertEqual(edge_meta["receipt"]["title"], "X")

    # 18. Direction doesn't reverse traversal
    def test_direction_no_reverse(self):
        graph = {
            "nodes": [{"id":"S"},{"id":"T"}],
            "edges": [
                {"id":"e1", "source_node":"T", "target_node":"S", "kind":"observed", "confidence":"high", "direction": "negative"}
            ]
        }
        finder = ImpactPathFinder(graph)
        paths = finder.find_paths("S", "T")
        self.assertEqual(paths, []) # S cannot reach T because edge is T->S, regardless of 'negative' direction.

    # 20. Invalid graph input
    def test_invalid_graph(self):
        with self.assertRaises(InvalidGraphError):
            ImpactPathFinder([])

if __name__ == '__main__':
    unittest.main()
