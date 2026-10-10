"""Knowledge Graph retrieval API endpoints.

Conforms strictly to `india-impact-graph/schemas/graph-node-edge-schema.json`
and `docs/KNOWLEDGE_GRAPH_SPEC.md`.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.models.event import FinancialEventModel
from app.schemas.graph import ImpactKnowledgeGraph
from app.services.graph import build_knowledge_graph

router = APIRouter(prefix="/api/graph", tags=["graph"])


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
