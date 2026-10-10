# India Impact Graph 🇮🇳 📊

### **From Global News to Your Household Budget**
> **Hackwave 3.0 (Indore)** | **Problem Statement 5: Autonomous Financial Event Market Impact Graph**  
> **Team:** SANKALP  
> **Current Project Status:** `Planning / Repository Scaffold` (Not implementation code)

---

## ⚠️ Important Project Status Notice

> **CURRENT STATUS: ARCHITECTURE, SPECIFICATION & SCAFFOLDING ONLY**  
> This repository contains the complete technical specifications, data schemas, CSV templates, reference documents, and repository architecture for the **India Impact Graph**.  
> **Application features, frontend UI, backend API services, graph algorithms, and machine learning pipelines HAVE NOT YET BEEN IMPLEMENTED.**  
> Development will begin strictly in accordance with [`docs/36_HOUR_BUILD_PLAN.md`](docs/36_HOUR_BUILD_PLAN.md).

---

## 1. The Problem We Are Solving

Financial news is fragmented. When global macro events occur—a geopolitical spike in crude oil, a change in central bank policy rates, or a fertilizer subsidy adjustment—media outlets report them as disconnected stories:
* *"Brent Crude jumps 12% on Middle East supply concerns"*
* *"Trucking associations demand freight rate revisions"*
* *"Retail vegetable and edible oil prices firm up in mandis"*
* *"Stock indices retreat as inflation expectations shift"*

Everyday citizens and retail analysts cannot easily trace how these disparate events connect, nor can they quantify what an abstract global percentage means for their personal cost of living.

---

## 2. Solution Overview

### English Summary
**India Impact Graph** bridges macroeconomic news and everyday household expenditure. The system converts financial news into an interactive dependency graph, tracks propagation pathways across commodities, sectors, and price indices, and calculates a defensible monthly rupee spending impact range for representative Indian household personas (e.g., a rural or urban middle-class family in Madhya Pradesh).

### Saral Hinglish Summary (सरल भाषा में सारांश)
> *Aamtaur par news alag-alag dikhti hai—kaccha tel mehnga hua, diesel badha, transport freight badha, mandi me sabzi mehngi hui. India Impact Graph in sabhi kadiyon ko ek interconnected Knowledge Graph me jodkar dikhata hai. Sabse ahem baat: ye Indore ya MP ke ek typical parivar ke monthly kharche (kitchen budget) par kitne rupaye ka asar pad sakta hai, uski ek realistic range batata hai. Har number ke piche official sarkari survey (MoSPI/PPAC) ki clickable receipt hoti hai. AI sirf text padhta aur explain karta hai—calculations hamesha deterministic formula aur verified data se hoti hain.*

---

## 3. Core Unique Selling Propositions (USPs)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      THE FOUR STRATEGIC PILLARS                        │
├────────────────────────────────────────────────────────────────────────┤
│ 1. RECEIPT-BACKED NUMBERS                                              │
│    Every number on screen is clickable, revealing its official source, │
│    table ID, survey year, unit, and mathematical formula. Missing      │
│    data is explicitly marked "Data not available" — zero hallucinations│
├────────────────────────────────────────────────────────────────────────┤
│ 2. PERSONA IMPACT CARD                                                 │
│    Converts abstract inflation percentages into a tangible monthly     │
│    rupee impact range (e.g. +₹190 to +₹310/month) for State × Sector   │
│    × Expenditure Class archetypes.                                     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. NEWS CONSENSUS METER (P1)                                           │
│    Compares up to 3 saved news sources per event, displaying shared    │
│    consensus and conflicting claims without assuming consensus is proof│
├────────────────────────────────────────────────────────────────────────┤
│ 4. AI-OFF PROOF (P1)                                                   │
│    An interactive toggle that completely turns off the LLM. All graph  │
│    nodes, paths, and calculated rupee numbers remain 100% identical,   │
│    proving that AI is used only as a reader and explainer, not a math  │
│    black-box.                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

> **Pitch Line:**  
> *"From global news to your household budget. Every number comes with an official receipt, and AI reads and explains — it never does the maths."*

---

## 4. MVP Scope & Demo Event

* **Geographic Market:** India-focused (Global Event $\rightarrow$ National $\rightarrow$ State $\rightarrow$ Household Persona).
* **Baseline State:** **Madhya Pradesh** (with up to 2 additional states if official tables are verified).
* **Persona Archetypes:** State $\times$ Rural/Urban $\times$ Expenditure Class (Low, Middle, High MPCE fractiles).
* **Primary Demo Event:** **Crude Oil Price Shock of +12%** (*Transparently labeled as a hypothetical scenario for demo purposes*).
* **Backup Event:** Edible Oil or Wheat supply shock.
* **Input Strategy:** 3 pre-cached news articles per event; optional text input.

---

## 5. End-to-End Conceptual Processing Workflow

```text
[1. Financial News / Scenario Input]
                │
                ▼
[2. Reader Module: LLM + JSON Schema Validation]
                │ (Extracts: Event, Magnitude, Entities, Quotes)
                ▼
[3. Curated Base Knowledge Graph Matching]
                │ (Maps entities to vetted nodes & directional edges)
                ▼
[4. Deterministic Propagation Path Discovery]
                │ (Path A: Food Cost | Path B: Transport | Path C: Financial Market)
                ▼
[5. Deterministic Household Impact Calculator]
                │ (Formula: MPCE × Basket Share × Shock % × Pass-Through Factor)
                ▼
[6. Constrained Explainer: Prompt-Locked LLM]
                │ (Narrates rationale using ONLY retrieved receipts)
                ▼
[7. Interactive UI, Receipts Drawer & Persona Card]
```

