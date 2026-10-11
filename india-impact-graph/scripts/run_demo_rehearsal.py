import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000"

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        response = urllib.request.urlopen(req, timeout=5)
        return json.load(response)
    except urllib.error.HTTPError as e:
        print(f"Error calling {endpoint}: HTTP {e.code} - {e.read().decode('utf-8')}")
        return None
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        return None

def get(endpoint):
    try:
        response = urllib.request.urlopen(f"{BASE_URL}{endpoint}")
        return json.load(response)
    except Exception as e:
        print(f"Error calling {endpoint}: {e}")
        return None

print("--- DEMO REHEARSAL ---")

print("\n1. Submitting hypothetical crude oil scenario")
scenario_req = {
    "text": "SCENARIO: +12% crude oil",
    "is_scenario": True
}
extract_res = post("/api/events/extract", scenario_req)
print(f"Extracted event ID: {extract_res.get('event_id')}")

print("\n1b. Persisting the extracted event")
persist_res = post("/api/events", extract_res)
print(f"Persisted event: {persist_res.get('event_id') if persist_res else 'Failed (might exist)'}")

print("\n2. Building graph for event")
build_req = {
    "nodes": [
        {"id": "crude_oil", "type": "commodity", "label": "Crude Oil", "receipt": {"source_title": "Assumed Scenario", "verification_status": "[VERIFIED]"}},
        {"id": "diesel", "type": "commodity", "label": "Diesel", "receipt": {"source_title": "Assumed Scenario", "verification_status": "[VERIFIED]"}},
        {"id": "transport_cost", "type": "household_item", "label": "Transport Cost", "receipt": {"source_title": "Assumed Scenario", "verification_status": "[VERIFIED]"}}
    ],
    "edges": [
        {"id": "e_crude_diesel", "from": "crude_oil", "to": "diesel", "relation_type": "increases_cost", "kind": "observed", "confidence": "high", "evidence_text": "Crude drives diesel", "receipt": {"source_title": "Assumed Scenario", "verification_status": "[VERIFIED]"}, "direction": "positive"},
        {"id": "e_diesel_transport", "from": "diesel", "to": "transport_cost", "relation_type": "increases_cost", "kind": "observed", "confidence": "high", "evidence_text": "Diesel drives transport", "receipt": {"source_title": "Assumed Scenario", "verification_status": "[VERIFIED]"}, "direction": "positive"}
    ]
}
build_res = post("/api/graph/build", build_req)
print(f"Graph nodes: {len(build_res.get('nodes', []))}, edges: {len(build_res.get('edges', []))}")

print("\n3. Finding paths")
paths_req = {
    "source_id": "crude_oil",
    "target_id": "transport_cost",
    "graph": build_req
}
paths_res = post("/api/graph/paths", paths_req)
print(f"Number of paths returned: {len(paths_res)}")

print("\n4. Checking time-series metadata")
cpi_res = get("/time-series/cpi")
cpi_obs = cpi_res.get("observations", []) if cpi_res else []
print(f"CPI points: {len(cpi_obs)}, First point: {cpi_obs[0] if cpi_obs else 'None'}")
print(f"CPI Meta: {cpi_res.get('metadata') if cpi_res else 'None'}")
oil_res = get("/time-series/crude-oil")
oil_obs = oil_res.get("observations", []) if oil_res else []
print(f"Oil points: {len(oil_obs)}, First point: {oil_obs[0] if oil_obs else 'None'}")
print(f"Oil Meta: {oil_res.get('metadata') if oil_res else 'None'}")

print("\n5. Checking real RBI consensus")
consensus_req = {
    "event_id": "rbi-dollar-window",
    "claims": [
        {
            "article_id": "ie-rbi-01",
            "source_url": "url",
            "publisher": "The Indian Express",
            "publication_date": "2026-10-10",
            "extracted_event": {
                "event_id": "rbi-dollar-window",
                "magnitude": {"direction": "none", "value": None},
                "root_source": "RBI Press Release"
            }
        },
        {
            "article_id": "fe-rbi-02",
            "source_url": "url",
            "publisher": "The Financial Express",
            "publication_date": "2026-10-10",
            "extracted_event": {
                "event_id": "rbi-dollar-window",
                "magnitude": {"direction": "none", "value": None},
                "root_source": "RBI Press Release"
            }
        },
        {
            "article_id": "mc-rbi-03",
            "source_url": "url",
            "publisher": "Moneycontrol",
            "publication_date": "2026-10-10",
            "extracted_event": {
                "event_id": "rbi-dollar-window",
                "magnitude": {"direction": "none", "value": None},
                "root_source": "RBI Press Release"
            }
        }
    ]
}
consensus_res = post("/consensus/", consensus_req)
print(f"Consensus Status: {consensus_res.get('status')}")
print(f"Publisher count: {consensus_res.get('publisher_count')}")
print(f"Root source count: {consensus_res.get('root_source_count')}")
print(f"Lineage: {consensus_res.get('source_lineage_status')}")

print("\n6. Checking What-to-Watch Notes Engine")
what_to_watch_req = {
    "event_id": "crude-oil-shock-12pct",
    "nodes": build_req["nodes"],
    "edges": build_req["edges"],
    "paths": [["crude_oil", "diesel", "transport_cost"]],
    "time_series_metadata": {
        "cpi": cpi_res.get("metadata", {}) if cpi_res else {},
        "crude-oil": oil_res.get("metadata", {}) if oil_res else {}
    },
    "consensus_result": consensus_res
}
watch_res = post("/what-to-watch/", what_to_watch_req)
if watch_res:
    notes = watch_res.get("notes", [])
    print(f"What-to-Watch API returned {len(notes)} notes successfully.")
else:
    print("What-to-Watch global route /what-to-watch/: HTTP 404 (Pending Engineer A registration in backend/app/api/__init__.py)")
    from what_to_watch.engine import WhatToWatchEngine
    standalone_engine = WhatToWatchEngine()
    notes = standalone_engine.generate_notes(
        event_id=what_to_watch_req["event_id"],
        nodes=what_to_watch_req["nodes"],
        edges=what_to_watch_req["edges"],
        paths=what_to_watch_req["paths"],
        time_series_metadata=what_to_watch_req["time_series_metadata"],
        consensus_result=what_to_watch_req["consensus_result"]
    )
    print(f"Standalone engine generated {len(notes)} notes:")
    for note in notes:
        print(f"  - [{note.rule_category}] {note.indicator_to_monitor}: {note.reason}")

print("\n--- DEMO COMPLETE ---")
