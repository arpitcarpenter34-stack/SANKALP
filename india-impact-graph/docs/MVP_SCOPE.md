# India Impact Graph: MVP Scope & Boundaries

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Product Specification & MVP Scope Agreement  
> **Status:** Final Scope Baseline — No unapproved feature expansion  

---

## 1. Executive Summary

The **India Impact Graph** MVP is an evidence-first prototype designed to convert unstructured financial news into an interactive dependency graph and calculate a transparent, receipt-backed monthly spending impact range for an Indian household archetype.

---

## 2. Scope Decisions Matrix [DECISION]

| Domain | Included in MVP | Boundary / Non-Negotiable Rule |
| :--- | :--- | :--- |
| **Market** | India-focused macro-to-micro view (Global $\rightarrow$ National $\rightarrow$ State $\rightarrow$ Household Persona). | Do **not** claim city-level, district-level, or individual household predictions. |
| **Geographic Scope (States)** | **Madhya Pradesh** (default primary state) plus up to **two** additional states (if and only if verified official expenditure data is accessible). | If state-level breakdown is missing for an item, show *"Data not available"*; do not interpolate or invent data. |
| **Persona Architecture** | 3 State options $\times$ Rural/Urban $\times$ 3 Expenditure Classes (Low, Middle, High). | Use the official term **"Expenditure Class"** (based on HCES MPCE fractiles), never "Income". Personas represent demographic groups, not real people. |
| **Expenditure Items** | 8 to 10 candidate consumption items: Petrol, Diesel, LPG, Edible Oil, Cereals/Wheat, Pulses, Sugar, Vegetables, Electricity, Gold. | Compute monetary impact **only** for the 3–4 items where expenditure share and verified pass-through factors exist. All others display *"Data not available"*. |
| **Event Scenarios** | Primary: **Crude Oil Price Shock (+12%)**. Backup: **Edible Oil or Wheat Price Spike**. | The +12% crude shock is a **hypothetical scenario** for demo purposes unless matched to a dated historical shock. Must be clearly labeled as such. |
| **News Input Strategy** | **3 saved/cached articles/documents** per event scenario. Option to paste arbitrary text. | **No live news feed or continuous scraping required.** Always display the active source count. |
| **Household Size Conversion** | Report results as **Per Capita (Per Person)** by default. If converted to a household total, only use official verified average household size data. | Never silently multiply per-capita spending by an invented family size. Explicitly state conversion assumptions. |
| **CPI Series Standard** | Use the applicable official series and metadata. MoSPI transitioned base year from 2012 to 2024 (effective Jan 2026). | **Do not silently mix 2012-base and 2024-base series.** Label historical series explicitly. |

---

## 3. Tiered Feature Prioritization (P0 to P3)

### Priority P0: Must Build (Core MVP - Essential for Hackathon Demo)
1. **News/Scenario Input & Schema Extraction:** Paste or select an article; parse structured fields (event, magnitude, geography, entities, evidence quotes) into validated JSON.
2. **Interactive Knowledge Graph:** Visual rendering of nodes and directional edges, enforcing solid lines for observed relationships and dashed lines for inferred relationships.
3. **Three Propagation Paths:** Distinct interactive highlighting for Food-Cost, Transport, and Financial-Market chains. Incomplete paths openly display missing edges.
4. **Number-Level Evidence Receipts:** Interactive modal/drawer on every edge or key number showing publisher, survey table, date, unit, formula, and uncertainty.
5. **Persona Selector & Impact Card:** State, sector, and class selectors calculating a low-to-high rupee monthly spending range for eligible items.
6. **Data Integrity States:** Explicit *"Data not available"* banners for unverified parameters; zero hallucinated numbers.

### Priority P1: Core Differentiators (Build only after P0 is 100% stable)
7. **Time-Series Comparative Chart:** Visual historical co-movement chart comparing global crude oil with domestic fuel or CPI sub-indices with units and caveats.
8. **AI-Off Proof Toggle:** User toggle that completely disables the LLM; verifies that numbers, graph structures, and paths remain identical.
9. **News Consensus Meter:** Comparative panel cross-referencing up to 3 saved sources per event, displaying shared consensus and points of conflict.

### Priority P2: Nice to Have (If time permits)
10. **Historical Backtest:** Validation against a dated historical commodity spike (e.g., 2022 crude spike using the 2012-base CPI series).
11. **Secondary Event Execution:** Interactive demo of the backup event (Edible Oil or Wheat shock).
12. **Rule-Based "What to Watch" Notes:** Non-advisory forward-looking indicators (e.g., upcoming MPC meeting dates, monsoon sowing updates).

### Priority P3: Polish & Presentation
13. **UI Export:** Clean export of persona impact summary as formatted JSON or print-ready PDF.
14. **Dark Mode:** Aesthetic toggle after all data pipelines and evaluation tests pass.

---

## 4. Explicitly Out of Scope [OUT OF SCOPE]

To prevent scope creep and ensure delivery within the hackathon window, the following are strictly **forbidden**:
* **Live News Scraping / Streaming:** No WebSockets, Twitter/X scrapers, RSS background bots, or news APIs requiring live keys during the pitch.
* **User Accounts & Personal Profiling:** No user logins, passwords, authentication tokens, salary inputs, or collection of personally identifiable information (PII).
* **Granular Micro-Targeting:** No city-level, ward-level, or pin-code-level claims (official expenditure surveys exist only at state/sector levels).
* **Financial Trading Advice:** No stock price prediction algorithms, trading bots, buy/sell signals, or brokerage integrations (Zerodha, Groww, etc.).
* **Custom Model Training:** No fine-tuning LLMs, training PyTorch neural networks from scratch, or multi-agent orchestration frameworks (e.g., CrewAI/AutoGen).
* **General Equilibrium Macro Simulations:** No complex econometric dynamic stochastic general equilibrium (DSGE) forecasting.

---

## 5. MVP Boundary Statement

> **The system explains plausible impact pathways and grounds them in official evidence.**  
> **It does not promise that an asset price will move, guarantee a financial outcome, or claim that a single headline is the sole cause of macroeconomic shifts.**
