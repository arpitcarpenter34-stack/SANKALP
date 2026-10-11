"""Unit tests for Composite Transmission Scenario Analysis API (POST /api/scenarios/analyze)."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_analyze_crude_preset_scenario_direct():
    """Verify analysis of canonical preset crude scenario returns genuine contract data."""
    payload = {
        "scenarioId": "crude-oil-shock-12pct",
        "isAiOff": True,
        "state": "Madhya Pradesh",
        "sector": "Rural",
        "expenditureClass": "Middle",
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # 1. Scenario contract checks
    scenario = data["scenario"]
    assert scenario["id"] == "crude-oil-shock-12pct"
    assert scenario["title"] == "Crude Oil Price Shock: +12% (Synthetic Benchmark Scenario)"
    assert scenario["title"] != "Backend Mock Scenario"
    assert scenario["magnitudeNumeric"] == 12.0
    assert scenario["magnitudeUnit"] == "%"
    assert scenario["sourceReceipt"]["verificationStatus"] == "[INFERENCE]"
    assert isinstance(scenario["sourceReceipt"]["caveats"], list)

    # 2. Graph contract checks
    graph = data["graph"]
    assert isinstance(graph["nodes"], list)
    assert len(graph["nodes"]) >= 3
    assert isinstance(graph["edges"], list)
    assert len(graph["edges"]) >= 2
    assert isinstance(graph["availablePaths"], list)
    assert len(graph["availablePaths"]) == 3

    # Check observed vs inferred node/edge integrity
    for node in graph["nodes"]:
        assert "id" in node
        assert "label" in node
        assert "type" in node
        assert isinstance(node["isObservedFact"], bool)

    for edge in graph["edges"]:
        assert "id" in edge
        assert "from" in edge
        assert "to" in edge
        assert "relationType" in edge
        assert edge["kind"] in ["observed", "inferred"]
        assert edge["confidence"] in ["high", "medium", "low"]
        assert "evidenceQuote" in edge
        assert "receipt" in edge

    # 3. Persona contract checks
    persona = data["persona"]
    assert persona["persona"]["state"] == "Madhya Pradesh"
    assert persona["persona"]["sector"] == "Rural"
    assert persona["mpceBaselineInr"] == 3441.0
    assert persona["mpceBaselineReceipt"]["verificationStatus"] == "[VERIFIED]"
    assert persona["mpceBaselineReceipt"]["tableOrSeriesId"] == "Table 2"

    # Total impact range should be computed from verified items
    assert persona["totalMonthlyImpactRangeInr"] is not None
    assert persona["totalMonthlyImpactRangeInr"]["low"] > 0
    assert persona["totalMonthlyImpactRangeInr"]["high"] >= persona["totalMonthlyImpactRangeInr"]["low"]

    # Vegetable impact factor must be strictly NULL with data_not_available status
    items = persona["itemBreakdown"]
    veg_item = next((i for i in items if i["itemId"] == "food_vegetables"), None)
    assert veg_item is not None
    assert veg_item["dataStatus"] == "data_not_available"
    assert veg_item["passThroughFactor"] is None
    assert veg_item["estimatedMonthlyImpactInr"] is None

    # Supported conveyance fuel impact must be available
    fuel_item = next((i for i in items if i["itemId"] == "commute_fuel"), None)
    assert fuel_item is not None
    assert fuel_item["dataStatus"] == "available"
    assert fuel_item["passThroughFactor"]["low"] == 0.30
    assert fuel_item["passThroughFactor"]["high"] == 0.45
    assert fuel_item["estimatedMonthlyImpactInr"]["low"] > 0

    # 4. Top-level metadata checks
    assert data["isAiOff"] is True
    assert data["isLiveBackend"] is True
    assert data["dataSourceLabel"] == "LIVE FASTAPI BACKEND // REAL-TIME EXTRACTION"
    assert "analyzedAt" in data


def test_analyze_frontend_aliases():
    """Verify frontend aliases correctly resolve to backend scenarios."""
    # Alias crude-oil-12pct
    res_crude = client.post(
        "/api/scenarios/analyze",
        json={"scenarioId": "crude-oil-12pct", "isAiOff": True},
    )
    assert res_crude.status_code == 200
    data_crude = res_crude.json()
    assert data_crude["scenario"]["id"] == "crude-oil-12pct"
    assert "Crude Oil Price Shock" in data_crude["scenario"]["title"]

    # Alias edible-oil-tariff
    res_edible = client.post(
        "/api/scenarios/analyze",
        json={"scenarioId": "edible-oil-tariff", "isAiOff": True},
    )
    assert res_edible.status_code == 200
    data_edible = res_edible.json()
    assert data_edible["scenario"]["id"] == "edible-oil-tariff"
    assert "Edible Oil" in data_edible["scenario"]["title"]

    # Alias wheat-procurement-spike
    res_wheat = client.post(
        "/api/scenarios/analyze",
        json={"scenarioId": "wheat-procurement-spike", "isAiOff": True},
    )
    assert res_wheat.status_code == 200
    data_wheat = res_wheat.json()
    assert data_wheat["scenario"]["id"] == "wheat-procurement-spike"
    assert "Wheat Mandi Arrival" in data_wheat["scenario"]["title"]


def test_analyze_custom_text_with_extraction():
    """Verify custom text dispatches are processed by event extraction."""
    payload = {
        "scenarioId": "custom",
        "customText": "Global crude oil prices jump 15 percent due to refinery shutdowns.",
        "isAiOff": True,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    scenario = data["scenario"]
    assert scenario["id"] == "custom"
    assert scenario["eventType"] == "custom"
    assert scenario["sourceReceipt"]["verificationStatus"] == "[UNVERIFIED]"
    assert data["graph"]["nodes"]
    assert data["persona"]["itemBreakdown"]


def test_analyze_custom_text_unquantified_honest_null():
    """Verify unquantified custom news produces honest NULL impact without fabricating numbers."""
    payload = {
        "scenarioId": "custom",
        "customText": "Global crude oil prices fluctuate amid international maritime geopolitical tensions.",
        "isAiOff": True,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Zero substitution prohibited: total range must be strictly null
    assert data["persona"]["totalMonthlyImpactRangeInr"] is None
    assert data["persona"]["itemCoverage"]["calculatedItemsCount"] == 0
    for item in data["persona"]["itemBreakdown"]:
        assert item["dataStatus"] == "data_not_available"
        assert item["estimatedMonthlyImpactInr"] is None


def test_analyze_custom_text_unrecognized_indicator_returns_422():
    """Verify custom text without recognized financial indicators returns 422."""
    payload = {
        "scenarioId": "custom",
        "customText": "General meeting held with no economic keywords present.",
        "isAiOff": True,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 422
    assert "No recognized financial event indicators found" in response.json()["detail"]


def test_analyze_sector_switching_urban():
    """Verify switching sector to Urban shifts baseline MPCE to official ₹5,538."""
    payload = {
        "scenarioId": "crude-oil-shock-12pct",
        "state": "Madhya Pradesh",
        "sector": "Urban",
        "expenditureClass": "Middle",
        "isAiOff": True,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["persona"]["persona"]["sector"] == "Urban"
    assert data["persona"]["mpceBaselineInr"] == 5538.0
    assert data["persona"]["totalMonthlyImpactRangeInr"] is not None


def test_analyze_empty_request_rejected():
    """Verify missing both scenarioId and customText returns 400 Bad Request."""
    response = client.post("/api/scenarios/analyze", json={})
    assert response.status_code == 400
    assert "Either scenarioId or customText" in response.json()["detail"]


def test_analyze_empty_custom_text_rejected():
    """Verify empty customText for scenarioId='custom' returns 422 Unprocessable Entity."""
    payload = {"scenarioId": "custom", "customText": "   "}
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 422


def test_analyze_unknown_scenario_returns_404():
    """Verify non-existent scenario ID returns 404 Not Found."""
    payload = {"scenarioId": "non-existent-scenario-999"}
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_contract_validator_criteria():
    """Verify the payload matches all assertions of frontend's isValidAnalysisPayload."""
    payload = {
        "scenarioId": "crude-oil-12pct",
        "isAiOff": False,
    }
    response = client.post("/api/scenarios/analyze", json=payload)
    assert response.status_code == 200
    d = response.json()

    # Rule 1: Validate scenario object
    assert "scenario" in d and isinstance(d["scenario"], dict)
    assert isinstance(d["scenario"]["id"], str)
    assert isinstance(d["scenario"]["title"], str)
    assert "sourceReceipt" in d["scenario"] and isinstance(d["scenario"]["sourceReceipt"], dict)

    # Rule 2: Validate graph object
    assert "graph" in d and isinstance(d["graph"], dict)
    assert isinstance(d["graph"]["nodes"], list)
    assert isinstance(d["graph"]["edges"], list)
    assert len(d["graph"]["nodes"]) > 0

    # Rule 3: Validate persona object
    assert "persona" in d and isinstance(d["persona"], dict)
    assert isinstance(d["persona"]["persona"], dict)
    assert isinstance(d["persona"]["itemBreakdown"], list)
    assert isinstance(d["persona"]["itemCoverage"], dict)
    assert d["persona"]["itemCoverage"] is not None

    # Title check: Must NOT be 'Backend Mock Scenario'
    assert d["scenario"]["title"] != "Backend Mock Scenario"


def test_analyze_trailing_slash_support():
    """Verify endpoint handles trailing slash path POST /api/scenarios/analyze/."""
    payload = {
        "scenarioId": "crude-oil-12pct",
        "isAiOff": True,
    }
    response = client.post("/api/scenarios/analyze/", json=payload)
    assert response.status_code == 200
    assert response.json()["scenario"]["id"] == "crude-oil-12pct"
