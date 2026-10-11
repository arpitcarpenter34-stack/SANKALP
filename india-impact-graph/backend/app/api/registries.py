"""Registry Read Endpoints for India Impact Graph.

Exposes verified Data Source Register, Pass-Through Register, Consumption Items Catalog,
and Cached Articles Catalog over HTTP for frontend integration and auditability.
"""

from pathlib import Path
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.consumption import VerificationStatus
from app.schemas.source import DataSourceResponse, SourceAccessCondition
from app.schemas.pass_through import PassThroughRecordResponse
from app.schemas.consumption import ConsumptionItemResponse
from app.schemas.article import CachedArticleResponse
from app.schemas.source_sync import DataSourceStatusListResponse
from app.services.source import get_all_data_sources
from app.services.live_refresh import get_data_sources_status
from app.services.pass_through import get_all_pass_through_records
from app.services.consumption import get_all_consumption_items, validate_consumption_csv
from app.services.article import get_all_cached_articles, validate_cached_articles_csv

router = APIRouter(prefix="/api", tags=["registries"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
CONSUMPTION_FILE = DATA_DIR / "curated" / "consumption_items.csv"
ARTICLES_FILE = DATA_DIR / "templates" / "cached-articles-catalog.csv"


# ---------------------------------------------------------------------------
# Data Source Register
# ---------------------------------------------------------------------------

@router.get("/sources", response_model=List[DataSourceResponse], summary="List data sources")
@router.get("/sources/", response_model=List[DataSourceResponse], include_in_schema=False)
def list_data_sources(db: Session = Depends(get_db)):
    """Retrieve all verified primary data sources from database or manifest fallback."""
    try:
        sources = get_all_data_sources(db)
        if sources:
            return [DataSourceResponse.model_validate(s) for s in sources]
    except Exception:
        pass

    # Curated authoritative data sources from manifest
    return [
        DataSourceResponse(
            source_id="SRC-01",
            source_title="PPAC Indian Basket Crude Oil Price Reports",
            publisher="PPAC",
            series_or_table_id="Important News Archive - Indian Basket Snapshot",
            base_year=None,
            frequency="Sparse published snapshots",
            geographic_coverage="All-India / Global",
            source_url="https://ppac.gov.in/archives/impnews",
            verification_status=VerificationStatus.VERIFIED,
            access_condition=SourceAccessCondition.PUBLIC_OPEN,
            notes="Published points are sparse; do not interpolate or average.",
        ),
        DataSourceResponse(
            source_id="SRC-02",
            source_title="Press releases on CPI base 2024=100",
            publisher="MoSPI",
            series_or_table_id="All India CPI General Index",
            base_year="2024=100",
            frequency="Monthly",
            geographic_coverage="All-India",
            source_url="https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI",
            verification_status=VerificationStatus.VERIFIED,
            access_condition=SourceAccessCondition.PUBLIC_OPEN,
            notes="Eight-month starter extract (Jan-Aug 2026).",
        ),
        DataSourceResponse(
            source_id="SRC-03",
            source_title="HCES 2023-24 Factsheet",
            publisher="MoSPI",
            series_or_table_id="Statement 7 (MPCE by State/Sector)",
            base_year="2023-24",
            frequency="Survey period",
            geographic_coverage="All-India & States",
            source_url="https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf",
            verification_status=VerificationStatus.VERIFIED,
            access_condition=SourceAccessCondition.PUBLIC_OPEN,
            notes="MPCE is per-capita; not household total.",
        ),
        DataSourceResponse(
            source_id="SRC-04",
            source_title="CPI 2024 FAQ & Linking Factors",
            publisher="MoSPI",
            series_or_table_id="Annexure V Linking Factors",
            base_year="2024=100",
            frequency="Methodology document",
            geographic_coverage="All-India",
            source_url="https://mospi.gov.in/uploads/documents/documents/1770891066052-Annexure_V.pdf",
            verification_status=VerificationStatus.VERIFIED,
            access_condition=SourceAccessCondition.PUBLIC_OPEN,
            notes="General linking factors must not be applied to sub-indices.",
        ),
    ]


@router.get(
    "/data-sources/status",
    response_model=DataSourceStatusListResponse,
    summary="Get data source sync and freshness status",
)
@router.get(
    "/sources/status",
    response_model=DataSourceStatusListResponse,
    summary="Get data source sync and freshness status (alias)",
)
def get_data_sources_sync_status(db: Session = Depends(get_db)):
    """Retrieve detailed synchronization, freshness SLA, and error status for all tracked sources."""
    return get_data_sources_status(db)


# ---------------------------------------------------------------------------
# Pass-Through Register
# ---------------------------------------------------------------------------

@router.get("/pass-through", response_model=List[PassThroughRecordResponse], summary="List pass-through elasticities")
@router.get("/pass-through/", response_model=List[PassThroughRecordResponse], include_in_schema=False)
def list_pass_through_records(db: Session = Depends(get_db)):
    """Retrieve verified pass-through relationships from database or fallback catalog."""
    try:
        records = get_all_pass_through_records(db)
        if records:
            return [PassThroughRecordResponse.model_validate(r) for r in records]
    except Exception:
        pass

    # Curated default verified pass-through records per HOUSEHOLD_IMPACT_CALCULATOR_SPEC
    return [
        PassThroughRecordResponse(
            upstream_commodity="crude_oil",
            downstream_item="petrol",
            pass_through_factor_low=0.30,
            pass_through_factor_high=0.45,
            unit="elasticity_coefficient",
            time_lag_months="1",
            historical_basis_source="PPAC Retail Selling Price Build-up & RBI Working Paper",
            verification_status=VerificationStatus.VERIFIED,
            caveats="Central Excise duty adjustments buffer pump price transmission.",
        ),
        PassThroughRecordResponse(
            upstream_commodity="crude_oil",
            downstream_item="diesel",
            pass_through_factor_low=0.35,
            pass_through_factor_high=0.50,
            unit="elasticity_coefficient",
            time_lag_months="1",
            historical_basis_source="PPAC Retail Selling Price Build-up",
            verification_status=VerificationStatus.VERIFIED,
            caveats="Operational freight input; buffers pump price transmission.",
        ),
        PassThroughRecordResponse(
            upstream_commodity="diesel",
            downstream_item="vegetables",
            pass_through_factor_low=0.05,
            pass_through_factor_high=0.15,
            unit="elasticity_coefficient",
            time_lag_months="1",
            historical_basis_source="MoSPI HCES Table 3 / Mandi Wholesale-to-Retail",
            verification_status=VerificationStatus.VERIFIED,
            caveats="Freight accounts for 6-15% of mandi vegetable retail costs.",
        ),
    ]


# ---------------------------------------------------------------------------
# Consumption Items Registry
# ---------------------------------------------------------------------------

@router.get("/consumption-items", response_model=List[ConsumptionItemResponse], summary="List household consumption items")
@router.get("/consumption-items/", response_model=List[ConsumptionItemResponse], include_in_schema=False)
def list_consumption_items(db: Session = Depends(get_db)):
    """Retrieve curated household consumption items catalog."""
    try:
        items = get_all_consumption_items(db)
        if items:
            return [ConsumptionItemResponse.model_validate(i) for i in items]
    except Exception:
        pass

    # Standalone fallback from curated CSV
    if CONSUMPTION_FILE.is_file():
        csv_items = validate_consumption_csv(CONSUMPTION_FILE)
        return [ConsumptionItemResponse.model_validate(i.model_dump()) for i in csv_items]
    return []


# ---------------------------------------------------------------------------
# Cached Articles Catalog
# ---------------------------------------------------------------------------

@router.get("/cached-articles", response_model=List[CachedArticleResponse], summary="List cached news articles")
@router.get("/cached-articles/", response_model=List[CachedArticleResponse], include_in_schema=False)
def list_cached_articles(db: Session = Depends(get_db)):
    """Retrieve cached news articles catalog with provenance."""
    try:
        articles = get_all_cached_articles(db)
        if articles:
            return [CachedArticleResponse.model_validate(a) for a in articles]
    except Exception:
        pass

    # Standalone fallback from catalog CSV
    if ARTICLES_FILE.is_file():
        csv_articles = validate_cached_articles_csv(ARTICLES_FILE)
        return [CachedArticleResponse.model_validate(a.model_dump()) for a in csv_articles]
    return []
