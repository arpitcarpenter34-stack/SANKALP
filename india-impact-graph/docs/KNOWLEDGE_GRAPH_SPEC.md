# India Impact Graph: Knowledge Graph Specification

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Graph Data Model, Edge Typing & Path Traversal Rules  
> **Status:** Specification Document — Not Implementation Code  

---

## 1. Architectural Foundations

A **Knowledge Graph** in the India Impact Graph system is a directed, attributed graph:

$$G = (V, E)$$

Where:
* $V$ is the set of typed economic entities (**Nodes**).
* $E$ is the set of attributed dependency relationships (**Edges**).

The purpose of the graph is to trace and explain how an exogenous financial shock propagates through markets, intermediate costs, and regulatory layers to retail consumer baskets.

---

## 2. Node Schema & Classification

The MVP defines exactly **6 node types**:

| Node Type | Definition | MVP Examples | Visual Encoding |
| :--- | :--- | :--- | :--- |
| **Commodity** | Raw physical goods and primary fuels traded globally or domestically. | `Crude Oil (Brent)`, `Diesel`, `Petrol`, `LPG`, `Edible Oil`, `Wheat` | Orange / Hexagon |
| **Household Item** | Direct consumer expenditure items tracked in household surveys. | `Vegetables`, `Cereals`, `Commute Fuel`, `Electricity`, `Cooking Fuel` | Green / Circle (Size $\propto$ Budget Share) |
| **Economic Indicator** | Published macroeconomic statistics and indices. | `CPI Headline Inflation`, `CPI Food Index`, `WPI Fuel Index`, `Repo Rate` | Blue / Diamond |
| **Sector** | Industrial, agricultural, or commercial sectors of the economy. | `Transport & Logistics`, `Agriculture & Food Supply`, `Banking / NBFCs`, `Real Estate` | Purple / Rounded Rectangle |
| **Instrument / Asset** | Traded financial securities, bonds, and indices. | `Nifty 50`, `Bank Nifty`, `10-Year Indian Sovereign Bond Yield` | Teal / Octagon |
| **Persona** | Demographic consumption group representing a household archetype. | `Madhya Pradesh Rural Middle-Class`, `MP Urban Low-Class` | Grey / Card Anchor |

---

## 3. Edge Typing, Semantics & Visual Hierarchy

Every edge $e = (u, v)$ represents a directional economic transmission mechanism from entity $u$ to entity $v$.

### 3.1 Observed vs. Inferred Distinction

```text
[Node A] ━━━━━━━━━━━━━━━━━━━━► [Node B]     (Solid Line: OBSERVED Fact / Measured Data)
[Node A] - - - - - - - - - - -► [Node B]     (Dashed Line: INFERRED Economic Dependency)
```

1. **Observed Edges (`kind: "observed"`):**
   * **Definition:** Directly documented in the input news article or measured by an identified empirical time-series dataset.
   * **UI Presentation:** Thick, solid stroke line.
   * **Example:** `Crude Oil (Brent)` $\rightarrow$ `Reported Shock: +12%` (stated directly in news).
2. **Inferred Edges (`kind: "inferred"`):**
   * **Definition:** Plausible economic transmission channel derived from economic theory, curated supply-chain linkages, or historical econometric pass-through literature.
   * **UI Presentation:** Dashed stroke line.
   * **Example:** `Diesel Price Hike` $\rightarrow$ `Vegetable Mandi Freight Hike`.
3. **Line Thickness Encoding:**
   * Line thickness indicates **impact strength** or **historical pass-through elasticity** *only* if a verified quantitative coefficient exists.
   * If strength is unquantified or noisy, line thickness must remain **constant**.

### 3.2 Mandatory Edge Attributes
Every edge stored in the graph must conform to `schemas/graph-node-edge-schema.json` and carry:
* `id`: Unique edge identifier (e.g., `crude_to_diesel_refining`).
* `from` / `to`: Source and target node IDs.
* `relation_type`: Typed predicate (e.g., `input_cost_for`, `refines_into`, `drives_expectations_of`, `transport_freight_for`).
* `kind`: `"observed"` or `"inferred"`.
* `direction`: `"positive"`, `"negative"`, or `"ambiguous"`.
* `confidence`: `"high"`, `"medium"`, or `"low"`.
* `evidence_text`: Plain-text excerpt explaining the transmission rationale.
* `what_could_be_wrong`: Known failure modes, mitigating policies, or countervailing factors.
* `receipt`: Complete provenance metadata block (publisher, table, year, URL, verification status).

