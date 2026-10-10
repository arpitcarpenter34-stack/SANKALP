# India Impact Graph: Project Understanding Document

> **Hackwave 3.0 (Indore)** | **Problem Statement 5: Autonomous Financial Event Market Impact Graph**  
> **Product Name:** India Impact Graph  
> **Tagline:** *From Global News to Your Household Budget*  
> **Document Version:** 1.0 (10 October 2026)  
> **Status:** Foundational Architecture & Project Understanding — Not Implementation Code  

---

## 2-Minute Quick Brief for New Teammates (Non-Technical Summary)

> **What are we building?**  
> When global news breaks—such as *"Crude oil spikes by 12%"*—most people see it as an abstract financial event or an isolated headline. In reality, global events create a domino effect: expensive oil increases diesel prices, higher diesel raises truck transport freight, freight increases retail vegetable and food costs, and ultimately, a household in Indore or Bhopal sees their monthly kitchen grocery bill go up.
>
> **India Impact Graph** takes a financial news story, builds a visual graph showing how that event travels across commodities, sectors, inflation indices, and everyday items, and estimates the realistic monthly rupee impact range for a typical Indian family (e.g., a middle-class urban or rural household in Madhya Pradesh).
>
> **Our Golden Rule:**  
> **"AI reads and explains. Verified data and formulas calculate the numbers."**  
> Every number has a clickable source receipt (official government survey like MoSPI HCES or PPAC). If reliable data is missing, we openly display *"Data not available"* rather than letting an AI make up numbers.

---

## 1. Project Context & Official Problem Statement

### 1.1 Hackathon Metadata
* **Hackathon:** Hackwave 3.0, Indore
* **Track / Problem Statement:** PS 5 — *Autonomous Financial Event Market Impact Graph*
* **Team:** SANKALP

### 1.2 Official Problem Statement [PS]
> *"Financial events rarely affect a single company. A geopolitical event, commodity shock, interest-rate decision or regulatory change can propagate through sectors and financial instruments. Many systems show news as isolated stories rather than connected chains of impact.*  
> *The challenge: build an AI system that converts unstructured financial information into a dynamic dependency graph, showing how an event may influence economic variables, sectors and assets."*

### 1.3 What the Official PS Requires [PS]
1. Detect financial events from unstructured natural language text.
2. Extract entities: companies, commodities, sectors, economic indicators, and financial instruments.
3. Identify and score relationships between extracted entities.
4. Construct and dynamically update a knowledge graph.
5. Estimate plausible propagation paths and identify affected assets.
6. Incorporate time-series data where available.
7. Explain each impact chain and provide the evidence behind each link.
8. Distinguish observed facts from inferred relationships, and communicate uncertainty rather than making unconditional predictions.

### 1.4 What the Official PS Leaves Open (Our Scope Decisions) [DECISION]
The official prompt does **not** specify:
* Target end-user persona
* Geographic market (Global vs. India-focused)
* Specific technology stack or framework
* Specific LLM or machine learning models
* Specific datasets, APIs, or evaluation metrics

---

## 2. Deep Hinglish Explanation (सरल भाषा में प्रोजेक्ट की समझ)

### 2.1 Asli Samasya Kya Hai? (The Real Problem)
Aamtaur par news media ya financial portals alag-alag articles dikhate hain:
* Article 1: *"Crude oil jumps 12% due to Middle East tensions"*
* Article 2: *"Transporters threaten freight hike"*
* Article 3: *"Vegetable prices hit 6-month high in retail mandis"*
* Article 4: *"Bank Nifty slips as inflation fears rise"*

Ek aam insaan ya retail investor in chaaron khabron ko alag-alag dekhta hai. Koi bhi tool aisi chains ko aapas me jodkar nahi dikhata ki **pehle step se lekar aakhri step tak asar kaise phaila**, aur na hi ye batata hai ki **Indore ya Bhopal me rehne wale ek aam parivar ke monthly kharche par iska kitne rupaye ka asar padega**.

