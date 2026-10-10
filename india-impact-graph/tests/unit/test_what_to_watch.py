import pytest
from what_to_watch.engine import WhatToWatchEngine

def test_generate_notes_empty():
    engine = WhatToWatchEngine()
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=[],
        edges=[],
        paths=[],
        time_series_metadata={},
        consensus_result=None
    )
    assert len(notes) == 0

def test_important_pathway_indicator():
    engine = WhatToWatchEngine()
    nodes = [{"id": "node1", "label": "Node 1", "receipt": {"verification_status": "[VERIFIED]"}}]
    edges = []
    paths = [["node1", "node2"]]
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=nodes,
        edges=edges,
        paths=paths,
        time_series_metadata={},
        consensus_result=None
    )
    assert len(notes) == 1
    note = notes[0]
    assert note.rule_category == "Important pathway indicator"
    assert note.related_item_id == "node1"
    assert note.indicator_to_monitor == "Node 1"

def test_evidence_limitation_inferred_edge():
    engine = WhatToWatchEngine()
    edges = [{
        "id": "edge1", 
        "from": "node1", 
        "to": "node2", 
        "kind": "inferred",
        "receipt": {"verification_status": "[VERIFIED]"}
    }]
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=[],
        edges=edges,
        paths=[],
        time_series_metadata={},
        consensus_result=None
    )
    assert len(notes) == 1
    assert notes[0].rule_category == "Evidence limitation"
    assert "inferred" in notes[0].reason
    assert notes[0].observed_inferred_status == "inferred"

def test_missing_data_node():
    engine = WhatToWatchEngine()
    nodes = [{"id": "node1", "label": "Node 1", "receipt": {"verification_status": "[VERIFY]"}}]
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=nodes,
        edges=[],
        paths=[],
        time_series_metadata={},
        consensus_result=None
    )
    assert len(notes) == 1
    assert notes[0].rule_category == "Missing data"
    assert notes[0].related_item_id == "node1"

def test_time_series_coverage():
    engine = WhatToWatchEngine()
    ts_metadata = {
        "cpi": {"frequency": "monthly", "notes": "Starter extract only"},
        "oil": {"frequency": "Sparse snapshots", "notes": ""}
    }
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=[],
        edges=[],
        paths=[],
        time_series_metadata=ts_metadata,
        consensus_result=None
    )
    assert len(notes) == 2
    categories = [n.rule_category for n in notes]
    assert categories == ["Time-series coverage", "Time-series coverage"]
    ids = [n.related_item_id for n in notes]
    assert "cpi" in ids
    assert "oil" in ids

def test_source_lineage_limitation():
    engine = WhatToWatchEngine()
    consensus = {
        "event_id": "rbi-dollar-window",
        "source_lineage_status": "MULTI_PUBLISHER_SINGLE_ROOT"
    }
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=[],
        edges=[],
        paths=[],
        time_series_metadata={},
        consensus_result=consensus
    )
    assert len(notes) == 1
    assert notes[0].rule_category == "Source-lineage limitation"
    assert notes[0].source_lineage_status == "MULTI_PUBLISHER_SINGLE_ROOT"

def test_deterministic_ordering():
    engine = WhatToWatchEngine()
    nodes = [
        {"id": "node_b", "label": "B", "receipt": {"verification_status": "[VERIFY]"}},
        {"id": "node_a", "label": "A", "receipt": {"verification_status": "[VERIFY]"}}
    ]
    notes = engine.generate_notes(
        event_id="test-event",
        nodes=nodes,
        edges=[],
        paths=[],
        time_series_metadata={},
        consensus_result=None
    )
    assert len(notes) == 2
    # Missing data category. note_id includes node_id, so missing-verification-node-node_a should come before node_b
    assert notes[0].note_id == "missing-verification-node-node_a"
    assert notes[1].note_id == "missing-verification-node-node_b"

def test_null_and_malformed_edge_cases():
    engine = WhatToWatchEngine()
    # Null receipt on node and edge, None metadata values, None paths, non-dict elements
    nodes = [
        {"id": "node1", "label": None, "receipt": None},
        "invalid_node_string",
        {"id": "node2", "label": "Node 2", "receipt": {"verification_status": None}}
    ]
    edges = [
        {"id": "edge1", "from": "node1", "to": "node2", "kind": None, "receipt": None},
        None,
        {"id": "edge2", "from": "node2", "to": "node1", "kind": "inferred", "receipt": "not_a_dict"}
    ]
    ts_meta = {
        "cpi": {"frequency": None, "notes": None},
        "invalid_ts": None,
        "oil": {"frequency": "sparse snapshots", "notes": None}
    }
    consensus = {"source_lineage_status": None}

    notes = engine.generate_notes(
        event_id="test-event",
        nodes=nodes,
        edges=edges,
        paths=None,
        time_series_metadata=ts_meta,
        consensus_result=consensus
    )
    # edge2 is inferred -> 1 note; oil has sparse frequency -> 1 note
    assert len(notes) == 2
    categories = [n.rule_category for n in notes]
    assert "Evidence limitation" in categories
    assert "Time-series coverage" in categories

