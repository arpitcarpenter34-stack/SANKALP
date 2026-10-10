# India Impact Graph: Feature Priorities & Dependency Map

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Feature Architecture, Prioritization & Build Sequence  
> **Status:** Architecture Agreement — Build P0 first before P1  

---

## 1. Feature Priority Matrix

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        BUILD DEPENDENCY HIERARCHY                      │
│                                                                        │
│    [P0: Must Build - Core Flow] ────────────────────────┐              │
│    • News Extraction ──► Curated Graph ──► Calculator   │              │
│    • Receipts Panel & Integrity States                  │              │
│                          │                                             │
│                          ▼ (Only when P0 is 100% verified & tested)    │
│    [P1: Core Differentiators] ──────────────────────────┤              │
│    • Time-Series Co-movement Chart                      │              │
│    • AI-Off Proof Toggle                                │              │
│    • News Consensus Meter                               │              │
│                          │                                             │
│                          ▼ (Only if time permits)                      │
│    [P2: Nice-to-Have] ───┴──────────────────────────────┤              │
│    • Historical 2022 Backtest                           │              │
│    • Backup Event (Edible Oil)                          │              │
│    • "What to Watch" Notes                              │              │
│                          │                                             │
│                          ▼ (Final 2 hours polish)                      │
│    [P3: UI Polish] ─────────────────────────────────────┘              │
│    • Export Summary & Dark Mode                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Priority P0: Must Build (Core MVP)

These 6 features constitute the minimum viable demonstration required by Problem Statement 5.

### 1. News/Scenario Input & Schema Extraction
* **Rationale:** PS 5 requires detecting financial events from unstructured text.
* **Definition of Done:** User can paste news text or select the primary +12% crude oil scenario; system outputs a validated JSON payload adhering to `schemas/event-extraction-schema.json`.

### 2. Interactive Knowledge Graph
* **Rationale:** Visualizes multi-step transmission instead of isolated news stories.
* **Definition of Done:** Nodes (Commodity, Household Item, Indicator, Sector, Asset, Persona) rendered with clear visual distinction; observed links use solid strokes and inferred links use dashed strokes.

### 3. Three Propagation Paths
* **Rationale:** Shows how a shock flows into food, transport, and capital markets.
* **Definition of Done:** Dedicated path highlights for Path A (Food), Path B (Transport), and Path C (Financial Markets). Missing edges visibly show *"unverified"*.

### 4. Clickable Evidence Receipts
* **Rationale:** Our #1 differentiator: no unsupported black-box assertions.
* **Definition of Done:** Clicking an edge or number opens a panel displaying publishing authority, survey table, date, unit, formula, and uncertainty caveats.

### 5. Persona Selector & Impact Card
* **Rationale:** Connects macroeconomic events directly to everyday household expenditure.
* **Definition of Done:** Allows selecting State (Madhya Pradesh), Sector (Rural/Urban), and Expenditure Class (Low/Middle/High); calculates low-to-high monthly rupee impact range for eligible items.

### 6. Strict Data Integrity States
* **Rationale:** Prevents hallucinated numbers and ensures scientific credibility.
* **Definition of Done:** Missing pass-through or price data is explicitly rendered as *"Data not available"*; no hidden zeros, no synthetic extrapolations.

---

## 3. Priority P1: Core Differentiators (Strategic Moat)

*Build only after all P0 features work end-to-end without errors.*

### 7. Comparative Time-Series Chart
* **Definition of Done:** Displays historical international crude oil prices against domestic retail fuel/CPI indices with clear caveats that co-movement $\ne$ causation.

### 8. AI-Off Proof Toggle
* **Definition of Done:** Interactive UI toggle disabling the LLM. Demonstrates that knowledge graph traversal, receipts, and numerical calculations produce identical results with AI turned off.

### 9. News Consensus Meter
* **Definition of Done:** Compares 3 cached articles covering the event, highlighting agreed metrics and reporting disagreements without assuming consensus equals truth.

---

## 4. Priority P2 & P3: Contingent Features

* **P2: Historical Backtest:** Runs the model against the 2022 crude spike using the 2012-base CPI series (strictly labeled as old series).
* **P2: Backup Event:** Secondary demo for an Edible Oil or Wheat supply shock.
* **P2: Rule-Based "What to Watch" Notes:** Non-advisory forward indicators (e.g., upcoming MPC meeting dates).
* **P3: Export & Dark Mode:** PDF/JSON export and dark UI styling, implemented only in the final hours if all acceptance criteria pass.