---

## 6. Repository Folder Structure

```text
india-impact-graph/
│
├── README.md                           # Project overview, architecture & status
├── PROJECT_STATUS.md                   # Workstream progress tracking table
├── CONTRIBUTING.md                     # Team git conventions & contribution rules
├── .gitignore                          # Standard git ignore rules (secrets, build files)
│
├── docs/                               # Comprehensive project documentation
│   ├── PROJECT_UNDERSTANDING.md        # Full project brief, Hinglish guide & specifications
│   ├── MVP_SCOPE.md                    # Detailed MVP boundaries, P0-P3 priorities & exclusions
│   ├── USER_FLOW.md                    # 8-step user journey & system flow
│   ├── KNOWLEDGE_GRAPH_SPEC.md         # Node schemas, edge types, paths & caveats
│   ├── HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md # Math formulas, pass-through mechanics & MPCE rules
│   ├── DATA_AND_EVIDENCE_RULES.md      # Provenance receipts, status tags & data governance
│   ├── DATA_SOURCE_REGISTER.md         # MoSPI, PPAC, World Bank source audit
│   ├── FEATURE_PRIORITIES.md           # P0/P1/P2/P3 breakdown and dependency hierarchy
│   ├── 36_HOUR_BUILD_PLAN.md           # Detailed 36-hour sequencing & team workstreams
│   ├── DEMO_AND_ACCEPTANCE_CRITERIA.md # 3-minute pitch script & 11 acceptance criteria
│   ├── RISKS_AND_FALLBACKS.md          # 8 core risks, mitigations & Go/No-Go rule
│   ├── OPEN_DECISIONS.md               # Unresolved items & data verification backlog
│   └── reference/                      # Original hackathon reference PDF documents
│       ├── project-explanation.pdf     # "India Impact Graph: Complete Project Brief"
│       └── mvp-definition.pdf          # "India Impact Graph MVP Definition Document"
│
├── data/                               # Data architecture directory
│   ├── README.md                       # Data folder organization & governance rules
│   ├── raw/                            # Immutable official downloads & original dumps
│   ├── processed/                      # Standardized tables with provenance metadata
│   ├── curated/                        # Verified baseline graphs, personas & pass-throughs
│   └── templates/                      # Standard CSV schema headers for data collection
│       ├── data-source-register.csv    # Source tracking template
│       ├── household-persona-template.csv # Demographic persona MPCE template
│       ├── pass-through-register.csv   # Historical pass-through factors template
│       └── cached-articles-catalog.csv # News scenario catalog template
│
├── schemas/                            # Strict contract definitions
│   ├── README.md                       # Contract overview
│   ├── event-extraction-schema.json    # JSON Schema for Reader LLM output
│   └── graph-node-edge-schema.json     # JSON Schema for knowledge graph nodes & edges
│
├── frontend/                           # Reserved for UI presentation layer (Future)
├── backend/                            # Reserved for API & data pipeline services (Future)
├── graph/                              # Reserved for graph traversal & matching engine (Future)
├── calculator/                         # Reserved for deterministic math formulas (Future)
│
├── tests/                              # Verification test suites (Future)
│   ├── unit/                           # Formula, schema & parsing unit tests
│   ├── integration/                    # Pipeline end-to-end integration tests
│   └── acceptance/                     # Demo checklist & AI-off equality verification
│
└── scripts/                            # Automation scripts for data preparation (Future)
```

---

## 7. How Teammates Can Clone & Get Started

```bash
# Clone the repository
git clone https://github.com/arpitcarpenter34-stack/SANKALP.git

# Navigate into the project directory
cd SANKALP/india-impact-graph

# Review the core foundational documents before writing code
cat docs/PROJECT_UNDERSTANDING.md
cat docs/36_HOUR_BUILD_PLAN.md
cat docs/OPEN_DECISIONS.md
```

---

## 8. Reference Documents & Quick Links

* [Project Understanding Document](docs/PROJECT_UNDERSTANDING.md)
* [MVP Scope & Boundaries](docs/MVP_SCOPE.md)
* [Knowledge Graph Specification](docs/KNOWLEDGE_GRAPH_SPEC.md)
* [Household Impact Calculator Specification](docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md)
* [Data Source Register](docs/DATA_SOURCE_REGISTER.md)
* [36-Hour Hackathon Build Plan](docs/36_HOUR_BUILD_PLAN.md)
* [Demo Script & Acceptance Criteria](docs/DEMO_AND_ACCEPTANCE_CRITERIA.md)
* [Reference PDF: Project Brief](docs/reference/project-explanation.pdf)
* [Reference PDF: MVP Definition](docs/reference/mvp-definition.pdf)

---

## 9. Non-Negotiable Data Rules for Teammates

1. **AI Reads and Explains — It Never Does the Maths.**
2. **Every Number Needs a Source Receipt.**
3. **If Data is Missing, Show `Data not available`. Never Invent Synthetic Values.**
4. **Observed Facts (`solid lines`) and Inferred Links (`dashed lines`) Must Remain Visually Distinct.**
5. **Do Not Mix CPI 2012-Base and 2024-Base Series Without Official Linking Methodology.**
