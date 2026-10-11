"""SQLAlchemy 2.0 ORM models for Data Source Sync Status and Refresh History.

Tracks live refresh outcomes, freshness policies, and execution logs
for authoritative macroeconomic data sources (MoSPI CPI, PPAC crude oil).
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class DataSourceSyncStatusModel(Base):
    """SQLAlchemy model tracking current synchronization and freshness status per data source."""

    __tablename__ = "data_source_sync_status"

    source_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("data_sources.source_id", ondelete="CASCADE"),
        primary_key=True,
    )
    series_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        ForeignKey("time_series_definitions.series_id", ondelete="SET NULL"),
        nullable=True,
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_check_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_success_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_observation_period: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    records_inserted_last_run: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_updated_last_run: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        default="idle",
        nullable=False,
    )  # 'idle', 'success', 'no_change', 'stale', 'error'
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    refresh_policy: Mapped[str] = mapped_column(
        String(50),
        default="monthly",
        nullable=False,
    )  # 'monthly', 'sparse_snapshot'
    freshness_threshold_days: Mapped[int] = mapped_column(Integer, default=45, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class DataSourceRefreshRunModel(Base):
    """SQLAlchemy model for historical audit logs of data source refresh executions."""

    __tablename__ = "data_source_refresh_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(
        String(50),
        ForeignKey("data_sources.source_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    run_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
    run_type: Mapped[str] = mapped_column(
        String(50),
        default="automated",
        nullable=False,
    )  # 'automated', 'manual_import', 'cli'
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # 'success', 'no_change', 'error'
    records_inserted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    records_updated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    execution_duration_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
