"""SQLAlchemy 2.0 ORM model for Pass-Through Register.

Tracks empirical transmission elasticities, bounds, time lags, and citations
between upstream commodities and downstream household consumption items.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Float, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class PassThroughRecordModel(Base):
    """SQLAlchemy model for commodity-to-item pass-through relationships."""

    __tablename__ = "pass_through_records"

    upstream_commodity: Mapped[str] = mapped_column(String(50), primary_key=True)
    downstream_item: Mapped[str] = mapped_column(String(50), primary_key=True)
    pass_through_factor_low: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pass_through_factor_high: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String(50), nullable=False, default="elasticity_coefficient")
    time_lag_months: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    historical_basis_source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False, default="[VERIFY]")
    caveats: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
