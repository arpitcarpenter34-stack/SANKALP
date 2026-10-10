# India Impact Graph: Project Status Tracker

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Team:** SANKALP  
> **Last Updated:** 10 October 2026  
> **Current Milestone:** `Phase 1: Architecture, Documentation & Repository Scaffolding`

---

## 1. Overall Workstream Status Dashboard

| Workstream / Component | Status | Owner | Notes / Checkpoint |
| :--- | :---: | :---: | :--- |
| **Project Understanding** | `Complete` | Team Lead | Both reference PDFs fully analyzed; 12 specifications authored. |
| **Folder Scaffold & Git Setup** | `Complete` | Lead Architect | Clean folder structure, schemas, and templates initialized. |
| **Official Data Verification** | `In Progress [VERIFY]` | Data Lead | MoSPI HCES 2023–24 MPCE confirmed; 2024 CPI weights & PPAC fuel tables under audit. |
| **Data Preparation & Templates** | `Templates Ready` | Data Lead | CSV schema templates created in `data/templates/`. Awaiting verified data rows. |
| **Event Extraction Pipeline** | `Not Started` | Backend Lead | `schemas/event-extraction-schema.json` defined. LLM extraction code not started. |
| **Knowledge Graph Engine** | `Not Started` | Backend Lead | `schemas/graph-node-edge-schema.json` defined. Graph traversal & matching not started. |
| **Evidence Receipts Panel** | `Not Started` | Frontend Lead | Specification and metadata schema established. UI drawer not started. |
| **Persona Impact Calculator** | `Not Started` | Backend/Math Lead | Mathematical formula specified. Implementation code not started. |
| **P1 Differentiators (AI-Off, Charts)** | `Not Started` | Full Team | Blocked until all P0 core features are fully stable and verified. |
| **Test Suites & Verification** | `Scaffolded` | QA Lead | Test directories initialized with `.gitkeep`. Test suites not started. |
| **Final Demo Rehearsal** | `Not Started` | Full Team | Pitch script ready in `docs/DEMO_AND_ACCEPTANCE_CRITERIA.md`. Scheduled for T-2h. |

---

## 2. Granular Task Checklist

### Milestone 1: Planning & Scaffolding (Current Phase)
- [x] Analyze "India Impact Graph: Complete Project Brief" PDF
- [x] Analyze "India Impact Graph MVP Definition Document" PDF
- [x] Create comprehensive `docs/PROJECT_UNDERSTANDING.md` with Hinglish brief
- [x] Establish P0/P1/P2/P3 feature boundaries in `docs/MVP_SCOPE.md`
- [x] Author technical specifications (KG, Calculator, Data Rules, Open Decisions)
- [x] Set up technology-neutral directory scaffold with `.gitkeep` placeholders
- [x] Define JSON Schemas for event extraction and knowledge graph
- [x] Author CSV templates for data collection
- [x] Configure `.gitignore` and link reference PDFs
- [ ] Connect and push to GitHub remote repository

### Milestone 2: Data Audit & Verification (Hours 0–3)
- [ ] Verify MoSPI HCES 2023–24 fractile MPCE values for Madhya Pradesh (Rural & Urban)
- [ ] Verify MoSPI 2024-base CPI item weights (specifically Cereals, Vegetables, Transport)
- [ ] Download and verify PPAC historical retail petrol and diesel prices for MP
- [ ] Confirm empirical pass-through factors for Diesel $\rightarrow$ Freight $\rightarrow$ Mandi Vegetables
- [ ] Cache 3 news articles for primary demo event (Crude Oil +12% Shock) in `data/raw/news/`

### Milestone 3: Core Implementation (Hours 3–24)
- [ ] Implement Reader LLM prompt with strict JSON schema validation
- [ ] Build curated knowledge graph data structures and path-finding algorithms
- [ ] Implement deterministic Persona Impact Calculator in pure math code (Zero AI calculation)
- [ ] Construct interactive UI with node visual hierarchy (solid observed vs dashed inferred)
- [ ] Build interactive Evidence Drawer and Number Receipts popovers
- [ ] Wire strict *"Data not available"* banners for unverified candidate items

### Milestone 4: Integration, P1 Differentiators & Demo Freeze (Hours 24–36)
- [ ] Connect UI to backend extraction and deterministic calculation pipeline
- [ ] Implement and test `AI: OFF` toggle (verifying zero variance in calculated numbers)
- [ ] Add comparative historical time-series chart (Crude vs domestic fuel/CPI)
- [ ] Add 3-source News Consensus Meter
- [ ] Rehearse 3-minute pitch against acceptance criteria
- [ ] Verify 100% offline demo execution capability