### 2.2 Technical Terms Ka Saral Hinglish Matlab
1. **Financial Event (वित्तीय घटना):** Koi badi aarthik ya geopolitical ghatna, jaise kacche tel (crude oil) ka rate 12% badhna, RBI ka repo rate badhana, ya government ka import duty badalna.
2. **Entity (इकाई / चीज़):** Economy me maujood koi specific cheez—jaise commodity (Crude Oil, Diesel), household item (Sabzi, Edible Oil), indicator (CPI Inflation), sector (Logistics, Banking), ya index (Nifty 50).
3. **Knowledge Graph (ज्ञान ग्राफ):** Ek digital network jisme **Nodes** (entities/cheezein) hoti hain aur unke beech ki kadiyon ko **Edges** (relationships) kehte hain.
4. **Propagation Path (प्रसार मार्ग):** Asar ka rasta—jaise Crude Oil $\rightarrow$ Diesel $\rightarrow$ Freight Rates $\rightarrow$ Retail Food $\rightarrow$ Ghar ka budget.
5. **Observed vs. Inferred (देखा गया तथ्य बनाम अनुमान):**
   * *Observed (Solid Line):* Jo baat news article me seedhe-seedhe likhi hai ya sarkari data me measured hai (e.g., "Crude rose by 12%").
   * *Inferred (Dashed Line):* Jo economic logic ya historical correlation par aadharit anumaan hai (e.g., diesel badhne se sabzi par asar pad sakta hai, par kitna padega ye local conditions par nirbhar karta hai).
6. **Supporting Evidence & Uncertainty (सबूत और अनिश्चितता):** Har claim ke piche sarkari report (MoSPI/PPAC) ka source hona chahiye. Agar data nahi hai, to AI ko mann-marzi se number nahi banane dena hai; seedhe *"Data not available"* bolna hai.
7. **Pass-through Factor (पास-थ्रू दर):** Global price badhne par Indian retail bazaar me kitna hissa reflect hota hai. Agar global crude 12% badha, to Indian petrol/diesel 12% nahi badhta kyunki uspar fixed taxes aur government subsidies hoti hain.

---

## 3. Product Vision & The Four USP Pillars

### 3.1 Product Vision
**India Impact Graph** turns financial events into an interactive, evidence-backed dependency graph, linking macroeconomic shocks to a transparent monthly rupee impact range for representative Indian household personas.

### 3.2 Pitch Line
> *"From global news to your household budget. Every number comes with an official receipt, and AI reads and explains — it never does the maths."*

### 3.3 The Four Core USPs (Unique Selling Propositions)

| USP Pillar | What the User Experiences | Why It Matters (Strategic Moat) |
| :--- | :--- | :--- |
| **1. Receipt-Backed Numbers** | User clicks any number on screen to inspect its source, publishing authority, dataset/table name, survey year, unit, and exact formula. | Eliminates black-box AI hallucinations. Unsupported values are marked *"Data not available"*, establishing unmatched trust. |
| **2. Persona Impact Card** | Displays estimated extra monthly spending in rupees (low-to-high range) for a specific archetype: State + Rural/Urban + Expenditure Class (e.g., MP Rural Middle-Class). | Converts abstract economic percentages (e.g., "CPI inflation +0.4%") into visceral, household-relevant financial reality. |
| **3. News Consensus Meter (P1)** | Compares up to 3 saved news sources for an event, displaying agreed facts, conflicting claims, and source URLs. | Teaches users that media consensus is not absolute proof; separates observed statements from speculative reporting. |
| **4. AI-Off Proof (P1)** | An interactive UI toggle that completely disables the LLM. All graph nodes, paths, and calculated rupee numbers remain 100% identical. | Empirically proves to hackathon judges that the AI is purely a linguistic interface (reader/explainer), not a mathematical black box. |

---

## 4. End-to-End Conceptual Processing Pipeline

The system follows a strict, sequential pipeline where AI and deterministic modules are strictly demarcated:

```text
[1. User Input / News Scenario]
       │
       ▼
[2. Reader Module (LLM + JSON Schema Validation)]
       │ (Extracts: Event Type, Magnitude, Date, Geography, Entities, Evidence Quotes)
       ▼
[3. Curated Graph Matching (Deterministic Base KG)]
       │ (Maps extracted entities to vetted nodes & verified relationships)
       ▼
[4. Path Finder (Deterministic Graph Traversal)]
       │ (Ranks and highlights plausible propagation chains: Paths A, B, C)
       ▼
[5. Household Impact Calculator (Deterministic Formula)]
       │ (Persona MPCE × Item Expenditure Share × Shock % × Pass-Through Factor)
       ▼
[6. Explainer Module (Constrained LLM)]
       │ (Generates natural language narrative STRICTLY grounded in retrieved evidence)
       ▼
[7. Interactive UI & Receipts Panel]
       │ (Graph visualization, Persona Card, Number Receipts, AI-Off Toggle)
```

