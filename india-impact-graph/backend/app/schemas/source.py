"""Pydantic schemas for Data Source & Evidence Provenance Registry.

Conforms strictly to `docs/DATA_AND_EVIDENCE_RULES.md`, `docs/DATA_SOURCE_REGISTER.md`,
and `data/templates/data-source-register.csv`.
"""

from enum import Enum
import re
from typing import Optional
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.consumption import VerificationStatus

SOURCE_ID_PATTERN = re.compile(r"^SRC-\d{2,4}$")
ALLOWED_URL_SCHEMES = ("https", "http")


class SourceAccessCondition(str, Enum):
    """Documented access protocols for primary data sources."""

    PUBLIC_OPEN = "public_open"
    OFFICIAL_PORTAL = "official_portal"
    REQUIRES_REGISTRATION = "requires_registration"
    PAYWALLED = "paywalled"
    CACHED_LOCAL = "cached_local"
    RESTRICTED = "restricted"


class DataSourceBase(BaseModel):
    """Base schema for authoritative data sources in the source register."""

    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(
        description="Canonical source identifier matching pattern '^SRC-\\d{2,4}$' (e.g., 'SRC-01', 'SRC-02')"
    )
    source_title: str = Field(
        description="Official publication or series title"
    )
    publisher: str = Field(
        description="Official issuing authority or publishing institution (e.g., 'MoSPI', 'PPAC', 'RBI')"
    )
    series_or_table_id: Optional[str] = Field(
        default=None,
        description="Specific table, bulletin, gazette, or series reference (e.g., 'Table 3 (MPCE by State/Sector)')"
    )
    base_year: Optional[str] = Field(
        default=None,
        description="Base year or survey round vintage (e.g., '2024 Base', '2023-24', '2012 Base')"
    )
    frequency: Optional[str] = Field(
        default=None,
        description="Publication cadence (e.g., 'Monthly', 'Daily', 'Quinquennial', 'Dated / Cached')"
    )
    geographic_coverage: Optional[str] = Field(
        default=None,
        description="Spatial boundary of validity (e.g., 'All-India', 'Madhya Pradesh', 'Global')"
    )
    source_url: Optional[str] = Field(
        default=None,
        description="Verifiable HTTPS link or official repository portal locator"
    )
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.VERIFY,
        description="Data governance verification classification"
    )
    access_condition: SourceAccessCondition = Field(
        default=SourceAccessCondition.PUBLIC_OPEN,
        description="Access and licensing conditions for obtaining raw data"
    )
    notes: Optional[str] = None

    @field_validator("source_id")
    @classmethod
    def validate_source_id(cls, v: str) -> str:
        clean = v.strip().upper()
        if not SOURCE_ID_PATTERN.match(clean):
            raise ValueError(
                f"Source ID '{v}' must be a canonical identifier matching pattern '^SRC-\\d{{2,4}}$' (e.g. 'SRC-01')"
            )
        return clean

    @field_validator("source_title", "publisher")
    @classmethod
    def validate_non_empty(cls, v: str, info) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError(f"{info.field_name} cannot be empty")
        return clean

    @field_validator("source_url")
    @classmethod
    def validate_safe_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            return None

        # Disallow unsafe URI schemes explicitly
        lower_url = clean.lower()
        if lower_url.startswith(("javascript:", "data:", "file:", "ftp:")):
            raise ValueError(f"Unsafe URL scheme in source URL: '{clean}'. Only HTTPS/HTTP permitted.")

        parsed = urlparse(clean)
        if parsed.scheme not in ALLOWED_URL_SCHEMES:
            raise ValueError(
                f"Invalid URL scheme '{parsed.scheme}'. Only HTTPS or HTTP URLs are allowed for external sources."
            )
        if not parsed.netloc:
            raise ValueError(f"Invalid source URL '{clean}': missing network domain host.")

        return clean

    @field_validator("access_condition", mode="before")
    @classmethod
    def parse_access_condition(cls, v: str | SourceAccessCondition) -> SourceAccessCondition:
        if isinstance(v, SourceAccessCondition):
            return v
        if isinstance(v, str):
            clean = v.strip().lower()
            try:
                return SourceAccessCondition(clean)
            except ValueError as exc:
                allowed = [c.value for c in SourceAccessCondition]
                raise ValueError(
                    f"Unsupported access_condition '{v}'. Must be one of: {allowed}"
                ) from exc
        raise ValueError(f"Invalid access_condition type: {type(v)}")


class DataSourceCreate(DataSourceBase):
    """Schema for registering a validated data source record."""

    pass


class DataSourceResponse(DataSourceBase):
    """Schema for returning a data source record from the registry."""

    pass
