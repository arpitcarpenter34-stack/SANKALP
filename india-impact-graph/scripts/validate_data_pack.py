#!/usr/bin/env python3
"""Validate the official-source starter CSVs without third-party dependencies."""
import csv
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CPI = ROOT / "data/curated/cpi_2024_general_index_monthly_2026_01_to_08.csv"
PPAC = ROOT / "data/curated/ppac_indian_basket_public_archive_snapshots_2026_01_to_02.csv"


def read_csv(path):
    with path.open("r", newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise AssertionError(f"Missing CSV headers: {path}")
        return reader.fieldnames, list(reader)


def iso_date(value, label):
    try:
        return date.fromisoformat(value)
    except Exception as exc:
        raise AssertionError(f"Invalid {label}: {value!r}") from exc


def validate_cpi():
    fields, rows = read_csv(CPI)
    required = {"reference_month", "sector", "index_value", "index_base", "release_status", "source_url", "source_release_date"}
    assert required.issubset(fields), f"CPI missing columns: {required - set(fields)}"
    assert len(rows) == 24, f"Expected 24 CPI rows for 8 months x 3 sectors, got {len(rows)}"
    seen = set()
    for row in rows:
        assert row["sector"] in {"Rural", "Urban", "Combined"}
        assert row["index_base"] == "2024=100"
        assert row["release_status"] in {"Final", "Provisional"}
        assert float(row["index_value"]) > 0
        assert row["source_url"].startswith("https://")
        iso_date(row["source_release_date"], "CPI source release date")
        key = (row["reference_month"], row["sector"])
        assert key not in seen, f"Duplicate CPI observation: {key}"
        seen.add(key)
    months = sorted({row["reference_month"] for row in rows})
    assert months == ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]
    for month in months:
        assert {r["sector"] for r in rows if r["reference_month"] == month} == {"Rural", "Urban", "Combined"}
    return len(rows), len(months)


def validate_ppac():
    fields, rows = read_csv(PPAC)
    required = {"observation_date", "published_date", "price_usd_per_bbl", "source_url", "observation_kind"}
    assert required.issubset(fields), f"PPAC missing columns: {required - set(fields)}"
    assert len(rows) == 31, f"Expected 31 explicitly transcribed archive snapshots, got {len(rows)}"
    seen = set()
    dates = []
    for row in rows:
        obs = iso_date(row["observation_date"], "PPAC observation date")
        pub = iso_date(row["published_date"], "PPAC publication date")
        assert pub >= obs, f"Publication date precedes observation date: {row}"
        assert float(row["price_usd_per_bbl"]) > 0
        assert row["source_url"] == "https://ppac.gov.in/archives/impnews"
        key = row["observation_date"]
        assert key not in seen, f"Duplicate PPAC observation date: {key}"
        seen.add(key)
        dates.append(obs)
    assert dates == sorted(dates), "PPAC observations are not sorted"
    # Explicitly ensure that this sparse dataset has not been falsely expanded to all calendar days.
    assert len({d for d in dates}) < (dates[-1] - dates[0]).days + 1
    return len(rows), dates[0].isoformat(), dates[-1].isoformat()


def main():
    cpi_count, month_count = validate_cpi()
    ppac_count, ppac_start, ppac_end = validate_ppac()
    manifest_fields, manifest_rows = read_csv(ROOT / "data/source_manifest.csv")
    assert len(manifest_rows) >= 3 and "source_url" in manifest_fields
    print(f"PASS: CPI {cpi_count} rows across {month_count} months validated (Jan-Aug 2026; mixed final/provisional status preserved).")
    print(f"PASS: PPAC {ppac_count} sparse public-archive snapshots validated ({ppac_start} to {ppac_end}); no missing dates filled.")
    print(f"PASS: source manifest {len(manifest_rows)} datasets/series documented.")
    print("LIMITATION: this is a starter extract, not a complete CPI 2026 time series or a full PPAC daily dataset.")


if __name__ == "__main__":
    main()
