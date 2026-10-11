#!/usr/bin/env python3
"""Idempotent Registry Seeding Script for India Impact Graph.

Seeds verified data sources, consumption items, and pass-through elasticity records
into PostgreSQL conforming strictly to `docs/DATA_SOURCE_REGISTER.md` and `docs/DATA_AND_EVIDENCE_RULES.md`.
"""

import sys
from pathlib import Path
from typing import Dict, List, Any

# Ensure project root and backend package are discoverable
ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select
from app.database import SessionLocal
from app.models.source import DataSourceModel
from app.models.consumption import ConsumptionItemModel
from app.models.pass_through import PassThroughRecordModel
from app.services.consumption import load_consumption_items_from_csv


VERIFIED_DATA_SOURCES: List[Dict[str, Any]] = [
    {
        "source_id": "SRC-01",
        "source_title": "PPAC Indian Basket Crude Oil Price Reports",
        "publisher": "PPAC",
        "series_or_table_id": "Important News Archive - Indian Basket Snapshot",
        "base_year": None,
        "frequency": "Sparse published snapshots",
        "geographic_coverage": "All-India / Global",
        "source_url": "https://ppac.gov.in/archives/impnews",
        "verification_status": "[VERIFIED]",
        "access_condition": "public_open",
        "notes": "Published points are sparse; do not interpolate or average.",
    },
    {
        "source_id": "SRC-02",
        "source_title": "Press releases on CPI base 2024=100",
        "publisher": "MoSPI",
        "series_or_table_id": "All India CPI General Index",
        "base_year": "2024=100",
        "frequency": "Monthly",
        "geographic_coverage": "All-India",
        "source_url": "https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI",
        "verification_status": "[VERIFIED]",
        "access_condition": "public_open",
        "notes": "Eight-month starter extract (Jan-Aug 2026).",
    },
    {
        "source_id": "SRC-03",
        "source_title": "HCES 2023-24 Factsheet",
        "publisher": "MoSPI",
        "series_or_table_id": "Statement 7 (MPCE by State/Sector)",
        "base_year": "2023-24",
        "frequency": "Survey period",
        "geographic_coverage": "All-India & States",
        "source_url": "https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf",
        "verification_status": "[VERIFIED]",
        "access_condition": "public_open",
        "notes": "MPCE is per-capita; not household total.",
    },
    {
        "source_id": "SRC-04",
        "source_title": "CPI 2024 FAQ & Linking Factors",
        "publisher": "MoSPI",
        "series_or_table_id": "Annexure V Linking Factors",
        "base_year": "2024=100",
        "frequency": "Methodology document",
        "geographic_coverage": "All-India",
        "source_url": "https://mospi.gov.in/uploads/documents/documents/1770891066052-Annexure_V.pdf",
        "verification_status": "[VERIFIED]",
        "access_condition": "public_open",
        "notes": "General linking factors must not be applied to sub-indices.",
    },
]

VERIFIED_PASS_THROUGH_RECORDS: List[Dict[str, Any]] = [
    {
        "upstream_commodity": "crude_oil",
        "downstream_item": "petrol",
        "pass_through_factor_low": 0.30,
        "pass_through_factor_high": 0.45,
        "unit": "elasticity_coefficient",
        "time_lag_months": "1",
        "historical_basis_source": "PPAC Retail Selling Price Build-up & RBI Working Paper",
        "verification_status": "[VERIFIED]",
        "caveats": "Central Excise duty adjustments buffer pump price transmission.",
    },
    {
        "upstream_commodity": "crude_oil",
        "downstream_item": "diesel",
        "pass_through_factor_low": 0.35,
        "pass_through_factor_high": 0.50,
        "unit": "elasticity_coefficient",
        "time_lag_months": "1",
        "historical_basis_source": "PPAC Retail Selling Price Build-up",
        "verification_status": "[VERIFIED]",
        "caveats": "Operational freight input; buffers pump price transmission.",
    },
    {
        "upstream_commodity": "diesel",
        "downstream_item": "vegetables",
        "pass_through_factor_low": 0.05,
        "pass_through_factor_high": 0.15,
        "unit": "elasticity_coefficient",
        "time_lag_months": "1",
        "historical_basis_source": "MoSPI HCES Table 3 / Mandi Wholesale-to-Retail",
        "verification_status": "[VERIFIED]",
        "caveats": "Freight accounts for 6-15% of mandi vegetable retail costs.",
    },
]


def seed_registries() -> Dict[str, Any]:
    """Execute idempotent seeding of verified registries into PostgreSQL."""
    db = SessionLocal()
    results: Dict[str, Any] = {}
    try:
        # 1. Consumption Items (from curated CSV)
        consumption_csv = ROOT_DIR / "data" / "curated" / "consumption_items.csv"
        if consumption_csv.is_file():
            results["consumption_items"] = load_consumption_items_from_csv(consumption_csv, db)
        else:
            results["consumption_items"] = {"total": 0, "created": 0, "skipped": 0, "error": "file_not_found"}

        # 2. Data Sources
        existing_source_ids = set(db.execute(select(DataSourceModel.source_id)).scalars().all())
        src_created, src_skipped = 0, 0
        for src in VERIFIED_DATA_SOURCES:
            if src["source_id"] in existing_source_ids:
                src_skipped += 1
            else:
                db.add(DataSourceModel(**src))
                src_created += 1
        results["data_sources"] = {
            "total": len(VERIFIED_DATA_SOURCES),
            "created": src_created,
            "skipped": src_skipped,
        }

        # 3. Pass-Through Records
        existing_pt_pairs = set(
            db.execute(
                select(
                    PassThroughRecordModel.upstream_commodity,
                    PassThroughRecordModel.downstream_item,
                )
            ).all()
        )
        pt_created, pt_skipped = 0, 0
        for pt in VERIFIED_PASS_THROUGH_RECORDS:
            pair = (pt["upstream_commodity"], pt["downstream_item"])
            if pair in existing_pt_pairs:
                pt_skipped += 1
            else:
                db.add(PassThroughRecordModel(**pt))
                pt_created += 1
        results["pass_through_records"] = {
            "total": len(VERIFIED_PASS_THROUGH_RECORDS),
            "created": pt_created,
            "skipped": pt_skipped,
        }

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return results


if __name__ == "__main__":
    summary = seed_registries()
    print("Seed execution summary:")
    for table, stats in summary.items():
        print(f"  {table}: {stats}")
