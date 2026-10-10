"""SQLAlchemy 2.0 ORM model for Cached Articles Catalog Registry.

Tracks immutable local news article caches, publishers, event timestamps,
source URLs, and verification classifications conforming to
`data/templates/cached-articles-catalog.csv`.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class CachedArticleModel(Base):
    """SQLAlchemy model for cached articles catalog registry."""

    __tablename__ = "cached_articles"

    article_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    event_name: Mapped[str] = mapped_column(String(255), nullable=False)
    headline: Mapped[str] = mapped_column(Text, nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False)
    publication_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    event_date: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    local_cache_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    reported_event_magnitude: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), nullable=False, default="[VERIFY]")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
