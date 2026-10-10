# India Impact Graph: Data and Evidence Governance Rules

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Data Integrity, Evidence Standards & Provenance Protocol  
> **Status:** Mandatory Data Architecture Rules  

---

## 1. Core Data Principles

1. **Evidence Before Confidence:** A claim is only as strong as its underlying source. If a relationship has weak evidence, show low confidence rather than assertive rhetoric.
2. **Data Before Numbers:** AI may read and synthesize text. It must **never** invent prices, expenditure weights, pass-through elasticities, or rupee figures.
3. **No Phantom Precision:** If data exists only at the broad group level (e.g., "Vegetables"), do not fabricate figures for specific sub-items (e.g., "Bhindi" or "Shimla Mirch"). Disclose the exact level of granularity.
4. **Missing Data is a Valid State:** Showing *"Data not available"* communicates rigor and builds trust; hallucinating a number destroys credibility.

---

## 2. Standard Status Classifications

Every entity, relationship, dataset, and code assumption in the India Impact Graph project must carry one of these standardized labels:

| Label | Full Name | Definition & Rule |
| :---: | :--- | :--- |
| **`[PS]`** | Official Requirement | Explicitly specified in the Hackwave 3.0 Problem Statement 5 prompt. Must be implemented as required. |
| **`[DECISION]`** | Team Product Choice | An architectural or scope boundary chosen by our team (e.g., India focus, MP default state, 3 saved articles). |
| **`[VERIFIED]`** | Confirmed Source | Sourced from a verified public document (e.g., MoSPI HCES 2023–24 Factsheet, PPAC retail report) with confirmed table, year, and unit. |
| **`[VERIFY]`** | Needs Verification | A proposed dataset, table, number, or external API that must be independently validated before feeding any calculation. |
| **`[INFERENCE]`** | Plausible Hypothesis | An economic transmission relationship or causal explanation that is plausible but not directly observed in the primary source document. |
| **`[OUT OF SCOPE]`** | Excluded | Explicitly forbidden from the MVP to preserve focus (e.g., live scrapers, stock price predictions, user accounts). |

---

## 3. The Number Receipt Specification

Every displayed figure—whether an MPCE expenditure baseline, a commodity shock percentage, a pass-through coefficient, or a final rupee impact—must have a clickable **"Source Receipt"**.

```text
┌────────────────────────────────────────────────────────┐
│                   SOURCE RECEIPT                       │
├────────────────────────────────────────────────────────┤
│ Metric Name:       Diesel Freight Pass-Through Factor  │
│ Value:             0.35 to 0.48                        │
│ Unit:              Elasticity Coefficient (Dimensionless)│
│ Date / Vintage:    2023-24                             │
│ Geography:         All India (Interstate Trucking)     │
│ Source Title:      RBI Monthly Bulletin / Working Paper│
│ Series / Table ID: Table 4 - Transport Cost Elasticity │
│ Direct Link / Ref: rbi.org.in/bulletin/2023/wps04       │
│ Governance Status: [VERIFIED]                          │
│ Formula Applied:   ΔRetail = ΔCrude × PassThrough       │
│ Counter-Factors:   State VAT changes, Toll hikes       │
└────────────────────────────────────────────────────────┘
```

### Mandatory Receipt Fields
1. **Metric / Item Name:** Exact descriptive title.
2. **Value & Unit:** The numerical quantity and standard unit (INR, %, USD/bbl, fractile).
3. **Date / Vintage:** Specific publication month/year or survey round.
4. **Geography:** Spatial validity boundary (Global, All-India, Madhya Pradesh, Urban/Rural).
5. **Publishing Authority:** Official organization name (MoSPI, PPAC, RBI, World Bank).
6. **Table / Document Identifier:** Exact table number, bulletin section, or file name.
7. **Verification Status:** `[VERIFIED]`, `[VERIFY]`, or `[INFERENCE]`.
8. **Formula & Calculation Inputs:** If derived, the exact mathematical formula and variable values used.
9. **Caveats & Failure Modes:** Known structural limitations or potential breakdown scenarios.

---

## 4. The Three Non-Interchangeable Source Types

A major flaw in naive financial graph applications is treating all text equally. In India Impact Graph, sources are categorized into three distinct tiers:

```text
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│     1. NEWS ARTICLES    │     │  2. OFFICIAL DATASETS   │     │ 3. EMPIRICAL STUDIES    │
├─────────────────────────┤     ├─────────────────────────┤     ├─────────────────────────┤
│ • Reports what happened │     │ • Provides measured,    │     │ • Supplies transmission │
│ • Documents breaking    │     │   audited historical    │     │   mechanisms, elastic-  │
│   events & sentiment    │     │   quantities & weights  │     │   ities, & formulas     │
│ • Example: Reuters, ET  │     │ • Example: MoSPI, PPAC  │     │ • Example: RBI, NIPFP   │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

* **News Articles:** Establish what was reported (the trigger event and immediate observations). News reports **cannot** be used as authoritative baselines for household expenditure shares.
* **Official Datasets:** Establish measured benchmark quantities (MPCE baselines, CPI weights, actual retail pump prices).
* **Empirical Studies:** Establish structural transmission mechanisms and pass-through elasticities.

---

## 5. Correlation vs. Causation Warning

A time-series chart showing two lines moving together (e.g., international crude oil prices and domestic mandi tomato prices) does **not** prove that crude oil caused tomato inflation.

* Any comparative time-series visualization in Priority P1 must prominently display a disclaimer:  
  *`"Caution: Parallel time-series trends show co-movement, not direct causality. Agricultural prices are heavily influenced by monsoon rainfall, crop disease, and seasonal cycles alongside transport fuel costs."`*
