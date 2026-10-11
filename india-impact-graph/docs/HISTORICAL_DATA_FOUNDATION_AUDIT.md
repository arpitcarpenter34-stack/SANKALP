# India Impact Graph — Phase 1: Historical Data Foundation Audit & Ingestion Architecture Plan

> **Scope:** Backend & Data Engineering Infrastructure  
> **Repository:** `H:\Sankalp\india-impact-graph`  
> **Branch:** `feat/backend-foundation`  
> **Audited Date:** 2026-10-11  
> **Governance Standard:** `docs/DATA_AND_EVIDENCE_RULES.md` ("Evidence before confidence. Data before numbers.")

---

## 1. Executive Summary

This audit assesses the readiness of the **India Impact Graph** backend to transition from synthetic scenario shocks and hardcoded graph topologies to an evidence-grounded, historical data foundation backed by official Indian economic datasets (MoSPI, PPAC, RBI).

### Key Audit Findings
1. **Database Persistence Scope:** PostgreSQL currently hosts only event-level tables (`financial_events`, `event_entities`, `event_evidence_snippets`). Historical time-series observations (CPI, crude oil prices) and consumption registries currently reside exclusively in flat CSV files (`data/curated/`) and are queried via in-memory CSV parsers.
2. **Pending Alembic Migrations:** Four migrations (`consumption_items`, `pass_through_records`, `data_sources`, `cached_articles`) exist in the repository but have not yet been applied to the live PostgreSQL database.
3. **Scenario Engine Separation:** The primary composite scenario analysis endpoint (`POST /api/scenarios/analyze`) currently calculates household impacts and knowledge graph topologies deterministically from in-memory synthetic shock vectors (`+12.0%`, `+8.5%`, `+6.0%`) and static HCES 2023–24 baselines; it does not dynamically query historical time-series trends from PostgreSQL.
4. **Data Integrity Adherence:** The existing starter data pack strictly enforces provenance, rejecting interpolation of sparse points (e.g. PPAC crude snapshots) and preserving official release statuses (`Provisional` vs `Final`).

---

## 2. PostgreSQL Data Foundation Audit

### 2.1 Database Configuration & Connectivity
- **Engine:** PostgreSQL 18.4 (`x86_64-windows`)
- **Driver:** `postgresql+psycopg` (SQLAlchemy 2.0 with Psycopg 3 binary)
- **Host & Port:** `127.0.0.1:5432`
- **Configured Database Name:** `india_impact_graph`
- **Connection Probe (`GET /api/health/db`):** `HTTP 200 OK` (`{"status": "ok", "database": "connected"}`)

### 2.2 Table Inventory & Migration State

| Table Name | Applied Migration ID | In Database? | Row Count | Primary Purpose |
|---|:---:|:---:|:---:|---|
| `alembic_version` | Core | **YES** | 1 (`12efdfb8841d`) | Alembic schema version tracking |
| `financial_events` | `12efdfb8841d` | **YES** | 1 | Persisted macro events & shock inputs |
| `event_entities` | `12efdfb8841d` | **YES** | 1 | Extracted entities with graph types |
| `event_evidence_snippets` | `12efdfb8841d` | **YES** | 1 | Text quotes and source URLs |
| `consumption_items` | `4c2b7f8e31b4` | **NO** *(pending)* | 0 | Curated household consumption categories |
| `pass_through_records` | `7d1a2f9b84e3` | **NO** *(pending)* | 0 | Empirical pass-through elasticity bounds |
| `data_sources` | `9e2f4a1b7c85` | **NO** *(pending)* | 0 | Official source registry & licenses |
| `cached_articles` | `8a3f5c2d9e14` | **NO** *(pending)* | 0 | Verifiable news article cache & consensus |
| *historical_time_series* | *Unmodeled* | **NO** | 0 | *(Missing)* Empirical time-series observations |

### 2.3 API Route Data Sources & Persistence Classification

