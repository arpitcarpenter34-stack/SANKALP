# Data Directory (`data/`)

This directory is the data backbone for the **India Impact Graph** project. Following our core project principle—**"Evidence before confidence. Data before numbers"**—this directory stores raw, processed, and curated datasets with strict provenance tracking.

---

## Directory Organization

```text
data/
├── raw/             # Unaltered official downloads and original source dumps
├── processed/       # Cleaned, standardized, and mapped datasets (e.g., converted units, filtered subsets)
├── curated/         # Verified baseline knowledge graph relations, persona tables, and pass-through factors
└── templates/       # Standard CSV schema headers for data collection and verification
    ├── data-source-register.csv
    ├── household-persona-template.csv
    ├── pass-through-register.csv
    └── cached-articles-catalog.csv
```

---

## Subdirectory Guidelines

### 1. `raw/`
* **Purpose**: Houses original, immutable source files directly downloaded from official portals (MoSPI, PPAC, RBI, World Bank, etc.).
* **Rule**: Never edit files in `raw/` directly. Always preserve the original download timestamp and file name.

### 2. `processed/`
* **Purpose**: Intermediate datasets produced by deterministic extraction or cleaning scripts.
* **Rule**: All processed files must include provenance columns: `source_name`, `source_year`, `dataset_version`, and `unit`.

### 3. `curated/`
* **Purpose**: High-confidence, peer-reviewed baseline data that the knowledge graph engine and calculator rely on.
* **Rule**: Any data committed here must carry a status label: `[VERIFIED]` with confirmed citations. No AI-generated estimations are allowed here.

### 4. `templates/`
* **Purpose**: Standard schema header templates to ensure team members collect and format datasets uniformly:
  * `data-source-register.csv`: Tracks candidate and verified data sources.
  * `household-persona-template.csv`: Standard format for HCES MPCE persona definitions across states, sectors, and fractile classes.
  * `pass-through-register.csv`: Tracks empirical pass-through factors with lower and upper bounds, lag times, and study citations.
  * `cached-articles-catalog.csv`: Metadata registry for cached news articles and scenario briefings.

---

## Non-Negotiable Data Rules

1. **No Hallucinated or Invented Data**: If an official figure or weight is not found in verified government releases, it must remain explicitly labeled **`Data not available`**. Never interpolate with synthetic numbers.
2. **Every Number Needs a Receipt**: Every number must be traceable to its original table, publisher, publication date, unit, and geographic boundary.
3. **CPI Series Integrity**:
   * Old series: Base year 2012 (runs through December 2025; 299 items).
   * New series: Base year 2024 (effective January 2026; 358 items; based on HCES 2023–24).
   * **Rule**: Do not mix or compare the 2012-base and 2024-base series directly without applying and citing the official MoSPI linking factor and back-series methodology.
4. **Reach vs. Impact Separation**:
   * *Reach* indicates the proportion of households consuming an item.
   * *Impact* indicates the change in rupees on consuming households.
   * Never merge reach and monetary impact into a misleading single index.
5. **Per-Capita vs. Household Integrity**:
   * HCES figures are Monthly Per Capita Consumption Expenditure (MPCE).
   * Do not silently multiply MPCE by an arbitrary household size unless supported by verified official average household size tables. Disclose limitations explicitly.
