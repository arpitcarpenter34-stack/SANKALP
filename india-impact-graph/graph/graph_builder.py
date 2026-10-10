from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any, Union

@dataclass
class Receipt:
    source_title: str
    verification_status: str
    source_url: Optional[str] = None
    table_or_series_id: Optional[str] = None
    year_or_date: Optional[str] = None
    geography: Optional[str] = None
    unit: Optional[str] = None
    formula_details: Optional[str] = None

@dataclass
class Node:
    id: str
    type: str
    label: str
    description: Optional[str] = None
    budget_share: Optional[float] = None
    receipt: Optional[Receipt] = None

@dataclass
class Edge:
    id: str
    source_node: str  # mapped to 'from' in schema
    target_node: str  # mapped to 'to' in schema
    relation_type: str
    kind: str
    confidence: str
    evidence_text: str
    receipt: Receipt
    direction: Optional[str] = None
    strength: Optional[float] = None
    propagation_path: Optional[str] = None
    what_could_be_wrong: Optional[str] = None

class GraphBuilderError(Exception):
    """Base exception for graph validation errors."""
    pass

class DuplicateNodeError(GraphBuilderError):
    pass

class MissingEndpointError(GraphBuilderError):
    pass

class ValidationError(GraphBuilderError):
    pass

class ImpactGraphBuilder:
    """
    Deterministic Graph Builder for India Impact Graph.
    Validates nodes and edges against the project schema.
    """
    NODE_TYPES = {"commodity", "household_item", "economic_indicator", "sector", "instrument_asset", "persona"}
    EDGE_KINDS = {"observed", "inferred"}
    CONFIDENCE_LEVELS = {"high", "medium", "low"}
    EDGE_DIRECTIONS = {"positive", "negative", "ambiguous", "unspecified", None}
    PROPAGATION_PATHS = {"food_cost", "transport_cost", "financial_market", "other", None}
    VERIFICATION_STATUSES = {"[VERIFIED]", "[VERIFY]", "[INFERENCE]", "[UNVERIFIED]"}

    def __init__(self):
        self._nodes: Dict[str, Node] = {}
        self._edges: Dict[str, Edge] = {}

    def _validate_receipt(self, receipt: Receipt, context: str):
        if not isinstance(receipt, Receipt):
            raise ValidationError(f"[{context}] Invalid receipt type.")
        if not receipt.source_title:
            raise ValidationError(f"[{context}] Receipt must have a source_title.")
        if receipt.verification_status not in self.VERIFICATION_STATUSES:
            raise ValidationError(f"[{context}] Invalid verification_status: {receipt.verification_status}")

    def add_node(self, node: Node) -> None:
        if not isinstance(node, Node):
            raise ValidationError("Input must be a Node object.")
        if not node.id or not node.type or not node.label:
            raise ValidationError(f"Node missing required fields (id, type, label): {node}")
        if node.id in self._nodes:
            raise DuplicateNodeError(f"Node with id '{node.id}' already exists.")
        if node.type not in self.NODE_TYPES:
            raise ValidationError(f"Invalid node type '{node.type}' for node '{node.id}'.")
        if node.receipt:
            self._validate_receipt(node.receipt, f"Node {node.id}")
            
        # Add to graph
        self._nodes[node.id] = node

    def add_edge(self, edge: Edge) -> None:
        if not isinstance(edge, Edge):
            raise ValidationError("Input must be an Edge object.")
        if not all([edge.id, edge.source_node, edge.target_node, edge.relation_type, 
                    edge.kind, edge.confidence, edge.evidence_text]):
            raise ValidationError(f"Edge missing required fields: {edge}")
            
        if edge.id in self._edges:
            raise ValidationError(f"Edge with id '{edge.id}' already exists.")
            
        # Endpoints must exist
        if edge.source_node not in self._nodes:
            raise MissingEndpointError(f"Source node '{edge.source_node}' does not exist.")
        if edge.target_node not in self._nodes:
            raise MissingEndpointError(f"Target node '{edge.target_node}' does not exist.")
            
        # Enums
        if edge.kind not in self.EDGE_KINDS:
            raise ValidationError(f"Invalid edge kind '{edge.kind}' for edge '{edge.id}'.")
        if edge.confidence not in self.CONFIDENCE_LEVELS:
            raise ValidationError(f"Invalid edge confidence '{edge.confidence}' for edge '{edge.id}'.")
        if edge.direction not in self.EDGE_DIRECTIONS:
            raise ValidationError(f"Invalid edge direction '{edge.direction}' for edge '{edge.id}'.")
        if edge.propagation_path not in self.PROPAGATION_PATHS:
            raise ValidationError(f"Invalid propagation path '{edge.propagation_path}' for edge '{edge.id}'.")
            
        # Edge Receipt is required
        if not edge.receipt:
            raise ValidationError(f"Edge '{edge.id}' must have a receipt.")
        self._validate_receipt(edge.receipt, f"Edge {edge.id}")

        self._edges[edge.id] = edge

    def get_graph(self) -> Dict[str, Any]:
        """
        Returns a serialisable, deterministic representation of the graph.
        Ordering is deterministic (sorted by keys).
        """
        return {
            "nodes": [self._nodes[k].__dict__ for k in sorted(self._nodes.keys())],
            "edges": [self._edges[k].__dict__ for k in sorted(self._edges.keys())]
        }
