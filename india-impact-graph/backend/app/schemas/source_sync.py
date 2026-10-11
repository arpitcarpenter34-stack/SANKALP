"""Pydantic schemas for Data Source Sync Status, Live Refresh Monitoring, and Freshness.

Exposes source freshness SLAs, synchronization outcomes, and historical run logs.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class FreshnessPolicyInfo(BaseModel):
    """Metadata describing the publication cadence and freshness evaluation for a source."""

    model_config = ConfigDict(extra="forbid")

    cadence: str = Field(description="Expected official publication frequency ('Monthly', 'Sparse snapshots')")
    threshold_days: int = Field(description="Days before lack of new published observations is classified as stale")
    is_fresh: bool = Field(description="Whether the dataset is within its freshness SLA")
    freshness_note: str = Field(description="Human-readable context regarding publication schedule and limitations")


class SourceProvenanceInfo(BaseModel):
    """Authoritative publishing and archive references."""

    model_config = ConfigDict(extra="forbid")

    publisher: str
    official_url: Optional[str] = None
    access_condition: str = "public_open"
    verification_status: str = "[VERIFIED]"
    base_year: Optional[str] = None
    notes: Optional[str] = None


class SourceSyncStatusResponse(BaseModel):
    """Comprehensive status response for an individual data source."""

    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(description="Canonical source identifier (e.g. 'SRC-01', 'SRC-02')")
    source_name: str = Field(description="Official publication or series title")
    series_id: Optional[str] = Field(default=None, description="Linked time-series definition ID")
    is_enabled: bool = Field(default=True, description="Whether active checking is enabled")
    last_check_time: Optional[datetime] = Field(default=None, description="Timestamp of most recent refresh check")
    last_success_time: Optional[datetime] = Field(default=None, description="Timestamp of most recent successful check")
    last_new_observation_time: Optional[datetime] = Field(
        default=None,
        description="Timestamp when new observations were last added or updated",
    )
    last_observation_period: Optional[str] = Field(
        default=None,
        description="Most recent reference period available in PostgreSQL (e.g. '2026-08', '2026-02-19')",
    )
    records_inserted_last_run: int = Field(default=0, description="Records inserted during the latest refresh run")
    records_updated_last_run: int = Field(default=0, description="Records updated during the latest refresh run")
    status: str = Field(
        description="Current health status: 'success', 'no_change', 'stale', 'error', or 'idle'"
    )
    error_summary: Optional[str] = Field(
        default=None,
        description="Sanitized, secrets-free description of last error if status is 'error'",
    )
    provenance: SourceProvenanceInfo
    freshness: FreshnessPolicyInfo


class DataSourceStatusListResponse(BaseModel):
    """Response containing status reports for all tracked data sources."""

    model_config = ConfigDict(extra="forbid")

    total_sources: int
    active_sources: int
    system_timestamp: datetime
    sources: List[SourceSyncStatusResponse]


class RefreshExecutionSummary(BaseModel):
    """Summary of a completed refresh execution."""

    source_id: str
    status: str  # 'success', 'no_change', 'error'
    run_type: str  # 'automated', 'manual_import', 'cli'
    records_inserted: int
    records_updated: int
    message: Optional[str] = None
    error_message: Optional[str] = None
    execution_duration_ms: Optional[float] = None
