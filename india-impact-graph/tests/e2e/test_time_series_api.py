import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestTimeSeriesAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_cpi_series_endpoint(self):
        response = self.client.get("/time-series/cpi")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["series_name"], "CPI 2024 General Index")
        self.assertIn("base_year", data["metadata"])
        
        # Test filtering
        response_rural = self.client.get("/time-series/cpi?sector=Rural")
        self.assertEqual(response_rural.status_code, 200)
        rural_data = response_rural.json()
        # All returned should be rural
        for obs in rural_data["observations"]:
            self.assertEqual(obs["sector"].lower(), "rural")

    def test_crude_oil_snapshots_endpoint(self):
        response = self.client.get("/time-series/crude-oil")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["series_name"], "PPAC Indian Basket Crude Oil")
        self.assertEqual(data["metadata"]["unit"], "USD/barrel")
        self.assertIn("limitations", data["metadata"])
        # Should be sparse and not fabricated daily
        self.assertGreater(len(data["observations"]), 0)
        # Verify chronological order
        dates = [obs["period"] for obs in data["observations"]]
        self.assertEqual(dates, sorted(dates))

    def test_time_series_metrics_endpoint(self):
        response = self.client.get("/time-series/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("metrics", data)
        metric_ids = {m["id"] for m in data["metrics"]}
        self.assertIn("cpi_2024_general", metric_ids)
        self.assertIn("crude_oil_indian_basket", metric_ids)

    def test_time_series_correlation_endpoint(self):
        response = self.client.get("/time-series/correlation")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("disclaimer", data)
        self.assertIn("co-movement, not direct causality", data["disclaimer"])

if __name__ == '__main__':

    unittest.main()