### Module Responsibilities: The Golden Rule

| Stage / Component | Handled By | Absolute Constraint |
| :--- | :--- | :--- |
| Entity & Event Extraction | LLM (Reader) + JSON Schema Validator | Cannot invent entities not present in text; missing fields remain null. |
| Base Graph Relationships | Static Curated Knowledge Graph (CSV/JSON) | Only verified economic dependencies; no dynamic hallucinated links. |
| Propagation Path Discovery | Deterministic Graph Algorithm (BFS/Dijkstra/DFS) | Ranks paths by edge confidence; never connects unsupported gaps. |
| Expenditure & Impact Math | Deterministic Formula Logic (Python/JS) | **The LLM is completely forbidden from calculating or adjusting numbers.** |
| Contextual Explanation | LLM (Explainer) constrained by Prompt | Can only explain using provided facts and retrieved official metadata. |
| Time-Series & Charts | Charting Engine (Plotly/ECharts/D3) | Plots raw historical series directly from verified records. |

---

## 5. Knowledge Graph Specifications

### 5.1 The 6 Required Node Types
1. **Commodity:** Raw goods traded globally or domestically (e.g., Crude Oil, Diesel, Edible Oil, Wheat).
2. **Household Expenditure Item:** Consumption goods consumed by Indian families (e.g., Cereals, Vegetables, Cooking Gas/LPG, Transport Fuel, Electricity).
3. **Economic Indicator:** Macroeconomic statistics (e.g., Consumer Price Index - CPI, Headline Inflation, Food Inflation).
4. **Sector:** Key economic industry segments (e.g., Transport & Logistics, Agriculture, Banking & NBFCs, Real Estate).
5. **Instrument / Asset:** Financial securities or indices (e.g., Nifty 50, Bank Nifty, 10-Year G-Sec Yield).
6. **Persona:** Archetypal household expenditure groups (e.g., Madhya Pradesh Rural Middle-Class).

### 5.2 Edge Types & Visual Hierarchy
* **Observed Edges (`solid line`):** Directly stated in the analyzed text or directly measured in an identified official dataset (e.g., "Brent crude price increased by 12%").
* **Inferred Edges (`dashed line`):** Economically plausible relationships derived from curated economic linkages, historical correlations, or literature (e.g., "Higher freight rates push retail vegetable prices higher").
* **Edge Attributes:** Every edge must contain:
  `id`, `from`, `to`, `relation_type`, `kind` (observed/inferred), `direction` (positive/negative), `strength` (if quantified), `confidence` (low/medium/high), `evidence_text`, `source_receipt`, and `what_could_be_wrong`.

### 5.3 The Three Core Propagation Paths

#### Path A: Household Food-Cost Chain
$$\text{Crude Oil} \xrightarrow{\text{refining}} \text{Diesel} \xrightarrow{\text{operational cost}} \text{Freight / Logistics} \xrightarrow{\text{mandi transport}} \text{Food / Vegetables} \xrightarrow{\text{kitchen basket}} \text{Household Budget}$$
* **Evidence Caveat:** Freight pass-through to retail vegetable prices is non-linear and depends on transport contracts, profit margins, seasonality, and local supply gluts.

#### Path B: Household Transport Chain
$$\text{Crude Oil} \xrightarrow{\text{refining}} \text{Petrol / Motor Spirit} \xrightarrow{\text{pump price}} \text{Commuting Cost} \xrightarrow{\text{personal mobility}} \text{Household Budget}$$
* **Evidence Caveat:** Indian retail fuel prices do not adjust one-for-one with global crude due to domestic excise duty buffers, state VAT structures, and oil marketing company (OMC) pricing freezes.

