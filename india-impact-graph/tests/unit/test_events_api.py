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


def test_list_events_empty_database(client: TestClient):
    """Verify GET /api/events returns HTTP 200 and empty list when no events are saved."""
    response = client.get("/api/events")
    assert response.status_code == 200
    assert response.json() == []


def test_list_events_multiple_deterministic_order(client: TestClient):
    """Verify GET /api/events returns events in stable, deterministic event_id order with summary schema."""
    event_c = {
        "event_id": "c-wheat-shock",
        "event_type": "commodity_price_shock",
        "headline": "Wheat Export Restrictions Introduced",
        "is_scenario": True,
        "entities": [],
        "evidence_snippets": [],
    }
    event_a = {
        "event_id": "a-crude-shock",
        "event_type": "commodity_price_shock",
        "headline": "Crude Oil Spikes 12%",
        "is_scenario": True,
        "magnitude": {"direction": "increase", "value": 12.0, "unit": "%"},
        "entities": [],
        "evidence_snippets": [],
    }
    event_b = {
        "event_id": "b-edible-oil-shock",
        "event_type": "commodity_price_shock",
        "headline": "Edible Oil Import Duty Adjusted",
        "is_scenario": False,
        "entities": [],
        "evidence_snippets": [],
    }

    # Insert out of order
    for ev in [event_c, event_a, event_b]:
        res = client.post("/api/events", json=ev)
        assert res.status_code == 201

    # Fetch list
    response = client.get("/api/events")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 3

    # Confirm alphabetical ascending sort by event_id
    assert [item["event_id"] for item in items] == [
        "a-crude-shock",
        "b-edible-oil-shock",
        "c-wheat-shock",
    ]

    # Confirm lightweight summary shape (does not include child collections)
    first = items[0]
    assert first["event_id"] == "a-crude-shock"
    assert first["headline"] == "Crude Oil Spikes 12%"
    assert first["magnitude"] == {"direction": "increase", "value": 12.0, "unit": "%"}
    assert "entities" not in first
    assert "evidence_snippets" not in first


def test_list_events_trailing_slash(client: TestClient):
    """Verify GET /api/events/ with trailing slash works properly."""
    response = client.get("/api/events/")
    assert response.status_code == 200
    assert response.json() == []


