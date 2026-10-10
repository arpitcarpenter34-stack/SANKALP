"""Pydantic data models for the India Impact Graph knowledge graph.

Conforms strictly to `india-impact-graph/schemas/graph-node-edge-schema.json`.
"""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ReceiptDefinition(BaseModel):
    """Data governance receipt encoding the source and provenance of a fact."""

    model_config = ConfigDict(extra="forbid")

    source_title: str
    verification_status: str
    source_url: Optional[str] = None
    table_or_series_id: Optional[str] = None
    year_or_date: Optional[str] = None
    geography: Optional[str] = None
    unit: Optional[str] = None
    formula_details: Optional[str] = None


class NodeType(str, Enum):
    COMMODITY = "commodity"
    HOUSEHOLD_ITEM = "household_item"
    ECONOMIC_INDICATOR = "economic_indicator"
    SECTOR = "sector"
    INSTRUMENT_ASSET = "instrument_asset"
    PERSONA = "persona"


class Node(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    type: NodeType
    label: str
    description: Optional[str] = None
    budget_share: Optional[float] = None
    receipt: Optional[ReceiptDefinition] = None


class EdgeKind(str, Enum):
    OBSERVED = "observed"
    INFERRED = "inferred"


class EdgeDirection(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    AMBIGUOUS = "ambiguous"
    UNSPECIFIED = "unspecified"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PropagationPath(str, Enum):
    FOOD_COST = "food_cost"
    TRANSPORT_COST = "transport_cost"
    FINANCIAL_MARKET = "financial_market"
    OTHER = "other"


class Edge(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    relation_type: str
    kind: EdgeKind
    confidence: ConfidenceLevel
    evidence_text: str
    receipt: ReceiptDefinition
    direction: Optional[EdgeDirection] = None
    strength: Optional[float] = None
    propagation_path: Optional[PropagationPath] = None
    what_could_be_wrong: Optional[str] = None


class ImpactKnowledgeGraph(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nodes: List[Node]
    edges: List[Edge]


class PathEdgeMetadata(BaseModel):
    """Metadata for a traversed edge."""
    id: str
    kind: Optional[str] = None
    confidence: Optional[str] = None
    receipt: Optional[ReceiptDefinition] = None


class PathResultSchema(BaseModel):
    """Response model for deterministic impact path finding."""
    nodes: List[str]
    edges: List[str]
    length: int
    min_confidence_score: int
    observed_ratio: float
    edge_metadata: List[PathEdgeMetadata]


class EvidenceStatusEnum(str, Enum):
    VALID_EVIDENCE = "VALID_EVIDENCE"
    NO_EVIDENCE = "NO_EVIDENCE"
    INCOMPLETE_METADATA = "INCOMPLETE_METADATA"
    INVALID_STRUCTURE = "INVALID_STRUCTURE"
    REFERENCE_NOT_FOUND = "REFERENCE_NOT_FOUND"


class EvidenceResultSchema(BaseModel):
    """Response model for evidence extraction."""
    status: EvidenceStatusEnum
    target_id: str
    target_type: str
    receipts: List[dict] # In evidence_service.py receipts have `_associated_node_id` etc., so using dict is safer.