#### Path C: Financial-Market Chain
$$\text{Crude Oil} \xrightarrow{\text{import bill}} \text{Inflation Expectations} \xrightarrow{\text{monetary stance}} \text{RBI Policy Rates} \xrightarrow{\text{cost of funds}} \text{Banks / Real Estate} \xrightarrow{\text{market repricing}} \text{Stock Indices (Nifty)}$$
* **Evidence Caveat:** These are conditional macroeconomic transmission channels. A rise in oil does not guarantee an immediate rate hike or equity market selloff; fiscal policy and corporate margins absorb shocks over varying horizons.

---

## 6. Household Impact Calculator Specification

### 6.1 Mathematical Formulation
The impact calculator is strictly deterministic:

$$\text{Item Spending (INR)} = \text{Persona MPCE} \times \text{Item Expenditure Share}$$

$$\text{Item Impact (INR/month)} = \text{Item Spending} \times \text{Event Shock \%} \times \text{Pass-Through Factor}$$

$$\text{Total Household Impact Range} = \left[ \sum_{i \in \text{Eligible}} \text{Item Impact}_{\text{low}, i}, \; \sum_{i \in \text{Eligible}} \text{Item Impact}_{\text{high}, i} \right]$$

### 6.2 Key Input Variables & Definitions
1. **Persona MPCE (Monthly Per Capita Consumption Expenditure):** Sourced from official MoSPI HCES 2023–24 fractile expenditure tables for specific state and rural/urban sector.
2. **Item Expenditure Share:** The percentage weight of that item category in the persona's consumption basket (from HCES 2023–24 or CPI basket weights).
3. **Event Shock %:** Magnitude extracted from news or selected scenario (e.g., +12% crude oil).
4. **Pass-Through Factor:** The proportion of upstream price fluctuation transmitted into Indian domestic retail prices (e.g., 0.15 to 0.35 for fuel-to-retail).
5. **Household Size Conversion:** If calculating total household spending, only use official verified average household size (e.g., ~4.4 persons). If not verified, **output must be clearly labeled "Per Capita (Per Person)"**.

### 6.3 Crucial Rules for the Calculator
* **A +12% crude shock NEVER means a +12% increase in petrol, diesel, or groceries.**
* Pass-through is applied **only once** per chain; cascading compounding is avoided in the MVP to prevent distortion.
* Items without verified pass-through data must display **`Data not available`**—never substituted with zero or AI estimates.
* Always report **Item Coverage**: e.g., *"Calculated across 3 of 10 candidate items; 7 items uncalculated due to missing pass-through factors."*

### 6.4 CPI Series Integrity (2012 Base vs. 2024 Base)
* **2012 Base Series:** Ran until December 2025; basket of 299 items.
* **2024 Base Series:** Effective January 2026; basket expanded to 358 items based on HCES 2023–24.
* **Rule:** The two series cannot be directly combined. If using historical backtesting from 2022–2024, explicitly label it *"Old 2012 Series"*. Do not blend them without official MoSPI linking factors.

---

## 7. MVP Scope & Boundaries

### 7.1 Scope Decisions Matrix [DECISION]

| Domain | Included in MVP | Strict Boundary / Rule |
| :--- | :--- | :--- |
| **Market** | India-focused (Global $\rightarrow$ National $\rightarrow$ State $\rightarrow$ Household) | No city-level claims; no individual household forecasting. |
| **States** | Madhya Pradesh (Default) + up to 2 additional states | Only add states if official HCES/CPI tables are verified. Otherwise show *"Data not available"*. |
| **Persona Archetypes** | State $\times$ Rural/Urban $\times$ Low/Middle/High Expenditure Class | Use *"Expenditure Class"* (based on MPCE fractiles), never *"Income"*. |
| **Candidate Items** | 8 to 10 items: Petrol, Diesel, LPG, Edible Oil, Cereals, Pulses, Sugar, Vegetables, Electricity, Gold | Calculate monetary impact only for the 3–4 items with verifiable pass-through factors. |
| **Primary Event** | Hypothetical Crude Oil Price Shock (+12%) | Must be explicitly labeled as a scenario unless matched to a dated historical date. |
| **Backup Event** | Edible Oil or Wheat Price Spike | Whichever has the strongest verifiable historical data. |
| **News Input** | 3 saved/cached articles/documents per event | No live news scraping required during hackathon evaluation. |

