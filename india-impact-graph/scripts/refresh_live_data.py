#!/usr/bin/env python3
"""CLI Entry Point for India Impact Graph Official Data Refresh.

Executes official data source checks, idempotent observation ingestion,
and sync status recording. Supports automated runs and manual file imports.

Usage:
    python scripts/refresh_live_data.py
    python scripts/refresh_live_data.py --source SRC-01
    python scripts/refresh_live_data.py --source SRC-02 --manual-file path/to/cpi_update.csv
    python scripts/refresh_live_data.py --status-only
"""

import argparse
from pathlib import Path
import sys

# Ensure backend package is discoverable
ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.services.live_refresh import (
    execute_all_source_refreshes,
    get_data_sources_status,
    refresh_mospi_cpi_source,
    refresh_ppac_crude_source,
)


def main():
    parser = argparse.ArgumentParser(
        description="India Impact Graph - Official Data Refresh CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "--source",
        choices=["SRC-01", "SRC-02", "ALL"],
        default="ALL",
        help="Specify which official source to refresh (SRC-01: PPAC, SRC-02: MoSPI, ALL: Both)",
    )
    parser.add_argument(
        "--manual-file",
        type=Path,
        default=None,
        help="Path to an official manual-import CSV file if official portal requires manual ingestion",
    )
    parser.add_argument(
        "--status-only",
        action="store_true",
        help="Display current tracking and freshness status without initiating a new network check",
    )

    args = parser.parse_args()

    db = SessionLocal()
    try:
        if args.status_only:
            status_report = get_data_sources_status(db)
            print(f"\n=======================================================")
            print(f" Data Source Synchronization & Freshness Status")
            print(f" System Time: {status_report.system_timestamp.isoformat()}")
            print(f" Total Sources: {status_report.total_sources} | Active: {status_report.active_sources}")
            print(f"=======================================================\n")
            for src in status_report.sources:
                print(f"[{src.source_id}] {src.source_name}")
                print(f"  Status:             {src.status.upper()}")
                print(f"  Last Check:         {src.last_check_time or 'Never'}")
                print(f"  Last Success:       {src.last_success_time or 'Never'}")
                print(f"  Latest Obs Period:  {src.last_observation_period or 'None'}")
                print(f"  Cadence:            {src.freshness.cadence}")
                print(f"  Freshness SLA:      {'FRESH' if src.freshness.is_fresh else 'STALE'} ({src.freshness.freshness_note})")
                if src.error_summary:
                    print(f"  Error Summary:      {src.error_summary}")
                print("")
            return

        print("\nStarting Official Data Source Refresh...")
        if args.source == "SRC-01":
            print("Checking SRC-01 (PPAC Indian Basket Crude Oil)...")
            res = refresh_ppac_crude_source(db, manual_file_path=args.manual_file)
            print(f"Result: {res.status.upper()} | Inserted: {res.records_inserted} | Updated: {res.records_updated}")
            if res.message:
                print(f"Note:   {res.message}")
            if res.error_message:
                print(f"Error:  {res.error_message}")
        elif args.source == "SRC-02":
            print("Checking SRC-02 (MoSPI CPI Base 2024=100)...")
            res = refresh_mospi_cpi_source(db, manual_file_path=args.manual_file)
            print(f"Result: {res.status.upper()} | Inserted: {res.records_inserted} | Updated: {res.records_updated}")
            if res.message:
                print(f"Note:   {res.message}")
            if res.error_message:
                print(f"Error:  {res.error_message}")
        else:
            print("Executing refresh for all configured sources (SRC-01 & SRC-02)...")
            results = execute_all_source_refreshes(db)
            for s_id, res in results.items():
                print(f"\n[{s_id}] Status: {res.status.upper()}")
                print(f"  Inserted: {res.records_inserted} | Updated: {res.records_updated}")
                if res.message:
                    print(f"  Message:  {res.message}")
                if res.error_message:
                    print(f"  Error:    {res.error_message}")

        print("\nRefresh execution completed.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
