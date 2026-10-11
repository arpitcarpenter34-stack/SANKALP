import unittest
from unittest.mock import patch
import os
import json
from decimal import Decimal
from event_extraction.event_extractor import FakeDeterministicProvider, LiveLLMProvider, FinancialEventExtractor, ExtractionProviderError
from graph.graph_builder import ImpactGraphBuilder, Node, Edge, Receipt
from calculator.core_calculator import HouseholdImpactCalculator, PassThroughData, Receipt as CalcReceipt

class TestAIOffNumericalParity(unittest.TestCase):
    def setUp(self):
        # We define a structured event that BOTH the fake provider and the mocked live provider will return.
        self.expected_event = {
            "event_id": "crude-oil-shock-12pct",
            "event_type": "commodity_price_shock",
            "is_scenario": True,
            "headline": "Hypothetical +12% crude oil shock",
            "magnitude": {
                "value": 12,
                "unit": "%",
                "direction": "increase"
            },
            "entities": [
                {
                    "entity_id": "crude_oil",
                    "name": "Crude Oil",
                    "entity_type": "commodity",
                    "mention_text": "crude oil"
                }
            ],
            "evidence_snippets": [
                {
                    "quote": "SCENARIO: +12% crude oil",
                    "source_title": "User Scenario"
                }
            ]
        }

    def _run_pipeline(self, provider):
        """Runs the deterministic pipeline given an extraction provider."""
        extractor = FinancialEventExtractor(provider)
        event = extractor.extract("SCENARIO: +12% crude oil")

        # Pipeline graph logic
        builder = ImpactGraphBuilder()
        rec = Receipt("Test", "[VERIFIED]")
        n_crude = Node(id="crude_oil", type="commodity", label="Crude", receipt=rec)
        n_trans = Node(id="transport_cost", type="household_item", label="Transport", receipt=rec)
        builder.add_node(n_crude)
        builder.add_node(n_trans)
        builder.add_edge(Edge("e1", "crude_oil", "transport_cost", "increases_cost", "observed", "high", "Ev", rec, "positive"))

        graph_dict = builder.get_graph()

        # Calculation logic
        calc = HouseholdImpactCalculator()
        scenario_receipt = CalcReceipt("Test", "[VERIFIED]")
        pt = PassThroughData("transport_cost", Decimal("0.5"), Decimal("0.8"), scenario_receipt)
        calc_res = calc.calculate_item_impact(
            item_id="transport_cost",
            baseline_expenditure=5000,
            item_share_pct=10,
            price_shock_pct=event["magnitude"]["value"],
            pass_through_data=pt,
            baseline_receipt=scenario_receipt,
            household_size=4
        )
        return event, graph_dict, calc_res

    def test_numerical_parity_fake_vs_live(self):
        # 1. Run OFF mode
        event_off, graph_off, calc_off = self._run_pipeline(FakeDeterministicProvider())

        # 2. Run ON mode (Mocked)
        # We mock the urllib.request.urlopen to avoid network calls and return the same dict
        mock_response_data = json.dumps({
            "choices": [{"message": {"content": json.dumps(self.expected_event)}}]
        }).encode("utf-8")

        with patch.dict(os.environ, {"USE_LIVE_LLM": "true", "LIVE_LLM_API_KEY": "dummy_key"}):
            with patch("urllib.request.urlopen") as mock_urlopen:
                # Mock context manager
                mock_urlopen.return_value.__enter__.return_value.read.return_value = mock_response_data
                mock_urlopen.return_value.__enter__.return_value.decode.return_value = mock_response_data.decode("utf-8")

                live_provider = LiveLLMProvider()
                event_on, graph_on, calc_on = self._run_pipeline(live_provider)

        # 3. Assert exact parity
        self.assertEqual(event_off, event_on, "Event extraction differs between ON and OFF modes.")
        self.assertEqual(len(graph_off["nodes"]), len(graph_on["nodes"]), "Graph nodes differ.")

        # Verify calculation numerical parity
        self.assertEqual(calc_off.status, calc_on.status)
        self.assertEqual(calc_off.low_impact, calc_on.low_impact, "Low impact numerical calculation altered by provider switch!")
        self.assertEqual(calc_off.high_impact, calc_on.high_impact, "High impact numerical calculation altered by provider switch!")
        self.assertEqual(calc_off.calculation_basis, calc_on.calculation_basis)
        self.assertEqual(calc_on.low_impact, Decimal("120.00")) # 5000 * 4 * 0.10 * 0.12 * 0.5

    def test_live_provider_missing_config(self):
        # Disabled via config
        with patch.dict(os.environ, {"USE_LIVE_LLM": "false"}, clear=True):
            live_provider = LiveLLMProvider()
            with self.assertRaisesRegex(ExtractionProviderError, "Live provider is disabled"):
                live_provider.extract_event("text")

        # Enabled but missing key
        with patch.dict(os.environ, {"USE_LIVE_LLM": "true"}, clear=True):
            live_provider = LiveLLMProvider()
            with self.assertRaisesRegex(ExtractionProviderError, "Configuration error: LIVE_LLM_API_KEY is missing"):
                live_provider.extract_event("text")

if __name__ == '__main__':
    unittest.main()
