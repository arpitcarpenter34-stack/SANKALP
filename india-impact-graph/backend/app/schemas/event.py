"""Pydantic data models for financial event extraction.

Conforms strictly to `india-impact-graph/schemas/event-extraction-schema.json`.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class EventType(str, Enum):
    """High-level categorization of the financial event."""

    COMMODITY_PRICE_SHOCK = "commodity_price_shock"
    GEOPOLITICAL_CONFLICT = "geopolitical_conflict"
    CENTRAL_BANK_POLICY_RATE = "central_bank_policy_rate"
    TRADE_REGULATORY_SHIFT = "trade_regulatory_shift"
    MACROECONOMIC_INDICATOR_RELEASE = "macroeconomic_indicator_release"


class MagnitudeDirection(str, Enum):
    """Direction of the quantified change magnitude."""

    INCREASE = "increase"
    DECREASE = "decrease"
    FLUCTUATION = "fluctuation"
    UNSPECIFIED = "unspecified"


class EventMagnitude(BaseModel):
    """Quantified change magnitude stated explicitly in the article."""

    model_config = ConfigDict(extra="forbid")

    direction: MagnitudeDirection
    value: Optional[float] = None
    unit: Optional[str] = None


class EntityType(str, Enum):
    """Categorization of entities matched against curated graph vocabulary."""

    COMMODITY = "commodity"
    HOUSEHOLD_ITEM = "household_item"
    ECONOMIC_INDICATOR = "economic_indicator"
    SECTOR = "sector"
    INSTRUMENT_ASSET = "instrument_asset"
    INSTITUTION = "institution"


class ExtractedEntity(BaseModel):
    """Entity extracted from text and mapped to graph vocabulary."""

    model_config = ConfigDict(extra="forbid")

    entity_id: str
    name: str
    entity_type: EntityType
    mention_text: str


class EvidenceSnippet(BaseModel):
    """Direct quote from the input document supporting extracted event and relationships."""

    model_config = ConfigDict(extra="forbid")

    quote: str
    source_title: str
    source_url: Optional[str] = None
    publication_date: Optional[str] = None


class FinancialEventExtraction(BaseModel):
    """Validation schema for structured event details extracted from financial text."""

    model_config = ConfigDict(extra="forbid")

    event_id: str
    event_type: EventType
    is_scenario: bool
    entities: list[ExtractedEntity]
    evidence_snippets: list[EvidenceSnippet]
    headline: Optional[str] = None
    event_date: Optional[str] = Field(
        default=None,
        pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
        description="Date of event in ISO-8601 format (YYYY-MM-DD)",
    )
    geography: Optional[str] = None
    magnitude: Optional[EventMagnitude] = None


class FinancialEventSummary(BaseModel):
    """Summary representation of a financial event for listing and selection.

    Excludes nested entities and evidence snippets to provide a lightweight payload
    for UI dropdowns and overview catalogs while strictly conforming to event contract fields.
    """

    model_config = ConfigDict(extra="forbid")

    event_id: str
    event_type: EventType
    is_scenario: bool
    headline: Optional[str] = None
    event_date: Optional[str] = Field(
        default=None,
        pattern=r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$",
        description="Date of event in ISO-8601 format (YYYY-MM-DD)",
    )
    geography: Optional[str] = None
    magnitude: Optional[EventMagnitude] = None
