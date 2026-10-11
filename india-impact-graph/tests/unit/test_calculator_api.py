"""Unit tests for Household Impact Calculator API."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_personas():
    """Verify listing personas returns verified MoSPI HCES records."""
    response = client.get("/api/calculator/personas")
    assert response.status_code == 200
    personas = response.json()
    assert isinstance(personas, list)
    assert len(personas) > 0

    # Check for Madhya Pradesh baseline personas
    mp_personas = [p for p in personas if p["state"] == "Madhya Pradesh"]
    assert len(mp_personas) >= 2
    assert any(p["sector"] == "Rural" and p["mpce_value_inr"] == 3441.0 for p in mp_personas)
    assert any(p["sector"] == "Urban" and p["mpce_value_inr"] == 5538.0 for p in mp_personas)


def test_list_personas_filter():
    """Verify filtering personas by state and sector."""
    response = client.get("/api/calculator/personas?state=Madhya+Pradesh&sector=Rural")
    assert response.status_code == 200
    personas = response.json()
    assert all(p["state"] == "Madhya Pradesh" and p["sector"] == "Rural" for p in personas)


def test_calculate_household_impact_valid():
    """Verify deterministic impact calculation on valid persona and shock."""
    payload = {
        "persona_id": "madhya_pradesh_rural_all",
        "price_shock_pct": 12.0,
    }
    response = client.post("/api/calculator/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["persona"]["persona_id"] == "madhya_pradesh_rural_all"
    assert data["price_shock_pct"] == 12.0
    assert data["calculation_basis"] == "INR/person/month"
    assert data["total_low_impact"] > 0
    assert data["total_high_impact"] >= data["total_low_impact"]
    assert "Deterministic arithmetic only" in data["determinism_proof"]

    # Verify item-level results
    results_by_id = {r["item_id"]: r for r in data["item_results"]}
    assert "petrol" in results_by_id
    assert results_by_id["petrol"]["status"] == "Success"
    assert results_by_id["petrol"]["low_impact"] is not None
    assert "receipts" in results_by_id["petrol"]

    # Verify unsupported candidate items return Data not available
    assert "pulses" in results_by_id
    assert results_by_id["pulses"]["status"] == "Data not available"
    assert results_by_id["pulses"]["low_impact"] is None

    # Verify gold is excluded
    assert "gold" in results_by_id
    assert results_by_id["gold"]["status"] == "Excluded capital asset"
    assert results_by_id["gold"]["low_impact"] is None


def test_calculate_household_impact_household_size():
    """Verify household size scales calculation basis and total impact."""
    payload_pc = {
        "persona_id": "madhya_pradesh_rural_all",
        "price_shock_pct": 10.0,
    }
    resp_pc = client.post("/api/calculator/calculate", json=payload_pc).json()

    payload_hh = {
        "persona_id": "madhya_pradesh_rural_all",
        "price_shock_pct": 10.0,
        "household_size": 4.5,
    }
    resp_hh = client.post("/api/calculator/calculate", json=payload_hh).json()

    assert resp_hh["calculation_basis"] == "INR/household/month"
    # Should be approx 4.5 times the per-capita value
    assert pytest.approx(resp_hh["total_low_impact"], rel=1e-2) == float(resp_pc["total_low_impact"]) * 4.5


def test_calculate_household_impact_unknown_persona():
    """Verify 404 for unknown persona."""
    payload = {
        "persona_id": "non_existent_persona_999",
        "price_shock_pct": 10.0,
    }
    response = client.post("/api/calculator/calculate", json=payload)
    assert response.status_code == 404
