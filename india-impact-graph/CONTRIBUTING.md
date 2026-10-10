# Contributing to India Impact Graph

Welcome to the **India Impact Graph** repository! This document outlines guidelines, conventions, and quality standards for all team members during Hackwave 3.0.

---

## 1. Onboarding Checklist for New Teammates

Before touching any code or making edits, complete these steps:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/arpitcarpenter34-stack/SANKALP.git
   cd SANKALP/india-impact-graph
   ```
2. **Read the Core Documentation:**
   * Start with the 2-minute summary in [`docs/PROJECT_UNDERSTANDING.md`](docs/PROJECT_UNDERSTANDING.md).
   * Review the scope and boundaries in [`docs/MVP_SCOPE.md`](docs/MVP_SCOPE.md).
   * Understand our golden rules in [`docs/DATA_AND_EVIDENCE_RULES.md`](docs/DATA_AND_EVIDENCE_RULES.md).
   * Check your workstream deliverables in [`docs/36_HOUR_BUILD_PLAN.md`](docs/36_HOUR_BUILD_PLAN.md).
3. **Inspect Open Decisions:**
   * Review [`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md) before assuming unverified values or picking additional states.

---

## 2. The Core Non-Negotiable Rules

Every teammate must adhere to these five non-negotiable rules:

1. **AI Reads and Explains — It Never Does the Maths:**
   * All mathematical calculations must be executed by pure deterministic code consuming verified datasets.
   * Never prompt an LLM to "calculate the impact" or "estimate the spending".
2. **Every Number Needs a Source Receipt:**
   * Any number committed to `data/` or displayed in the UI must have a verified citation (Publisher, Survey Table, Year, Unit, URL).
3. **No Hallucinated or Invented Data:**
   * If an official weight or pass-through factor is missing, mark it **`Data not available`**. Never invent numbers to fill gaps.
4. **Observed vs. Inferred Separation:**
   * Observed relationships (directly stated in news or measured in data) must use solid lines.
   * Inferred relationships (economic logic or estimated correlation) must use dashed lines.
5. **No Secrets or Credentials in Git:**
   * Never commit API keys (OpenAI, Anthropic, Gemini, Groq), passwords, `.env` files, or personal tokens.

---

## 3. Git Workflow & Collaboration Guidelines

### 3.1 Branching Strategy
To avoid overwriting each other's work during the hackathon, follow feature branching:

* `main`: Protected trunk; only verified, tested code is merged here.
* Feature branches:
  * `feat/data-mospi-verification` (Data team)
  * `feat/reader-event-extraction` (Backend team)
  * `feat/graph-ui-component` (Frontend team)
  * `feat/persona-impact-calculator` (Math/Backend team)

### 3.2 Commit Message Conventions
Use clear, semantic commit messages:
* `feat: implement persona impact calculator formulas`
* `docs: update data source register with MoSPI HCES table 4`
* `data: add verified MPCE baseline for Madhya Pradesh rural`
* `fix: correct pass-through upper bound for diesel freight`
* `test: add unit test verifying AI-off calculation invariance`

---

## 4. How to Document Source Evidence & Verification Status

When adding a dataset to `data/raw/` or `data/curated/`:
1. Use the status labels: `[VERIFIED]`, `[VERIFY]`, or `[INFERENCE]`.
2. Add an entry to [`docs/DATA_SOURCE_REGISTER.md`](docs/DATA_SOURCE_REGISTER.md) documenting:
   * Source Title
   * Table / Series ID
   * Publication Date / Vintage
   * Geography & Unit
   * Direct URL or file download path
3. Fill out the corresponding row in `data/templates/data-source-register.csv`.
