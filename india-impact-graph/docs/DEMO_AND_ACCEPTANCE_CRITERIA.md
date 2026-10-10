# India Impact Graph: Demo Script & Acceptance Criteria

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Pitch Script, Quality Verification & Acceptance Checklist  
> **Status:** Criteria Agreement — All acceptance criteria must pass before final submission  

---

## 1. Three-Minute Hackathon Demonstration Script

*Target Duration: Exactly 3 minutes (180 seconds).*

| Timestamp | Screen / Action | Spoken Talking Points (Pitch Script) | What It Proves to Judges |
| :---: | :--- | :--- | :--- |
| **0:00 – 0:20** | **Intro & Problem Frame** | *"Financial headlines are presented in isolation: crude oil jumps, transport freight rises, food prices spike, and bank shares drop. The everyday citizen or analyst is left guessing how these connect, and has no idea what it means for their monthly household budget."* | Clear understanding of Problem Statement 5 and our human-centric product vision. |
| **0:20 – 0:45** | **Event Input / Scenario** | *"We introduce India Impact Graph. We select our primary event: Crude Oil Shock of +12%. Notice the explicit badge: this is transparently marked as a hypothetical demo scenario, not a falsified historical claim."* | Intellectual honesty, input transparency, and structured scenario ingestion. |
| **0:45 – 1:15** | **Graph & Propagation** | *"Our reader extracts structured entities and maps them into our curated economic dependency graph. We filter by three distinct propagation paths: Path A shows fuel-to-food transport costs; Path B shows commuting fuel; Path C shows interest rates and markets. Solid lines show observed facts; dashed lines show inferred economic links."* | Core knowledge graph capability, path discovery, and observed vs inferred visual hierarchy. |
| **1:15 – 1:45** | **Evidence Panel & Receipts** | *"We click on the Diesel $\rightarrow$ Freight edge. Look at the Evidence Panel: it displays the exact government bulletin, publishing date, unit, confidence rating, and crucially—what could break this relationship, such as an excise duty cut."* | **USP 1: Evidence-First Architecture.** Eliminates black-box AI claims. |
| **1:45 – 2:20** | **Persona Impact Card** | *"Now we connect global macro to the household budget. We select Madhya Pradesh $\rightarrow$ Rural $\rightarrow$ Middle-Expenditure Class. The system computes a realistic range: +₹190 to +₹310 per month. Every number has a clickable receipt showing its MoSPI HCES 2023–24 survey source and formula."* | **USP 2: Persona Impact Card.** Replaces abstract percentages with actionable rupee ranges. |
| **2:20 – 2:40** | **AI-Off Proof Toggle** | *"Is the AI hallucinating these numbers? Watch this: we toggle AI to OFF. The language explanations vanish, but every single graph node, path, and calculated rupee number remains 100% identical. AI reads and explains—it never does the maths."* | **USP 4: AI-Off Proof.** Proves strict mathematical and deterministic separation. |
| **2:40 – 3:00** | **Closing Summary** | *"India Impact Graph delivers evidence before confidence, and data before numbers. We don't predict the stock market—we show how an economic shock travels to your household kitchen."* | Memorable punchline and disciplined product boundary. |

---

## 2. MVP Acceptance Checklist

To sign off on the MVP before submission, every single item in this checklist must be verified:

- [ ] **1. Event Ingestion:** A user can select a pre-loaded scenario or paste arbitrary financial text.
- [ ] **2. Structured Schema Extraction:** Event details (event type, magnitude, date, geography, entities, evidence snippets) are extracted into validated JSON conforming to `schemas/event-extraction-schema.json`. Unknown fields remain `null`.
- [ ] **3. Visual Observed vs. Inferred Separation:** Graph clearly renders solid lines for observed relationships and dashed lines for inferred relationships.
- [ ] **4. Three Propagation Paths:** Users can explore and highlight Path A (Food), Path B (Transport), and Path C (Financial Market).
- [ ] **5. Inspectable Edge Receipts:** Clicking any important edge opens an evidence drawer showing source title, publication date, unit, evidence quote, confidence, and caveats.
- [ ] **6. Persona Selector:** Users can select State (Madhya Pradesh), Sector (Rural/Urban), and Expenditure Class (Low/Middle/High).
- [ ] **7. Deterministic Rupee Range:** Output displays a low-to-high rupee impact range computed exclusively from official baseline MPCE, expenditure shares, shock magnitude, and empirical pass-through factors.
- [ ] **8. Clickable Number Receipts:** Every numerical value on screen has a clickable receipt showing its official survey source, table, and formula.
- [ ] **9. Strict Missing-Data Handling:** Items without verified pass-through data display *"Data not available"*; no synthetic zero substitution or AI-generated numbers.
- [ ] **10. AI-Off Equivalence:** Toggling AI off leaves all graph structures, paths, and calculated numbers completely unchanged.
- [ ] **11. Offline / Cached Reliability:** The entire demonstration flow works 100% reliably using local cached files without requiring live internet or active API calls during the pitch.

---

## 3. Demo Failure Protocol: "Data Not Available"

If during evaluation a judge asks to see an item or state where verified data is absent:

> **The system's correct behaviour is to show *"Data not available"* and explain why the data is incomplete.**  
> Under no circumstances will the team fabricate an unverified number to make the graph look complete. Explain to judges:  
> *"In financial systems, knowing what you do not know is as vital as knowing what you know. We refuse to compromise data integrity for visual aesthetics."*
