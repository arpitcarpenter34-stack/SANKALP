"""Historical Time-Series ingestion and query service.

Provides idempotent ingestion of MoSPI CPI and PPAC crude-oil series,
preserving source provenance, exact dates, units, and missing-value semantics.
"""

import csv
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.time_series import (
    TimeSeriesDefinitionModel,
    TimeSeriesObservationModel,
)
from app.schemas.time_series import (
    CPIObservation,
    PPACSnapshot,
)

logger = logging.getLogger(__name__)

# Default curated data paths
DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "data" / "curated"
DEFAULT_CPI_PATH = DEFAULT_DATA_DIR / "cpi_2024_general_index_monthly_2026_01_to_08.csv"
DEFAULT_PPAC_PATH = DEFAULT_DATA_DIR / "ppac_indian_basket_public_archive_snapshots_2026_01_to_02.csv"

DEFINITIONS_CATALOG: List[Dict[str, Any]] = [
    {
        "series_id": "cpi_2024_general",
        "series_name": "CPI 2024 General Index",
        "publisher": "MoSPI",
        "unit": "Index points",
        "frequency": "Monthly",
        "geographic_scope": "All-India",
        "base_year": "2024=100",
        "source_id": "SRC-02",
        "notes": (
            "MoSPI NSO Consumer Price Index on Base 2024=100. Starter extract covering "
            "January to August 2026 across Rural, Urban, and Combined sectors. "
            "Preserves original final vs. provisional release status."
        ),
    },
    {
        "series_id": "crude_oil_indian_basket",
        "series_name": "PPAC Indian Basket Crude Oil",
        "publisher": "PPAC",
        "unit": "USD/barrel",
        "frequency": "Sparse published snapshots",
        "geographic_scope": "All-India",
        "base_year": None,
        "source_id": "SRC-01",
        "notes": (
            "Sparse published snapshots transcribed from PPAC Important News archive headlines "
            "from January 02 to February 19, 2026. These are discrete published points, not a "
            "complete continuous daily series. Do not interpolate missing dates or compute synthetic monthly averages."
        ),
    },
]


def ingest_time_series_definitions(db: Session) -> Dict[str, int]:
    """Idempotently register time-series definitions."""
    existing_series_ids = set(
        db.execute(select(TimeSeriesDefinitionModel.series_id)).scalars().all()
    )
    created, skipped = 0, 0

    for def_data in DEFINITIONS_CATALOG:
        if def_data["series_id"] in existing_series_ids:
            skipped += 1
        else:
            db.add(TimeSeriesDefinitionModel(**def_data))
            created += 1

    return {"created": created, "skipped": skipped, "total": len(DEFINITIONS_CATALOG)}


def ingest_cpi_observations_from_csv(csv_path: Path, db: Session) -> Dict[str, Any]:
    """Read and idempotently ingest MoSPI CPI monthly observations from CSV.

    Preserves exact months, sectors, index values, status, and source references.
    Does not interpolate or synthetic-fill any dates.
    """
    if not csv_path.is_file():
        raise FileNotFoundError(f"CPI CSV file not found: {csv_path}")

    with csv_path.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        required_fields = {
            "reference_month",
            "sector",
            "index_value",
            "index_base",
            "release_status",
            "source_title",
            "source_url",
            "source_release_date",
        }
        missing = required_fields - set(fieldnames)
        if missing:
            raise ValueError(f"CPI CSV missing mandatory headers: {missing}")

        rows = list(reader)

    # Fetch existing natural keys to guarantee idempotency
    existing_keys = set(
        db.execute(
            select(
                TimeSeriesObservationModel.reference_period,
                TimeSeriesObservationModel.geographic_scope,
                TimeSeriesObservationModel.sector,
            ).where(TimeSeriesObservationModel.series_id == "cpi_2024_general")
        ).all()
    )

    created, skipped = 0, 0
    for row in rows:
        ref_month = row["reference_month"].strip()
        sector = row["sector"].strip()
        geo_scope = "All-India"
        key = (ref_month, geo_scope, sector)

        if key in existing_keys:
            skipped += 1
            continue

        raw_val = row["index_value"].strip()
        if not raw_val:
            # Never insert synthetic zero for missing value
            continue
        index_val = float(raw_val)
        if index_val <= 0:
            raise ValueError(f"Invalid non-positive CPI index value: {raw_val}")

        obs = TimeSeriesObservationModel(
            series_id="cpi_2024_general",
            reference_period=ref_month,
            observation_date=None,  # Monthly aggregate, not a discrete day
            geographic_scope=geo_scope,
            sector=sector,
            observation_value=index_val,
            unit=row.get("unit", "Index points").strip() or "Index points",
            release_status=row.get("release_status", "Final").strip(),
            source_title=row.get("source_title", "").strip() or None,
            source_url=row.get("source_url", "").strip() or None,
            publication_date=row.get("source_release_date", "").strip() or None,
            notes=row.get("notes", "").strip() or None,
        )
        db.add(obs)
        existing_keys.add(key)
        created += 1

    return {"total_rows": len(rows), "created": created, "skipped": skipped}


