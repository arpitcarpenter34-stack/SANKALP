"""Financial Event Persistence and Retrieval API endpoints.

Conforms strictly to `india-impact-graph/schemas/event-extraction-schema.json`.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from app.database import get_db
from app.models.event import (
    EventEntityModel,
    EventEvidenceSnippetModel,
    FinancialEventModel,
)
from app.schemas.event import (
    EventMagnitude,
    EvidenceSnippet,
    ExtractedEntity,
    FinancialEventExtraction,
    FinancialEventSummary,
)

router = APIRouter(prefix="/api/events", tags=["events"])


def model_to_summary(event_model: FinancialEventModel) -> FinancialEventSummary:
    """Convert a FinancialEventModel ORM instance to a FinancialEventSummary Pydantic model."""
    magnitude = None
    if event_model.magnitude_direction is not None:
        magnitude = EventMagnitude(
            direction=event_model.magnitude_direction,
            value=event_model.magnitude_value,
            unit=event_model.magnitude_unit,
        )

    return FinancialEventSummary(
        event_id=event_model.event_id,
        event_type=event_model.event_type,
        is_scenario=event_model.is_scenario,
        headline=event_model.headline,
        event_date=event_model.event_date,
        geography=event_model.geography,
        magnitude=magnitude,
    )



def model_to_schema(event_model: FinancialEventModel) -> FinancialEventExtraction:
    """Convert a FinancialEventModel ORM instance to a FinancialEventExtraction Pydantic model."""
    magnitude = None
    if event_model.magnitude_direction is not None:
        magnitude = EventMagnitude(
            direction=event_model.magnitude_direction,
            value=event_model.magnitude_value,
            unit=event_model.magnitude_unit,
        )

    # Preserve deterministic insertion order by primary key ID
    sorted_entities = sorted(event_model.entities, key=lambda e: e.id or 0)
    sorted_snippets = sorted(event_model.evidence_snippets, key=lambda s: s.id or 0)

    entities = [
        ExtractedEntity(
            entity_id=ent.entity_id,
            name=ent.name,
            entity_type=ent.entity_type,
            mention_text=ent.mention_text,
        )
        for ent in sorted_entities
    ]

    evidence_snippets = [
        EvidenceSnippet(
            quote=snip.quote,
            source_title=snip.source_title,
            source_url=snip.source_url,
            publication_date=snip.publication_date,
        )
        for snip in sorted_snippets
    ]

    return FinancialEventExtraction(
        event_id=event_model.event_id,
        event_type=event_model.event_type,
        is_scenario=event_model.is_scenario,
        entities=entities,
        evidence_snippets=evidence_snippets,
        headline=event_model.headline,
        event_date=event_model.event_date,
        geography=event_model.geography,
        magnitude=magnitude,
    )


@router.post(
    "",
    response_model=FinancialEventExtraction,
    status_code=status.HTTP_201_CREATED,
    summary="Create and persist a financial event",
)
def create_event(
    event: FinancialEventExtraction,
    db: Session = Depends(get_db),
) -> FinancialEventExtraction:
    """Create and persist a financial event along with all evidence snippets and extracted entities.

    Executes in a single atomic database transaction and rolls back on failure.
    Rejects duplicate event IDs with HTTP 409 Conflict.
    """
    # 1. Preflight check for duplicate event ID
    existing = db.execute(
        select(FinancialEventModel.event_id).where(
            FinancialEventModel.event_id == event.event_id
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Financial event with ID '{event.event_id}' already exists",
        )

    # 2. Build root event ORM model
    event_model = FinancialEventModel(
        event_id=event.event_id,
        event_type=(
            event.event_type.value
            if hasattr(event.event_type, "value")
            else str(event.event_type)
        ),
        headline=event.headline,
        is_scenario=event.is_scenario,
        event_date=event.event_date,
        geography=event.geography,
        magnitude_direction=(
            event.magnitude.direction.value
            if (event.magnitude and hasattr(event.magnitude.direction, "value"))
            else (event.magnitude.direction if event.magnitude else None)
        ),
        magnitude_value=event.magnitude.value if event.magnitude else None,
        magnitude_unit=event.magnitude.unit if event.magnitude else None,
    )

    # 3. Build child entity ORM models
    for entity in event.entities:
        entity_model = EventEntityModel(
            event_id=event.event_id,
            entity_id=entity.entity_id,
            name=entity.name,
            entity_type=(
                entity.entity_type.value
                if hasattr(entity.entity_type, "value")
                else str(entity.entity_type)
            ),
            mention_text=entity.mention_text,
        )
        event_model.entities.append(entity_model)

    # 4. Build child evidence snippet ORM models
    for snippet in event.evidence_snippets:
        snippet_model = EventEvidenceSnippetModel(
            event_id=event.event_id,
            quote=snippet.quote,
            source_title=snippet.source_title,
            source_url=snippet.source_url,
            publication_date=snippet.publication_date,
        )
        event_model.evidence_snippets.append(snippet_model)

    # 5. Persist inside a single atomic transaction with rollback on failure
    try:
        db.add(event_model)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Financial event with ID '{event.event_id}' already exists",
        ) from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist financial event due to an internal database error",
        ) from exc

    # 6. Eagerly reload the persisted entity with all relationships
    persisted = db.execute(
        select(FinancialEventModel)
        .where(FinancialEventModel.event_id == event.event_id)
        .options(
            selectinload(FinancialEventModel.entities),
            selectinload(FinancialEventModel.evidence_snippets),
        )
    ).scalar_one()

    return model_to_schema(persisted)


@router.post(
    "/",
    response_model=FinancialEventExtraction,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False,
)
def create_event_trailing_slash(
    event: FinancialEventExtraction,
    db: Session = Depends(get_db),
) -> FinancialEventExtraction:
    """Handle trailing slash path for POST /api/events/."""
    return create_event(event=event, db=db)


@router.get(
    "",
    response_model=list[FinancialEventSummary],
    status_code=status.HTTP_200_OK,
    summary="List financial events",
)
def list_events(
    db: Session = Depends(get_db),
) -> list[FinancialEventSummary]:
    """Retrieve a list of financial event summaries in deterministic event_id order.

    Does not load child entities and evidence snippets, optimizing payload size
    for dropdowns and overview listings. Returns an empty list if no events exist.
    """
    stmt = select(FinancialEventModel).order_by(FinancialEventModel.event_id.asc())
    events = db.execute(stmt).scalars().all()
    return [model_to_summary(event) for event in events]


@router.get(
    "/",
    response_model=list[FinancialEventSummary],
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def list_events_trailing_slash(
    db: Session = Depends(get_db),
) -> list[FinancialEventSummary]:
    """Handle trailing slash path for GET /api/events/."""
    return list_events(db=db)


@router.get(
    "/{event_id}",
    response_model=FinancialEventExtraction,
    status_code=status.HTTP_200_OK,
    summary="Retrieve a financial event by ID",
)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
) -> FinancialEventExtraction:
    """Retrieve a persisted financial event by ID, including all related evidence snippets and entities.

    Returns HTTP 404 if the event does not exist.
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

    return model_to_schema(event_model)


from pydantic import BaseModel
from event_extraction.event_extractor import (
    EventExtractionError,
    FakeDeterministicProvider,
    FinancialEventExtractor,
)


class EventExtractionRequest(BaseModel):
    """Request payload for text-based financial event extraction."""

    text: str


@router.post(
    "/extract",
    response_model=FinancialEventExtraction,
    status_code=status.HTTP_200_OK,
    summary="Extract a financial event from text",
)
def extract_event(req: EventExtractionRequest) -> FinancialEventExtraction:
    """Extract a financial event deterministically from text."""
    provider = FakeDeterministicProvider()
    extractor = FinancialEventExtractor(provider)
    try:
        raw_event = extractor.extract(req.text)
        return FinancialEventExtraction(**raw_event)
    except EventExtractionError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