| Endpoint | Method | Data Store | Reads From | Persists To |
|---|:---:|:---:|---|---|
| `GET /api/health` | `GET` | N/A | In-memory ping | None |
| `GET /api/health/db` | `GET` | PostgreSQL | `SELECT 1` | None |
| `POST /api/events` | `POST` | PostgreSQL | Checks uniqueness | `financial_events`, `event_entities`, `event_evidence_snippets` |
| `GET /api/events` | `GET` | PostgreSQL | `financial_events` | None |
| `GET /api/events/{id}` | `GET` | PostgreSQL | `financial_events` + child joins | None |
| `GET /api/graph/{id}` | `GET` | Hybrid | Checks `financial_events`, falls back to preset | Generates graph in-memory |
| `GET /time-series/cpi` | `GET` | CSV File | `data/curated/cpi_2024_general_index_monthly_2026_01_to_08.csv` | None |
| `GET /time-series/crude-oil` | `GET` | CSV File | `data/curated/ppac_indian_basket_public_archive_snapshots_2026_01_to_02.csv` | None |
| `GET /api/calculator/personas`| `GET` | CSV File | `data/curated/hces-2023-24-personas.csv` | None |
| `POST /api/calculator/calculate`| `POST`| In-Memory | CSV personas + in-memory pass-through rules | None |
| `POST /api/scenarios/analyze`| `POST` | In-Memory | `SCENARIO_METADATA`, NLP extractor, HCES CSV | None |
| `GET /api/sources` | `GET` | Hybrid | Tries DB `data_sources`, falls back to in-memory manifest | None |
| `GET /api/pass-through` | `GET` | Hybrid | Tries DB `pass_through_records`, falls back to in-memory list | None |
| `GET /api/consumption-items`| `GET`| Hybrid | Tries DB `consumption_items`, falls back to CSV | None |
| `GET /api/cached-articles` | `GET` | Hybrid | Tries DB `cached_articles`, falls back to CSV | None |

---

## 3. Historical Data Inventory & Quality Catalog

### 3.1 Primary Curated Datasets

#### 1. MoSPI Consumer Price Index (CPI 2024 Base)
- **Indicator:** CPI General Index (Consumer price level across Rural, Urban, Combined).
- **Official Publisher:** National Statistical Office (NSO), MoSPI, Government of India.
- **Source Portal / URL:** `https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI` and monthly press releases (`https://pib.gov.in/`).
- **Base Year:** `2024=100` (effective January 2026, replacing `2012=100`).
- **Geographic Coverage:** All-India (disaggregated into Rural, Urban, Combined).
- **Observation Period:** January 2026 to August 2026 (8 months).
- **Frequency:** Monthly.
- **Available Observations:** 24 verified observations (8 months × 3 sectors).
- **Missing Periods:** Full historical back-series under the 2024 base is not yet published. Historical splicing requires the official linking factors:
  - Rural: `0.5222`
  - Urban: `0.5320`
  - Combined: `0.5267`
- **Revision Handling:** January–April, June–July are `Final`; May and August are `Provisional`. Official updates revise prior provisional observations upon the subsequent release.
- **Status:** **`[VERIFIED]`** for available 8 months.

#### 2. PPAC Indian Basket of Crude Oil Price Snapshots
- **Indicator:** Landed price of the Indian Basket of crude oil.
- **Official Publisher:** Petroleum Planning & Analysis Cell (PPAC), Ministry of Petroleum and Natural Gas.
- **Source Portal / URL:** `https://ppac.gov.in/archives/impnews`.
- **Unit & Currency:** USD per barrel (`USD/bbl`).
- **Geographic Coverage:** Global import parity for Indian refineries.
- **Observation Period:** 2026-01-02 to 2026-02-19.
- **Frequency:** Sparse published archive snapshots.
- **Available Observations:** 31 discrete snapshots.
- **Missing Periods:** Weekends, market holidays, and unarchived days.
- **Known Limitations:** This dataset is a sparse archive extract, **not a continuous daily series**. Per project rules, linear interpolation or monthly averaging is strictly prohibited.
- **Status:** **`[VERIFIED]`** (as sparse snapshot points).

#### 3. MoSPI HCES 2023–24 Household Personas
- **Indicator:** Monthly Per Capita Consumption Expenditure (MPCE) without imputation.
- **Official Publisher:** MoSPI NSS Household Consumption Expenditure Survey 2023–24.
- **Source Portal / URL:** `https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf`.
- **Geographic Coverage:** All 28 States and 8 Union Territories (Rural and Urban).
- **Observation Period:** August 2022 to July 2024 (Survey collection round).
- **Available Observations:** 99 state/sector persona records.
- **Limitations:** Data is strictly per-capita expenditure, not household-total expenditure. Fractile distributions (Low, Middle, High) within specific states require unit-level microdata extraction or Table 4 of the Detailed Report.
- **Status:** **`[VERIFIED]`** for state averages.

#### 4. Pass-Through Elasticity Factors Register
- **Indicator:** Empirical transmission elasticity bounds from macro shocks to retail prices.
- **Official Sources:** PPAC Retail Selling Price Build-up, RBI Working Papers, MoSPI HCES Table 3/4.
- **Curated Elasticities:**
  - Crude Oil $\rightarrow$ Petrol: `[0.30, 0.45]`, 1-month lag
  - Crude Oil $\rightarrow$ Diesel: `[0.35, 0.50]`, 1-month lag
  - Diesel $\rightarrow$ Perishable Vegetables: `[0.05, 0.15]`, 1-month lag
  - Crude Oil $\rightarrow$ Vegetables (Direct): `NULL` (`data_not_available`, direct pass-through unverified)
