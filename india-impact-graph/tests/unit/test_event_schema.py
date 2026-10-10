"""Unit tests for Pydantic event extraction models conforming to event-extraction-schema.json."""

from pathlib import Path
import sys
import pytest
from pydantic import ValidationError

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.schemas.event import (  # noqa: E402
    EntityType,
    EventMagnitude,
    EventType,
    EvidenceSnippet,
    ExtractedEntity,
    FinancialEventExtraction,
    MagnitudeDirection,
)


@pytest.fixture
def valid_complete_payload() -> dict:
    """Fixture representing a complete valid event extraction matching the crude oil primary scenario."""
    return {
        "event_id": "crude-oil-shock-12pct",
        "event_type": "commodity_price_shock",
        "headline": "Brent Crude Surges 12% Amid Escalating Middle East Tensions",
        "is_scenario": True,
        "event_date": "2026-10-10",
        "geography": "Global",
        "magnitude": {
            "value": 12.0,
            "unit": "%",
            "direction": "increase",
        },
        "entities": [
            {
                "entity_id": "crude_oil",
                "name": "Brent Crude Oil",
                "entity_type": "commodity",
                "mention_text": "Brent Crude Surges 12%",
            },
            {
                "entity_id": "diesel",
                "name": "Retail Diesel",
                "entity_type": "commodity",
                "mention_text": "diesel fuel prices",
            },
        ],
        "evidence_snippets": [
            {
                "quote": "Brent crude oil prices rose 12% in international markets following supply disruptions.",
                "source_title": "Energy Market Bulletin",
                "source_url": "https://example.com/energy-bulletin-2026",
                "publication_date": "2026-10-10",
            }
        ],
    }


@pytest.fixture
def valid_minimal_payload() -> dict:
    """Fixture representing the minimal required fields according to event-extraction-schema.json."""
    return {
        "event_id": "repo-rate-hike-minimal",
        "event_type": "central_bank_policy_rate",
        "is_scenario": False,
        "entities": [],
        "evidence_snippets": [],
    }


def test_valid_complete_event_model(valid_complete_payload: dict) -> None:
    """Verify that a complete valid event parses correctly and preserves field types."""
    event = FinancialEventExtraction.model_validate(valid_complete_payload)
    assert event.event_id == "crude-oil-shock-12pct"
    assert event.event_type == EventType.COMMODITY_PRICE_SHOCK
    assert event.is_scenario is True
    assert event.event_date == "2026-10-10"
    assert event.headline == "Brent Crude Surges 12% Amid Escalating Middle East Tensions"
    assert event.geography == "Global"
    assert event.magnitude is not None
    assert event.magnitude.value == 12.0
    assert event.magnitude.unit == "%"
    assert event.magnitude.direction == MagnitudeDirection.INCREASE
    assert len(event.entities) == 2
    assert event.entities[0].entity_type == EntityType.COMMODITY
    assert len(event.evidence_snippets) == 1
    assert event.evidence_snippets[0].quote.startswith("Brent crude")


def test_valid_minimal_scenario_model(valid_minimal_payload: dict) -> None:
    """Verify that a minimal payload with only required fields parses successfully."""
    event = FinancialEventExtraction.model_validate(valid_minimal_payload)
    assert event.event_id == "repo-rate-hike-minimal"
    assert event.event_type == EventType.CENTRAL_BANK_POLICY_RATE
    assert event.is_scenario is False
    assert event.headline is None
    assert event.event_date is None
    assert event.geography is None
    assert event.magnitude is None
    assert event.entities == []
    assert event.evidence_snippets == []


def test_invalid_event_type_raises_validation_error(valid_minimal_payload: dict) -> None:
    """Verify that unlisted event_type raises ValidationError."""
    payload = valid_minimal_payload.copy()
    payload["event_type"] = "unsupported_event_category"
    with pytest.raises(ValidationError) as exc_info:
        FinancialEventExtraction.model_validate(payload)
    assert "event_type" in str(exc_info.value)


