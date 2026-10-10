# India Impact Graph: 36-Hour Hackathon Build Plan

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Team Execution Roadmap & Sequencing Guide  
> **Status:** Planning Document — Future implementation sequence, not completed work  

---

## 1. Hackathon Execution Timeline

This plan provides a recommended sequencing structure for a 36-hour hackathon. Data-access checks and schema definitions are scheduled upfront because the MVP depends on verified official tables.

| Time Window | Milestone / Phase | Deliverable & Checkpoint |
| :---: | :--- | :--- |
| **00:00 – 03:00** | **Scope Lock & Data Audit** | Finalize single event scenario (+12% crude oil), audit HCES 2023–24 MPCE tables for Madhya Pradesh, identify missing `[VERIFY]` items, establish expected graph propagation paths. |
| **03:00 – 08:00** | **Data Foundation & Reader Pipeline** | Populate curated CSV/JSON files with source receipts, year, and units; configure extraction prompt against `schemas/event-extraction-schema.json`; test extraction on 3 saved articles. |
| **08:00 – 16:00** | **P0 Knowledge Graph Engine** | Construct static curated base graph; implement path-finding algorithm; render interactive graph with solid (observed) vs dashed (inferred) styling; wire Edge Evidence Drawer. |
| **16:00 – 24:00** | **Persona Calculator & Receipts** | Implement deterministic persona impact formulas; wire Madhya Pradesh Rural/Urban Low/Middle/High MPCE shares; integrate pass-through factors; build number-level receipt popovers. |
| **24:00 – 30:00** | **System Integration & Failure Testing** | Connect UI to extraction and graph modules; test missing-data fallback states; verify zero-hallucination constraints; run manual cross-check on calculations with pocket calculator. |
| **30:00 – 34:00** | **P1 Differentiators (If P0 Stable)** | Implement AI-Off Proof toggle; add historical co-movement time-series chart; wire 3-source News Consensus Meter. |
| **34:00 – 36:00** | **Feature Freeze & Demo Rehearsal** | **Hard feature freeze.** Test end-to-end flow completely offline using cached data; rehearse 3-minute pitch; prepare answers for judge Q&A. |

---

## 2. Parallel Team Workstreams

To maximize hackathon velocity, the team can divide work across four parallel workstreams:

```text
┌─────────────────────────────────┬─────────────────────────────────┐
│ 1. DATA & RESEARCH WORKSTREAM   │ 2. EXTRACTION & GRAPH BACKEND   │
├─────────────────────────────────┼─────────────────────────────────┤
│ • Official MoSPI HCES download  │ • Reader LLM extraction prompt  │
│ • PPAC fuel price series audit  │ • JSON Schema validation logic  │
│ • Pass-through factor research  │ • Curated graph data structure  │
│ • Source receipts documentation │ • Path-ranking traversal code   │
├─────────────────────────────────┼─────────────────────────────────┤
│ 3. FRONTEND & UI WORKSTREAM     │ 4. INTEGRATION & QA WORKSTREAM  │
├─────────────────────────────────┼─────────────────────────────────┤
│ • Interactive graph canvas      │ • End-to-end pipeline wiring    │
│ • Persona selector & card       │ • Formula verification tests    │
│ • Evidence drawer & popovers    │ • AI-off equality verification  │
│ • P1 toggles & consensus meter  │ • Offline cache & pitch rehearsal│
└─────────────────────────────────┴─────────────────────────────────┘
```

---

## 3. Critical Path

$$\text{Verified Official Data} \longrightarrow \text{Event Extraction} \longrightarrow \text{Curated Base Graph} \longrightarrow \text{Path Finder} \longrightarrow \text{Deterministic Calculator} \longrightarrow \text{Receipts UI} \longrightarrow \text{Demo Rehearsal}$$

---

## 4. The "First 12 Hours: Do Not Build" List

To protect the team from common hackathon traps, **do not build any of the following during the first 12 hours**:
* ❌ Do not build a custom fine-tuned model, complex multi-agent framework, or stock price predictor.
* ❌ Do not attempt broad all-market coverage or build live web scrapers.
* ❌ Do not spend time on dark mode, complex CSS animations, or user authentication.
* ❌ Do not start the time-series chart or consensus meter before the core P0 graph and calculator work end-to-end.
