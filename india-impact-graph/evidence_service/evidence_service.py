from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Union
import copy
from graph.graph_builder import Receipt, Node, Edge
from graph.path_finder import PathResult

class EvidenceStatus:
    VALID = "VALID_EVIDENCE"
    NONE = "NO_EVIDENCE"
    INCOMPLETE = "INCOMPLETE_METADATA"
    INVALID = "INVALID_STRUCTURE"
    NOT_FOUND = "REFERENCE_NOT_FOUND"

@dataclass
class EvidenceResult:
    status: str
    target_id: str
    target_type: str # 'node', 'edge', 'path'
    receipts: List[Dict[str, Any]]
    
class EvidenceService:
    def __init__(self, graph_data: Dict[str, Any]):
        """
        graph_data is expected to be the dictionary representation of the graph 
        as returned by ImpactGraphBuilder.get_graph().
        """
        self._nodes = {n["id"]: n for n in graph_data.get("nodes", [])}
        self._edges = {e["id"]: e for e in graph_data.get("edges", [])}

    def _validate_receipt_dict(self, receipt_dict: Optional[Dict[str, Any]]) -> str:
        if not receipt_dict:
            return EvidenceStatus.NONE
        if not isinstance(receipt_dict, dict):
            return EvidenceStatus.INVALID
        
        # Check required fields of Receipt
        if not receipt_dict.get("source_title"):
            return EvidenceStatus.INCOMPLETE
        if not receipt_dict.get("verification_status"):
            return EvidenceStatus.INCOMPLETE
            
        return EvidenceStatus.VALID

    def get_node_evidence(self, node_id: str) -> EvidenceResult:
        if node_id not in self._nodes:
            return EvidenceResult(EvidenceStatus.NOT_FOUND, node_id, "node", [])
            
        node = self._nodes[node_id]
        receipt = node.get("receipt")
        
        status = self._validate_receipt_dict(receipt)
        receipts = [copy.deepcopy(receipt)] if status == EvidenceStatus.VALID else []
        
        if status == EvidenceStatus.VALID:
            receipts[0]["_associated_node_id"] = node_id
            
        return EvidenceResult(status, node_id, "node", receipts)

    def get_edge_evidence(self, edge_id: str) -> EvidenceResult:
        if edge_id not in self._edges:
            return EvidenceResult(EvidenceStatus.NOT_FOUND, edge_id, "edge", [])
            
        edge = self._edges[edge_id]
        receipt = edge.get("receipt")
        
        status = self._validate_receipt_dict(receipt)
        receipts = [copy.deepcopy(receipt)] if status == EvidenceStatus.VALID else []
        
        # Edge kind preservation check? The prompt says "preserve observed/inferred classifications".
        # We can include kind in the returned receipt structure to preserve association, 
        # or it's implicitly tied to the edge ID. We'll attach edge context to the receipt.
        if status == EvidenceStatus.VALID:
            receipts[0]["_associated_edge_id"] = edge_id
            receipts[0]["_edge_kind"] = edge.get("kind")
        
        return EvidenceResult(status, edge_id, "edge", receipts)

    def get_path_evidence(self, path: PathResult) -> EvidenceResult:
        """
        Returns aggregated evidence for a given PathResult.
        Collects only receipts associated with the actual traversed nodes and edges.
        Deduplicates repeated receipt references deterministically.
        """
        if not isinstance(path, PathResult):
            return EvidenceResult(EvidenceStatus.INVALID, "unknown", "path", [])
            
        all_receipts = []
        status_set = set()
        
        seen_receipt_signatures = set()
        
        # Collect nodes
        for node_id in path.nodes:
            res = self.get_node_evidence(node_id)
            if res.status == EvidenceStatus.VALID:
                for r in res.receipts:
                    r["_associated_node_id"] = node_id
                    sig = self._get_receipt_signature(r)
                    if sig not in seen_receipt_signatures:
                        seen_receipt_signatures.add(sig)
                        all_receipts.append(r)
            else:
                if res.status != EvidenceStatus.NONE:
                    status_set.add(res.status)
                    
        # Collect edges (preserving order of traversal)
        # Using edge_metadata from PathResult if possible, but we can also use graph_data directly 
        # to ensure it's not fabricated by path finder.
        for edge_id in path.edges:
            res = self.get_edge_evidence(edge_id)
            if res.status == EvidenceStatus.VALID:
                for r in res.receipts:
                    sig = self._get_receipt_signature(r)
                    if sig not in seen_receipt_signatures:
                        seen_receipt_signatures.add(sig)
                        all_receipts.append(r)
            else:
                # If an edge is completely missing evidence, it might be INCOMPLETE or NONE.
                status_set.add(res.status)
                
        # Determine aggregate status
        if EvidenceStatus.NOT_FOUND in status_set:
            final_status = EvidenceStatus.NOT_FOUND
        elif EvidenceStatus.INVALID in status_set:
            final_status = EvidenceStatus.INVALID
        elif EvidenceStatus.INCOMPLETE in status_set:
            final_status = EvidenceStatus.INCOMPLETE
        elif not all_receipts:
            final_status = EvidenceStatus.NONE
        else:
            final_status = EvidenceStatus.VALID
            
        path_id = ",".join(path.nodes)
        return EvidenceResult(final_status, path_id, "path", all_receipts)
        
    def _get_receipt_signature(self, receipt: Dict[str, Any]) -> str:
        """
        Create a deterministic string to identify unique receipts for deduplication.
        """
        title = receipt.get("source_title", "")
        url = receipt.get("source_url", "")
        date = receipt.get("year_or_date", "")
        # Do not include association metadata in signature to allow deduplication across different edges
        return f"{title}|{url}|{date}"
