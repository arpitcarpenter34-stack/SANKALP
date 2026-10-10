"""Integration tests for What-to-Watch router mounted in the real FastAPI application."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_what_to_watch_route_registered_in_real_app():
    """Verify endpoint is registered in the FastAPI application with expected method and path."""
    paths = app.openapi()["paths"]
    assert "/what-to-watch/" in paths
    assert "post" in paths["/what-to-watch/"]


def test_what_to_watch_endpoint_integration_valid_request():
    """Verify endpoint handles valid request through the real FastAPI application."""
    payload = {
        "event_id": "rbi-dollar-window",
        "nodes": [
            {
                "id": "node1",
                "label": "Node 1",
                "receipt": {"verification_status": "[VERIFIED]"},
            }
        ],
        "edges": [],
        "paths": [["node1"]],
        "time_series_metadata": {},
        "consensus_result": None,
    }
    response = client.post("/what-to-watch/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "notes" in data
    assert isinstance(data["notes"], list)
    assert len(data["notes"]) == 1
    assert data["notes"][0]["rule_category"] == "Important pathway indicator"
    assert data["notes"][0]["event_id"] == "rbi-dollar-window"


def test_what_to_watch_endpoint_integration_invalid_payload():
    """Verify endpoint validation errors (422) through the real FastAPI application."""
    payload = {
        "event_id": "rbi-dollar-window"
        # missing required fields
    }
    response = client.post("/what-to-watch/", json=payload)
    assert response.status_code == 422


def test_existing_endpoints_preserved_in_real_app():
    """Verify that existing routes remain registered and functional in the real app."""
    # Health check endpoint
    health_resp = client.get("/api/health")
    assert health_resp.status_code == 200
    assert health_resp.json() == {"status": "ok"}

    paths = app.openapi()["paths"]
    # Events endpoints preserved
    assert "/api/events" in paths
    assert "/api/events/{event_id}" in paths

    # Graph endpoint preserved
    assert "/api/graph/{event_id}" in paths
