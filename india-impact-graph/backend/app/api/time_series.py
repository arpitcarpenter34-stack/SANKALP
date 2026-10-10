from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import csv
import os

router = APIRouter(prefix="/time-series", tags=["Time Series"])

# --- Models ---
class CPIObservation(BaseModel):
    period: str
    geography: str
    sector: str
    group: str
    index_value: float
    base_year: str
    status: str

class PPACSnapshot(BaseModel):
    period: str
    price_usd_per_bbl: float
    status: str

class CPISeriesResponse(BaseModel):
    series_name: str
    metadata: dict
    observations: List[CPIObservation]

class PPACSeriesResponse(BaseModel):
    series_name: str
    metadata: dict
    observations: List[PPACSnapshot]

# --- Data Loading ---
DATA_DIR = os.path.join(os.path.dirname(__file__), "../../../data/curated")
CPI_FILE = os.path.join(DATA_DIR, "cpi_2024_general_index_monthly_2026_01_to_08.csv")
PPAC_FILE = os.path.join(DATA_DIR, "ppac_indian_basket_public_archive_snapshots_2026_01_to_02.csv")

def load_cpi_data():
    if not os.path.exists(CPI_FILE):
        return []
    obs = []
    with open(CPI_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            obs.append(CPIObservation(
                period=row["reference_month"],
                geography="All India",
                sector=row["sector"],
                group=row["series_name"],
                index_value=float(row["index_value"]),
                base_year=row["index_base"],
                status=row.get("release_status", "final")
            ))
    # Sort chronologically
    return sorted(obs, key=lambda x: x.period)

def load_ppac_data():
    if not os.path.exists(PPAC_FILE):
        return []
    obs = []
    with open(PPAC_FILE, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            obs.append(PPACSnapshot(
                period=row["observation_date"],
                price_usd_per_bbl=float(row["price_usd_per_bbl"]),
                status=row.get("observation_kind", "sparse_snapshot")
            ))
    return sorted(obs, key=lambda x: x.period)

# --- Routes ---
@router.get("/cpi", response_model=CPISeriesResponse)
def get_cpi_series(sector: Optional[str] = None):
    """Retrieve CPI monthly series (2024 base). Exposes only curated data."""
    data = load_cpi_data()
    if not data:
        raise HTTPException(status_code=404, detail="CPI data not available")

    if sector:
        data = [d for d in data if d.sector.lower() == sector.lower()]

    if not data:
        raise HTTPException(status_code=404, detail="No observations found for given filters")

    return CPISeriesResponse(
        series_name="CPI 2024 General Index",
        metadata={
            "base_year": "2024=100",
            "source": "MoSPI",
            "notes": "Starter extract, not the full historical series"
        },
        observations=data
    )

@router.get("/crude-oil", response_model=PPACSeriesResponse)
def get_crude_oil_snapshots():
    """Retrieve sparse PPAC Indian Basket crude oil snapshots."""
    data = load_ppac_data()
    if not data:
        raise HTTPException(status_code=404, detail="PPAC data not available")

    return PPACSeriesResponse(
        series_name="PPAC Indian Basket Crude Oil",
        metadata={
            "unit": "USD/barrel",
            "source": "PPAC Archives",
            "frequency": "Sparse (not a complete continuous daily series)",
            "limitations": "Do not interpolate or compute monthly averages from this sample"
        },
        observations=data
    )
