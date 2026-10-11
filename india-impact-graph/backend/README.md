# India Impact Graph — Backend Architecture & Service Documentation 🇮🇳 📊

> **Service:** Autonomous Financial Event Market Impact Graph API  
> **Framework:** FastAPI (Python 3.10+)  
> **Database:** PostgreSQL with psycopg 3 driver  
> **Execution Model:** Deterministic calculation engines with strictly isolated rule-based and NLP extraction fallback pipelines.

---

## 1. Architecture Overview

The backend is built around a receipt-backed, deterministic pipeline connecting global and national macroeconomic news to state- and persona-level household consumption expenditure:

```text
[Financial News / Scenario]
         │
         ▼
[Event Extractor] ──► Rule-based extraction & LiveLLMProvider / FakeDeterministicProvider
         │
         ▼
[Knowledge Graph]  ──► Directed DAG with 3 propagation paths (Food, Transport, Financial)
         │
         ▼
[Household Impact] ──► MoSPI HCES 2023–24 Table 2 baselines + PPAC pass-through elasticity
         │
         ▼
[Receipts & Audit] ──► Provenance receipts for all facts; strictly null for unverified data
```

### Core Invariants:
1. **Mathematical Determinism:** No AI or LLM is ever used to calculate numbers. All rupee ranges and expenditure weights derive from pure arithmetic and curated government datasets.
2. **Strict Missing Data Handling:** Unknown pass-through factors (e.g. crude-to-retail vegetables) output `dataStatus: "data_not_available"` with `estimatedMonthlyImpactInr: null`. Zero substitution is prohibited.
3. **Observed vs. Inferred Distinction:** Solid graph edges represent observed official facts; dashed edges represent inferred economic dependencies.

---

## 2. API Endpoints

### Health & Connectivity
- `GET /api/health` — FastAPI service readiness ping (returns `{"status": "ok"}`).
- `GET /api/health/db` — Truthful database health probe (executes `SELECT 1`). Returns `503 Service Unavailable` if database connectivity is broken.

### Composite Scenario Analysis (Primary Frontend Contract)
- `POST /api/scenarios/analyze` (and `POST /api/scenarios/analyze/`)
  - **Request Body:**
    ```json
    {
      "scenarioId": "crude-oil-12pct",
      "customText": null,
      "isAiOff": true,
      "state": "Madhya Pradesh",
      "sector": "Rural",
      "expenditureClass": "Middle"
    }
    ```
  - **Supported Presets & Aliases:**
    - `crude-oil-12pct` / `crude-oil-shock-12pct`
    - `edible-oil-tariff` / `edible-oil-shock`
    - `wheat-procurement-spike` / `wheat-price-shock`
    - `custom` (with mandatory `customText`)
  - **Response Envelope:** Returns full `AnalysisResponse` containing `scenario`, `graph` (nodes, edges, available paths), `persona` (MPCE baseline, rupee range, itemized breakdown), `isAiOff`, `isLiveBackend: true`, and `dataSourceLabel`.

### Event Extraction & Persistence
- `POST /api/events` — Persist financial event with child entities and evidence snippets.
- `GET /api/events` — List persisted financial events deterministically.
- `GET /api/events/{event_id}` — Retrieve persisted event details.
- `POST /api/events/extract` — Extract financial event from arbitrary text via configured provider.

### Knowledge Graph
- `GET /api/graph/{event_id}` — Retrieve deterministic knowledge graph for preset or persisted event.
- `POST /api/graph/build` — Validate and build graph from nodes and edges.
- `POST /api/graph/paths` — Find impact propagation paths.
- `POST /api/graph/evidence/node` — Get node provenance receipt.
- `POST /api/graph/evidence/edge` — Get edge provenance receipt and limitations.
- `POST /api/graph/evidence/path` — Aggregate evidence across path edges.

### Household Impact Calculator
- `GET /api/calculator/personas` — List curated MoSPI HCES 2023–24 demographic personas.
- `POST /api/calculator/calculate` — Compute deterministic rupee impact range for a specified persona and shock.

### Registries & Differentiators
- `GET /api/sources` — Data Source Registry (MoSPI, PPAC, RBI).
- `GET /api/pass-through` — Pass-through elasticity factor registry.
- `GET /api/consumption-items` — Consumption items catalog.
- `GET /api/cached-articles` — Cached articles catalog.
- `POST /api/consensus/analyze` — 3-article News Consensus Meter.
- `GET /api/time-series/cpi` & `/crude-oil` — Historical comparative time-series.
- `POST /api/what-to-watch/` — Forward-looking rule-based indicator notes.

---

## 3. Configuration & Environment Variables

Copy `backend/.env.example` to `backend/.env` to configure:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/india_impact_graph` | PostgreSQL connection URL via psycopg 3 driver. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000,...` | Comma-separated list of permitted CORS origins. Wildcards (`*`) and `null` are rejected. |
| `USE_LIVE_LLM` | `false` | When `false`, uses deterministic rule-based NLP extraction. |
| `LIVE_LLM_API_KEY` | *(None)* | API key for live provider (required only when `USE_LIVE_LLM=true`). |

---

## 4. Local Execution & Testing

### Running the API Server
```bash
# From repository root or backend/ directory
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Running Test Suites
```bash
# Run unit tests
python -m pytest tests/unit/ -v

# Run composite scenarios API tests
python -m pytest tests/unit/test_scenarios_api.py -v

# Run full backend regression suite (all unit, integration, and e2e tests)
python -m pytest tests/ -q
```