def test_invalid_entity_type_raises_validation_error() -> None:
    """Verify that an invalid entity_type raises ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        ExtractedEntity.model_validate(
            {
                "entity_id": "test_id",
                "name": "Test Entity",
                "entity_type": "cryptocurrency_token",  # Not in JSON schema enum
                "mention_text": "test",
            }
        )
    assert "entity_type" in str(exc_info.value)


def test_invalid_magnitude_direction_raises_validation_error() -> None:
    """Verify that an invalid direction in EventMagnitude raises ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        EventMagnitude.model_validate(
            {
                "direction": "skyrocketing",  # Not in JSON schema enum
                "value": 10.0,
            }
        )
    assert "direction" in str(exc_info.value)


def test_extra_fields_forbidden_at_root(valid_minimal_payload: dict) -> None:
    """Verify extra='forbid' rejects unexpected fields at root level."""
    payload = valid_minimal_payload.copy()
    payload["hallucinated_field"] = "unexpected_value"
    with pytest.raises(ValidationError) as exc_info:
        FinancialEventExtraction.model_validate(payload)
    assert "extra_forbidden" in str(exc_info.value) or "Extra inputs are not permitted" in str(exc_info.value)


def test_extra_fields_forbidden_in_magnitude() -> None:
    """Verify extra='forbid' rejects unexpected fields inside EventMagnitude."""
    with pytest.raises(ValidationError) as exc_info:
        EventMagnitude.model_validate(
            {
                "direction": "increase",
                "value": 5.0,
                "unauthorized_field": "disallowed",
            }
        )
    assert "extra_forbidden" in str(exc_info.value) or "Extra inputs are not permitted" in str(exc_info.value)


def test_extra_fields_forbidden_in_entities() -> None:
    """Verify extra='forbid' rejects unexpected fields inside ExtractedEntity."""
    with pytest.raises(ValidationError) as exc_info:
        ExtractedEntity.model_validate(
            {
                "entity_id": "crude_oil",
                "name": "Crude Oil",
                "entity_type": "commodity",
                "mention_text": "crude oil",
                "sentiment_score": 0.85,  # Not in JSON schema
            }
        )
    assert "extra_forbidden" in str(exc_info.value) or "Extra inputs are not permitted" in str(exc_info.value)


def test_extra_fields_forbidden_in_evidence_snippets() -> None:
    """Verify extra='forbid' rejects unexpected fields inside EvidenceSnippet."""
    with pytest.raises(ValidationError) as exc_info:
        EvidenceSnippet.model_validate(
            {
                "quote": "Sample quote",
                "source_title": "Source Title",
                "extra_confidence_metric": 0.99,  # Not in JSON schema
            }
        )
    assert "extra_forbidden" in str(exc_info.value) or "Extra inputs are not permitted" in str(exc_info.value)


@pytest.mark.parametrize(
    "bad_date",
    [
        "2026/10/10",
        "10-10-2026",
        "2026-1-1",
        "2026-10-10T12:00:00Z",
        "invalid-date",
    ],
)
def test_malformed_event_date_format(valid_minimal_payload: dict, bad_date: str) -> None:
    """Verify that dates not conforming to ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ fail validation."""
    payload = valid_minimal_payload.copy()
    payload["event_date"] = bad_date
    with pytest.raises(ValidationError) as exc_info:
        FinancialEventExtraction.model_validate(payload)
    assert "event_date" in str(exc_info.value)


@pytest.mark.parametrize(
    "missing_field",
    [
        "event_id",
        "event_type",
        "is_scenario",
        "entities",
        "evidence_snippets",
    ],
)
def test_missing_required_fields_raise_error(valid_minimal_payload: dict, missing_field: str) -> None:
    """Verify that omitting any required field fails validation."""
    payload = valid_minimal_payload.copy()
    del payload[missing_field]
    with pytest.raises(ValidationError) as exc_info:
        FinancialEventExtraction.model_validate(payload)
    assert missing_field in str(exc_info.value)


def test_nullable_and_omitted_optional_fields() -> None:
    """Verify that nullable fields accept explicit None without validation errors."""
    mag = EventMagnitude.model_validate(
        {
            "direction": "unspecified",
            "value": None,
            "unit": None,
        }
    )
    assert mag.direction == MagnitudeDirection.UNSPECIFIED
    assert mag.value is None
    assert mag.unit is None

    snippet = EvidenceSnippet.model_validate(
        {
            "quote": "A direct factual quote.",
            "source_title": "Official Journal",
            "source_url": None,
            "publication_date": None,
        }
    )
    assert snippet.source_url is None
    assert snippet.publication_date is None
