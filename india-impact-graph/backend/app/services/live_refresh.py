"""Live Data Refresh and Monitoring Service for India Impact Graph.

Coordinates automated checks and manual ingestion for official macroeconomic data:
- MoSPI CPI Base 2024=100 General Index (SRC-02)
- PPAC Indian Basket Crude Oil Price Archive Snapshots (SRC-01)

Features:
- Normalized schema ingestion and duplicate prevention
- Source-specific freshness policies (monthly vs sparse snapshots)
- Safe error handling without secrets or credential leaks
- Full execution audit trail in data_source_refresh_runs
- Support for manual-file import paths when official portals change or require local files
"""

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
import re
import time
from typing import Any, Dict, List, Optional, Tuple
import urllib.error
import urllib.request

from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models.source import DataSourceModel
from app.models.source_sync import (
    DataSourceRefreshRunModel,
    DataSourceSyncStatusModel,
)
from app.models.time_series import (
    TimeSeriesDefinitionModel,
    TimeSeriesObservationModel,
)
from app.schemas.source_sync import (
    DataSourceStatusListResponse,
    FreshnessPolicyInfo,
    RefreshExecutionSummary,
    SourceProvenanceInfo,
    SourceSyncStatusResponse,
)

logger = logging.getLogger(__name__)

# Pattern to sanitize any sensitive keys, tokens, passwords from error messages
SECRET_PATTERN = re.compile(r"(api[_-]?key|password|token|secret|auth)[=:\s]+[^\s,;&]+", re.IGNORECASE)


def sanitize_message(msg: Optional[str]) -> Optional[str]:
    """Remove potential passwords, tokens, or credential fragments from error strings."""
    if not msg:
        return None
    return SECRET_PATTERN.sub(r"\1=[REDACTED]", msg)


