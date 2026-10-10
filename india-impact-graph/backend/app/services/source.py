"""Data Source Register Service and CSV Loader.

Provides deterministic validation, loading, and querying of primary data sources
conforming to `docs/DATA_AND_EVIDENCE_RULES.md` and `data/templates/data-source-register.csv`.
"""

import csv
from pathlib import Path
from typing import Optional, Union
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.source import DataSourceModel
from app.schemas.source import DataSourceCreate

EXPECTED_CSV_COLUMNS = [
    "source_id",
    "source_title",
    "publisher",
    "series_or_table_id",
    "base_year",
    "frequency",
    "geographic_coverage",
    "source_url",
    "verification_status",
    "access_condition",
    "notes",
]


def validate_data_source_csv(csv_path: Union[str, Path]) -> list[DataSourceCreate]:
    """Validate data source CSV file against registry schema.

    Enforces column completeness, strict enum validation, URL safety, and duplicate ID detection.
    Does not write to or mutate the database.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Data source CSV file not found at: {path}")

    records: list[DataSourceCreate] = []
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
            raw_id = (row.get("source_id") or "").strip().upper()
            if not raw_id:
                raise ValueError(f"Line {line_num}: source_id cannot be empty")

            if raw_id in seen_ids:
                raise ValueError(f"Line {line_num}: Duplicate source_id '{raw_id}' found in CSV")
            seen_ids.add(raw_id)

            clean_row = {}
            for k, v in row.items():
                k_clean = k.strip()
                v_clean = v.strip() if isinstance(v, str) else v
                clean_row[k_clean] = v_clean if v_clean != "" else None

            # Ensure default access condition if empty
            if not clean_row.get("access_condition"):
                clean_row["access_condition"] = "public_open"

            # Ensure default verification status if empty
            if not clean_row.get("verification_status"):
                clean_row["verification_status"] = "[VERIFY]"

            try:
                source_obj = DataSourceCreate(**clean_row)
                records.append(source_obj)
            except ValidationError as exc:
                raise ValueError(f"Line {line_num} validation error: {exc}") from exc

    return records


def load_data_sources_from_csv(
    csv_path: Union[str, Path],
    db: Session,
) -> dict[str, int]:
    """Idempotently load validated data sources into database.

    Executes in a single atomic transaction. Skips sources that already exist
    without overwriting them. Rolls back on error.
    """
    validated_sources = validate_data_source_csv(csv_path)

    created_count = 0
    skipped_count = 0

    try:
        existing_stmt = select(DataSourceModel.source_id)
        existing_ids = set(db.execute(existing_stmt).scalars().all())

        for s in validated_sources:
            if s.source_id in existing_ids:
                skipped_count += 1
                continue

            model = DataSourceModel(
                source_id=s.source_id,
                source_title=s.source_title,
                publisher=s.publisher,
                series_or_table_id=s.series_or_table_id,
                base_year=s.base_year,
                frequency=s.frequency,
                geographic_coverage=s.geographic_coverage,
                source_url=s.source_url,
                verification_status=s.verification_status.value,
                access_condition=s.access_condition.value,
                notes=s.notes,
            )
            db.add(model)
            created_count += 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "total": len(validated_sources),
        "created": created_count,
        "skipped": skipped_count,
    }


def get_all_data_sources(db: Session) -> list[DataSourceModel]:
    """Retrieve all data sources in deterministic source_id order."""
    stmt = select(DataSourceModel).order_by(DataSourceModel.source_id.asc())
    return list(db.execute(stmt).scalars().all())


def get_data_source_by_id(source_id: str, db: Session) -> Optional[DataSourceModel]:
    """Retrieve a data source by unique canonical source ID."""
    stmt = select(DataSourceModel).where(
        DataSourceModel.source_id == source_id.strip().upper()
    )
    return db.execute(stmt).scalar_one_or_none()
