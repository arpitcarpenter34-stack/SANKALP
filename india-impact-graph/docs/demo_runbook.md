# India Impact Graph: MVP Demo Runbook

> **Status:** Verified working as of Task 12
> **Note:** A frontend UI is not currently part of this repository. All interactions must be performed via the documented API endpoints or the demo rehearsal script.

## 1. Prerequisites and Environment Setup

The backend requires the project root (`india-impact-graph`) and the `backend` module to be in the Python path.

1. Ensure you have the Python virtual environment active and dependencies installed:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Start the Uvicorn application server from the `backend/` directory, or by setting `PYTHONPATH`:
   ```powershell
   # Windows PowerShell
   $env:PYTHONPATH=".;backend"
   uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```
   Or on Unix/Mac:
   ```bash
   PYTHONPATH=".:backend" uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

3. The interactive OpenAPI documentation will be available at:
   `http://127.0.0.1:8000/docs`

## 2. Automated Demo Rehearsal

A fully automated demo rehearsal script is available. Run it using:

```powershell
python scripts/run_demo_rehearsal.py
```

This script exercises the core pipeline end-to-end, producing output verifying extraction, graph building, path finding, time-series metadata limitations, and the news consensus meter.

## 3. Supported API Routes and Workflows

### A. Event Extraction (`POST /api/events/extract`)
Extracts structured event data from a hypothetical scenario or real text. 
**Example Request:**
```json
{
    "text": "SCENARIO: +12% crude oil",
    "is_scenario": true
}
```

### B. Graph Building (`POST /api/graph/build`)
Builds a curated subset graph dynamically from given nodes and edges representing the observed and inferred relationships. Every relation demands a deterministic receipt.

### C. Path Finding (`POST /api/graph/paths`)
Discovers propagation paths (capped to a maximum search depth) between a global source and a localized household item.
**Example Request:**
```json
{
    "source_id": "crude_oil",
    "target_id": "transport_cost",
    "graph": { /* previously built graph object */ }
}
```
*Note on Determinism:* All calculation bounds and paths rely strictly on the documented MPCE (Monthly Per Capita Expenditure) tables, pass-through coefficients, and basket shares. If a coefficient is missing, it transparently defaults to `Data not available` rather than hallucinating a synthetic value.

### D. Time-Series Data APIs (`GET /time-series/cpi`, `GET /time-series/crude-oil`)
Returns the currently ingested dataset for baseline indicators.
**Known Limitations (Transparently Disclosed via API Metadata):**
- **CPI Data:** Contains a limited starter extract covering January–August 2026 (base year 2024=100), not the complete historical series.
- **PPAC Crude Oil:** Contains 31 sparse snapshots from January-February 2026. The data frequency is irregular and interpolation or monthly averaging is explicitly disabled.

### E. News Consensus Meter (`POST /consensus/`)
Evaluates multiple cached news sources to determine alignment.
**Test Data:** The repository contains three real cached articles in `data/templates/cached-articles-catalog.csv` regarding the October 2026 RBI special dollar window for oil PSUs (from The Indian Express, The Financial Express, and Moneycontrol).
- The meter correctly distinguishes **Publisher Count** (3) from **Root-Source Count** (1 — the RBI Press Release).
- Expected Lineage Status: `MULTI_PUBLISHER_SINGLE_ROOT`.
- Expected Consensus Status: `AGREEMENT`.

### F. What-to-Watch Notes Engine (`POST /what-to-watch/`)
Deterministic, rule-based monitoring engine identifying critical indicators, evidence gaps, and data limitations without market predictions or financial advice.
**Rules & Categories:**
1. **Important pathway indicator:** Identifies indicators that appear on active ranked impact pathways.
2. **Evidence limitation:** Highlights structurally inferred relationships (`inferred` edge kind) and unverified edge receipts.
3. **Time-series coverage:** Transparently alerts users when baseline historical series are sparse or starter extracts.
4. **Source-lineage limitation:** Alerts when multiple publishers echo a single root announcement (`MULTI_PUBLISHER_SINGLE_ROOT`), distinguishing publisher count from independent confirmation.
5. **Missing data:** Identifies indicators or relationships requiring data acquisition (`[UNVERIFIED]` or `[VERIFY]` status).

**Integration Status & Ownership Boundary:**
- The engine logic (`what_to_watch.engine`), standalone API router (`what_to_watch.api`), and comprehensive unit/API/pipeline tests are 100% complete and passing.
- Global FastAPI router registration in `backend/app/api/__init__.py` is owned by Engineer A and is currently pending merge. In the global app, `POST /what-to-watch/` returns HTTP 404 until Engineer A mounts `what_to_watch_router` into `api_router`.

## 4. AI-Off Proof

The backend logic operates completely offline regarding mathematics and paths. The AI is utilized exclusively as a "Reader/Explainer" for unstructured text extraction. Graph paths and household budget impacts are calculated using classical algorithms and official tabular data.
