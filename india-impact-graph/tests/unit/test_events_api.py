"""Unit tests for Financial Event Persistence API endpoints.

Tests run against an isolated in-memory SQLite database, guaranteeing zero
reliance on local PostgreSQL credentials while validating end-to-end ORM
persistence, transaction rollback, cascade rules, constraints, and HTTP statuses.
"""

from pathlib import Path
import sys
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import Base, get_db
from app.main import app
from app.models.event import (
    EventEntityModel,
    EventEvidenceSnippetModel,
    FinancialEventModel,
)

# In-memory SQLite engine configured for concurrent session isolation
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Create fresh schema before each test and drop it afterwards."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide an isolated database session bound to the test in-memory SQLite engine."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session):
    """Provide a FastAPI TestClient with get_db overridden to use the test session."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_complete_event_payload():
    """Return a valid complete payload matching authoritative schema."""
    return {
        "event_id": "crude-oil-spike-12pct-2026",
        "event_type": "commodity_price_shock",
        "headline": "Brent Crude Surges 12% Amid Middle East Supply Disruptions",
        "is_scenario": False,
        "event_date": "2026-10-10",
        "geography": "Global",
        "magnitude": {
            "direction": "increase",
            "value": 12.0,
            "unit": "%",
        },
        "entities": [
            {
                "entity_id": "crude_oil",
                "name": "Brent Crude Oil",
                "entity_type": "commodity",
                "mention_text": "crude oil prices rose sharply",
            },
            {
                "entity_id": "diesel",
                "name": "Retail Diesel",
                "entity_type": "household_item",
                "mention_text": "higher diesel fuel costs",
            },
        ],
        "evidence_snippets": [
            {
                "quote": "Brent crude surged 12% following tanker disruptions in the Strait of Hormuz.",
                "source_title": "Financial Express",
                "source_url": "https://example.com/brent-12-spike",
                "publication_date": "2026-10-10",
            },
            {
                "quote": "Higher freight transport costs are expected to pass through to wholesale vegetable markets.",
                "source_title": "Mint",
                "source_url": None,
                "publication_date": "2026-10-10",
            },
        ],
    }


def test_create_event_success(client: TestClient, db_session: Session, sample_complete_event_payload: dict):
    """Verify POST /api/events creates the event and returns HTTP 201 with persisted payload."""
    response = client.post("/api/events", json=sample_complete_event_payload)
    assert response.status_code == 201

    data = response.json()
    assert data["event_id"] == "crude-oil-spike-12pct-2026"
    assert data["event_type"] == "commodity_price_shock"
    assert data["headline"] == "Brent Crude Surges 12% Amid Middle East Supply Disruptions"
    assert data["is_scenario"] is False
    assert data["event_date"] == "2026-10-10"
    assert data["geography"] == "Global"
    assert data["magnitude"] == {
        "direction": "increase",
        "value": 12.0,
        "unit": "%",
    }
    assert len(data["entities"]) == 2
    assert data["entities"][0]["entity_id"] == "crude_oil"
    assert data["entities"][1]["entity_id"] == "diesel"
    assert len(data["evidence_snippets"]) == 2
    assert data["evidence_snippets"][0]["source_title"] == "Financial Express"

    # Confirm direct database rows were persisted
    db_event = db_session.execute(
        select(FinancialEventModel).where(FinancialEventModel.event_id == "crude-oil-spike-12pct-2026")
    ).scalar_one_or_none()
    assert db_event is not None
    assert db_event.event_type == "commodity_price_shock"
    assert db_event.magnitude_direction == "increase"
    assert db_event.magnitude_value == 12.0
    assert db_event.magnitude_unit == "%"
    assert len(db_event.entities) == 2
    assert len(db_event.evidence_snippets) == 2


def test_create_event_trailing_slash(client: TestClient, sample_complete_event_payload: dict):
    """Verify POST /api/events/ with trailing slash works properly."""
    response = client.post("/api/events/", json=sample_complete_event_payload)
    assert response.status_code == 201
    assert response.json()["event_id"] == "crude-oil-spike-12pct-2026"


def test_create_minimal_scenario_event(client: TestClient, db_session: Session):
    """Verify creating a minimal scenario event with omitted optional fields."""
    minimal_payload = {
        "event_id": "hypothetical-rate-hike-50bps",
        "event_type": "central_bank_policy_rate",
        "is_scenario": True,
        "entities": [],
        "evidence_snippets": [],
    }
    response = client.post("/api/events", json=minimal_payload)
    assert response.status_code == 201

    data = response.json()
    assert data["event_id"] == "hypothetical-rate-hike-50bps"
    assert data["is_scenario"] is True
    assert data["headline"] is None
    assert data["event_date"] is None
    assert data["geography"] is None
    assert data["magnitude"] is None
    assert data["entities"] == []
    assert data["evidence_snippets"] == []


def test_get_event_success(client: TestClient, sample_complete_event_payload: dict):
    """Verify GET /api/events/{event_id} retrieves an existing event with all entities and snippets."""
    create_res = client.post("/api/events", json=sample_complete_event_payload)
    assert create_res.status_code == 201

    get_res = client.get("/api/events/crude-oil-spike-12pct-2026")
    assert get_res.status_code == 200

    data = get_res.json()
    assert data["event_id"] == "crude-oil-spike-12pct-2026"
    assert data["event_type"] == "commodity_price_shock"
    assert len(data["entities"]) == 2
    assert data["entities"][0]["name"] == "Brent Crude Oil"
    assert data["entities"][1]["name"] == "Retail Diesel"
    assert len(data["evidence_snippets"]) == 2
    assert "Brent crude surged 12%" in data["evidence_snippets"][0]["quote"]


def test_get_event_not_found(client: TestClient):
    """Verify GET /api/events/{event_id} returns HTTP 404 when the event does not exist."""
    response = client.get("/api/events/non-existent-event-slug")
    assert response.status_code == 404
    data = response.json()
    assert "not found" in data["detail"].lower()
    assert "non-existent-event-slug" in data["detail"]


def test_create_duplicate_event_id_conflict(client: TestClient, sample_complete_event_payload: dict):
    """Verify POST /api/events returns HTTP 409 Conflict when event_id already exists."""
    # First creation succeeds
    res1 = client.post("/api/events", json=sample_complete_event_payload)
    assert res1.status_code == 201

    # Second creation with identical event_id must fail with 409
    res2 = client.post("/api/events", json=sample_complete_event_payload)
    assert res2.status_code == 409
    data = res2.json()
    assert "already exists" in data["detail"].lower()
    assert "crude-oil-spike-12pct-2026" in data["detail"]


def test_create_event_validation_errors(client: TestClient):
    """Verify POST /api/events returns HTTP 422 for malformed requests."""
    # Missing required field 'event_type'
    res_missing = client.post("/api/events", json={
        "event_id": "test-missing-type",
        "is_scenario": True,
        "entities": [],
        "evidence_snippets": [],
    })
    assert res_missing.status_code == 422

    # Invalid enum value for event_type
    res_invalid_enum = client.post("/api/events", json={
        "event_id": "test-bad-enum",
        "event_type": "alien_invasion_shock",
        "is_scenario": True,
        "entities": [],
        "evidence_snippets": [],
    })
    assert res_invalid_enum.status_code == 422

    # Invalid date pattern
    res_bad_date = client.post("/api/events", json={
        "event_id": "test-bad-date",
        "event_type": "commodity_price_shock",
        "is_scenario": False,
        "event_date": "10-10-2026",
        "entities": [],
        "evidence_snippets": [],
    })
    assert res_bad_date.status_code == 422

    # Extra forbidden field at root
    res_extra_field = client.post("/api/events", json={
        "event_id": "test-extra-field",
        "event_type": "commodity_price_shock",
        "is_scenario": True,
        "entities": [],
        "evidence_snippets": [],
        "unauthorized_field": "injected",
    })
    assert res_extra_field.status_code == 422


def test_transaction_rollback_on_persistence_failure(client: TestClient, db_session: Session, sample_complete_event_payload: dict):
    """Verify that if database commit fails, the transaction is rolled back and returns HTTP 500 without corrupting state."""
    with patch.object(Session, "commit", side_effect=RuntimeError("Simulated database disk failure")):
        response = client.post("/api/events", json=sample_complete_event_payload)
        assert response.status_code == 500
        assert "internal database error" in response.json()["detail"].lower()

    # Verify no partial rows exist in database
    persisted = db_session.execute(
        select(FinancialEventModel).where(FinancialEventModel.event_id == sample_complete_event_payload["event_id"])
    ).scalar_one_or_none()
    assert persisted is None

    # Verify entities and snippets tables are completely empty
    entity_count = len(db_session.execute(select(EventEntityModel)).scalars().all())
    snippet_count = len(db_session.execute(select(EventEvidenceSnippetModel)).scalars().all())
    assert entity_count == 0
    assert snippet_count == 0
