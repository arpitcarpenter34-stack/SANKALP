# India Impact Graph: Open Decisions Log

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Unresolved Questions, Data Verification Gaps & Technical Decisions  
> **Status:** Active Backlog — Decisions must be resolved through team consensus and verified data  

---

## 1. Overview

This document records architectural, data, and procedural decisions that remain open. In accordance with our core principle—**"Never promote an unverified claim to verified status merely because it appears in a draft"**—these items are tracked as open work items.

---

## 2. Open Decisions Register

### Decision 1: Selection of Two Additional States Beyond Madhya Pradesh
* **Status:** `OPEN [VERIFY]`
* **Context:** The MVP sets **Madhya Pradesh** as the default baseline state. The brief permits adding up to two additional states (e.g., Uttar Pradesh, Maharashtra, or Rajasthan) for geographic comparison.
* **Open Questions:**
  * Which two states have complete, easily parsable HCES 2023–24 fractile MPCE tables available in our local data store?
  * Do we have corresponding PPAC fuel retail prices for those states?
* **Rule:** If verified official tables cannot be obtained for additional states within the first 6 hours, freeze scope to **Madhya Pradesh only**.

---

### Decision 2: Specific Cached Source Documents for Events
* **Status:** `OPEN [VERIFY]`
* **Context:** The pipeline requires 3 saved/cached articles per event scenario.
* **Open Questions:**
  * For the Primary Event (Crude Oil Shock): Which 3 dated articles from reputable business press (e.g., Reuters, Mint, Business Standard) will be downloaded into `data/raw/news/`?
  * What exact claims and quotes from each article will serve as the ground truth for extraction?
* **Rule:** Pre-cache full text locally to guarantee 100% offline functionality.

---

### Decision 3: Exact Official CPI 2024-Base Weights & HCES Table Reference
* **Status:** `OPEN [VERIFY]`
* **Context:** MoSPI announced the 2024-base CPI revision (effective Jan 2026), expanding items from 299 to 358 and altering basket weights.
* **Open Questions:**
  * What is the exact official file URL and release table identifier for the 2024-base All-India and State weight matrices?
  * What is the official MoSPI food weight? (Reported as ~36.75% by third-party blogs; needs official confirmation).
  * Which specific table of the HCES 2023–24 Factsheet contains item-wise MPCE fractile shares for rural and urban MP?

---

### Decision 4: Supported 3–4 Item Pass-Through Relationships
* **Status:** `OPEN [VERIFY]`
* **Context:** The MVP restricts active rupee calculations to 3–4 items with verifiable pass-through factors.
* **Open Questions:**
  * Which specific 4 items will be selected? (Recommended candidate set: 1. Commuting Petrol, 2. Diesel Freight on Vegetables, 3. LPG Cooking Gas, 4. Edible Oil).
  * What are the cited lower and upper elasticity coefficients for each?
  * Which RBI or academic study will be cited in the number receipts for these coefficients?

---

### Decision 5: Backup Event Selection (Edible Oil vs. Wheat)
* **Status:** `OPEN [DECISION]`
* **Context:** The brief specifies a backup demo scenario if crude oil is insufficient or if judges request a second event.
* **Options:**
  * *Option A: Edible Oil Import Duty Shock* (Strong link to global palm/soybean prices, high household budget share in MP).
  * *Option B: Wheat / Cereal Export Ban or Procurement Spike* (Direct link to domestic MSP and staple food basket).
* **Selection Criteria:** Choose the option with the most readily verifiable historical retail price series from the Department of Consumer Affairs.

---

### Decision 6: Household Size Conversion vs. Per-Capita Reporting
* **Status:** `OPEN [DECISION]`
* **Context:** HCES measures **Monthly Per Capita Consumption Expenditure (MPCE)**. Showing impact for an entire household requires multiplying per-capita impact by household size.
* **Open Questions:**
  * Do we display the primary result as **Per Person (Per Capita)** or **Total Household (Family of ~4.5)**?
* **Recommendation:** Display **Per Capita** as the default primary metric; provide an explicit toggle for *"Household Total (Average Family Size = 4.5)"* with clear receipt disclosure citing MoSPI average household size tables.

---

### Decision 7: Technology Stack Selection (Frontend & Backend Frameworks)
* **Status:** `OPEN [DECISION]`
* **Context:** The Problem Statement intentionally does **not** specify a technology stack. The repository scaffold is intentionally technology-neutral.
* **Open Options for Future Implementation:**
  * *Option 1 (Full-stack Python):* FastAPI backend + Streamlit or Dash frontend (fastest data app prototyping).
  * *Option 2 (Modern Web):* FastAPI or Node.js backend + React/Vite/TypeScript with Cytoscape.js or ECharts (highest UI fidelity and custom aesthetics).
* **Rule:** Tech stack selection will be finalized in consultation with the team before any implementation code is written.

---

### Decision 8: Team Roles and Task Allocation
* **Status:** `OPEN [DECISION]`
* **Context:** Team membership, individual strengths, and assignment across the 4 workstreams (Data/Research, Extraction/Graph Backend, UI/Frontend, Integration/QA) must be assigned upon team convening.
