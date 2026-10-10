"""Pydantic data models for Knowledge Graph entities and relationships.

Conforms strictly to `india-impact-graph/schemas/graph-node-edge-schema.json`
and `india-impact-graph/docs/KNOWLEDGE_GRAPH_SPEC.md`.
Unified schema supporting both database persistence and traversal/path-finding engines.
"""

from enum import Enum
from typing import List, Optional, Union
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


ConfidenceLevel = EdgeConfidence


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
    """Data governance receipt encoding the source and provenance of a fact."""

    model_config = ConfigDict(extra="forbid")

    source_title: str
    verification_status: Union[VerificationStatus, str]
    source_url: Optional[str] = None
    table_or_series_id: Optional[str] = None
    year_or_date: Optional[str] = None
    geography: Optional[str] = None
    unit: Optional[str] = None
    formula_details: Optional[str] = None


class Node(BaseModel):
    """Typed economic entity within the impact knowledge graph."""

    model_config = ConfigDict(extra="forbid")

    id: str
    type: NodeType
    label: str
    description: Optional[str] = None
    budget_share: Optional[float] = None
    receipt: Optional[ReceiptDefinition] = None


GraphNode = Node


class Edge(BaseModel):
    """Attributed directional transmission relationship between economic entities."""

    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: str
    from_node: str = Field(alias="from", serialization_alias="from")
    to_node: str = Field(alias="to", serialization_alias="to")
    relation_type: str
    kind: EdgeKind
    confidence: EdgeConfidence
    evidence_text: str
    receipt: ReceiptDefinition
    direction: Optional[EdgeDirection] = None
    strength: Optional[float] = None
    propagation_path: Optional[PropagationPath] = None
    what_could_be_wrong: Optional[str] = None

    @property
    def to(self) -> str:
        """Compatibility property for code accessing edge.to directly."""
        return self.to_node


GraphEdge = Edge


class ImpactKnowledgeGraph(BaseModel):
    """Full knowledge graph payload representing nodes and edges for an event."""

    model_config = ConfigDict(extra="forbid")

    nodes: List[Node]
    edges: List[Edge]


class PathEdgeMetadata(BaseModel):
    """Metadata for a traversed edge."""

    model_config = ConfigDict(extra="forbid")

    id: str
    kind: Optional[str] = None
    confidence: Optional[str] = None
    receipt: Optional[ReceiptDefinition] = None


class PathResultSchema(BaseModel):
    """Response model for deterministic impact path finding."""

    model_config = ConfigDict(extra="forbid")

    nodes: List[str]
    edges: List[str]
    length: int
    min_confidence_score: int
    observed_ratio: float
    edge_metadata: List[PathEdgeMetadata]


class EvidenceStatusEnum(str, Enum):
    """Status classification for evidence retrieval."""

    VALID_EVIDENCE = "VALID_EVIDENCE"
    NO_EVIDENCE = "NO_EVIDENCE"
    INCOMPLETE_METADATA = "INCOMPLETE_METADATA"
    INVALID_STRUCTURE = "INVALID_STRUCTURE"
    REFERENCE_NOT_FOUND = "REFERENCE_NOT_FOUND"


class EvidenceResultSchema(BaseModel):
    """Response model for evidence extraction."""

    model_config = ConfigDict(extra="forbid")

    status: EvidenceStatusEnum
    target_id: str
    target_type: str
    receipts: List[dict]


class PathFindingRequest(BaseModel):
    """Request payload for finding paths between nodes."""

    model_config = ConfigDict(extra="forbid")

    graph: ImpactKnowledgeGraph
    source_id: str
    target_id: Optional[str] = None
    max_depth: int = 5
    limit: int = 3


class NodeEvidenceRequest(BaseModel):
    """Request payload for node evidence inspection."""

    model_config = ConfigDict(extra="forbid")

    graph: ImpactKnowledgeGraph
    node_id: str


class EdgeEvidenceRequest(BaseModel):
    """Request payload for edge evidence inspection."""

    model_config = ConfigDict(extra="forbid")

    graph: ImpactKnowledgeGraph
    edge_id: str


class PathEvidenceRequest(BaseModel):
    """Request payload for path evidence inspection."""

    model_config = ConfigDict(extra="forbid")

    graph: ImpactKnowledgeGraph
    path: PathResultSchema
