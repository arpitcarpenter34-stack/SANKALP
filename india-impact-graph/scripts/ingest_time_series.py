#!/usr/bin/env python3
"""Idempotent Time-Series Ingestion Script for India Impact Graph.

Ingests MoSPI CPI and PPAC crude-oil historical series into PostgreSQL.
Preserves source provenance, exact dates, publication status, and missing-value semantics.
"""

import sys
from pathlib import Path
from typing import Dict, Any

# Ensure project root and backend package are discoverable
ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.services.time_series import ingest_all_time_series


def run_ingestion() -> Dict[str, Any]:
    """Execute repeatable, idempotent ingestion of historical time-series."""
    db = SessionLocal()
    try:
        results = ingest_all_time_series(db)
        return results
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting historical time-series ingestion...")
    summary = run_ingestion()
    print("Ingestion results:")
    for section, stats in summary.items():
        print(f"  {section}: {stats}")
