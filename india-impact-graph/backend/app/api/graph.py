"""Knowledge Graph API routes for India Impact Graph.

Provides both database-backed event graph retrieval and dynamic
deterministic graph validation, path-finding, and evidence inspection.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.event import FinancialEventModel
from app.schemas.graph import (
    EdgeEvidenceRequest,
    EvidenceResultSchema,
    ImpactKnowledgeGraph,
    NodeEvidenceRequest,
    PathEvidenceRequest,
    PathFindingRequest,
    PathResultSchema,
)
from app.services.graph import build_knowledge_graph
from evidence_service.evidence_service import EvidenceService
from graph.graph_builder import (
    Edge as DomainEdge,
    GraphBuilderError,
    ImpactGraphBuilder,
    Node as DomainNode,
    Receipt as DomainReceipt,
)
from graph.path_finder import ImpactPathFinder, PathFinderError, PathResult

router = APIRouter(prefix="/api/graph", tags=["graph"])


# ============================================================================
# Dynamic Traversal & Analysis Endpoints
# ============================================================================


@router.post("/build", response_model=ImpactKnowledgeGraph, summary="Build and validate a graph")
def build_graph(graph_req: ImpactKnowledgeGraph):
    """Accept nodes and edges, validate deterministically using ImpactGraphBuilder,

    and return the valid deterministic representation.
    """
    builder = ImpactGraphBuilder()
    try:
        for n in graph_req.nodes:
            receipt = None
            if n.receipt:
                receipt = DomainReceipt(**n.receipt.model_dump())
            node = DomainNode(
                id=n.id,
                type=n.type.value,
                label=n.label,
                description=n.description,
                budget_share=n.budget_share,
                receipt=receipt,
            )
            builder.add_node(node)

        for e in graph_req.edges:
            receipt = None
            if e.receipt:
                receipt = DomainReceipt(**e.receipt.model_dump())
            edge = DomainEdge(
                id=e.id,
                source_node=e.from_node,
                target_node=e.to_node,
                relation_type=e.relation_type,
                kind=e.kind.value,
                confidence=e.confidence.value,
                evidence_text=e.evidence_text,
                receipt=receipt,
                direction=e.direction.value if e.direction else None,
                strength=e.strength,
                propagation_path=e.propagation_path.value if e.propagation_path else None,
                what_could_be_wrong=e.what_could_be_wrong,
            )
            builder.add_edge(edge)

        graph_dict = builder.get_graph()

        for node_dict in graph_dict["nodes"]:
            if node_dict.get("receipt"):
                node_dict["receipt"] = node_dict["receipt"].__dict__

        for edge_dict in graph_dict["edges"]:
            edge_dict["from"] = edge_dict.pop("source_node")
            edge_dict["to"] = edge_dict.pop("target_node")
            if edge_dict.get("receipt"):
                edge_dict["receipt"] = edge_dict["receipt"].__dict__

        return ImpactKnowledgeGraph(**graph_dict)
    except GraphBuilderError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/paths", response_model=list[PathResultSchema], summary="Find impact paths")
def find_paths(req: PathFindingRequest):
    """Find impact paths in the provided graph deterministically using ImpactPathFinder."""
    try:
        graph_dict = req.graph.model_dump(by_alias=True)
        for edge_dict in graph_dict["edges"]:
            edge_dict["source_node"] = edge_dict.pop("from")
            edge_dict["target_node"] = edge_dict.pop("to")

        finder = ImpactPathFinder(graph_dict)
        paths = finder.find_paths(
            source_id=req.source_id,
            target_id=req.target_id,
            max_depth=req.max_depth,
            limit=req.limit,
        )

        res = []
        for p in paths:
            res.append(
                PathResultSchema(
                    nodes=p.nodes,
                    edges=p.edges,
                    length=p.length,
                    min_confidence_score=p.min_confidence_score,
                    observed_ratio=p.observed_ratio,
                    edge_metadata=p.edge_metadata,
                )
            )
        return res
    except PathFinderError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/evidence/node", response_model=EvidenceResultSchema, summary="Get node evidence")
def get_node_evidence(req: NodeEvidenceRequest):
    """Extract and validate evidence receipts for a specific node in the graph."""
    graph_dict = req.graph.model_dump(by_alias=True)
    svc = EvidenceService(graph_dict)
    res = svc.get_node_evidence(req.node_id)
    return EvidenceResultSchema(
        status=res.status,
        target_id=res.target_id,
        target_type=res.target_type,
        receipts=res.receipts,
    )


@router.post("/evidence/edge", response_model=EvidenceResultSchema, summary="Get edge evidence")
def get_edge_evidence(req: EdgeEvidenceRequest):
    """Extract and validate evidence receipts for a specific edge in the graph."""
    graph_dict = req.graph.model_dump(by_alias=True)
    for edge_dict in graph_dict["edges"]:
        edge_dict["source_node"] = edge_dict.pop("from")
        edge_dict["target_node"] = edge_dict.pop("to")
    svc = EvidenceService(graph_dict)
    res = svc.get_edge_evidence(req.edge_id)
    return EvidenceResultSchema(
        status=res.status,
        target_id=res.target_id,
        target_type=res.target_type,
        receipts=res.receipts,
    )


@router.post("/evidence/path", response_model=EvidenceResultSchema, summary="Get path evidence")
def get_path_evidence(req: PathEvidenceRequest):
    """Extract and aggregate evidence receipts across all edges in an impact path."""
    graph_dict = req.graph.model_dump(by_alias=True)
    for edge_dict in graph_dict["edges"]:
        edge_dict["source_node"] = edge_dict.pop("from")
        edge_dict["target_node"] = edge_dict.pop("to")
    svc = EvidenceService(graph_dict)

    domain_path = PathResult(
        nodes=req.path.nodes,
        edges=req.path.edges,
        length=req.path.length,
        min_confidence_score=req.path.min_confidence_score,
        observed_ratio=req.path.observed_ratio,
        edge_metadata=[m.model_dump() for m in req.path.edge_metadata],
    )

    res = svc.get_path_evidence(domain_path)
    return EvidenceResultSchema(
        status=res.status,
        target_id=res.target_id,
        target_type=res.target_type,
        receipts=res.receipts,
    )


# ============================================================================
# Database Persistence Graph Retrieval Endpoints
# ============================================================================


@router.get(
    "/{event_id}",
    response_model=ImpactKnowledgeGraph,
    status_code=status.HTTP_200_OK,
    summary="Retrieve impact knowledge graph for a financial event",
)
def get_graph(
    event_id: str,
    db: Session = Depends(get_db),
) -> ImpactKnowledgeGraph:
    """Retrieve the deterministic impact knowledge graph for a persisted financial event.

    Verifies the event exists in the database. Returns HTTP 404 if not found.
    Distinguishes observed facts from inferred relationships, enforces number-level
    provenance receipts, and avoids unverified quantitative assertions.
    """
    stmt = (
        select(FinancialEventModel)
        .where(FinancialEventModel.event_id == event_id)
        .options(
            selectinload(FinancialEventModel.entities),
            selectinload(FinancialEventModel.evidence_snippets),
        )
    )
    event_model = db.execute(stmt).scalar_one_or_none()

    if not event_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial event with ID '{event_id}' not found",
        )

    return build_knowledge_graph(event=event_model)


@router.get(
    "/{event_id}/",
    response_model=ImpactKnowledgeGraph,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def get_graph_trailing_slash(
    event_id: str,
    db: Session = Depends(get_db),
) -> ImpactKnowledgeGraph:
    """Handle trailing slash path for GET /api/graph/{event_id}/."""
    return get_graph(event_id=event_id, db=db)
