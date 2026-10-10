# India Impact Graph: Household Impact Calculator Specification

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Mathematical Specification & Calculation Methodology  
> **Status:** Specification Document — Not Implementation Code  

---

## 1. Executive Summary & Purpose

The **Persona Impact Card** translates abstract macroeconomic shocks into tangible, monthly rupee impacts on an Indian household's budget.

> **Fundamental Principle:**  
> **The calculator is 100% deterministic.** The AI Language Model (LLM) is strictly barred from computing, estimating, or adjusting numbers. All calculations are executed by fixed mathematical code consuming verified tables.

---

## 2. Demographic Persona Architecture

A Persona is a representative statistical archetype defined by three selection dimensions:

$$\text{Persona} = \langle \text{State}, \; \text{Sector}, \; \text{Expenditure Class} \rangle$$

1. **State:**
   * **Madhya Pradesh** (Primary default state).
   * Up to **two additional states** (e.g., Uttar Pradesh, Maharashtra) if and only if verified HCES/CPI tables are confirmed.
2. **Sector:**
   * **Rural**
   * **Urban**
3. **Expenditure Class:**
   * **Low:** Bottom 20% fractile of MPCE distribution (Fractile classes 0–20).
   * **Middle:** Middle 60% fractile of MPCE distribution (Fractile classes 20–80).
   * **High:** Top 20% fractile of MPCE distribution (Fractile classes 80–100).
   * *Rule:* Always use the official demographic term **"Expenditure Class"**, never "Income Class", because official NSSO/MoSPI surveys measure consumption expenditure, not personal income.

---

## 3. Mathematical Formulation

### 3.1 Item Spending Formula
For a given persona and consumption item $i$:

$$\text{Spending}_i = \text{MPCE}_{\text{persona}} \times w_i$$

Where:
* $\text{MPCE}_{\text{persona}}$ is the official Monthly Per Capita Consumption Expenditure (in INR) from MoSPI HCES 2023–24.
* $w_i$ is the verified expenditure share ($\%$) of item $i$ in that persona's consumption basket (from HCES 2023–24 or CPI weights).

### 3.2 Item Impact Formula
The monthly financial impact on item $i$ is calculated as:

$$\Delta \text{Cost}_i = \text{Spending}_i \times \Delta P_{\text{shock}} \times \beta_i$$

Where:
* $\Delta P_{\text{shock}}$ is the percentage shock of the upstream commodity (e.g., $+12\%$ or $+0.12$ for crude oil).
* $\beta_i$ is the empirical **Pass-Through Factor** ($0 \le \beta_i \le 1.0$) reflecting how much of the upstream price shock reaches domestic retail prices.

### 3.3 Low and High Range Estimation
Because economic pass-through is subject to time lags, tax structures, and margins, we compute a conservative lower bound and upper bound:

$$\Delta \text{Cost}_{\text{low}, i} = \text{Spending}_i \times \Delta P_{\text{shock}} \times \beta_{\text{low}, i}$$

$$\Delta \text{Cost}_{\text{high}, i} = \text{Spending}_i \times \Delta P_{\text{shock}} \times \beta_{\text{high}, i}$$

### 3.4 Total Persona Impact Range
The total monthly impact range is the sum across all **eligible** items:

$$\text{Total Impact Range} = \left[ \sum_{i \in \text{Eligible}} \Delta \text{Cost}_{\text{low}, i}, \; \sum_{i \in \text{Eligible}} \Delta \text{Cost}_{\text{high}, i} \right]$$

---

## 4. Pass-Through Mechanics & Reality Checks

### 4.1 Why +12% Crude $\ne$ +12% Petrol / Vegetables
A frequent amateur error in financial modeling is assuming that a $12\%$ increase in international crude oil causes a $12\%$ increase in retail petrol or grocery prices. In reality:

1. **Tax Buffers on Fuel:** Indian retail prices for petrol and diesel consist heavily of specific Central Excise Duty, State VAT, dealer commissions, and freight. Crude oil represents roughly $40\% - 50\%$ of the retail pump price. Thus, a $10\%$ rise in crude typically translates to only a $4\% - 5\%$ rise in retail pump prices, even if fully passed through.
2. **Transportation Cost Share in Mandi Food:** Transport freight typically accounts for $6\% - 15\%$ of final retail vegetable prices. If diesel rises by $5\%$, freight rates rise by $\sim 3\% - 4\%$, which in turn impacts retail vegetable prices by only $\sim 0.3\% - 0.6\%$.
3. **Pass-Through Factor Ranges ($\beta_i$):**
   * **Petrol / Commuting:** $\beta \approx 0.30 - 0.45$ (direct refinery & tax pass-through).
   * **Diesel Freight:** $\beta \approx 0.35 - 0.50$.
   * **Vegetables (Indirect Diesel Pass-Through):** $\beta \approx 0.05 - 0.15$.
   * *Rule:* Apply pass-through **once only** per propagation chain to prevent compounding distortions.

---

## 5. Per-Capita vs. Household-Size Conversion Rules

* **Default Output Unit:** All HCES survey figures are published as **Monthly Per Capita Consumption Expenditure (MPCE)**. Therefore, the calculator's primary output must be clearly stated as:  
  $$\text{Unit: } \textbf{₹ / person / month (Per Capita)}$$
* **Household Conversion Invariant:** If the UI provides an option to show "Total Household Impact (Family of 4 or 5)":
  * It must use the **official average household size** from MoSPI HCES 2023–24 for that specific state and sector (e.g., Rural MP average household size: $\sim 4.5$).
  * The conversion must be explicitly documented in the receipt:  
    $$\text{Household Total} = \text{Per Capita Impact} \times \text{Official Average Household Size}$$
  * If official household size data is unverified, **do not multiply by an invented number**. Display the per-capita result and disclose the limitation.

---

## 6. CPI Series Integrity (2012 Base vs. 2024 Base)

1. **Background:** MoSPI announced the migration of the Consumer Price Index (CPI) base year from **2012 = 100** to **2024 = 100**, effective with the January 2026 data release.
2. **Basket Re-weighting:** The 2024-base basket is built on HCES 2023–24 data, expanding items from 299 to 358 and substantially altering expenditure weights (e.g., food weight adjusted).
3. **Integrity Rule:**
   * **Never silently mix series.**
   * Current MVP calculations must rely strictly on the 2024-base series or recent HCES 2023–24 expenditure tables.
   * If a historical backtest is conducted for events occurring between 2020 and 2024, it must be prominently labeled: `[HISTORICAL 2012-BASE CPI SERIES]`.

---

## 7. Data Coverage Reporting & Missing Value Policy

1. **Eligible Items:** The MVP prioritizes computing impacts for roughly **3 to 4 items** where historical pass-through factors have reliable empirical backing (e.g., Commute Petrol, Diesel-linked Food/Vegetables, Cooking Gas).
2. **Unsupported Items:** For remaining candidate items (e.g., Gold, Pulses, Sugar, Electricity), if reliable pass-through data is unavailable, the calculator **must display**:  
   $$\textbf{Data not available}$$
3. **No Zero Substitution:** Missing items must **never** be coded as ₹0.00 (which implies zero inflation) or filled with AI estimates.
4. **Coverage Transparency Card:** Every persona output card must show a coverage metric:
   > *"Coverage: Impact calculated for 3 of 10 candidate items (covering ~42% of monthly persona expenditure). 7 items uncalculated due to missing verified pass-through data."*
