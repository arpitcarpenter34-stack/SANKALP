"""Household Consumption Item Registry Service and Loader.

Provides deterministic validation, loading, and querying of consumption reference datasets
conforming to `docs/DATA_AND_EVIDENCE_RULES.md` and `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md`.
"""

import csv
from pathlib import Path
from typing import Optional, Union
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.consumption import ConsumptionItemModel
from app.schemas.consumption import ConsumptionItemCreate

EXPECTED_CSV_COLUMNS = [
    "item_id",
    "name",
    "category",
    "canonical_unit",
    "is_calculable",
    "is_capital_asset",
    "verification_status",
    "data_availability",
    "source_title",
    "table_or_series_id",
    "year_or_vintage",
    "notes",
]


def _parse_bool(val: Union[str, bool, None]) -> bool:
    """Parse boolean from string or boolean values."""
    if isinstance(val, bool):
        return val
    if not val:
        return False
    str_val = str(val).strip().lower()
    if str_val in ("true", "1", "yes", "t"):
        return True
    if str_val in ("false", "0", "no", "f"):
        return False
    raise ValueError(f"Invalid boolean value: '{val}'")


def validate_consumption_csv(csv_path: Union[str, Path]) -> list[ConsumptionItemCreate]:
    """Validate curated consumption items CSV file against registry schema.

    Enforces column completeness, strict enum validation, and duplicate ID detection.
    Does not write to or mutate the database.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Consumption CSV file not found at: {path}")

    items: list[ConsumptionItemCreate] = []
    seen_ids: set[str] = set()

    with open(path, mode="r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        # Check column headers match expected schema exactly
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
            raw_id = (row.get("item_id") or "").strip().lower()
            if not raw_id:
                raise ValueError(f"Line {line_num}: item_id cannot be empty")

            if raw_id in seen_ids:
                raise ValueError(f"Line {line_num}: Duplicate item_id '{raw_id}' found in CSV")
            seen_ids.add(raw_id)

            # Sanitize row inputs
            clean_row = {}
            for k, v in row.items():
                k_clean = k.strip()
                v_clean = v.strip() if isinstance(v, str) else v
                clean_row[k_clean] = v_clean if v_clean != "" else None

            # Convert boolean fields
            try:
                clean_row["is_calculable"] = _parse_bool(clean_row.get("is_calculable"))
                clean_row["is_capital_asset"] = _parse_bool(clean_row.get("is_capital_asset"))
            except ValueError as exc:
                raise ValueError(f"Line {line_num}: {exc}") from exc

            try:
                item_obj = ConsumptionItemCreate(**clean_row)
                items.append(item_obj)
            except ValidationError as exc:
                raise ValueError(f"Line {line_num} validation error: {exc}") from exc

    return items


def load_consumption_items_from_csv(
    csv_path: Union[str, Path],
    db: Session,
) -> dict[str, int]:
    """Idempotently load validated consumption items into the database.

    Executes in a single atomic transaction. Skips items that already exist
    without overwriting or duplicating them. Rolls back on error.
    """
    validated_items = validate_consumption_csv(csv_path)

    created_count = 0
    skipped_count = 0

    try:
        # Load existing item IDs to guarantee idempotency
        existing_ids_stmt = select(ConsumptionItemModel.item_id)
        existing_ids = set(db.execute(existing_ids_stmt).scalars().all())

        for item_data in validated_items:
            if item_data.item_id in existing_ids:
                skipped_count += 1
                continue

            model = ConsumptionItemModel(
                item_id=item_data.item_id,
                name=item_data.name,
                category=item_data.category.value,
                canonical_unit=item_data.canonical_unit,
                is_calculable=item_data.is_calculable,
                is_capital_asset=item_data.is_capital_asset,
                verification_status=item_data.verification_status.value,
                data_availability=item_data.data_availability.value,
                source_title=item_data.source_title,
                table_or_series_id=item_data.table_or_series_id,
                year_or_vintage=item_data.year_or_vintage,
                notes=item_data.notes,
            )
            db.add(model)
            created_count += 1

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "total": len(validated_items),
        "created": created_count,
        "skipped": skipped_count,
    }


def get_all_consumption_items(db: Session) -> list[ConsumptionItemModel]:
    """Retrieve all consumption items from the registry in deterministic item_id order."""
    stmt = select(ConsumptionItemModel).order_by(ConsumptionItemModel.item_id.asc())
    return list(db.execute(stmt).scalars().all())


def get_consumption_item_by_id(item_id: str, db: Session) -> Optional[ConsumptionItemModel]:
    """Retrieve a consumption item by unique item ID."""
    stmt = select(ConsumptionItemModel).where(ConsumptionItemModel.item_id == item_id)
    return db.execute(stmt).scalar_one_or_none()
