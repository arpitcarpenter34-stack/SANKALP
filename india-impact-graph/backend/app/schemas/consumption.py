"""Pydantic schemas for Household Consumption Item Registry.

Conforms strictly to project data rules in `docs/DATA_AND_EVIDENCE_RULES.md`
and `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md`.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ConsumptionItemCategory(str, Enum):
    """Categorization for household consumption and expenditure items."""

    TRANSPORT_FUEL = "transport_fuel"
    COMMERCIAL_FUEL = "commercial_fuel"
    COOKING_FUEL = "cooking_fuel"
    FOOD_COOKING = "food_cooking"
    FOOD_STAPLE = "food_staple"
    FOOD_PROTEIN = "food_protein"
    FOOD_SWEETENER = "food_sweetener"
    FOOD_PERISHABLE = "food_perishable"
    UTILITY = "utility"
    CAPITAL_ASSET = "capital_asset"


class DataAvailabilityStatus(str, Enum):
    """Data governance classification for calculation readiness."""

    PENDING_VERIFICATION = "pending_verification"
    INDIRECT_OPERATIONAL_ONLY = "indirect_operational_only"
    DATA_NOT_AVAILABLE = "data_not_available"
    EXCLUDED_CAPITAL_ASSET = "excluded_capital_asset"


class VerificationStatus(str, Enum):
    """Data governance classification for source provenance."""

    VERIFIED = "[VERIFIED]"
    VERIFY = "[VERIFY]"
    INFERENCE = "[INFERENCE]"
    UNVERIFIED = "[UNVERIFIED]"


class ConsumptionItemBase(BaseModel):
    """Base schema for household consumption item registry."""

    model_config = ConfigDict(extra="forbid")

    item_id: str = Field(description="Unique snake_case identifier for the consumption item")
    name: str = Field(description="Display name of the consumption item")
    category: ConsumptionItemCategory
    canonical_unit: str = Field(description="Standardized unit of measurement (e.g., INR/Litre, INR/kg)")
    is_calculable: bool = Field(
        default=False,
        description="True only if verified spending share and pass-through factors exist in repo",
    )
    is_capital_asset: bool = Field(
        default=False,
        description="True if classified as store-of-value/capital asset and excluded from MPCE",
    )
    verification_status: VerificationStatus
    data_availability: DataAvailabilityStatus
    source_title: Optional[str] = None
    table_or_series_id: Optional[str] = None
    year_or_vintage: Optional[str] = None
    notes: Optional[str] = None


class ConsumptionItemCreate(ConsumptionItemBase):
    """Schema for validating and creating a consumption item from curated datasets."""

    pass


class ConsumptionItemResponse(ConsumptionItemBase):
    """Schema for returning a consumption item from the registry."""

    pass
