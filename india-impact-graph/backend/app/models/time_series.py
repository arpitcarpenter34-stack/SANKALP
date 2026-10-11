"""SQLAlchemy 2.0 ORM models for Historical Time-Series Foundation.

Stores definitions and observations for macroeconomic and energy series
such as MoSPI CPI General Index and PPAC Indian Basket Crude Oil.
Conforms strictly to data governance and source provenance rules.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, Float, ForeignKey, Index, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class TimeSeriesDefinitionModel(Base):
    """SQLAlchemy model for time-series metadata and definition."""

    __tablename__ = "time_series_definitions"

    series_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    series_name: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[str] = mapped_column(String(100), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    frequency: Mapped[str] = mapped_column(String(50), nullable=False)
    geographic_scope: Mapped[str] = mapped_column(String(100), nullable=False, default="All-India")
    base_year: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        ForeignKey("data_sources.source_id", ondelete="SET NULL"),
        nullable=True,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    observations: Mapped[List["TimeSeriesObservationModel"]] = relationship(
        "TimeSeriesObservationModel",
        back_populates="definition",
        cascade="all, delete-orphan",
        order_by="TimeSeriesObservationModel.reference_period",
    )


class TimeSeriesObservationModel(Base):
    """SQLAlchemy model for discrete historical time-series observations."""

    __tablename__ = "time_series_observations"

    __table_args__ = (
        UniqueConstraint(
            "series_id",
            "reference_period",
            "geographic_scope",
            "sector",
            name="uq_time_series_obs_natural_key",
        ),
        Index("ix_time_series_obs_series_period", "series_id", "reference_period"),
        Index("ix_time_series_obs_series_sector", "series_id", "sector"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    series_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("time_series_definitions.series_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reference_period: Mapped[str] = mapped_column(String(50), nullable=False)
    observation_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    geographic_scope: Mapped[str] = mapped_column(String(100), nullable=False, default="All-India")
    sector: Mapped[str] = mapped_column(String(50), nullable=False, default="Combined")
    observation_value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    release_status: Mapped[str] = mapped_column(String(50), nullable=False, default="Final")
    source_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    publication_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationship
    definition: Mapped["TimeSeriesDefinitionModel"] = relationship(
        "TimeSeriesDefinitionModel",
        back_populates="observations",
    )