- **Status:** **`[VERIFIED]`** for fuel and transport freight; honest `NULL` for unverified food commodities.

---

## 4. Architectural Gaps & Vulnerabilities

1. **Dual Storage Discrepancy:** Time-series data lives in CSV files, while event data lives in PostgreSQL. Lack of a unified relational model prevents SQL-based join analysis between historical observations and event receipts.
2. **Pending Migrations:** Models for `data_sources`, `consumption_items`, `pass_through_records`, and `cached_articles` are defined in code, but their tables do not exist in the database, causing registry endpoints to execute fallback logic on every invocation.
3. **Absence of a Time-Series Table:** There is no database table designed to hold time-series observations (`observation_date`, `metric_id`, `value`, `unit`, `status`, `source_id`).
4. **Decoupled Scenario Calculations:** `POST /api/scenarios/analyze` uses hardcoded percentage shocks instead of allowing users to select an actual historical interval (e.g. "January to February 2026 Crude surge of +$8.5/bbl") and calculate impacts based on real observed deltas.

---

## 5. Proposed Ingestion Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   HISTORICAL INGESTION PIPELINE                        │
└────────────────────────────────────────────────────────────────────────┘
                                 │
     1. RAW INGESTION            ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Official Source Downloads (MoSPI, PPAC, RBI)                 │
  │ Immutable Storage: `data/raw/<domain>/<source_file>`         │
  │ Cryptographic Hash (SHA-256) & Manifest Audit                │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
     2. VALIDATION & NORMALIZATION ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ Pydantic Validation Schemas (`ObservationBatch`)             │
  │ ISO-8601 Date Formats (`YYYY-MM-DD` / `YYYY-MM`)             │
  │ Mandatory Provenance Receipts & Source ID Attachment         │
  │ Status Enforcement: `Provisional` vs `Final` vs `Sparse`     │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
     3. IDEMPOTENT UPSERT        ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ PostgreSQL Table: `time_series_observations`                 │
  │ Composite Natural Key: `(series_id, period, sector, geo)`    │
  │ `ON CONFLICT (series_id, period, sector, geo) DO UPDATE`     │
  │ Audit Log: Track revisions when provisional becomes final    │
  └──────────────────────────────┬───────────────────────────────┘
                                 │
     4. DATA QUALITY & SERVING   ▼
  ┌──────────────────────────────────────────────────────────────┐
  │ FastAPI Endpoints: `/api/time-series/*` backed by PostgreSQL │
  │ Unified Source Receipts linking Data to Graph Edges          │
  │ Strict Missing-Data Policy: Return `null`, Never Impute 0    │
  └──────────────────────────────────────────────────────────────┘
```

### Core Architecture Components

#### 1. Immutable Raw Snapshot Vault
- Raw downloads (PDFs, Excel sheets, CSVs) are committed to `data/raw/` with immutable filenames containing the download timestamp.
- A `source_manifest.csv` records SHA-256 hashes, publication dates, and terms of access.

#### 2. Validation & Normalization Pipeline
- Ingestion scripts validate column constraints, reject negative or unphysical values, and verify date bounds.
- Normalizes disparate date representations into standard ISO-8601 strings.
- Rejects automatic interpolation across sparse data points.

#### 3. Idempotent Database Storage
- PostgreSQL table `time_series_observations` with a unique constraint on:
  `(series_id, reference_period, geographic_scope, sector)`.
- Idempotent upserts update provisional values to final values when MoSPI or PPAC issues revised figures.

#### 4. Provenance & Receipts Linking
- Every observation references a foreign key in `data_sources` (`source_id`).
- When the knowledge graph constructs an edge or node, it queries the observation record and inherits the exact provenance receipt (`source_title`, `table_id`, `url`).

---

## 6. Proposed Schema & Migration Roadmap

### 6.1 Step A: Apply Existing Pending Migrations
Execute Alembic upgrade to bring existing models into PostgreSQL:
1. `4c2b7f8e31b4_create_consumption_items_table.py`
2. `7d1a2f9b84e3_create_pass_through_records_table.py`
3. `9e2f4a1b7c85_create_data_sources_table.py`
4. `8a3f5c2d9e14_create_cached_articles_table.py`

### 6.2 Step B: New Migration for Historical Time-Series
Introduce a new revision `create_time_series_tables`:

```sql
CREATE TABLE time_series_definitions (
    series_id VARCHAR(100) PRIMARY KEY,
    series_name VARCHAR(255) NOT NULL,
    publisher VARCHAR(100) NOT NULL,
    base_year VARCHAR(50),
    unit VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    source_id VARCHAR(50) REFERENCES data_sources(source_id) ON DELETE RESTRICT,
    notes TEXT
);

