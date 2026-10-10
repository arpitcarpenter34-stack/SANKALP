"""Pydantic schemas for Household Consumption Item Registry.

Conforms strictly to project data rules in `docs/DATA_AND_EVIDENCE_RULES.md`
and `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md`.
"""

from enum import Enum
import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

SNAKE_CASE_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")


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

    @field_validator("item_id")
    @classmethod
    def validate_item_id(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("item_id cannot be empty")
        if not SNAKE_CASE_PATTERN.match(clean):
            raise ValueError(
                f"item_id '{v}' must be valid snake_case matching pattern '^[a-z][a-z0-9_]*$'"
            )
        return clean

    @field_validator("name", "canonical_unit")
    @classmethod
    def validate_non_empty(cls, v: str, info) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError(f"{info.field_name} cannot be empty")
        return clean

    @field_validator("source_title", "table_or_series_id", "year_or_vintage", "notes")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        return clean if clean else None

    @model_validator(mode="after")
    def validate_consumption_integrity(self) -> "ConsumptionItemBase":
        # 1. Capital asset exclusion rule: capital assets are stores of value excluded from MPCE
        if self.is_capital_asset:
            if self.is_calculable:
                raise ValueError(
                    f"Contradictory consumption item '{self.item_id}': capital assets are stores of "
                    f"value excluded from MPCE and cannot be marked is_calculable=True"
                )
            if self.category != ConsumptionItemCategory.CAPITAL_ASSET:
                raise ValueError(
                    f"Item '{self.item_id}' has is_capital_asset=True but category is '{self.category.value}'. "
                    f"Expected category '{ConsumptionItemCategory.CAPITAL_ASSET.value}'"
                )
            if self.data_availability != DataAvailabilityStatus.EXCLUDED_CAPITAL_ASSET:
                raise ValueError(
                    f"Item '{self.item_id}' has is_capital_asset=True but data_availability is "
                    f"'{self.data_availability.value}'. Expected '{DataAvailabilityStatus.EXCLUDED_CAPITAL_ASSET.value}'"
                )

        # 2. Calculability integrity: can only be calculable if verified and supported with empirical source
        if self.is_calculable:
            if self.verification_status != VerificationStatus.VERIFIED:
                raise ValueError(
                    f"Item '{self.item_id}' cannot be calculable with verification_status "
                    f"'{self.verification_status.value}'. Must be '[VERIFIED]' with confirmed empirical evidence"
                )
            if self.data_availability in (
                DataAvailabilityStatus.DATA_NOT_AVAILABLE,
                DataAvailabilityStatus.EXCLUDED_CAPITAL_ASSET,
            ):
                raise ValueError(
                    f"Item '{self.item_id}' cannot be calculable with data_availability "
                    f"'{self.data_availability.value}'"
                )
            if not self.source_title:
                raise ValueError(
                    f"Item '{self.item_id}' is marked is_calculable=True but has no source_title citation"
                )

        # 3. Data not available items must never be marked calculable
        if self.data_availability == DataAvailabilityStatus.DATA_NOT_AVAILABLE and self.is_calculable:
            raise ValueError(
                f"Item '{self.item_id}' has data_availability='data_not_available' and cannot be calculable"
            )

        return self


class ConsumptionItemCreate(ConsumptionItemBase):
    """Schema for validating and creating a consumption item from curated datasets."""

    pass


class ConsumptionItemResponse(ConsumptionItemBase):
    """Schema for returning a consumption item from the registry."""

    pass
