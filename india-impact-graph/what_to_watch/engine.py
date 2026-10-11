from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class WatchNote(BaseModel):
    note_id: str
    event_id: Optional[str] = None
    related_item_id: Optional[str] = None
    item_type: str
    indicator_to_monitor: str
    reason: str
    rule_category: str
    evidence_receipt: Optional[Dict[str, Any]] = None
    observed_inferred_status: Optional[str] = None
    source_lineage_status: Optional[str] = None
    time_series_status: Optional[str] = None
    missing_data_explanation: Optional[str] = None

class WhatToWatchEngine:
    def __init__(self):
        pass

    def generate_notes(
        self,
        event_id: str,
        nodes: List[Dict[str, Any]],
        edges: List[Dict[str, Any]],
        paths: List[List[str]],
        time_series_metadata: Dict[str, Dict[str, Any]],
        consensus_result: Optional[Dict[str, Any]] = None
    ) -> List[WatchNote]:
        notes = []
        
        path_nodes = set()
        for p in (paths or []):
            if p:
                for n_id in p:
                    if n_id:
                        path_nodes.add(n_id)
                
        for node in (nodes or []):
            if not isinstance(node, dict):
                continue
            node_id = node.get("id", "unknown")
            label = node.get("label") or node_id
            
            # 1. Important pathway indicator
            if node_id in path_nodes:
                notes.append(WatchNote(
                    note_id=f"pathway-{node_id}",
                    event_id=event_id,
                    related_item_id=node_id,
                    item_type="node",
                    indicator_to_monitor=label,
                    reason="This indicator appears on a ranked impact pathway.",
                    rule_category="Important pathway indicator",
                    evidence_receipt=node.get("receipt") if isinstance(node.get("receipt"), dict) else None
                ))
            
            # 5. Missing data (Node level)
            receipt = node.get("receipt")
            status = receipt.get("verification_status") if isinstance(receipt, dict) else None
            if status in ["[UNVERIFIED]", "[VERIFY]"]:
                notes.append(WatchNote(
                    note_id=f"missing-verification-node-{node_id}",
                    event_id=event_id,
                    related_item_id=node_id,
                    item_type="node",
                    indicator_to_monitor=label,
                    reason="Required indicator data lacks verification.",
                    rule_category="Missing data",
                    missing_data_explanation="Data acquisition is required before further reliable calculation."
                ))
            
        # 2. Evidence limitation & Missing data (Edges)
        for edge in (edges or []):
            if not isinstance(edge, dict):
                continue
            edge_id = edge.get("id", "unknown")
            kind = edge.get("kind")
            receipt = edge.get("receipt")
            status = receipt.get("verification_status") if isinstance(receipt, dict) else None
            
            if kind == "inferred":
                notes.append(WatchNote(
                    note_id=f"evidence-limitation-inferred-{edge_id}",
                    event_id=event_id,
                    related_item_id=edge_id,
                    item_type="edge",
                    indicator_to_monitor=f"Relationship from {edge.get('from')} to {edge.get('to')}",
                    reason="This relationship is structurally inferred and requires validation.",
                    rule_category="Evidence limitation",
                    evidence_receipt=receipt if isinstance(receipt, dict) else None,
                    observed_inferred_status=kind
                ))
            
            if status in ["[UNVERIFIED]", "[VERIFY]"]:
                notes.append(WatchNote(
                    note_id=f"missing-verification-edge-{edge_id}",
                    event_id=event_id,
                    related_item_id=edge_id,
                    item_type="edge",
                    indicator_to_monitor=f"Relationship from {edge.get('from')} to {edge.get('to')}",
                    reason="This relationship lacks sufficient corroborating evidence.",
                    rule_category="Evidence limitation",
                    evidence_receipt=receipt if isinstance(receipt, dict) else None,
                    observed_inferred_status=kind
                ))
                
        # 3. Time-series coverage
        for ts_id, meta in (time_series_metadata or {}).items():
            if not isinstance(meta, dict):
                continue
            freq = (meta.get("frequency") or "").lower()
            notes_str = (meta.get("notes") or "").lower()
            if "sparse" in freq or "starter extract" in notes_str or "not a complete" in freq or "not the full" in notes_str:
                notes.append(WatchNote(
                    note_id=f"ts-coverage-{ts_id}",
                    event_id=event_id,
                    related_item_id=ts_id,
                    item_type="time_series",
                    indicator_to_monitor=ts_id,
                    reason="The available history is sparse or incomplete.",
                    rule_category="Time-series coverage",
                    time_series_status="Sparse or incomplete history"
                ))
                
        # 4. Source-lineage limitation
        if consensus_result and isinstance(consensus_result, dict):
            lineage = consensus_result.get("source_lineage_status")
            if lineage == "MULTI_PUBLISHER_SINGLE_ROOT":
                notes.append(WatchNote(
                    note_id=f"lineage-{event_id}",
                    event_id=event_id,
                    related_item_id=consensus_result.get("event_id", event_id),
                    item_type="consensus",
                    indicator_to_monitor="News Consensus",
                    reason="Multiple publishers report one root announcement. Agreement must not be mistaken for independent confirmation.",
                    rule_category="Source-lineage limitation",
                    source_lineage_status=lineage
                ))
                
        # Deterministic sorting
        notes.sort(key=lambda x: (x.rule_category, x.note_id))
        return notes
