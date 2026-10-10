# India Impact Graph: Risks, Fallbacks & Failure Modes

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Risk Management & Mitigation Protocols  
> **Status:** Active Operational Safety Agreement  

---

## 1. Risk and Fallback Matrix

| # | Risk Event | Why It Matters (Impact) | Fallback / Mitigation Strategy |
| :-: | :--- | :--- | :--- |
| **1** | **Pass-through estimates are noisy or unavailable** | A crude oil shock does not transmit 1:1 to domestic retail food or fuel prices. Inaccurate pass-through undermines economic credibility. | **Fallback:** Restrict active calculation to the **3–4 items** with established historical empirical backing (e.g., commute petrol, diesel freight, cooking gas). For all other items, prominently display **`Data not available`**. Show explicit lower and upper bounds. |
| **2** | **LLM invents an edge, entity, or numerical value** | Hallucinations destroy user trust and violate hackathon data integrity rules. | **Fallback:** Rely on a static, curated base knowledge graph for economic structure. Constrain LLM extraction with strict JSON schemas. Restrict LLM explanations strictly to supplied text quotes. **The LLM is completely isolated from calculation logic.** |
| **3** | **API rate-limits or internet outage during presentation** | Live API calls to LLM providers or data portals can fail, hang, or time out during the pitch. | **Fallback:** Pre-cache 3 structured articles per event and store pre-downloaded CSV datasets locally in `data/curated/`. Implement an explicit **Offline Cached Demo Mode** that requires zero external network calls. |
| **4** | **Official survey data lacks local granularity** | Claiming district-level or city-level (e.g., Indore vs. Bhopal) precision when official surveys only publish state-level MPCE implies false accuracy. | **Fallback:** Confine geographic granularity to broad **State + Sector (Rural/Urban)** fractile levels. Openly state data boundaries and refuse to extrapolate unverified city-level micro-estimates. |
| **5** | **CPI series mismatch (2012-base vs. 2024-base)** | Baskets differ significantly (299 items in 2012 base vs. 358 items in 2024 base). Directly mixing them creates distorted percentage comparisons. | **Fallback:** Use only the 2024-base series or recent HCES 2023–24 tables for forward scenario analysis. If presenting a historical backtest (e.g., 2022 crude shock), isolate it completely and clearly label it `[HISTORICAL 2012-BASE CPI SERIES]`. |
| **6** | **News sources disagree or report conflicting figures** | Relying on an automated consensus meter could falsely present common media consensus as verified economic truth. | **Fallback:** Display sources side-by-side in the News Consensus Meter. Highlight points of consensus as well as points of conflict. Explicitly state: *"Media consensus reflects shared reporting, not independent statistical proof."* |
| **7** | **Correlation is misconstrued as causation** | A chart showing crude oil and retail tomato prices rising simultaneously may be coincidental due to monsoon damage rather than diesel freight. | **Fallback:** Enforce visual and semantic distinction between observed facts and inferred links. Add explicit cautionary notes explaining seasonal and supply-side confounding factors. |
| **8** | **Scope creep derails completion within 36 hours** | Attempting live news feeds, user logins, trading algorithms, or dark mode before the core graph works leads to an incomplete demo. | **Fallback:** Enforce strict build order: **Zero P1 features may be started until all P0 features work end-to-end and have passed verification.** |

---

## 2. The Go / No-Go Release Rule

> ### 🛑 Mandatory Go / No-Go Gate:
> **1. Do not declare the MVP ready until the end-to-end event-to-graph path and the edge evidence drawer operate without errors.**  
> **2. Do not declare the household impact calculator ready unless every displayed rupee range can be manually verified and reproduced using a standard pocket calculator from the cited input variables and formulas.**