---

## 4. The Three Proposed Propagation Paths

The MVP pre-defines and investigates three specific propagation pathways:

### Path A: Household Food-Cost Chain
$$\text{Crude Oil} \xrightarrow{\text{refines into}} \text{Diesel} \xrightarrow{\text{operational cost}} \text{Freight Logistics} \xrightarrow{\text{mandi transport}} \text{Vegetables / Food} \xrightarrow{\text{kitchen basket}} \text{Household Budget}$$
* **Transmission Logic:** 
  1. Crude oil accounts for a major share of refinery input costs.
  2. Commercial trucking in India runs predominantly on high-speed diesel (HSD).
  3. Perishable vegetables travel significant distances (e.g., Nashik onions, Malwa potatoes) via diesel trucks.
  4. Higher freight charges raise wholesale mandi prices and final retail consumer prices.
* **Evidence Caveat & Weakening Factors:**
  * Government may reduce Central Excise Duty or State VAT on fuel to cushion consumers.
  * Local seasonal bumper harvests can overpower freight cost increases, causing farmgate prices to crash despite high transport costs.
  * Long-term transport contracts often have lagged adjustment clauses.

### Path B: Household Transport Chain
$$\text{Crude Oil} \xrightarrow{\text{refines into}} \text{Petrol} \xrightarrow{\text{pump price}} \text{Personal Commuting Cost} \xrightarrow{\text{mobility basket}} \text{Household Budget}$$
* **Transmission Logic:**
  1. Global crude oil price shocks alter the import parity price (IPP) and trade parity price (TPP) for Indian refiners.
  2. Retail petrol prices at the pump adjust accordingly over time.
  3. Households with two-wheelers or four-wheelers experience higher daily commuting expenses.
* **Evidence Caveat & Weakening Factors:**
  * Domestic retail fuel prices in India are frequently frozen by state-run Oil Marketing Companies (OMCs) during election cycles or global volatility.
  * Ad-valorem vs. specific tax structures distort one-for-one pass-through.

### Path C: Financial-Market Chain
$$\text{Crude Oil} \xrightarrow{\text{trade deficit}} \text{Inflation Expectations} \xrightarrow{\text{monetary policy}} \text{RBI Repo Rate} \xrightarrow{\text{cost of credit}} \text{Banking / Real Estate} \xrightarrow{\text{equity repricing}} \text{Nifty / Indices}$$
* **Transmission Logic:**
  1. India imports over 85% of its crude oil requirements; oil price spikes widen the Current Account Deficit (CAD) and push up imported inflation.
  2. Rising headline CPI prompts the RBI Monetary Policy Committee (MPC) to adopt a hawkish stance or raise policy repo rates.
  3. Higher interest rates raise the cost of capital for banks and increase borrowing costs for real estate developers and home buyers.
  4. Interest-sensitive stocks face valuation compressions, leading to declines in benchmark market indices.
* **Evidence Caveat & Weakening Factors:**
  * These are macroeconomic correlations, not guaranteed causal outcomes.
  * Strong domestic institutional liquidity (SIP inflows) or sovereign interventions may offset foreign selling, cushioning market indices.

---

## 5. Incomplete Paths & Missing-Data Behaviour

A core tenet of the India Impact Graph is intellectual honesty:

* **No Forced Graph Closure:** If empirical evidence or reliable pass-through data is absent for an intermediate step (e.g., freight rates to local sugar retail prices), **the edge must NOT be fabricated**.
* **Visual Incomplete State:** The graph displays a broken or faded edge marked `[UNVERIFIED - DATA NOT AVAILABLE]`.
* **Path Disconnection Warning:** The UI displays an alert:  
  *`"Propagation path could not be fully resolved: Official pass-through dataset for freight-to-sugar transmission is unverified."`*
* **LLM Constraint:** An LLM explanation alone is never accepted as independent proof of an edge.
