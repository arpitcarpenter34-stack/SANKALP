import unittest
from decimal import Decimal
from event_extraction.event_extractor import FinancialEventExtractor, FakeDeterministicProvider
from graph.graph_builder import ImpactGraphBuilder, Node, Edge, Receipt
from graph.path_finder import ImpactPathFinder
from evidence_service.evidence_service import EvidenceService
from calculator.core_calculator import HouseholdImpactCalculator, PassThroughData, Receipt as CalcReceipt

class TestEndToEndPipeline(unittest.TestCase):
    def test_crude_oil_scenario_end_to_end(self):
        # 1. Event Extraction
        provider = FakeDeterministicProvider()
        extractor = FinancialEventExtractor(provider)
        event = extractor.extract("SCENARIO: +12% crude oil")
        self.assertEqual(event["event_id"], "crude-oil-shock-12pct")
        self.assertEqual(event["magnitude"]["value"], 12)

        # 2. Build Associated Impact Graph
        builder = ImpactGraphBuilder()

        # Nodes
        verified_receipt = Receipt(source_title="Scenario assumption", verification_status="[VERIFIED]")
        n_crude = Node(id="crude_oil", type="commodity", label="Crude Oil", receipt=verified_receipt)
        n_diesel = Node(id="diesel", type="commodity", label="Diesel", receipt=verified_receipt)
        n_transport = Node(id="transport_cost", type="household_item", label="Transport Cost", receipt=verified_receipt)
        n_groceries = Node(id="groceries", type="household_item", label="Groceries", receipt=verified_receipt)

        builder.add_node(n_crude)
        builder.add_node(n_diesel)
        builder.add_node(n_transport)
        builder.add_node(n_groceries)

        # Edges
        edge_receipt = Receipt(source_title="Edge Assumption", verification_status="[VERIFIED]")
        # Path 1: Crude -> Diesel -> Transport
        e1 = Edge(
            id="e_crude_diesel", source_node="crude_oil", target_node="diesel",
            relation_type="increases_cost", kind="observed", confidence="high",
            evidence_text="Crude price drives diesel", receipt=edge_receipt,
            direction="positive"
        )
        e2 = Edge(
            id="e_diesel_transport", source_node="diesel", target_node="transport_cost",
            relation_type="increases_cost", kind="observed", confidence="high",
            evidence_text="Diesel drives transport", receipt=edge_receipt,
            direction="positive"
        )
        # Path 2: Crude -> Diesel -> Groceries
        e3 = Edge(
            id="e_diesel_groceries", source_node="diesel", target_node="groceries",
            relation_type="increases_cost", kind="inferred", confidence="medium",
            evidence_text="Transport costs increase groceries", receipt=edge_receipt,
            direction="positive"
        )
        # Add a cycle to test cycle avoidance
        e_cycle = Edge(
            id="e_cycle", source_node="transport_cost", target_node="crude_oil",
            relation_type="feedback", kind="inferred", confidence="low",
            evidence_text="Feedback loop", receipt=edge_receipt,
            direction="positive"
        )

        builder.add_edge(e1)
        builder.add_edge(e2)
        builder.add_edge(e3)
        builder.add_edge(e_cycle)

        graph_dict = builder.get_graph()

        # Convert Receipt dataclasses to dicts for EvidenceService
        for node in graph_dict["nodes"]:
            if getattr(node.get("receipt"), "__dict__", None):
                node["receipt"] = node["receipt"].__dict__
        for edge in graph_dict["edges"]:
            if getattr(edge.get("receipt"), "__dict__", None):
                edge["receipt"] = edge["receipt"].__dict__

        self.assertEqual(len(graph_dict["nodes"]), 4)

        # 3. Path Finding & Ranking
        finder = ImpactPathFinder(graph_dict)
        paths = finder.find_paths(source_id="crude_oil", target_id="transport_cost", limit=3)
        self.assertLessEqual(len(paths), 3) # Max three pathways
        # Validate cycle avoidance: lengths shouldn't be infinite
        self.assertTrue(all(p.length <= 5 for p in paths))

        top_path = paths[0]
        # Should be crude -> diesel -> transport_cost
        self.assertEqual(top_path.nodes, ["crude_oil", "diesel", "transport_cost"])

        # 4. Evidence Retrieval
        evidence_service = EvidenceService(graph_dict)
        path_evidence = evidence_service.get_path_evidence(top_path)
        self.assertEqual(path_evidence.status, "VALID_EVIDENCE")
        # Ensure observed/inferred distinctions survive
        has_observed = any("observed" in str(r.get("_edge_kind", "")) for r in path_evidence.receipts)
        self.assertTrue(has_observed)

        # 5. Deterministic Household Calculator
        calculator = HouseholdImpactCalculator()

        # We simulate missing real data for household expenditure baseline
        # (as per requirement: do not fabricate, report exact missing inputs)
        calc_result_missing = calculator.calculate_item_impact(
            item_id="transport_cost",
            baseline_expenditure=None, # Missing data
            item_share_pct=None, # Missing data
            price_shock_pct=event["magnitude"]["value"],
            pass_through_data=None, # Missing pass-through
            baseline_receipt=None
        )

        self.assertEqual(calc_result_missing.status, "Data not available")
        self.assertIn("Missing required input fields", calc_result_missing.message)

        # Now test calculator with clearly labeled supported scenario assumptions
        # just to prove the deterministic arithmetic is working.
        scenario_receipt = CalcReceipt(source_title="Scenario Assumption 2024", verification_status="[VERIFY]")
        pass_through = PassThroughData(
            item_id="transport_cost",
            low_factor=Decimal("0.5"),
            high_factor=Decimal("0.8"),
            receipt=scenario_receipt
        )

        calc_result_valid = calculator.calculate_item_impact(
            item_id="transport_cost",
            baseline_expenditure=5000, # Scenario baseline: 5000 INR
            item_share_pct=10, # Scenario share: 10%
            price_shock_pct=event["magnitude"]["value"], # 12%
            pass_through_data=pass_through,
            baseline_receipt=scenario_receipt,
            household_size=4
        )

        self.assertEqual(calc_result_valid.status, "Success")
        # baseline affected = 5000 * 4 * (10/100) = 2000 INR
        # shock = 12% -> 2000 * 0.12 = 240
        # low = 240 * 0.5 = 120
        # high = 240 * 0.8 = 192
        self.assertEqual(calc_result_valid.low_impact, Decimal("120.00"))
        self.assertEqual(calc_result_valid.high_impact, Decimal("192.00"))
        self.assertEqual(calc_result_valid.calculation_basis, "INR/household/month")

if __name__ == '__main__':
    unittest.main()
