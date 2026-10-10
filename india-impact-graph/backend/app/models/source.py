"""SQLAlchemy 2.0 ORM model for Data Source & Evidence Provenance Registry.

Tracks primary publishing authorities, series identifiers, vintages, URLs,
and access conditions conforming to `data/templates/data-source-register.csv`.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class DataSourceModel(Base):
    """SQLAlchemy model for authoritative data sources registry."""

    __tablename__ = "data_sources"

    source_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    source_title: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False)
    series_or_table_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    base_year: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    geographic_coverage: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False, default="[VERIFY]")
    access_condition: Mapped[str] = mapped_column(String(50), nullable=False, default="public_open")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
