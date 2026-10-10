"""Graph API routes for India Impact Graph."""

import sys
import os
from fastapi import APIRouter, HTTPException, status
from typing import Any, Dict

# Ensure we can import from the core domain folders
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../")))

from graph.graph_builder import ImpactGraphBuilder, Node as DomainNode, Edge as DomainEdge, Receipt as DomainReceipt, GraphBuilderError
from graph.path_finder import ImpactPathFinder, PathResult, PathFinderError
from evidence_service.evidence_service import EvidenceService

from app.schemas.graph import (
    ImpactKnowledgeGraph,
    PathFindingRequest,
    NodeEvidenceRequest,
    EdgeEvidenceRequest,
    PathEvidenceRequest,
    PathResultSchema,
    EvidenceResultSchema
)

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.post("/build", response_model=ImpactKnowledgeGraph, summary="Build and validate a graph")
def build_graph(graph_req: ImpactKnowledgeGraph):
    """
    Accepts nodes and edges, validates them deterministically using ImpactGraphBuilder,
    and returns the valid deterministic representation.
    """
    builder = ImpactGraphBuilder()
    try:
        # Reconstruct Domain objects
        for n in graph_req.nodes:
            receipt = None
            if n.receipt:
                receipt = DomainReceipt(**n.receipt.model_dump())
            node = DomainNode(
                id=n.id, type=n.type.value, label=n.label,
                description=n.description, budget_share=n.budget_share, receipt=receipt
            )
            builder.add_node(node)
            
        for e in graph_req.edges:
            receipt = None
            if e.receipt:
                receipt = DomainReceipt(**e.receipt.model_dump())
            edge = DomainEdge(
                id=e.id, source_node=e.from_node, target_node=e.to_node,
                relation_type=e.relation_type, kind=e.kind.value,
                confidence=e.confidence.value, evidence_text=e.evidence_text,
                receipt=receipt, direction=e.direction.value if e.direction else None,
                strength=e.strength, propagation_path=e.propagation_path.value if e.propagation_path else None,
                what_could_be_wrong=e.what_could_be_wrong
            )
            builder.add_edge(edge)
            
        graph_dict = builder.get_graph()
        
        # We need to map `source_node` back to `from` and `target_node` to `to` for the Pydantic schema
        # And convert Receipt dataclasses to dicts
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
    """
    Find impact paths in the provided graph deterministically using ImpactPathFinder.
    """
    try:
        # Build graph_data dict exactly as expected by PathFinder
        graph_dict = req.graph.model_dump(by_alias=True)
        # Fix aliases for path finder which expects 'source_node' and 'target_node' internally!
        # Oh wait, path finder was written against the output of graph builder.
        # Graph builder output has `source_node` and `target_node`. Our schema uses `from` and `to`.
        for edge_dict in graph_dict["edges"]:
            edge_dict["source_node"] = edge_dict.pop("from")
            edge_dict["target_node"] = edge_dict.pop("to")
            
        finder = ImpactPathFinder(graph_dict)
        paths = finder.find_paths(
            source_id=req.source_id,
            target_id=req.target_id,
            max_depth=req.max_depth,
            limit=req.limit
        )
        
        # Convert PathResult to PathResultSchema
        res = []
        for p in paths:
            res.append(PathResultSchema(
                nodes=p.nodes,
                edges=p.edges,
                length=p.length,
                min_confidence_score=p.min_confidence_score,
                observed_ratio=p.observed_ratio,
                edge_metadata=p.edge_metadata
            ))
        return res
    except PathFinderError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/evidence/node", response_model=EvidenceResultSchema, summary="Get node evidence")
def get_node_evidence(req: NodeEvidenceRequest):
    graph_dict = req.graph.model_dump(by_alias=True)
    svc = EvidenceService(graph_dict)
    res = svc.get_node_evidence(req.node_id)
    return EvidenceResultSchema(
        status=res.status,
        target_id=res.target_id,
        target_type=res.target_type,
        receipts=res.receipts
    )


@router.post("/evidence/edge", response_model=EvidenceResultSchema, summary="Get edge evidence")
def get_edge_evidence(req: EdgeEvidenceRequest):
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
        receipts=res.receipts
    )


@router.post("/evidence/path", response_model=EvidenceResultSchema, summary="Get path evidence")
def get_path_evidence(req: PathEvidenceRequest):
    graph_dict = req.graph.model_dump(by_alias=True)
    for edge_dict in graph_dict["edges"]:
        edge_dict["source_node"] = edge_dict.pop("from")
        edge_dict["target_node"] = edge_dict.pop("to")
    svc = EvidenceService(graph_dict)
    
    # Convert PathResultSchema back to PathResult
    domain_path = PathResult(
        nodes=req.path.nodes,
        edges=req.path.edges,
        length=req.path.length,
        min_confidence_score=req.path.min_confidence_score,
        observed_ratio=req.path.observed_ratio,
        edge_metadata=[m.model_dump() for m in req.path.edge_metadata]
    )
    
    res = svc.get_path_evidence(domain_path)
    return EvidenceResultSchema(
        status=res.status,
        target_id=res.target_id,
        target_type=res.target_type,
        receipts=res.receipts
    )
