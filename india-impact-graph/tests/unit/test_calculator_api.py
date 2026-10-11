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
    assert "not found" in response.json()["detail"].lower()


def test_list_personas_all_india_fractiles():
    """Verify listing personas for All-India returns fractile classes without inventing state data."""
    response = client.get("/api/calculator/personas?state=All-India")
    assert response.status_code == 200
    personas = response.json()
    assert len(personas) >= 24  # 12 rural + 12 urban fractiles

    rural_0_5 = next((p for p in personas if p["persona_id"] == "all_india_rural_0-5"), None)
    assert rural_0_5 is not None
    assert rural_0_5["state"] == "All-India"
    assert rural_0_5["sector"] == "Rural"
    assert rural_0_5["expenditure_class"] == "0-5%"
    assert rural_0_5["mpce_value_inr"] == 1677.0


def test_list_personas_state_fractile_filter_empty():
    """Verify filtering by state and fractile class returns empty when state fractiles are not published."""
    response = client.get("/api/calculator/personas?state=Madhya+Pradesh&expenditure_class=Low")
    assert response.status_code == 200
    personas = response.json()
    assert personas == []  # Not fabricated


def test_list_personas_state_name_normalization():
    """Verify state name normalization (All India vs All-India)."""
    resp_hyphen = client.get("/api/calculator/personas?state=All-India")
    resp_space = client.get("/api/calculator/personas?state=All+India")
    assert resp_hyphen.status_code == 200
    assert resp_space.status_code == 200
    assert len(resp_hyphen.json()) == len(resp_space.json())


def test_calculate_household_impact_unsupported_state_fractile_id():
    """Verify calling calculate with documented but unsupported state fractile IDs returns clear 404."""
    for pid in ["mp_rural_low", "mp_rural_middle", "mp_urban_high"]:
        payload = {
            "persona_id": pid,
            "price_shock_pct": 10.0,
        }
        response = client.post("/api/calculator/calculate", json=payload)
        assert response.status_code == 404
        detail = response.json()["detail"]
        assert "not supported" in detail
        assert "State-level fractile personas are not present" in detail


def test_calculate_household_impact_all_india_fractile():
    """Verify calculation succeeds for genuinely supported All-India fractile persona."""
    payload = {
        "persona_id": "all_india_rural_0-5",
        "price_shock_pct": 10.0,
    }
    response = client.post("/api/calculator/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["persona"]["persona_id"] == "all_india_rural_0-5"
    assert data["persona"]["mpce_value_inr"] == 1677.0
    assert data["total_low_impact"] > 0
