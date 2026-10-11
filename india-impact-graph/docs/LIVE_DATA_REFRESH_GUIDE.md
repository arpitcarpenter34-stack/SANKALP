# India Impact Graph: Live Data Refresh & Windows Task Scheduler Guide

> **Milestone 3 Reference Guide**  
> **Target Environment:** Windows 10/11 Server / Developer Workstation  
> **Script:** `scripts/refresh_live_data.py`  
> **Python Virtual Environment:** `backend\.venv\Scripts\python.exe`  

---

## 1. Overview & Data Philosophy

In the India Impact Graph architecture, historical time-series storage (in PostgreSQL) is decoupled from live tracking:

1. **Official Sources Only:** Data is fetched solely from registered primary government repositories:
   - **MoSPI CPI (Base 2024=100):** Monthly releases around the 12th of each month for the preceding reference month.
   - **PPAC Indian Basket Crude Oil:** Public Important News archives containing discrete, sparse headline snapshots.
2. **No Data Fabrication:** If an official source has not published a new data point, the system records `no_change` without fabricating synthetic dates, interpolating calendar days, or filling values with zero.
3. **Freshness SLAs:**
   - **MoSPI CPI:** 45-day threshold (monthly cadence accounting for standard publication lags).
   - **PPAC Crude Oil:** 21-day threshold (sparse snapshot cadence). If no new snapshot is released within 21 days, the dataset is reported as `stale` to provide full transparency to analysts.

---

## 2. Command-Line Usage

The refresh pipeline can be executed manually at any time without running background daemons.

### 2.1 View Current Tracking Status (Dry-Run / Status-Only)
```powershell
# In PowerShell at H:\Sankalp\india-impact-graph
$env:PYTHONPATH='backend'
.\backend\.venv\Scripts\python.exe scripts\refresh_live_data.py --status-only
```

### 2.2 Execute Automated Official Refresh Check
```powershell
$env:PYTHONPATH='backend'
# Check both SRC-01 (PPAC) and SRC-02 (MoSPI)
.\backend\.venv\Scripts\python.exe scripts\refresh_live_data.py

# Or check only a specific source:
.\backend\.venv\Scripts\python.exe scripts\refresh_live_data.py --source SRC-01
.\backend\.venv\Scripts\python.exe scripts\refresh_live_data.py --source SRC-02
```

### 2.3 Manual File Ingestion (Safe Fallback)
If official portals introduce dynamic CAPTCHAs, temporary DDoS protection, or PDF attachments that require verified human extraction, operators can ingest validated CSV updates directly:

```powershell
$env:PYTHONPATH='backend'
.\backend\.venv\Scripts\python.exe scripts\refresh_live_data.py --source SRC-02 --manual-file data/curated/cpi_september_2026_update.csv
```

---

## 3. Windows Task Scheduler Setup

To schedule automated daily or weekly background checks on Windows without relying on long-running dev servers:

### Option A: Using PowerShell (Recommended)

Run PowerShell as Administrator:

```powershell
$action = New-ScheduledTaskAction `
    -Execute "H:\Sankalp\india-impact-graph\backend\.venv\Scripts\python.exe" `
    -Argument "scripts\refresh_live_data.py" `
    -WorkingDirectory "H:\Sankalp\india-impact-graph"

# Schedule to run every day at 18:00 (after standard 17:30 MoSPI releases)
$trigger = New-ScheduledTaskTrigger -Daily -At "18:00"

$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask `
    -TaskName "IndiaImpactGraph_DataRefresh" `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Description "Automated refresh and freshness tracking for MoSPI CPI and PPAC crude oil data."
```

### Option B: Using the Windows Task Scheduler GUI (`taskschd.msc`)

1. Press `Win + R`, type `taskschd.msc`, and press **Enter**.
2. Click **Create Basic Task...** in the right panel.
3. **Name:** `IndiaImpactGraph_DataRefresh`.
4. **Trigger:** Daily (e.g., 6:00 PM / 18:00 IST).
5. **Action:** Start a program.
   - **Program/script:** `H:\Sankalp\india-impact-graph\backend\.venv\Scripts\python.exe`
   - **Add arguments:** `scripts\refresh_live_data.py`
   - **Start in:** `H:\Sankalp\india-impact-graph`
6. Click **Finish**.

---

## 4. Parser Architecture & Supported Publication Formats

The live refresh service implements deterministic, regex- and structural-parsers for primary official portals while maintaining strict zero-fabrication guarantees.

### 4.1 PPAC Indian Basket Crude Oil (SRC-01)
- **Official URL:** `https://ppac.gov.in/archives/impnews`
- **Supported Live Format:** Public Important News headline announcements.
- **Headline Pattern:** Captures Indian Basket crude oil prices (`US$ XX.XX per bbl`, `$XX.XX/bbl`, or `XX.XX USD/barrel`) and as-on observation dates (`DD.MM.YYYY`, `DD-MM-YYYY`, `DD/MM/YYYY`, or `YYYY-MM-DD`).
- **Semantic Constraint:** Preserves discrete sparse snapshot points only. Weekends, holidays, or missing dates are **never** filled with synthetic or interpolated values.
- **Fallback / Limitation:** If the archive HTML layout changes or the headline does not contain an identifiable price and date, the pipeline records `no_change` without fabricating data.
- **Manual Import Format (CSV):**
  Headers: `observation_date,published_date,price_usd_per_bbl,series_name,observation_kind,source_title,source_url,notes`

### 4.2 MoSPI CPI Base 2024=100 General Index (SRC-02)
- **Official URL:** `https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI`
- **Supported Live Format:**
  1. **REST / JSON API catalog items:** Array of objects with `reference_month` (`YYYY-MM`), `sector` (`Rural`, `Urban`, or `Combined`), `index_value` (float), and `status` (`Final` or `Provisional`).
  2. **HTML publication table rows:** `<tr>...<td>YYYY-MM</td>...<td>Sector</td>...<td>Value</td>...<td>Status</td>...</tr>`.
- **Semantic Constraint:**
  - Ingests only Base 2024=100 General Index values. Incompatible base years (such as Base 2012=100) are strictly excluded unless officially linked.
  - Automatically handles official status revisions (e.g. promoting a provisional figure to final upon publication of subsequent release) without creating duplicate natural keys.
- **Fallback / Limitation:** Because monthly press releases are often distributed as multi-page PDF bulletins (`Press_Release_of_CPI_<Month>_<Year>.pdf`), live portal HTML without structured tables or JSON will yield `no_change`. Operators can extract the 3 key national index numbers from the official release and ingest them via `--manual-file`.
- **Manual Import Format (CSV):**
  Headers: `reference_month,sector,index_value,index_base,series_name,release_status,source_title,source_url,source_release_date,table_section,unit,notes`

---

## 5. Troubleshooting & Failure Modes

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `Network connection error` | Portal unreachable or machine offline | The refresh pipeline logs an error in `data_source_refresh_runs` without crashing. Existing historical records remain completely safe. |
| `HTTP 403 Forbidden` / Bot Block | Government portal blocking automated Python `User-Agent` | Download the official press release manually and use `--manual-file` option. |
| Status indicates `STALE` | No new observation released within freshness SLA | Normal for sparse snapshot series or survey data; check portal for scheduled release dates. |
| `no_change` after official check | Portal returns valid page but no new structured rows | Portal has not published a new release, or release is an unparsed PDF attachment. Ingest via `--manual-file`. |
| Missing observation values | Government release does not publish a sub-index | The pipeline rejects blank/zero values to avoid distorting downstream economic calculations. |
