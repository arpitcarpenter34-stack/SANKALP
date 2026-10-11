import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from what_to_watch.api import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)

def test_api_valid_request():
    payload = {
        "event_id": "rbi-dollar-window",
        "nodes": [{"id": "node1", "label": "Node 1", "receipt": {"verification_status": "[VERIFIED]"}}],
        "edges": [],
        "paths": [["node1"]],
        "time_series_metadata": {},
        "consensus_result": None
    }
    response = client.post("/what-to-watch/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "notes" in data
    assert len(data["notes"]) == 1
    assert data["notes"][0]["rule_category"] == "Important pathway indicator"

def test_api_invalid_payload():
    payload = {
        "event_id": "rbi-dollar-window"
        # missing other required fields
    }
    response = client.post("/what-to-watch/", json=payload)
    assert response.status_code == 422  # Unprocessable Entity

def test_api_deterministic_repeated_requests():
    payload = {
        "event_id": "test-event",
        "nodes": [{"id": "node1", "label": "Node 1", "receipt": {"verification_status": "[VERIFY]"}}],
        "edges": [],
        "paths": [],
        "time_series_metadata": {},
        "consensus_result": None
    }
    res1 = client.post("/what-to-watch/", json=payload)
    res2 = client.post("/what-to-watch/", json=payload)
    
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.json() == res2.json()

