# India Impact Graph: Data Source Register

> **Hackwave 3.0** | **PS 5: Autonomous Financial Event Market Impact Graph**  
> **Document Type:** Official Data Sources Audit & Verification Status  
> **Status:** Working Register — Items marked `[VERIFY]` must be confirmed before production use  

---

## 1. Candidate Official Data Sources Overview

This register tracks all primary data sources identified in the project brief and MVP specification. It distinguishes confirmed reference datasets from candidate sources requiring active verification.

---

## 2. Comprehensive Source Register

| ID | Data Need | Candidate Source | Release / Vintage | Verification Status | Specific Table / Series to Verify | Required Action & Access Conditions |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **SRC-01** | **CPI Item Weights** | MoSPI (Ministry of Statistics and Programme Implementation) | 2024 Base (Effective Jan 2026) | `[VERIFY]` | All-India and State-level Item Weight Matrix (358 items). | Download official gazette/press release. Confirm exact weights for Cereals, Vegetables, Fuel, Edible Oils. |
| **SRC-02** | **State & Fractile MPCE** | MoSPI HCES (Household Consumption Expenditure Survey) | 2023–24 Factsheet & Tables | `[VERIFIED]` for state aggregates; `[VERIFY]` for fractile items | Table 3 (MPCE by State/Sector) and Table 4 (Fractile distribution for Madhya Pradesh). | Confirm exact MPCE fractile cutoffs (Low: bottom 20%, Middle: 20-80%, High: top 20%) for Rural & Urban MP. |
| **SRC-03** | **Global Crude Oil Prices** | World Bank Commodities ("Pink Sheet") / FRED | Monthly / Historical | `[VERIFY]` | Crude oil, Brent, ($/bbl), nominal series. | Verify CSV export availability and licensing terms. Series must cover 2020–2026. |
| **SRC-04** | **Indian Retail Fuel Prices** | PPAC (Petroleum Planning & Analysis Cell, MoPNG) | Historical Monthly / Daily | `[VERIFY]` | Retail Selling Price (RSP) of Petrol & Diesel in Bhopal / Indore / Metro cities. | Download official PPAC time series. Check excise duty vs base price breakdown. |
| **SRC-05** | **Indian Retail Food Prices** | Department of Consumer Affairs (Price Monitoring Division) / MoSPI | Daily / Monthly retail reports | `[VERIFY]` | Retail prices of Potato, Onion, Tomato, Mustard Oil, Wheat Atta in MP. | Verify whether daily retail mandi monitoring data is available as CSV or requires static snapshot. |
| **SRC-06** | **Indian Financial Market Indices** | NSE India / FRED / yfinance (prototype only) | Daily closing series | `[VERIFY]` | `^NSEI` (Nifty 50), `^NSEBANK` (Bank Nifty), 10Y Indian Benchmark Bond Yield. | Use yfinance or static FRED CSV for prototype only; check terms of use for hackathon demo. |
| **SRC-07** | **Freight Rates & Logistics** | Freightos / Drewry / Transporters Association Data | 2023–2025 | `[VERIFY]` (High Risk) | Interstate truck freight rates per tonne-km. | Commercial indices are paywalled; fallback to published academic elasticity studies (RBI/NIPFP). |
| **SRC-08** | **News Scenario Articles** | Curated Financial Press (Reuters, Mint, Economic Times) | Dated / Cached | `[VERIFY]` exact text clips | 3 saved text files for Crude Oil Shock; 3 saved files for backup event. | Store immutable markdown/text versions in `data/raw/news/`. No live scraping during pitch. |

---

## 3. Data Source Integrity Checklists

### Checklist for SRC-01 (MoSPI CPI 2024-Base Weights)
- [ ] Has the official 2024-base weight table been confirmed from mospi.gov.in?
- [ ] Is the reported food weight (~36.75%) verified against official tables?
- [ ] Are state-level basket weights for Madhya Pradesh available, or only All-India weights?
- [ ] Are linking factors between the 2012-base and 2024-base documented?

### Checklist for SRC-02 (MoSPI HCES 2023–24 MPCE)
- [ ] Is Madhya Pradesh Rural Average MPCE confirmed? (Reported: ~₹3,200–₹3,500/month).
- [ ] Is Madhya Pradesh Urban Average MPCE confirmed? (Reported: ~₹5,200–₹5,800/month).
- [ ] Are item-group spending shares confirmed for MP: Food (~47% Rural, ~39% Urban), Fuel & Light, Transport?
- [ ] Are fractile class boundaries verified for Low, Middle, and High expenditure classes?

### Checklist for SRC-04 (PPAC Fuel Price History)
- [ ] Is the retail price of Petrol in Bhopal recorded for the baseline period?
- [ ] Is the retail price of Diesel in Bhopal recorded for the baseline period?
- [ ] Is the central and state tax share verified to explain pass-through dampening?
