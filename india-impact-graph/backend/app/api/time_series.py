"""Historical Time-Series API router.

Serves PostgreSQL-backed historical observations for MoSPI CPI and PPAC crude-oil series,
preserving source provenance, publication status, and observation dates with CSV fallback.
"""

import csv
import logging
import os
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.time_series import (
    CPIObservation,
    CPISeriesResponse,
    PPACSeriesResponse,
    PPACSnapshot,
)
from app.services.time_series import (
    get_cpi_observations_from_db,
    get_ppac_snapshots_from_db,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/time-series", tags=["Time Series"])

# --- CSV Fallback Configuration ---
DATA_DIR = os.path.join(os.path.dirname(__file__), "../../../data/curated")
CPI_FILE = os.path.join(DATA_DIR, "cpi_2024_general_index_monthly_2026_01_to_08.csv")
PPAC_FILE = os.path.join(DATA_DIR, "ppac_indian_basket_public_archive_snapshots_2026_01_to_02.csv")


def load_cpi_data() -> List[CPIObservation]:
    """Fallback loader for CPI data from local curated CSV."""
    if not os.path.exists(CPI_FILE):
        return []
    obs = []
    with open(CPI_FILE, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            obs.append(
                CPIObservation(
                    period=row["reference_month"].strip(),
                    geography="All-India",
                    sector=row["sector"].strip(),
                    group=row.get("series_name", "CPI General").strip(),
                    index_value=float(row["index_value"].strip()),
                    base_year=row.get("index_base", "2024=100").strip(),
                    status=row.get("release_status", "Final").strip(),
                    source_title=row.get("source_title", "").strip() or None,
                    source_url=row.get("source_url", "").strip() or None,
                    publication_date=row.get("source_release_date", "").strip() or None,
                )
            )
    return sorted(obs, key=lambda x: (x.period, x.sector))


def load_ppac_data() -> List[PPACSnapshot]:
    """Fallback loader for PPAC data from local curated CSV."""
    if not os.path.exists(PPAC_FILE):
        return []
    obs = []
    with open(PPAC_FILE, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            obs.append(
                PPACSnapshot(
                    period=row["observation_date"].strip(),
                    price_usd_per_bbl=float(row["price_usd_per_bbl"].strip()),
                    status=row.get("observation_kind", "As-on published snapshot").strip(),
                    source_title=row.get("source_title", "").strip() or None,
                    source_url=row.get("source_url", "").strip() or None,
                    publication_date=row.get("published_date", "").strip() or None,
                )
            )
    return sorted(obs, key=lambda x: x.period)


# --- Routes ---
@router.get("/cpi", response_model=CPISeriesResponse)
def get_cpi_series(
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve CPI monthly series (2024 base).

    Queries PostgreSQL historical time-series storage, falling back to curated CSV if DB is empty or unavailable.
    """
    data: List[CPIObservation] = []
    data_source = "postgresql"

    try:
        data = get_cpi_observations_from_db(db, sector=sector)
    except Exception as exc:
        logger.warning("Database query failed for CPI series; falling back to CSV: %s", exc)
        data = []

    if not data:
        data = load_cpi_data()
        data_source = "csv_fallback"
        if sector and data:
            data = [d for d in data if d.sector.lower() == sector.lower()]

    if not data:
        raise HTTPException(status_code=404, detail="No observations found for given filters")

    return CPISeriesResponse(
        series_name="CPI 2024 General Index",
        metadata={
            "base_year": "2024=100",
            "source": "MoSPI",
            "notes": "Starter extract, not the full historical series",
            "data_source": data_source,
            "frequency": "Monthly",
            "geographic_scope": "All-India",
        },
        observations=data,
    )


@router.get("/crude-oil", response_model=PPACSeriesResponse)
def get_crude_oil_snapshots(
    db: Session = Depends(get_db),
):
    """Retrieve sparse PPAC Indian Basket crude oil snapshots.

    Queries PostgreSQL historical time-series storage, falling back to curated CSV if DB is empty or unavailable.
    """
    data: List[PPACSnapshot] = []
    data_source = "postgresql"

    try:
        data = get_ppac_snapshots_from_db(db)
    except Exception as exc:
        logger.warning("Database query failed for PPAC snapshots; falling back to CSV: %s", exc)
        data = []

    if not data:
        data = load_ppac_data()
        data_source = "csv_fallback"

    if not data:
        raise HTTPException(status_code=404, detail="PPAC data not available")

    return PPACSeriesResponse(
        series_name="PPAC Indian Basket Crude Oil",
        metadata={
            "unit": "USD/barrel",
            "source": "PPAC Archives",
            "frequency": "Sparse (not a complete continuous daily series)",
            "limitations": "Do not interpolate or compute monthly averages from this sample",
            "data_source": data_source,
        },
        observations=data,
    )


@router.get("/metrics", summary="List available time-series metrics")
def list_time_series_metrics():
    """List available time-series metrics with dataset limitations."""
    return {
        "metrics": [
            {
                "id": "cpi_2024_general",
                "name": "CPI 2024 General Index",
                "endpoint": "/time-series/cpi",
                "base_year": "2024=100",
                "frequency": "Monthly",
                "source": "MoSPI NSO",
                "data_source": "postgresql",
            },
            {
                "id": "crude_oil_indian_basket",
                "name": "PPAC Indian Basket Crude Oil",
                "endpoint": "/time-series/crude-oil",
                "unit": "USD/barrel",
                "frequency": "Sparse published snapshots",
                "source": "PPAC Archives",
                "data_source": "postgresql",
            },
        ]
    }


@router.get("/correlation", summary="Get correlation and co-movement analysis")
def get_time_series_correlation(
    series_a: str = Query(default="crude_oil_indian_basket"),
    series_b: str = Query(default="cpi_2024_general"),
):
    """Retrieve co-movement analysis with mandatory causation disclaimer."""
    return {
        "series_a": series_a,
        "series_b": series_b,
        "note": "Co-movement analysis between international energy and domestic indices.",
        "disclaimer": (
            "Caution: Parallel time-series trends show co-movement, not direct causality. "
            "Agricultural prices are heavily influenced by monsoon rainfall, crop disease, "
            "and seasonal cycles alongside transport fuel costs."
        ),
        "data_availability": {
            "cpi_months": 8,
            "crude_snapshots": 31,
            "status": "STARTER_EXTRACT_ONLY",
        },
    }
