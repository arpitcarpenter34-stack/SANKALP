"""Pass-Through Register Service and CSV Loader.

Provides deterministic validation, loading, and querying of pass-through reference datasets
conforming to `docs/DATA_AND_EVIDENCE_RULES.md` and `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md`.
"""

import csv
import math
from pathlib import Path
from typing import Optional, Union
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.pass_through import PassThroughRecordModel
from app.schemas.pass_through import PassThroughRecordCreate

EXPECTED_CSV_COLUMNS = [
    "upstream_commodity",
    "downstream_item",
    "pass_through_factor_low",
    "pass_through_factor_high",
    "unit",
    "time_lag_months",
    "historical_basis_source",
    "verification_status",
    "caveats",
]


def _parse_optional_float(val: Union[str, float, None], line_num: int, col_name: str) -> Optional[float]:
    """Parse optional float with finite-value checks."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        float_val = float(val)
    else:
        str_val = str(val).strip()
        if not str_val:
            return None
        try:
            float_val = float(str_val)
        except ValueError as exc:
            raise ValueError(f"Line {line_num}: Invalid numeric value '{str_val}' in column '{col_name}'") from exc

    if math.isnan(float_val) or math.isinf(float_val):
        raise ValueError(f"Line {line_num}: Column '{col_name}' cannot be NaN or Infinite")

    return float_val


def validate_pass_through_csv(csv_path: Union[str, Path]) -> list[PassThroughRecordCreate]:
    """Validate pass-through CSV file against registry schema.

    Enforces column completeness, strict enum validation, and duplicate relationship detection.
    Does not write to or mutate the database.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Pass-through CSV file not found at: {path}")

    records: list[PassThroughRecordCreate] = []
    seen_pairs: set[tuple[str, str]] = set()

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
            raw_upstream = (row.get("upstream_commodity") or "").strip().lower()
            raw_downstream = (row.get("downstream_item") or "").strip().lower()

            if not raw_upstream:
                raise ValueError(f"Line {line_num}: upstream_commodity cannot be empty")
            if not raw_downstream:
                raise ValueError(f"Line {line_num}: downstream_item cannot be empty")

            pair = (raw_upstream, raw_downstream)
            if pair in seen_pairs:
                raise ValueError(
                    f"Line {line_num}: Duplicate pass-through relationship '{raw_upstream}' -> '{raw_downstream}'"
                )
            seen_pairs.add(pair)

            clean_row = {}
            for k, v in row.items():
                k_clean = k.strip()
                v_clean = v.strip() if isinstance(v, str) else v
                clean_row[k_clean] = v_clean if v_clean != "" else None

            # Parse numeric floats safely
            try:
                clean_row["pass_through_factor_low"] = _parse_optional_float(
                    clean_row.get("pass_through_factor_low"), line_num, "pass_through_factor_low"
                )
                clean_row["pass_through_factor_high"] = _parse_optional_float(
                    clean_row.get("pass_through_factor_high"), line_num, "pass_through_factor_high"
                )
            except ValueError as exc:
                raise ValueError(str(exc)) from exc

            # Set default unit if empty
            if not clean_row.get("unit"):
                clean_row["unit"] = "elasticity_coefficient"

            try:
                record_obj = PassThroughRecordCreate(**clean_row)
                records.append(record_obj)
            except ValidationError as exc:
                raise ValueError(f"Line {line_num} validation error: {exc}") from exc

    return records


def load_pass_through_records_from_csv(
    csv_path: Union[str, Path],
    db: Session,
) -> dict[str, int]:
    """Idempotently load validated pass-through records into database.

    Executes in a single atomic transaction. Skips relationships that already exist
    without overwriting them. Rolls back on error.
    """
    validated_records = validate_pass_through_csv(csv_path)

    created_count = 0
    skipped_count = 0

    try:
        existing_stmt = select(
            PassThroughRecordModel.upstream_commodity,
            PassThroughRecordModel.downstream_item,
        )
        existing_pairs = set(db.execute(existing_stmt).all())

        for r in validated_records:
            pair = (r.upstream_commodity, r.downstream_item)
            if pair in existing_pairs:
                skipped_count += 1
                continue

            model = PassThroughRecordModel(
                upstream_commodity=r.upstream_commodity,
                downstream_item=r.downstream_item,
                pass_through_factor_low=r.pass_through_factor_low,
                pass_through_factor_high=r.pass_through_factor_high,
                unit=r.unit,
                time_lag_months=r.time_lag_months,
                historical_basis_source=r.historical_basis_source,
                verification_status=r.verification_status.value,
                caveats=r.caveats,
            )
            db.add(model)
            created_count += 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "total": len(validated_records),
        "created": created_count,
        "skipped": skipped_count,
    }


def get_all_pass_through_records(db: Session) -> list[PassThroughRecordModel]:
    """Retrieve all pass-through records in deterministic order."""
    stmt = select(PassThroughRecordModel).order_by(
        PassThroughRecordModel.upstream_commodity.asc(),
        PassThroughRecordModel.downstream_item.asc(),
    )
    return list(db.execute(stmt).scalars().all())


def get_pass_through_record(
    upstream: str,
    downstream: str,
    db: Session,
) -> Optional[PassThroughRecordModel]:
    """Retrieve a specific pass-through record by composite key."""
    stmt = select(PassThroughRecordModel).where(
        PassThroughRecordModel.upstream_commodity == upstream.strip().lower(),
        PassThroughRecordModel.downstream_item == downstream.strip().lower(),
    )
    return db.execute(stmt).scalar_one_or_none()


def get_pass_through_for_item(
    downstream_item: str,
    db: Session,
) -> list[PassThroughRecordModel]:
    """Retrieve all upstream commodity pass-through relationships for a given downstream consumption item."""
    stmt = (
        select(PassThroughRecordModel)
        .where(PassThroughRecordModel.downstream_item == downstream_item.strip().lower())
        .order_by(PassThroughRecordModel.upstream_commodity.asc())
    )
    return list(db.execute(stmt).scalars().all())
