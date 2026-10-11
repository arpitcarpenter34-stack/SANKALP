# India Impact Graph: Methodological Boundaries — Scenarios vs. Historical Data

> **Milestone 3 Architectural & Methodological Guidance**  
> **Topic:** Disallowing Automatic Substitution of Refreshed Data into Synthetic Benchmark Scenarios  

---

## 1. The Core Scientific Distinction

A common flaw in automated impact-graph systems is conflating:
1. **Discrete Historical Time-Series Observations** (empirical, backward-looking measured points, such as MoSPI CPI Base 2024 index points or PPAC USD/barrel snapshots).
2. **Synthetic Counterfactual Benchmark Scenarios** (hypothetical forward-looking policy and commodity shocks, such as a simulated `+12%` international crude oil price surge).

In the India Impact Graph backend:
- The scenario engine calculates the transmission of an instantaneous, parameterized shock ($\Delta P / P = +12.0\%$) through empirical pass-through elasticities to evaluate household vulnerability across expenditure fractiles.
- The historical time-series database records official published points to establish baseline levels, methodology validation (e.g. Base 2024=100 weights), and co-movement analysis.

---

## 2. Mandatory Rules for Live Refresh Integration with Scenarios

1. **Preserve Benchmark Scenarios:** The canonical synthetic benchmark scenarios (`crude-oil-shock-12pct`, `edible-oil-tariff`, `wheat-procurement-spike`) must retain their calibrated shock definitions. Live data refresh runs must **never** automatically overwrite or re-parameterize benchmark scenario magnitudes without explicit user-requested scenario reconfiguration.
2. **Correlation is Not Causation:** Live observations of energy price changes and food index movements must display the required co-movement disclaimer. Time-series co-movement does not prove direct causation, as agricultural prices are driven by weather, buffer stocks, and domestic mandis.
3. **Sparse Data Handling:** PPAC crude oil points are discrete sparse snapshots. Downstream impact calculations must not interpolate intermediate dates or calculate unweighted calendar averages from sparse snapshot samples.
4. **Transparent Data Sourcing:** When an API endpoint serves data, its metadata must explicitly identify whether the source is `postgresql` or `csv_fallback`, ensuring full auditability.