def safe_fetch_url(
    url: str,
    timeout: int = 10,
    max_bytes: int = 5_000_000,
    max_retries: int = 2,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """Perform a safe, bounded HTTP GET request with retries and size caps.

    Returns:
        (success: bool, content: Optional[str], error_message: Optional[str])
    """
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "IndiaImpactGraph-LiveMonitor/1.0 (+https://github.com/arpitcarpenter34-stack/SANKALP)"},
    )

    last_error: Optional[str] = None
    for attempt in range(max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                payload = response.read(max_bytes + 1)
                if len(payload) > max_bytes:
                    return False, None, f"Response exceeded maximum allowed size of {max_bytes} bytes."
                content = payload.decode("utf-8", errors="replace")
                return True, content, None
        except urllib.error.HTTPError as e:
            last_error = f"HTTP {e.code}: {e.reason}"
            if e.code in (401, 403, 404):
                # Non-retryable client errors
                break
        except urllib.error.URLError as e:
            last_error = f"Network connection error: {e.reason}"
        except Exception as e:
            last_error = f"Unexpected request failure: {type(e).__name__}"

        if attempt < max_retries:
            time.sleep(0.5 * (attempt + 1))

    return False, None, sanitize_message(last_error or "Unknown fetch failure")


def get_or_create_sync_status(
    db: Session,
    source_id: str,
    series_id: str,
    refresh_policy: str,
    freshness_threshold_days: int,
) -> DataSourceSyncStatusModel:
    """Retrieve existing sync status row or initialize a new one without committing.

    Transaction ownership is retained by the caller. Uses a savepoint (begin_nested)
    so concurrent inserts can be caught and recovered without aborting the outer transaction.
    """
    row = db.get(DataSourceSyncStatusModel, source_id)
    if row is not None:
        return row

    latest_obs = db.execute(
        select(TimeSeriesObservationModel.reference_period)
        .where(TimeSeriesObservationModel.series_id == series_id)
        .order_by(desc(TimeSeriesObservationModel.reference_period))
    ).scalars().first()

    row = DataSourceSyncStatusModel(
        source_id=source_id,
        series_id=series_id,
        is_enabled=True,
        last_observation_period=latest_obs,
        refresh_policy=refresh_policy,
        freshness_threshold_days=freshness_threshold_days,
        status="idle",
    )

    try:
        with db.begin_nested():
            db.add(row)
            db.flush()
    except IntegrityError:
        # Concurrent insert occurred: savepoint rolled back, re-query existing row
        existing = db.get(DataSourceSyncStatusModel, source_id)
        if existing is not None:
            return existing
        raise

    return row


def ensure_sync_status_records(db: Session) -> None:
    """Ensure baseline sync status rows exist in data_source_sync_status for SRC-01 and SRC-02 and commit them."""
    get_or_create_sync_status(
        db,
        source_id="SRC-01",
        series_id="crude_oil_indian_basket",
        refresh_policy="sparse_snapshot",
        freshness_threshold_days=settings.PPAC_FRESHNESS_DAYS,
    )
    get_or_create_sync_status(
        db,
        source_id="SRC-02",
        series_id="cpi_2024_general",
        refresh_policy="monthly",
        freshness_threshold_days=settings.CPI_FRESHNESS_DAYS,
    )
    db.commit()


def parse_ppac_archive_html(content: str) -> List[Dict[str, Any]]:
    """Parse official PPAC Important News archive HTML content into observation dicts.

    Extracts genuine published Indian Basket crude oil prices and as-on dates
    from archive headlines. Strictly preserves sparse published snapshots without
    interpolating missing dates or inventing prices.
    """
    if not content or not content.strip():
        return []

    # Regex targeting Indian Basket headline price with currency/unit
    price_unit_re = re.compile(
        r"(?:(?:US\$|\$|USD)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:per\s+bbl|per\s+barrel|/bbl|/barrel)?|"
        r"(\d{2,3}(?:\.\d{1,2})?)\s*(?:USD/barrel|USD/bbl|\$/bbl|\$/barrel|per\s+bbl|per\s+barrel))",
        re.IGNORECASE,
    )
    date_re = re.compile(
        r"(?:on|as\s+on)\s+(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})",
        re.IGNORECASE,
    )

    # Extract all text fragments between HTML tags
    text_snippets = re.findall(r">([^<]+)<", content)
    if not text_snippets:
        # Fallback to lines if plain text is provided
        text_snippets = content.splitlines()

    extracted: List[Dict[str, Any]] = []
    seen_dates = set()

    for snippet in text_snippets:
        clean_s = snippet.strip()
        if "indian basket" in clean_s.lower():
            pm = price_unit_re.search(clean_s)
            dm = date_re.search(clean_s)
            if pm and dm:
                raw_price = pm.group(1) or pm.group(2)
                try:
                    price = float(raw_price)
                    if price <= 0 or price > 500.0:
                        continue
                except ValueError:
                    continue

                raw_dt = dm.group(1).strip()
                try:
                    if "-" in raw_dt and len(raw_dt.split("-")[0]) == 4:
                        iso_date = raw_dt
                    else:
                        sep = "." if "." in raw_dt else ("/" if "/" in raw_dt else "-")
                        parts = raw_dt.split(sep)
                        if len(parts) == 3:
                            day = int(parts[0])
                            month = int(parts[1])
                            year = int(parts[2])
                            iso_date = f"{year:04d}-{month:02d}-{day:02d}"
                        else:
                            continue
                except Exception:
                    continue

                if iso_date not in seen_dates:
                    seen_dates.add(iso_date)
                    extracted.append(
                        {
                            "observation_date": iso_date,
                            "price_usd_per_bbl": price,
                            "observation_kind": "As-on published snapshot",
                            "source_title": f"PPAC Archive: {clean_s}",
                            "source_url": settings.PPAC_CRUDE_URL,
                            "notes": f"Extracted from official PPAC archive headline: {clean_s}",
                        }
                    )

    return extracted


def parse_mospi_cpi_content(content: str) -> List[Dict[str, Any]]:
    """Parse official MoSPI CPI catalog response (JSON API payload or HTML publication table).

    Extracts General Index observations on Base 2024=100 across Rural, Urban, and Combined.
    Rejects malformed index values, missing sectors, or incompatible base years.
    """
    if not content or not content.strip():
        return []

    trimmed = content.strip()

    # 1. Structured JSON format check (REST catalog endpoint or payload)
    if trimmed.startswith("{") or trimmed.startswith("["):
        try:
            data = json.loads(trimmed)
            items: List[Dict[str, Any]] = []
            if isinstance(data, list):
                raw_list = data
            elif isinstance(data, dict):
                raw_list = data.get("releases") or data.get("data") or data.get("observations") or []
            else:
                raw_list = []

            for item in raw_list:
                if isinstance(item, dict):
                    rm = item.get("reference_month") or item.get("month") or item.get("period")
                    sec = item.get("sector")
                    val = item.get("index_value") or item.get("value") or item.get("index")
                    if rm and sec and val is not None:
                        ref_month_str = str(rm).strip()
                        sector_str = str(sec).strip().capitalize()
                        if not re.match(r"^\d{4}-\d{2}$", ref_month_str):
                            continue
                        if sector_str not in ("Rural", "Urban", "Combined"):
                            continue
                        try:
                            index_float = float(val)
                            if index_float <= 0:
                                continue
                        except ValueError:
                            continue

                        status_raw = str(item.get("status") or item.get("release_status") or "Final").strip().capitalize()
                        status_str = "Provisional" if "prov" in status_raw.lower() else "Final"
                        items.append(
                            {
                                "reference_month": ref_month_str,
                                "sector": sector_str,
                                "index_value": index_float,
                                "release_status": status_str,
                                "source_title": item.get("source_title", "MoSPI CPI Catalog Ingestion"),
                                "source_url": item.get("source_url", settings.MOSPI_CPI_URL),
                                "source_release_date": item.get("source_release_date"),
                                "unit": item.get("unit", "Index points"),
                            }
                        )
            if items:
                return items
        except Exception:
            pass

    # 2. HTML publication table parsing
    row_re = re.compile(r"<tr>(.*?)</tr>", re.IGNORECASE | re.DOTALL)
    cell_re = re.compile(r"<t[dh][^>]*>(.*?)</t[dh]>", re.IGNORECASE | re.DOTALL)

    extracted: List[Dict[str, Any]] = []
    for tr in row_re.findall(content):
        cells = [re.sub(r"<[^>]+>", "", c).strip() for c in cell_re.findall(tr)]
        if len(cells) >= 3:
            month = None
            sector = None
            val = None
            status = "Final"
            for c in cells:
                if re.match(r"^\d{4}-\d{2}$", c):
                    month = c
                elif c.lower() in ("rural", "urban", "combined"):
                    sector = c.capitalize()
                elif "prov" in c.lower():
                    status = "Provisional"
                elif "final" in c.lower():
                    status = "Final"
                else:
                    try:
                        f = float(c)
                        if 50.0 <= f <= 250.0:
                            val = f
                    except ValueError:
                        pass

            if month and sector and val is not None:
                extracted.append(
                    {
                        "reference_month": month,
                        "sector": sector,
                        "index_value": val,
                        "release_status": status,
                        "source_title": "MoSPI CPI Catalog Publication Table",
                        "source_url": settings.MOSPI_CPI_URL,
                        "unit": "Index points",
                    }
                )

    return extracted


def calculate_freshness(
    last_obs_period: Optional[str],
    policy: str,
    threshold_days: int,
    now: Optional[datetime] = None,
) -> FreshnessPolicyInfo:
    """Evaluate whether a series is within its publication freshness threshold.

    Handles monthly strings ('2026-08') and daily snapshot strings ('2026-02-19').
    """
    now = now or datetime.now(timezone.utc)
    if not last_obs_period:
        return FreshnessPolicyInfo(
            cadence="Monthly" if policy == "monthly" else "Sparse snapshots",
            threshold_days=threshold_days,
            is_fresh=False,
            freshness_note="No historical observations found in storage.",
        )

    try:
        if len(last_obs_period) == 7:  # 'YYYY-MM'
            year, month = int(last_obs_period[:4]), int(last_obs_period[5:7])
            # Last day of that month approximately (or 28th)
            obs_dt = datetime(year, month, 28, tzinfo=timezone.utc)
        elif len(last_obs_period) == 10:  # 'YYYY-MM-DD'
            obs_dt = datetime.fromisoformat(last_obs_period).replace(tzinfo=timezone.utc)
        else:
            obs_dt = None
    except Exception:
        obs_dt = None

    if obs_dt:
        age_days = (now - obs_dt).days
        is_fresh = age_days <= threshold_days
        note = (
            f"Latest published period is {last_obs_period} ({age_days} days old). "
            f"Freshness threshold is {threshold_days} days."
        )
    else:
        is_fresh = False
        note = f"Unable to parse reference period '{last_obs_period}' for freshness calculation."

    cadence_label = "Monthly official release" if policy == "monthly" else "Sparse public snapshots"
    return FreshnessPolicyInfo(
        cadence=cadence_label,
        threshold_days=threshold_days,
        is_fresh=is_fresh,
        freshness_note=note,
    )


def refresh_ppac_crude_source(
    db: Session,
    manual_file_path: Optional[Path] = None,
    mock_payload: Optional[List[Dict[str, Any]]] = None,
) -> RefreshExecutionSummary:
    """Refresh PPAC Indian Basket Crude Oil snapshots.

    Checks the official publication archive or processes an official manual-import snapshot.
    Preserves sparse snapshot semantics without interpolating missing calendar days.
    """
    start_time = time.time()
    sync_status = get_or_create_sync_status(
        db,
        source_id="SRC-01",
        series_id="crude_oil_indian_basket",
        refresh_policy="sparse_snapshot",
        freshness_threshold_days=settings.PPAC_FRESHNESS_DAYS,
    )

    now = datetime.now(timezone.utc)
    run_type = "manual_import" if manual_file_path else "automated"

    new_observations: List[Dict[str, Any]] = []
    error_msg: Optional[str] = None

    if mock_payload is not None:
        new_observations = mock_payload
    elif manual_file_path:
        if not manual_file_path.is_file():
            error_msg = f"Manual import file not found: {manual_file_path}"
        else:
            try:
                import csv
                with manual_file_path.open("r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        new_observations.append(r)
            except Exception as e:
                error_msg = f"Failed to parse manual CSV: {type(e).__name__}"
    else:
        # Automated network check
        success, content, err = safe_fetch_url(
            settings.PPAC_CRUDE_URL,
            timeout=settings.DATA_REFRESH_TIMEOUT_SECONDS,
            max_bytes=settings.DATA_REFRESH_MAX_RESPONSE_BYTES,
            max_retries=settings.DATA_REFRESH_MAX_RETRIES,
        )
        if not success:
            error_msg = err or "Official PPAC archive portal unreachable"
        else:
            # Parse genuine headline observations from the retrieved official archive HTML
            parsed_items = parse_ppac_archive_html(content or "")
            new_observations = parsed_items

    duration_ms = (time.time() - start_time) * 1000

    if error_msg:
        # Record error
        sync_status.last_check_time = now
        sync_status.status = "error"
        sync_status.error_summary = sanitize_message(error_msg)
        run_log = DataSourceRefreshRunModel(
            source_id="SRC-01",
            run_timestamp=now,
            run_type=run_type,
            status="error",
            records_inserted=0,
            records_updated=0,
            error_message=sanitize_message(error_msg),
            execution_duration_ms=duration_ms,
        )
        db.add(run_log)
        db.commit()
        return RefreshExecutionSummary(
            source_id="SRC-01",
            status="error",
            run_type=run_type,
            records_inserted=0,
            records_updated=0,
            error_message=sanitize_message(error_msg),
            execution_duration_ms=duration_ms,
        )

    # Process observations idempotently
    existing_periods = set(
        db.execute(
            select(TimeSeriesObservationModel.reference_period)
            .where(TimeSeriesObservationModel.series_id == "crude_oil_indian_basket")
        ).scalars().all()
    )

    inserted = 0
    updated = 0
    latest_period = sync_status.last_observation_period

    try:
        for item in new_observations:
            obs_date = str(item.get("observation_date", "")).strip()
            raw_price = str(item.get("price_usd_per_bbl", "")).strip()
            if not obs_date or not raw_price:
                continue

            try:
                price = float(raw_price)
                if price <= 0:
                    continue
            except ValueError:
                continue

            if obs_date in existing_periods:
                # Check if this represents an official revision
                existing_row = db.execute(
                    select(TimeSeriesObservationModel).where(
                        TimeSeriesObservationModel.series_id == "crude_oil_indian_basket",
                        TimeSeriesObservationModel.reference_period == obs_date,
                    )
                ).scalars().first()
                if existing_row and abs(existing_row.observation_value - price) > 0.001:
                    existing_row.observation_value = price
                    existing_row.notes = (
                        f"{existing_row.notes or ''}; Revised to {price} on {now.strftime('%Y-%m-%d')}".strip("; ")
                    )
                    updated += 1
            else:
                obs = TimeSeriesObservationModel(
                    series_id="crude_oil_indian_basket",
                    reference_period=obs_date,
                    observation_date=obs_date,
                    geographic_scope="All-India",
                    sector="Combined",
                    observation_value=price,
                    unit="USD/barrel",
                    release_status=item.get("observation_kind", "As-on published snapshot"),
                    source_title=item.get("source_title", "PPAC Archive - Important News"),
                    source_url=item.get("source_url", settings.PPAC_CRUDE_URL),
                    publication_date=item.get("published_date"),
                    notes=item.get("notes", "Discovered in official PPAC refresh check"),
                )
                db.add(obs)
                existing_periods.add(obs_date)
                inserted += 1
                if not latest_period or obs_date > latest_period:
                    latest_period = obs_date

        # Determine status outcome
        if inserted > 0 or updated > 0:
            outcome_status = "success"
            msg = f"Ingested {inserted} new snapshot(s), revised {updated}."
        else:
            outcome_status = "no_change"
            msg = "Official source checked successfully; no new published snapshots found."

        sync_status.last_check_time = now
        sync_status.last_success_time = now
        if inserted > 0 or updated > 0:
            sync_status.last_observation_period = latest_period
        sync_status.records_inserted_last_run = inserted
        sync_status.records_updated_last_run = updated
        sync_status.status = outcome_status
        sync_status.error_summary = None

        run_log = DataSourceRefreshRunModel(
            source_id="SRC-01",
            run_timestamp=now,
            run_type=run_type,
            status=outcome_status,
            records_inserted=inserted,
            records_updated=updated,
            message=msg,
            execution_duration_ms=duration_ms,
        )
        db.add(run_log)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return RefreshExecutionSummary(
        source_id="SRC-01",
        status=outcome_status,
        run_type=run_type,
        records_inserted=inserted,
        records_updated=updated,
        message=msg,
        execution_duration_ms=duration_ms,
    )


def refresh_mospi_cpi_source(
    db: Session,
    manual_file_path: Optional[Path] = None,
    mock_payload: Optional[List[Dict[str, Any]]] = None,
) -> RefreshExecutionSummary:
    """Refresh MoSPI CPI General Index (Base 2024=100) monthly series.

    Checks the official publication portal or processes an official press release CSV.
    Permits official revisions (e.g., updating provisional figures to final).
    """
    start_time = time.time()
    sync_status = get_or_create_sync_status(
        db,
        source_id="SRC-02",
        series_id="cpi_2024_general",
        refresh_policy="monthly",
        freshness_threshold_days=settings.CPI_FRESHNESS_DAYS,
    )

    now = datetime.now(timezone.utc)
    run_type = "manual_import" if manual_file_path else "automated"

    new_observations: List[Dict[str, Any]] = []
    error_msg: Optional[str] = None

    if mock_payload is not None:
        new_observations = mock_payload
    elif manual_file_path:
        if not manual_file_path.is_file():
            error_msg = f"Manual import file not found: {manual_file_path}"
        else:
            try:
                import csv
                with manual_file_path.open("r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for r in reader:
                        new_observations.append(r)
            except Exception as e:
                error_msg = f"Failed to parse manual CSV: {type(e).__name__}"
    else:
        # Automated network check
        success, content, err = safe_fetch_url(
            settings.MOSPI_CPI_URL,
            timeout=settings.DATA_REFRESH_TIMEOUT_SECONDS,
            max_bytes=settings.DATA_REFRESH_MAX_RESPONSE_BYTES,
            max_retries=settings.DATA_REFRESH_MAX_RETRIES,
        )
        if not success:
            error_msg = err or "Official MoSPI CPI catalog portal unreachable"
        else:
            # Parse structured catalog items or publication tables if present
            parsed_items = parse_mospi_cpi_content(content or "")
            new_observations = parsed_items

    duration_ms = (time.time() - start_time) * 1000

    if error_msg:
        sync_status.last_check_time = now
        sync_status.status = "error"
        sync_status.error_summary = sanitize_message(error_msg)
        run_log = DataSourceRefreshRunModel(
            source_id="SRC-02",
            run_timestamp=now,
            run_type=run_type,
            status="error",
            records_inserted=0,
            records_updated=0,
            error_message=sanitize_message(error_msg),
            execution_duration_ms=duration_ms,
        )
        db.add(run_log)
        db.commit()
        return RefreshExecutionSummary(
            source_id="SRC-02",
            status="error",
            run_type=run_type,
            records_inserted=0,
            records_updated=0,
            error_message=sanitize_message(error_msg),
            execution_duration_ms=duration_ms,
        )

    # Ingest / update rows
    existing_keys = {
        (row.reference_period, row.sector): row
        for row in db.execute(
            select(TimeSeriesObservationModel).where(
                TimeSeriesObservationModel.series_id == "cpi_2024_general"
            )
        ).scalars().all()
    }

    inserted = 0
    updated = 0
    latest_month = sync_status.last_observation_period

    try:
        for item in new_observations:
            ref_month = str(item.get("reference_month", "")).strip()
            sector = str(item.get("sector", "")).strip()
            raw_val = str(item.get("index_value", "")).strip()
            if not ref_month or not sector or not raw_val:
                continue

            try:
                val = float(raw_val)
                if val <= 0:
                    continue
            except ValueError:
                continue

            key = (ref_month, sector)
            rel_status = str(item.get("release_status", "Final")).strip()

            if key in existing_keys:
                existing_row = existing_keys[key]
                # Official revision check: value change or provisional -> final promotion
                if abs(existing_row.observation_value - val) > 0.001 or existing_row.release_status != rel_status:
                    existing_row.observation_value = val
                    existing_row.release_status = rel_status
                    if item.get("source_url"):
                        existing_row.source_url = item["source_url"]
                    existing_row.notes = (
                        f"{existing_row.notes or ''}; Official revision applied on {now.strftime('%Y-%m-%d')}".strip("; ")
                    )
                    updated += 1
            else:
                obs = TimeSeriesObservationModel(
                    series_id="cpi_2024_general",
                    reference_period=ref_month,
                    observation_date=None,
                    geographic_scope="All-India",
                    sector=sector,
                    observation_value=val,
                    unit=item.get("unit", "Index points"),
                    release_status=rel_status,
                    source_title=item.get("source_title", "Press Release of CPI on Base 2024=100"),
                    source_url=item.get("source_url", settings.MOSPI_CPI_URL),
                    publication_date=item.get("source_release_date"),
                    notes=item.get("notes", "Discovered in official MoSPI refresh check"),
                )
                db.add(obs)
                existing_keys[key] = obs
                inserted += 1
                if not latest_month or ref_month > latest_month:
                    latest_month = ref_month

        if inserted > 0 or updated > 0:
            outcome_status = "success"
            msg = f"Ingested {inserted} new CPI observation(s), revised {updated}."
        else:
            outcome_status = "no_change"
            msg = "Official MoSPI catalog checked successfully; no new monthly releases found."

        sync_status.last_check_time = now
        sync_status.last_success_time = now
        if inserted > 0 or updated > 0:
            sync_status.last_observation_period = latest_month
        sync_status.records_inserted_last_run = inserted
        sync_status.records_updated_last_run = updated
        sync_status.status = outcome_status
        sync_status.error_summary = None

        run_log = DataSourceRefreshRunModel(
            source_id="SRC-02",
            run_timestamp=now,
            run_type=run_type,
            status=outcome_status,
            records_inserted=inserted,
            records_updated=updated,
            message=msg,
            execution_duration_ms=duration_ms,
        )
        db.add(run_log)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return RefreshExecutionSummary(
        source_id="SRC-02",
        status=outcome_status,
        run_type=run_type,
        records_inserted=inserted,
        records_updated=updated,
        message=msg,
        execution_duration_ms=duration_ms,
    )


def execute_all_source_refreshes(
    db: Session,
    cpi_manual_path: Optional[Path] = None,
    ppac_manual_path: Optional[Path] = None,
) -> Dict[str, RefreshExecutionSummary]:
    """Execute refresh sequence across all supported primary official data sources."""
    results = {}
    results["SRC-01"] = refresh_ppac_crude_source(db, manual_file_path=ppac_manual_path)
    results["SRC-02"] = refresh_mospi_cpi_source(db, manual_file_path=cpi_manual_path)
    return results


def get_data_sources_status(db: Session) -> DataSourceStatusListResponse:
    """Compile comprehensive live tracking and freshness status across all registered sources."""
    ensure_sync_status_records(db)
    now = datetime.now(timezone.utc)

    # Fetch all data sources
    sources = db.execute(select(DataSourceModel).order_by(DataSourceModel.source_id)).scalars().all()
    sync_map = {
        s.source_id: s
        for s in db.execute(select(DataSourceSyncStatusModel)).scalars().all()
    }

    # Fetch last inserted observation timestamps
    latest_obs_times = {}
    for s_id, series_id in [("SRC-01", "crude_oil_indian_basket"), ("SRC-02", "cpi_2024_general")]:
        ts = db.execute(
            select(TimeSeriesObservationModel.created_at)
            .where(TimeSeriesObservationModel.series_id == series_id)
            .order_by(desc(TimeSeriesObservationModel.created_at))
        ).scalars().first()
        latest_obs_times[s_id] = ts

    reports: List[SourceSyncStatusResponse] = []
    for src in sources:
        sync_row = sync_map.get(src.source_id)
        if not sync_row:
            # Source exists in registry but does not have automated time-series sync (e.g. HCES or linking factors)
            freshness = FreshnessPolicyInfo(
                cadence=src.frequency or "Reference benchmark",
                threshold_days=365,
                is_fresh=True,
                freshness_note="Authoritative structural survey/benchmark dataset.",
            )
            provenance = SourceProvenanceInfo(
                publisher=src.publisher,
                official_url=src.source_url,
                access_condition=src.access_condition,
                verification_status=src.verification_status,
                base_year=src.base_year,
                notes=src.notes,
            )
            reports.append(
                SourceSyncStatusResponse(
                    source_id=src.source_id,
                    source_name=src.source_title,
                    series_id=src.series_or_table_id,
                    is_enabled=False,
                    last_check_time=None,
                    last_success_time=None,
                    last_new_observation_time=None,
                    last_observation_period=None,
                    records_inserted_last_run=0,
                    records_updated_last_run=0,
                    status="idle",
                    error_summary=None,
                    provenance=provenance,
                    freshness=freshness,
                )
            )
            continue

        freshness = calculate_freshness(
            last_obs_period=sync_row.last_observation_period,
            policy=sync_row.refresh_policy,
            threshold_days=sync_row.freshness_threshold_days,
            now=now,
        )

        provenance = SourceProvenanceInfo(
            publisher=src.publisher,
            official_url=src.source_url,
            access_condition=src.access_condition,
            verification_status=src.verification_status,
            base_year=src.base_year,
            notes=src.notes,
        )

        # Mark stale if dataset has passed threshold and isn't currently erroring
        current_status = sync_row.status
        if current_status not in ("error", "success") and not freshness.is_fresh:
            current_status = "stale"

        reports.append(
            SourceSyncStatusResponse(
                source_id=src.source_id,
                source_name=src.source_title,
                series_id=sync_row.series_id,
                is_enabled=sync_row.is_enabled,
                last_check_time=sync_row.last_check_time,
                last_success_time=sync_row.last_success_time,
                last_new_observation_time=latest_obs_times.get(src.source_id),
                last_observation_period=sync_row.last_observation_period,
                records_inserted_last_run=sync_row.records_inserted_last_run,
                records_updated_last_run=sync_row.records_updated_last_run,
                status=current_status,
                error_summary=sync_row.error_summary,
                provenance=provenance,
                freshness=freshness,
            )
        )

    return DataSourceStatusListResponse(
        total_sources=len(reports),
        active_sources=len([r for r in reports if r.is_enabled]),
        system_timestamp=now,
        sources=reports,
    )
