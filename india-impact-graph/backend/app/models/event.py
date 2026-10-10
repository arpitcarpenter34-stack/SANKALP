"""SQLAlchemy 2.0 ORM models for Financial Events domain.

Conforms to `india-impact-graph/schemas/event-extraction-schema.json`.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class FinancialEventModel(Base):
    """SQLAlchemy model for financial events and scenario inputs."""

    __tablename__ = "financial_events"

    event_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    headline: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_scenario: Mapped[bool] = mapped_column(Boolean, nullable=False)
    event_date: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    geography: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Flattened magnitude attributes conforming to EventMagnitude schema
    magnitude_direction: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    magnitude_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    magnitude_unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # 1:N Relationships with cascade deletion
    evidence_snippets: Mapped[list["EventEvidenceSnippetModel"]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    entities: Mapped[list["EventEntityModel"]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class EventEvidenceSnippetModel(Base):
    """SQLAlchemy model for supporting evidence snippets attached to an event."""

    __tablename__ = "event_evidence_snippets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("financial_events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    source_title: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publication_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    event: Mapped["FinancialEventModel"] = relationship(
        back_populates="evidence_snippets",
    )


class EventEntityModel(Base):
    """SQLAlchemy model for entities extracted from an event text."""

    __tablename__ = "event_entities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("financial_events.event_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    entity_id: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    mention_text: Mapped[str] = mapped_column(Text, nullable=False)

    event: Mapped["FinancialEventModel"] = relationship(
        back_populates="entities",
    )