### 7.2 Explicitly Out of Scope [OUT OF SCOPE]
* Live news streaming or continuous background scrapers
* User authentication, user accounts, and personal financial data collection
* Real individual financial planning or city-level predictions
* Stock price forecasting, trading algorithms, or Buy/Sell/Hold recommendations
* Custom-trained LLM models, fine-tuning, or multi-agent orchestration frameworks
* Complex quantitative general-equilibrium simulations

---

## 8. Feature Priorities (P0 to P3)

```text
[P0: Must Build - Core MVP]
├── 1. News/Scenario Input & Schema Extraction
├── 2. Interactive Knowledge Graph (Observed vs Inferred visual distinction)
├── 3. Three Proposed Propagation Paths (Food, Transport, Financial Market)
├── 4. Clickable Evidence Receipts (Source, Table, Year, Unit, Formula)
├── 5. Persona Selector & Impact Card (MP Rural/Urban, Rupee range)
└── 6. Strict Data Integrity States ("Data not available" for missing items)
      │
      ▼
[P1: Core Differentiators - Only after P0 is stable]
├── 7. Comparative Time-Series Chart (Crude oil vs domestic series)
├── 8. AI-Off Proof Toggle (Verifies numbers don't depend on LLM)
└── 9. News Consensus Meter (Cross-references 3 cached articles)
      │
      ▼
[P2: Nice to Have - If time permits]
├── 10. Historical Backtest on past event (e.g. 2022 crude spike)
├── 11. Second Event (Edible oil or wheat shock)
└── 12. "What to Watch" Policy/Market notes (Rule-based)
      │
      ▼
[P3: Final Polish]
├── 13. UI Dark Mode
└── 14. PDF/JSON Summary Export
```

---

## 9. Data Sources & Provenance Verification Register

| Data Need | Candidate Source | Verification Status & Check |
| :--- | :--- | :--- |
| **CPI Item Weights** | MoSPI CPI (2024 Base) | `[VERIFY]` Confirm official release table, state-specific weights, and item codes. |
| **State MPCE Spending** | MoSPI HCES 2023–24 Factsheet | `[VERIFY]` Confirm Table 3/4 fractile expenditure values for Madhya Pradesh (Rural & Urban). |
| **Global Commodity Prices** | World Bank Pink Sheet / FRED / FAO | `[VERIFY]` Verify monthly Brent crude series, units ($/bbl), and download terms. |
| **Indian Retail Fuel Prices** | PPAC (Petroleum Planning & Analysis Cell) | `[VERIFY]` Retrieve historical petrol and diesel retail selling prices for MP/Bhopal. |
| **Indian Retail Food Prices** | MoSPI Price Data / Department of Consumer Affairs | `[VERIFY]` Check retail price monitoring series for vegetables, edible oils, and pulses. |
| **Market Index Data** | FRED / Yahoo Finance (prototype only) | `[VERIFY]` Ticker symbols (`^NSEI`, `^NSEBANK`), date alignment, and terms of use. |
| **Freight Rates** | Freightos / Drewry / Transporters Index | `[VERIFY]` If proprietary or behind paywall, use documented academic transport elasticity rather than live API. |
| **News Documents** | 3 Saved/Cached articles per event | `[VERIFIED]` Store full text, headline, date, publisher, and URL in local catalog. |

---

## 10. Risks, Mitigations & Acceptance Criteria

### 10.1 Key Risks & Fallback Matrix

| Risk | Why It Matters | Mitigation / Fallback Strategy |
| :--- | :--- | :--- |
| **Pass-through data noisy or missing** | Crude oil shock does not translate 1:1 to retail prices. | Only compute 3–4 items with strong historical backing. Show *"Data not available"* for all others with explicit low/high assumptions. |
| **LLM hallucinates edges or numbers** | Destroys credibility and violates hackathon rules. | Curated static base graph, schema validation, fixed relation vocabulary; LLM explanations constrained strictly to citations. |
| **API rate-limits or network failure** | Live evaluation during demo can break. | Pre-cache 3 articles per event and pre-download all CSV datasets into `data/curated/`. App must run 100% offline. |
| **Official data lacks city granularity** | Claiming city-level precision would be fraudulent. | Confine scope to broad State + Rural/Urban fractiles; explicitly disclose geographic boundaries. |
| **CPI 2012 vs 2024 series mismatch** | Baskets differ (299 vs 358 items). | Never blend without linking factors. Clearly label historical backtests as *"2012-base series"*. |
| **Scope creep during 36h hackathon** | Team risks having half-finished screens. | Strict build order: complete P0 end-to-end before touching any P1 or visual styling. |

