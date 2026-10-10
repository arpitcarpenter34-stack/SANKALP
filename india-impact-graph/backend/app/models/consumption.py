"""SQLAlchemy 2.0 ORM model for Household Consumption Item Registry.

Tracks reference metadata, units, survey citations, and calculation availability flags.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class ConsumptionItemModel(Base):
    """SQLAlchemy model for the household consumption items registry."""

    __tablename__ = "consumption_items"

    item_id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    canonical_unit: Mapped[str] = mapped_column(String(50), nullable=False)
    is_calculable: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    is_capital_asset: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False)
    data_availability: Mapped[str] = mapped_column(String(50), nullable=False)
    source_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    table_or_series_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    year_or_vintage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