def ingest_ppac_snapshots_from_csv(csv_path: Path, db: Session) -> Dict[str, Any]:
    """Read and idempotently ingest PPAC crude-oil snapshots from CSV.

    Preserves exact snapshot observation dates, prices, status, and source URLs.
    Does not interpolate or fill calendar gaps.
    """
    if not csv_path.is_file():
        raise FileNotFoundError(f"PPAC CSV file not found: {csv_path}")

    with csv_path.open("r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        required_fields = {
            "observation_date",
            "published_date",
            "price_usd_per_bbl",
            "observation_kind",
            "source_title",
            "source_url",
        }
        missing = required_fields - set(fieldnames)
        if missing:
            raise ValueError(f"PPAC CSV missing mandatory headers: {missing}")

        rows = list(reader)

    existing_keys = set(
        db.execute(
            select(
                TimeSeriesObservationModel.reference_period,
                TimeSeriesObservationModel.geographic_scope,
                TimeSeriesObservationModel.sector,
            ).where(TimeSeriesObservationModel.series_id == "crude_oil_indian_basket")
        ).all()
    )

    created, skipped = 0, 0
    for row in rows:
        obs_date = row["observation_date"].strip()
        geo_scope = "All-India"
        sector = "Combined"
        key = (obs_date, geo_scope, sector)

        if key in existing_keys:
            skipped += 1
            continue

        raw_val = row["price_usd_per_bbl"].strip()
        if not raw_val:
            continue
        price_val = float(raw_val)
        if price_val <= 0:
            raise ValueError(f"Invalid non-positive PPAC price value: {raw_val}")

        obs = TimeSeriesObservationModel(
            series_id="crude_oil_indian_basket",
            reference_period=obs_date,
            observation_date=obs_date,
            geographic_scope=geo_scope,
            sector=sector,
            observation_value=price_val,
            unit="USD/barrel",
            release_status=row.get("observation_kind", "As-on published snapshot").strip(),
            source_title=row.get("source_title", "").strip() or None,
            source_url=row.get("source_url", "").strip() or None,
            publication_date=row.get("published_date", "").strip() or None,
            notes=row.get("notes", "").strip() or None,
        )
        db.add(obs)
        existing_keys.add(key)
        created += 1

    return {"total_rows": len(rows), "created": created, "skipped": skipped}


def ingest_all_time_series(
    db: Session,
    cpi_path: Optional[Path] = None,
    ppac_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """Execute full idempotent ingestion of time-series definitions and observations."""
    cpi_csv = cpi_path or DEFAULT_CPI_PATH
    ppac_csv = ppac_path or DEFAULT_PPAC_PATH

    results: Dict[str, Any] = {}
    try:
        results["definitions"] = ingest_time_series_definitions(db)
        results["cpi"] = ingest_cpi_observations_from_csv(cpi_csv, db)
        results["ppac"] = ingest_ppac_snapshots_from_csv(ppac_csv, db)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return results


def get_cpi_observations_from_db(
    db: Session,
    sector: Optional[str] = None,
) -> List[CPIObservation]:
    """Query MoSPI CPI monthly observations from PostgreSQL."""
    query = (
        select(TimeSeriesObservationModel)
        .where(TimeSeriesObservationModel.series_id == "cpi_2024_general")
        .order_by(
            TimeSeriesObservationModel.reference_period.asc(),
            TimeSeriesObservationModel.sector.asc(),
        )
    )

    if sector:
        query = query.where(
            TimeSeriesObservationModel.sector.ilike(sector.strip())
        )

    rows = db.execute(query).scalars().all()
    return [
        CPIObservation(
            period=row.reference_period,
            geography=row.geographic_scope,
            sector=row.sector,
            group="CPI General",
            index_value=row.observation_value,
            base_year="2024=100",
            status=row.release_status,
            source_title=row.source_title,
            source_url=row.source_url,
            publication_date=row.publication_date,
        )
        for row in rows
    ]


def get_ppac_snapshots_from_db(db: Session) -> List[PPACSnapshot]:
    """Query PPAC crude-oil sparse snapshots from PostgreSQL in chronological order."""
    query = (
        select(TimeSeriesObservationModel)
        .where(TimeSeriesObservationModel.series_id == "crude_oil_indian_basket")
        .order_by(TimeSeriesObservationModel.reference_period.asc())
    )

    rows = db.execute(query).scalars().all()
    return [
        PPACSnapshot(
            period=row.reference_period,
            price_usd_per_bbl=row.observation_value,
            status=row.release_status,
            source_title=row.source_title,
            source_url=row.source_url,
            publication_date=row.publication_date,
        )
        for row in rows
    ]
