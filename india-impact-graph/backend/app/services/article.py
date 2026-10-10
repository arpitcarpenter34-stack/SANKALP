"""Cached Articles Catalog Service and CSV Loader.

Provides deterministic validation, loading, and querying of cached news articles
conforming to `docs/DATA_AND_EVIDENCE_RULES.md` and `data/templates/cached-articles-catalog.csv`.
"""

import csv
from pathlib import Path
from typing import Optional, Union
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.article import CachedArticleModel
from app.schemas.article import CachedArticleCreate

EXPECTED_CSV_COLUMNS = [
    "article_id",
    "event_name",
    "headline",
    "publisher",
    "publication_date",
    "event_date",
    "source_url",
    "local_cache_path",
    "reported_event_magnitude",
    "verification_status",
]


def validate_cached_articles_csv(
    csv_path: Union[str, Path],
    verify_cache_presence: bool = False,
    base_dir: Optional[Path] = None,
) -> list[CachedArticleCreate]:
    """Validate cached articles CSV file against catalog schema.

    Enforces column completeness, strict enum validation, URL safety,
    path traversal safety, and duplicate ID detection.
    Does not write to or mutate the database.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Cached articles CSV file not found at: {path}")

    records: list[CachedArticleCreate] = []
    seen_ids: set[str] = set()

    with open(path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        if reader.fieldnames is None:
            raise ValueError(f"CSV file at {path} is empty or missing headers")

        actual_fields = [f.strip() for f in reader.fieldnames]
        if actual_fields != EXPECTED_CSV_COLUMNS:
            missing = set(EXPECTED_CSV_COLUMNS) - set(actual_fields)
            extra = set(actual_fields) - set(EXPECTED_CSV_COLUMNS)
            raise ValueError(
                f"CSV header mismatch. Expected {EXPECTED_CSV_COLUMNS}. "
                f"Missing: {list(missing)}, Extra: {list(extra)}"
            )

        for line_num, row in enumerate(reader, start=2):
            raw_id = (row.get("article_id") or "").strip()
            if not raw_id:
                raise ValueError(f"Line {line_num}: article_id cannot be empty")

            if raw_id in seen_ids:
                raise ValueError(f"Line {line_num}: Duplicate article_id '{raw_id}' found in CSV")
            seen_ids.add(raw_id)

            clean_row = {}
            for k, v in row.items():
                k_clean = k.strip()
                v_clean = v.strip() if isinstance(v, str) else v
                clean_row[k_clean] = v_clean if v_clean != "" else None

            # Ensure default verification status if empty
            if not clean_row.get("verification_status"):
                clean_row["verification_status"] = "[VERIFY]"

            try:
                article_obj = CachedArticleCreate(**clean_row)
                if verify_cache_presence and article_obj.local_cache_path:
                    if not article_obj.is_locally_cached(base_dir=base_dir):
                        raise ValueError(
                            f"Line {line_num}: Referenced local cache file '{article_obj.local_cache_path}' "
                            f"does not exist on disk."
                        )
                records.append(article_obj)
            except ValidationError as exc:
                raise ValueError(f"Line {line_num} validation error: {exc}") from exc

    return records


def load_cached_articles_from_csv(
    csv_path: Union[str, Path],
    db: Session,
) -> dict[str, int]:
    """Idempotently load validated cached articles into database.

    Executes in a single atomic transaction. Skips articles that already exist
    without overwriting them. Rolls back on error.
    """
    validated_articles = validate_cached_articles_csv(csv_path)

    created_count = 0
    skipped_count = 0

    try:
        existing_stmt = select(CachedArticleModel.article_id)
        existing_ids = set(db.execute(existing_stmt).scalars().all())

        for art in validated_articles:
            if art.article_id in existing_ids:
                skipped_count += 1
                continue

            model = CachedArticleModel(
                article_id=art.article_id,
                event_name=art.event_name,
                headline=art.headline,
                publisher=art.publisher,
                publication_date=art.publication_date,
                event_date=art.event_date,
                source_url=art.source_url,
                local_cache_path=art.local_cache_path,
                reported_event_magnitude=art.reported_event_magnitude,
                verification_status=art.verification_status.value,
            )
            db.add(model)
            created_count += 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "total": len(validated_articles),
        "created": created_count,
        "skipped": skipped_count,
    }


def get_all_cached_articles(db: Session) -> list[CachedArticleModel]:
    """Retrieve all cached articles in deterministic article_id order."""
    stmt = select(CachedArticleModel).order_by(CachedArticleModel.article_id.asc())
    return list(db.execute(stmt).scalars().all())


def get_cached_article_by_id(article_id: str, db: Session) -> Optional[CachedArticleModel]:
    """Retrieve a single cached article by unique article ID."""
    stmt = select(CachedArticleModel).where(CachedArticleModel.article_id == article_id)
    return db.execute(stmt).scalar_one_or_none()


def get_cached_articles_by_event(event_name: str, db: Session) -> list[CachedArticleModel]:
    """Retrieve all cached articles for a specific event in deterministic order."""
    stmt = (
        select(CachedArticleModel)
        .where(CachedArticleModel.event_name == event_name)
        .order_by(CachedArticleModel.article_id.asc())
    )
    return list(db.execute(stmt).scalars().all())