### 10.2 Go / No-Go Rule
> **Do not call the MVP ready until:**
> 1. The event-to-graph path and the edge evidence receipts panel work end-to-end.
> 2. The household calculator's rupee range can be independently reproduced on a pocket calculator using the cited input numbers and formula.

---

## 11. Three-Minute Hackathon Demonstration Script

* **0:00 – 0:20 | The Problem:** Show how news presents disconnected events. Introduce our vision: connecting global headlines to household kitchens.
* **0:20 – 0:45 | Event Selection:** Select the primary demo scenario: *"Crude Oil Shock +12%"*. Point out transparent labeling as a scenario input.
* **0:45 – 1:15 | Graph & Propagation:** Display the extracted entities and interactive graph. Highlight **Path A (Food)**, **Path B (Transport)**, and **Path C (Financial Markets)**. Show solid (observed) vs dashed (inferred) lines.
* **1:15 – 1:45 | Evidence Receipts:** Click an edge (e.g., Diesel $\rightarrow$ Freight). Show the edge evidence panel with source citation, publication date, uncertainty rating, and *"What could be wrong"*.
* **1:45 – 2:20 | Persona Impact Card:** Select **Madhya Pradesh $\rightarrow$ Rural $\rightarrow$ Middle Expenditure Class**. Reveal estimated monthly spending impact range in rupees. Click a number to show its formula and MoSPI HCES receipt.
* **2:20 – 2:40 | AI-Off Proof:** Toggle the **AI-Off switch**. Show the graph and numbers remaining 100% identical, proving deterministic calculation.
* **2:40 – 3:00 | Conclusion & Q&A:** Summarize our core contribution: Evidence-first financial transparency without hallucinated predictions.

---

## 12. Technical Glossary

1. **Event Extraction:** Identifying key events, magnitudes, and entities from unstructured natural language text.
2. **Entity:** An economic actor, good, indicator, or sector (Commodity, Household Item, Indicator, Sector, Asset, Persona).
3. **Knowledge Graph:** A network of nodes (entities) linked by directional edges (relationships).
4. **Propagation Path:** A multi-step traversal chain showing how an initial impulse travels through intermediate variables.
5. **Observed vs. Inferred:** Observed relationships are directly stated in sources; Inferred relationships are derived from economic models or curated graphs.
6. **CPI (Consumer Price Index):** India's primary retail inflation metric tracking changes in prices paid by consumers.
7. **HCES (Household Consumption Expenditure Survey):** MoSPI's comprehensive survey assessing spending patterns and MPCE across India.
8. **MPCE (Monthly Per Capita Consumption Expenditure):** The average monthly spending per person for a given household fractile class.
9. **Pass-Through Factor:** Elasticity reflecting the percentage change in retail prices resulting from a 1% change in upstream commodity prices.
10. **Persona:** A statistical archetype defined by State $\times$ Rural/Urban $\times$ Expenditure Class.
11. **Receipt:** Complete provenance metadata (source, year, table, unit, formula) backing every displayed numerical claim.
12. **Consensus Meter:** Comparative module tracking agreement and contradictions across multiple news reports.

---

## 13. Status Classifications: What is Known, Assumed, and Unverified

* **What is Known `[VERIFIED]`:**
  * MoSPI transition from 2012-base to 2024-base CPI (effective January 2026; item count increased from 299 to 358).
  * HCES 2023–24 state-level and fractile MPCE tables are published.
  * Rural food spending is ~47.04% and urban food spending is ~39.68% (HCES 2023–24).
* **What is Assumed `[DECISION]`:**
  * Default focus state: Madhya Pradesh.
  * Primary scenario: +12% crude oil price shock.
  * 3 representative expenditure classes: Low, Middle, High.
  * Target audience: Hackathon judges and retail economic observers.
* **What Remains Unverified `[VERIFY]`:**
  * Exact item-level weight table from the new CPI 2024-base release.
  * Exact empirical pass-through factors for Diesel $\rightarrow$ Mandi Vegetables in central India.
  * Choice of the 2 additional comparison states.
  * The 3 cached news articles for the secondary demo event.
