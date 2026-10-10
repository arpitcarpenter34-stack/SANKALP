"""Unit tests for SQLAlchemy 2.0 Financial Event ORM models."""

from pathlib import Path
import sys
import pytest

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import Base
from app.models.event import (
    EventEntityModel,
    EventEvidenceSnippetModel,
    FinancialEventModel,
)


def test_models_registered_in_base_metadata():
    """Verify all 3 event domain tables are registered in Base.metadata."""
    table_names = set(Base.metadata.tables.keys())
    assert "financial_events" in table_names
    assert "event_evidence_snippets" in table_names
    assert "event_entities" in table_names


def test_financial_events_table_columns_and_pk():
    """Verify columns, types, and primary key on financial_events table."""
    table = Base.metadata.tables["financial_events"]
    assert table.primary_key.columns.keys() == ["event_id"]

    cols = table.columns
    # Check non-nullable required contract fields
    assert cols["event_id"].nullable is False
    assert cols["event_type"].nullable is False
    assert cols["is_scenario"].nullable is False
    assert cols["created_at"].nullable is False

    # Check nullable contract fields
    assert cols["headline"].nullable is True
    assert cols["event_date"].nullable is True
    assert cols["geography"].nullable is True
    assert cols["magnitude_direction"].nullable is True
    assert cols["magnitude_value"].nullable is True
    assert cols["magnitude_unit"].nullable is True


def test_evidence_snippets_table_columns_and_fk():
    """Verify columns, primary key, and foreign key with CASCADE on event_evidence_snippets."""
    table = Base.metadata.tables["event_evidence_snippets"]
    assert table.primary_key.columns.keys() == ["id"]

    cols = table.columns
    assert cols["quote"].nullable is False
    assert cols["source_title"].nullable is False
    assert cols["source_url"].nullable is True
    assert cols["publication_date"].nullable is True

    # Foreign key verification
    fks = list(cols["event_id"].foreign_keys)
    assert len(fks) == 1
    fk = fks[0]
    assert fk.target_fullname == "financial_events.event_id"
    assert fk.ondelete == "CASCADE"


def test_event_entities_table_columns_and_fk():
    """Verify columns, primary key, and foreign key with CASCADE on event_entities."""
    table = Base.metadata.tables["event_entities"]
    assert table.primary_key.columns.keys() == ["id"]

    cols = table.columns
    assert cols["entity_id"].nullable is False
    assert cols["name"].nullable is False
    assert cols["entity_type"].nullable is False
    assert cols["mention_text"].nullable is False

    # Foreign key verification
    fks = list(cols["event_id"].foreign_keys)
    assert len(fks) == 1
    fk = fks[0]
    assert fk.target_fullname == "financial_events.event_id"
    assert fk.ondelete == "CASCADE"


def test_orm_relationships_configured():
    """Verify ORM relationships between parent event and child models."""
    event = FinancialEventModel(
        event_id="test-crude-12",
        event_type="commodity_price_shock",
        is_scenario=True,
    )
    snippet = EventEvidenceSnippetModel(
        quote="Test quote",
        source_title="Test source",
    )
    entity = EventEntityModel(
        entity_id="crude_oil",
        name="Crude Oil",
        entity_type="commodity",
        mention_text="crude oil",
    )

    event.evidence_snippets.append(snippet)
    event.entities.append(entity)

    assert len(event.evidence_snippets) == 1
    assert event.evidence_snippets[0].quote == "Test quote"
    assert snippet.event == event

    assert len(event.entities) == 1
    assert event.entities[0].name == "Crude Oil"
    assert entity.event == event
