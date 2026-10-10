# India Impact Graph: User Flow & System Journey

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Interaction Design & System Processing Flow  
> **Status:** Architecture Specification — Not Implementation Code  

---

## 1. End-to-End User Journey (The 8-Step Experience)

The primary user workflow guides hackathon judges or users through an intuitive, inspectable flow:

```text
[Step 1: Select/Paste Event] ──► [Step 2: Structured Extraction] ──► [Step 3: Base Graph Matching]
                                                                                │
                                                                                ▼
[Step 6: Select Persona]     ◄── [Step 5: Inspect Evidence]      ◄── [Step 4: Explore Paths]
         │
         ▼
[Step 7: Review Rupee Impact] ──► [Step 8: Comparative Verification (P1 Toggles)]
```

### Step 1: Select or Paste Event
* The user lands on the dashboard and selects a pre-configured scenario:
  * Primary: **"Crude Oil Shock +12%"** (clearly labeled with a badge: `[HYPOTHETICAL DEMO SCENARIO]`).
  * Option to select one of 3 saved news articles or paste arbitrary custom financial text into an input box.
* The system displays known article metadata: Publisher, Publication Date, Source URL, and Headline.

### Step 2: Extract Event Details
* The Reader LLM analyzes the text and populates validated structured fields:
  * `Event Type` (e.g., Commodity Price Shock)
  * `Magnitude & Unit` (e.g., +12%)
  * `Event Date` & `Geography`
  * `Identified Entities` (e.g., Crude Oil, Diesel, Freight, Vegetables, Inflation, RBI)
  * `Direct Evidence Quotes` from the text
* **Rule:** If a field is not stated in the input text, it remains `null` / unstated.

### Step 3: Match with Curated Base Graph
* Extracted entities are mapped to the vetted, source-backed base knowledge graph.
* **Invariant:** The LLM cannot add an arbitrary edge and classify it as an observed fact. Extracted concepts must bind to supported economic entities.

### Step 4: Explore Impact Paths
* The UI renders an interactive dependency network with distinct node types.
* Users can click dedicated path filter buttons:
  * **Path A:** Household Food-Cost Chain
  * **Path B:** Household Transport Chain
  * **Path C:** Financial-Market Chain
* Selected paths light up; inactive nodes fade slightly. Solid lines represent **observed** facts; dashed lines represent **inferred** dependencies.

### Step 5: Inspect Evidence Panel
* Clicking any edge opens an **Evidence Drawer / Modal** showing:
  * **Relationship Predicate:** (e.g., *Diesel $\rightarrow$ Mandi Freight Rates*)
  * **Status:** `[VERIFIED]` or `[INFERENCE]`
  * **Source Receipt:** Direct document title, publishing body, table/series ID, year, and URL.
  * **Evidence Text:** Sourced citation explaining the transmission mechanism.
  * **Confidence & Uncertainty:** High / Medium / Low.
  * **What Could Be Wrong:** Realistic counter-arguments (e.g., government fuel tax cuts, commercial buffer stocks).

### Step 6: Select Household Persona
* The user navigates to the **Persona Impact Panel** and selects:
  * **State:** Madhya Pradesh (default)
  * **Sector:** Rural or Urban
  * **Expenditure Class:** Low (Bottom 20%), Middle (Middle 60%), or High (Top 20%)
* The UI indicates data coverage for the selected persona from MoSPI HCES 2023–24.

### Step 7: Review Impact Range & Number Receipts
* The system deterministically computes and presents:
  * **Estimated Monthly Rupee Range:** e.g., `+₹185 to +₹340 / month` (Per Capita or Household).
  * **Item Breakdown:** Line-by-line item costs (Diesel/Freight impact on Food, Transport Fuel).
  * **Data Coverage Banner:** e.g., *"Calculated for 3 of 10 items. 7 items uncalculated due to missing verified pass-through data."*
  * **Clickable Receipts:** Clicking any calculated figure shows the exact formula: $\text{MPCE} \times \text{Weight} \times \Delta P \times \text{Pass-Through}$.

### Step 8: Compare Sources & Verify Integrity (P1 Differentiators)
* **Time-Series Co-Movement:** Inspect historical price trends comparing international crude against domestic retail fuel indices.
* **News Consensus Meter:** Compare 3 cached sources to view verified claims vs. reporting conflicts.
* **AI-Off Proof Toggle:** Flip the switch to `AI: OFF`. The UI shows a confirmation banner indicating that all graph structures and rupee calculations remain completely identical.

---

## 2. High-Level Processing Flow

| Stage | Responsible Component | Input | Primary Output | Invariant / Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **Input** | User / Cached Scenario | News article or scenario prompt | Plain text + document metadata | Scenario inputs must be labeled separately from dated facts. |
| **Reader** | LLM + Schema Validator | Unstructured text | Structured JSON payload | Must validate against `event-extraction-schema.json`. |
| **Graph Matching** | Curated Knowledge Base | Extracted entities | Matched nodes & verified edges | LLM cannot create unverified edges. |
| **Path Finder** | Deterministic Graph Logic | Curated Graph + Event Node | Ranked propagation paths | Computes topological paths; highlights gaps. |
| **Impact Calculator** | Deterministic Math Engine | Persona MPCE + Shares + Shock + Pass-Through | Low-to-high rupee range | **No AI involved in math.** Missing inputs return *"Data not available"*. |
| **Explainer** | Constrained LLM | Calculated data + retrieved receipts | Plain-English summary with caveats | Prompt-locked to cite only provided facts. |
| **UI Presentation** | Frontend Components | Graph, receipts, persona output | Interactive visual dashboard | Clean desktop/mobile layout; inspectable receipts. |

---

## 3. UI State Handling & Error Boundaries

1. **Missing Data State:** If a pass-through factor or item weight is absent in official data, render a badge: `Data not available`. Never display `₹0.00` or an AI estimate.
2. **Offline / Fallback State:** If external LLM API calls fail or timeout, the system falls back seamlessly to pre-extracted JSON caches for the 3 demo events.
3. **Hypothetical Scenario Warning:** The primary +12% crude shock must prominently display:  
   *`"Illustrative Scenario: Not a dated historical observation. Calculations assume theoretical +12% shock."`*
