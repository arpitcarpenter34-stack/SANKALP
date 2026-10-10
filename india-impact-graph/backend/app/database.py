"""Database configuration and session management using SQLAlchemy 2.x."""

from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from app.config import settings

# Engine is created lazily; connections are not established at import time
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2.x ORM models."""

    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session with guaranteed cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