def test_cors_preflight_allowed_origin(client: TestClient):
    """Verify CORS preflight request from allowed origin returns permitted headers without credentials."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/api/events", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
    assert "Content-Type" in response.headers.get("access-control-allow-headers", "")
    assert response.headers.get("access-control-allow-credentials") is None


def test_cors_preflight_disallowed_origin(client: TestClient):
    """Verify CORS preflight from disallowed origin does not grant cross-origin access."""
    headers = {
        "Origin": "http://malicious-attacker-domain.org",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
    }
    response = client.options("/api/events", headers=headers)
    assert "access-control-allow-origin" not in response.headers


def test_cors_null_origin_rejected(client: TestClient):
    """Verify Origin: null is rejected to prevent sandbox and file URI bypass vulnerabilities."""
    headers = {
        "Origin": "null",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/events", headers=headers)
    assert "access-control-allow-origin" not in response.headers

    get_res = client.get("/api/events", headers={"Origin": "null"})
    assert get_res.status_code == 200
    assert "access-control-allow-origin" not in get_res.headers


def test_extract_event_success(client: TestClient):
    """Verify POST /api/events/extract deterministically extracts event from article text."""
    payload = {"text": "SCENARIO: +12% crude oil shock in international markets"}
    response = client.post("/api/events/extract", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["event_type"] == "commodity_price_shock"
    assert data["event_id"] == "crude-oil-shock-12pct"
    assert data["magnitude"]["value"] == 12.0
    assert data["magnitude"]["direction"] == "increase"
    assert len(data["entities"]) > 0


def test_extract_event_empty_text_error(client: TestClient):
    """Verify POST /api/events/extract rejects empty text with 422 unprocessable entity."""
    payload = {"text": "   "}
    response = client.post("/api/events/extract", json=payload)
    assert response.status_code == 422
    assert "detail" in response.json()


def test_extract_event_free_text_acceptance_headline(client: TestClient):
    """Verify POST /api/events/extract extracts headline 'Crude oil surges by 15% amid geopolitical tensions'."""
    payload = {"text": "Crude oil surges by 15% amid geopolitical tensions"}
    response = client.post("/api/events/extract", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["event_id"] == "crude-oil-increase-15pct"
    assert data["event_type"] == "commodity_price_shock"
    assert data["is_scenario"] is False
    assert data["headline"] == "Crude oil surges by 15% amid geopolitical tensions"
    assert data["magnitude"] == {
        "direction": "increase",
        "value": 15.0,
        "unit": "%",
    }
    assert len(data["entities"]) == 1
    assert data["entities"][0]["entity_id"] == "crude_oil"
    assert data["entities"][0]["name"] == "Crude Oil"
    assert data["entities"][0]["entity_type"] == "commodity"
    assert data["entities"][0]["mention_text"] == "Crude oil"
    assert len(data["evidence_snippets"]) == 1
    assert data["evidence_snippets"][0]["quote"] == "Crude oil surges by 15% amid geopolitical tensions"
    assert data["evidence_snippets"][0]["source_title"] == "Input Text"


def test_extract_event_free_text_ambiguous_direction(client: TestClient):
    """Verify POST /api/events/extract returns HTTP 422 for ambiguous conflicting directions."""
    payload = {"text": "Crude oil surges then cuts by 5%"}
    response = client.post("/api/events/extract", json=payload)
    assert response.status_code == 422
    assert "ambiguous direction" in response.json()["detail"].lower()


def test_extract_event_free_text_unsupported_text(client: TestClient):
    """Verify POST /api/events/extract returns HTTP 422 for unsupported non-financial text."""
    payload = {"text": "Film wins prestigious international cinema award"}
    response = client.post("/api/events/extract", json=payload)
    assert response.status_code == 422
    assert "unsupported text" in response.json()["detail"].lower()


def test_extract_event_live_mode_missing_api_key_error(client: TestClient):
    """Verify POST /api/events/extract returns clear configuration error when USE_LIVE_LLM=true but key is missing."""
    import os
    from unittest.mock import patch

    with patch.dict(os.environ, {"USE_LIVE_LLM": "true", "LIVE_LLM_API_KEY": ""}, clear=False):
        response = client.post("/api/events/extract", json={"text": "SCENARIO: +12% crude oil"})
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert "LIVE_LLM_API_KEY is missing" in detail
        # Ensure it did not silently pretend or fall back to fake provider
        assert "event_id" not in response.json()


def test_extract_event_live_mode_mocked_provider_success(client: TestClient):
    """Verify POST /api/events/extract succeeds when live mode is configured and provider returns valid response without network calls."""
    from unittest.mock import MagicMock
    from app.api.events import get_extraction_provider
    from app.main import app

    mock_provider = MagicMock()
    mock_provider.extract_event.return_value = {
        "event_id": "live-crude-shock-15pct",
        "event_type": "commodity_price_shock",
        "headline": "Crude oil spikes by 15%",
        "is_scenario": True,
        "magnitude": {
            "direction": "increase",
            "value": 15.0,
            "unit": "%",
        },
        "entities": [
            {
                "entity_id": "crude_oil",
                "name": "Crude Oil",
                "entity_type": "commodity",
                "mention_text": "crude oil",
            }
        ],
        "evidence_snippets": [
            {
                "quote": "Crude oil spikes by 15%",
                "source_title": "Live LLM Provider",
            }
        ],
    }

    app.dependency_overrides[get_extraction_provider] = lambda: mock_provider
    try:
        response = client.post("/api/events/extract", json={"text": "Crude oil spikes by 15%"})
        assert response.status_code == 200
        data = response.json()
        assert data["event_id"] == "live-crude-shock-15pct"
        assert data["event_type"] == "commodity_price_shock"
        assert data["magnitude"]["value"] == 15.0
        assert mock_provider.extract_event.called
    finally:
        app.dependency_overrides.pop(get_extraction_provider, None)


def test_extract_event_live_mode_mocked_provider_schema_rejection(client: TestClient):
    """Verify live provider responses are strictly schema-validated and rejected if malformed."""
    from unittest.mock import MagicMock
    from app.api.events import get_extraction_provider
    from app.main import app

    mock_provider = MagicMock()
    # Live provider returns unsupported event_type
    mock_provider.extract_event.return_value = {
        "event_id": "bad-event",
        "event_type": "hallucinated_unsupported_type",
        "is_scenario": False,
        "entities": [],
        "evidence_snippets": [],
    }

    app.dependency_overrides[get_extraction_provider] = lambda: mock_provider
    try:
        response = client.post("/api/events/extract", json={"text": "Arbitrary financial text"})
        assert response.status_code == 422
        assert "Invalid event_type" in response.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_extraction_provider, None)
