"""Pydantic data models for Knowledge Graph entities and relationships.

Conforms strictly to `india-impact-graph/schemas/graph-node-edge-schema.json`
and `india-impact-graph/docs/KNOWLEDGE_GRAPH_SPEC.md`.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class NodeType(str, Enum):
    """The 6 core node types defined by the MVP specification."""

    COMMODITY = "commodity"
    HOUSEHOLD_ITEM = "household_item"
    ECONOMIC_INDICATOR = "economic_indicator"
    SECTOR = "sector"
    INSTRUMENT_ASSET = "instrument_asset"
    PERSONA = "persona"


class EdgeKind(str, Enum):
    """Classification of edge as observed fact vs inferred economic dependency."""

    OBSERVED = "observed"
    INFERRED = "inferred"


class EdgeDirection(str, Enum):
    """Correlation or transmission direction."""

    POSITIVE = "positive"
    NEGATIVE = "negative"
    AMBIGUOUS = "ambiguous"
    UNSPECIFIED = "unspecified"


class EdgeConfidence(str, Enum):
    """Confidence level based on empirical evidence quality."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class PropagationPath(str, Enum):
    """Primary propagation pathway within the MVP."""

    FOOD_COST = "food_cost"
    TRANSPORT_COST = "transport_cost"
    FINANCIAL_MARKET = "financial_market"
    OTHER = "other"


class VerificationStatus(str, Enum):
    """Data governance classification for source provenance."""

    VERIFIED = "[VERIFIED]"
    VERIFY = "[VERIFY]"
    INFERENCE = "[INFERENCE]"
    UNVERIFIED = "[UNVERIFIED]"


class ReceiptDefinition(BaseModel):
    """Number-level provenance receipt grounding data entities and transmission links."""

    model_config = ConfigDict(extra="forbid")

    source_title: str
    verification_status: VerificationStatus
    source_url: Optional[str] = None
    table_or_series_id: Optional[str] = None
    year_or_date: Optional[str] = None
    geography: Optional[str] = None
    unit: Optional[str] = None
    formula_details: Optional[str] = None


class GraphNode(BaseModel):
    """Typed economic entity within the impact knowledge graph."""

    model_config = ConfigDict(extra="forbid")

    id: str
    type: NodeType
    label: str
    description: Optional[str] = None
    budget_share: Optional[float] = None
    receipt: Optional[ReceiptDefinition] = None


class GraphEdge(BaseModel):
    """Attributed directional transmission relationship between economic entities."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    from_node: str = Field(alias="from", serialization_alias="from")
    to: str
    relation_type: str
    kind: EdgeKind
    confidence: EdgeConfidence
    evidence_text: str
    receipt: ReceiptDefinition
    direction: Optional[EdgeDirection] = None
    strength: Optional[float] = None
    propagation_path: Optional[PropagationPath] = None
    what_could_be_wrong: Optional[str] = None


class ImpactKnowledgeGraph(BaseModel):
    """Full knowledge graph payload representing nodes and edges for an event."""

    model_config = ConfigDict(extra="forbid")

    nodes: list[GraphNode]
    edges: list[GraphEdge]
