"""Unit tests for Scenario Analysis Transmission Pipeline API."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_analyze_crude_oil_scenario():
    """Test full transmission pipeline for crude oil price shock."""
    payload = {
        "scenarioId": "crude-oil-12pct",
        "state": "Madhya Pradesh",
        "sector": "Rural",
        "expenditureClass": "Middle",
        "isAiOff": False,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Validate Scenario object
    assert data["scenario"]["id"] == "crude-oil-12pct"
    assert data["scenario"]["magnitudeNumeric"] == 12.0
    assert data["scenario"]["sourceReceipt"]["verificationStatus"] == "[VERIFIED]"

    # Validate Graph object
    assert len(data["graph"]["nodes"]) >= 4
    assert len(data["graph"]["edges"]) >= 3
    assert len(data["graph"]["availablePaths"]) >= 2
    assert any(n["id"] == "crude_oil" for n in data["graph"]["nodes"])

    # Validate Persona object
    persona = data["persona"]
    assert persona["persona"]["state"] == "Madhya Pradesh"
    assert persona["persona"]["sector"] == "Rural"
    assert persona["mpceBaselineInr"] == 3179
    assert persona["totalMonthlyImpactRangeInr"] is not None
    assert persona["totalMonthlyImpactRangeInr"]["low"] > 0
    assert len(persona["itemBreakdown"]) >= 1

    # Validate metadata
    assert data["isLiveBackend"] is True
    assert "REAL-TIME DETERMINISTIC ENGINE" in data["dataSourceLabel"]


def test_analyze_custom_dispatch_unverified():
    """Test custom text analysis enforces [UNVERIFIED] status and no fake numbers."""
    payload = {
        "scenarioId": "custom",
        "customText": "SCENARIO: +12% crude oil",
        "state": "Maharashtra",
        "sector": "Urban",
        "isAiOff": True,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scenario"]["id"] == "custom-analysis"
    assert data["scenario"]["sourceReceipt"]["verificationStatus"] == "[UNVERIFIED]"
    # Unverified custom news does not fabricate numerical totals
    assert data["persona"]["totalMonthlyImpactRangeInr"] is None
    assert data["isAiOff"] is True


def test_analyze_edible_oil_scenario():
    """Test edible oil tariff scenario transmission."""
    payload = {
        "scenarioId": "edible-oil-tariff",
        "state": "Gujarat",
        "sector": "Urban",
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scenario"]["id"] == "edible-oil-tariff"
    assert any(n["id"] == "edible_oil_crude" for n in data["graph"]["nodes"])
    assert data["persona"]["totalMonthlyImpactRangeInr"] is not None
