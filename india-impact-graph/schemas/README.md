# Schemas Directory (`schemas/`)

This directory contains strict JSON Schema definitions enforcing structured contracts across the **India Impact Graph** pipeline.

---

## Files in this Directory

| File | Purpose | Key Constraints |
| :--- | :--- | :--- |
| `event-extraction-schema.json` | Validates structured extraction output from the Reader LLM | Requires explicit separation of scenarios (`is_scenario: true`) vs. dated historical news; validates entity types; forbids ungrounded hallucinated numbers. |
| `graph-node-edge-schema.json` | Validates nodes, relationships (edges), and evidence receipts | Enforces 6 core node types; strictly enforces `observed` (solid) vs `inferred` (dashed) edge kinds; mandates number-level source receipts. |

---

## Design Principles

1. **Contract-First Development**: All future backend extraction logic and knowledge graph graph builders must validate outputs against these schemas before delivering payloads to the UI.
2. **Schema Validation, Not Implementation**: These schemas describe the data structures and boundary invariants. They contain no application logic, frameworks, or dependencies.
3. **No Hallucinated Edges**: As established in the MVP definition, an LLM reading an article cannot create an arbitrary edge and label it `observed` unless supported by an exact quote and citation.
