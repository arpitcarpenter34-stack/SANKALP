"""Pydantic schemas for Pass-Through Register Foundation.

Conforms strictly to project data rules in `docs/DATA_AND_EVIDENCE_RULES.md`
and `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md`.
"""

import math
import re
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from app.schemas.consumption import VerificationStatus

SNAKE_CASE_PATTERN = re.compile(r"^[a-z][a-z0-9_]*$")


class PassThroughRecordBase(BaseModel):
    """Base schema for pass-through transmission relationships."""

    model_config = ConfigDict(extra="forbid")

    upstream_commodity: str = Field(
        description="Unique snake_case identifier of upstream commodity (e.g. crude_oil, diesel)"
    )
    downstream_item: str = Field(
        description="Unique snake_case identifier of downstream consumption item (e.g. petrol, vegetables)"
    )
    pass_through_factor_low: Optional[float] = Field(
        default=None,
        description="Conservative lower-bound pass-through elasticity factor (0.0 <= beta <= 1.0)",
    )
    pass_through_factor_high: Optional[float] = Field(
        default=None,
        description="Conservative upper-bound pass-through elasticity factor (0.0 <= beta <= 1.0)",
    )
    unit: str = Field(
        default="elasticity_coefficient",
        description="Dimensionless ratio or elasticity unit (e.g., elasticity_coefficient, ratio)",
    )
    time_lag_months: Optional[str] = Field(
        default=None,
        description="Transmission time-lag in months or range (e.g., '1', '1-2', 'immediate', '0')",
    )
    historical_basis_source: Optional[str] = Field(
        default=None,
        description="Verifiable citation to published government/academic empirical study",
    )
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.VERIFY,
        description="Data governance verification classification",
    )
    caveats: Optional[str] = Field(
        default=None,
        description="Documented transmission buffers, subsidies, VAT differences, or breakdown risks",
    )

    @field_validator("upstream_commodity", "downstream_item")
    @classmethod
    def validate_identifier(cls, v: str) -> str:
        clean = v.strip().lower()
        if not clean:
            raise ValueError("Identifier cannot be empty")
        if not SNAKE_CASE_PATTERN.match(clean):
            raise ValueError(
                f"Identifier '{v}' must be valid snake_case matching pattern '^[a-z][a-z0-9_]*$'"
            )
        return clean

    @field_validator("pass_through_factor_low", "pass_through_factor_high")
    @classmethod
    def validate_factor_finite_and_bounds(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        if math.isnan(v) or math.isinf(v):
            raise ValueError(f"Pass-through factor must be a finite number, got {v}")
        if v < 0.0 or v > 1.0:
            raise ValueError(
                f"Pass-through factor must be within normalized bounds [0.0, 1.0], got {v}"
            )
        return round(v, 6)

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Unit cannot be empty")
        return clean

    @model_validator(mode="after")
    def validate_relational_consistency(self) -> "PassThroughRecordBase":
        # 1. Distinct upstream and downstream
        if self.upstream_commodity == self.downstream_item:
            raise ValueError(
                f"Contradictory pass-through relationship: upstream_commodity and downstream_item "
                f"cannot both be '{self.upstream_commodity}'"
            )

        # 2. Ordered bounds if both present
        if self.pass_through_factor_low is not None and self.pass_through_factor_high is not None:
            if self.pass_through_factor_low > self.pass_through_factor_high:
                raise ValueError(
                    f"Contradictory bounds: pass_through_factor_low ({self.pass_through_factor_low}) "
                    f"cannot exceed pass_through_factor_high ({self.pass_through_factor_high})"
                )

        # 3. Strict verification constraints for [VERIFIED] status
        if self.verification_status == VerificationStatus.VERIFIED:
            if self.pass_through_factor_low is None or self.pass_through_factor_high is None:
                raise ValueError(
                    "Cannot mark pass-through record as [VERIFIED] when pass-through factor bounds are missing"
                )
            if not self.historical_basis_source or not self.historical_basis_source.strip():
                raise ValueError(
                    "Cannot mark pass-through record as [VERIFIED] without a documented historical_basis_source citation"
                )

        return self

    @property
    def is_calculation_ready(self) -> bool:
        """Indicates whether this pass-through relationship is evidence-backed and calculation-ready."""
        return (
            self.verification_status == VerificationStatus.VERIFIED
            and self.pass_through_factor_low is not None
            and self.pass_through_factor_high is not None
            and bool(self.historical_basis_source and self.historical_basis_source.strip())
        )


class PassThroughRecordCreate(PassThroughRecordBase):
    """Schema for validating and registering a pass-through record."""

    pass


class PassThroughRecordResponse(PassThroughRecordBase):
    """Schema for querying and returning a pass-through record."""

    pass