CREATE TABLE time_series_observations (
    id SERIAL PRIMARY KEY,
    series_id VARCHAR(100) NOT NULL REFERENCES time_series_definitions(series_id) ON DELETE CASCADE,
    reference_period VARCHAR(50) NOT NULL, -- e.g. "2026-01" or "2026-01-02"
    observation_date DATE,
    geographic_scope VARCHAR(100) NOT NULL DEFAULT 'All-India',
    sector VARCHAR(50) NOT NULL DEFAULT 'Combined', -- Rural, Urban, Combined
    observation_value DOUBLE PRECISION NOT NULL,
    release_status VARCHAR(50) NOT NULL DEFAULT 'Final', -- Provisional, Final, Sparse
    source_url TEXT,
    publication_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_series_period_geo_sector UNIQUE (series_id, reference_period, geographic_scope, sector)
);

CREATE INDEX ix_observations_series_period ON time_series_observations(series_id, reference_period);
```

---

## 7. Dataset-by-Dataset Ingestion Plan

| Dataset | Ingestion Tool | Source File | Target Table | Frequency / Mode |
|---|---|---|---|---|
| **Data Source Register** | `scripts/ingest_data_sources.py` | `data/source_manifest.csv` | `data_sources` | One-time / on-change |
| **Consumption Catalog** | `scripts/ingest_consumption_items.py`| `data/curated/consumption_items.csv` | `consumption_items` | One-time / on-change |
| **Pass-Through Register**| `scripts/ingest_pass_through.py` | Built-in verified elasticity rules | `pass_through_records` | One-time / on-change |
| **MoSPI CPI Series** | `scripts/ingest_cpi_series.py` | `data/curated/cpi_2024_general_index_monthly_2026_01_to_08.csv` | `time_series_observations` | Monthly batch / idempotent |
| **PPAC Crude Snapshots**| `scripts/ingest_ppac_snapshots.py` | `data/curated/ppac_indian_basket_public_archive_snapshots_2026_01_to_02.csv` | `time_series_observations` | Daily/weekly batch / idempotent |
| **HCES Personas** | `scripts/extract_hces_personas.py`| `data/curated/hces-2023-24-personas.csv` | `hces_personas` (or curated CSV) | Benchmark release |

---

## 8. Required Secrets & Accounts Audit

- **MoSPI Public Portal:** No API key required for press releases and catalogue files.
- **PPAC Public Archives:** Open public access via HTTPS. No credentials needed.
- **MoSPI Microdata Portal (NADA):** Unit-level microdata requires researcher login and signed declaration. Raw microdata must reside in private local folders and never be committed to Git.
- **Local Database:** Uses existing PostgreSQL connection credentials configured in `backend/.env`. No new external database service or cloud accounts required.

---

## 9. Automated Testing & Acceptance Criteria

### Test Strategy
1. **Schema Integrity Tests:** Verify foreign key constraints, primary keys, and unique indexes on all tables.
2. **Idempotence Tests:** Ingesting the same dataset twice must result in `0` duplicates and return `skipped_count == total_rows`.
3. **Missing-Data & Status Parity:** Ensure provisional flags are tracked and unobserved intervals produce `null` rather than zero-filled figures.
4. **Synthetic Test Fixtures:** Tests must use synthetic test records (e.g. `TEST-CPI-2026-99`) and execute cleanup inside transaction rollbacks without polluting production rows.

### Acceptance Criteria
- [ ] All 5 Alembic migrations applied cleanly to PostgreSQL.
- [ ] `time_series_observations` populated with the 24 verified CPI rows and 31 PPAC crude oil snapshots.
- [ ] Endpoints `GET /time-series/cpi` and `GET /time-series/crude-oil` query PostgreSQL directly with CSV fallback.
- [ ] All 246 existing backend regression tests continue to pass.

---

## 10. Ordered Milestones & Immediate Next Step

1. **Milestone 1 (Immediate Next Step):** Apply pending Alembic migrations (`4c2b7f8e31b4`, `7d1a2f9b84e3`, `9e2f4a1b7c85`, `8a3f5c2d9e14`) to PostgreSQL and seed initial registries (`data_sources`, `consumption_items`, `pass_through_records`).
2. **Milestone 2:** Create SQLAlchemy models and Alembic migration for `time_series_definitions` and `time_series_observations`.
3. **Milestone 3:** Implement idempotent ingestion scripts for CPI and PPAC crude datasets with unit tests.
4. **Milestone 4:** Refactor `backend/app/api/time_series.py` to query PostgreSQL observations while retaining CSV fallback.
5. **Milestone 5:** Connect scenario calculation engine to real historical intervals, allowing users to evaluate actual historical price surges alongside synthetic stress tests.
