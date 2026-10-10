# HCES 2023–24 Persona Extraction Pipeline

This directory contains the automated, evidence-first extraction pipeline to process official MoSPI Household Consumption Expenditure Survey (HCES) 2023–24 unit records and compute empirical Monthly Per Capita Consumption Expenditure (MPCE), average household sizes, and item expenditure shares for six canonical Madhya Pradesh household personas.

---

## 1. Official Microdata Access Prerequisites

Official unit-level microdata for the HCES 2023–24 survey is managed by the Ministry of Statistics and Programme Implementation (MoSPI).

* **Portal:** [MoSPI Microdata Portal (NADA)](https://microdata.gov.in/NADA/index.php/catalog/237)
* **Study Identifier:** `DDI-IND-MOSPI-NSS-HCES23-24` (Catalog ID `237`)
* **Access Requirements:**
  1. User registration and authentication on `microdata.gov.in`.
  2. Submission of a formal data request and confidentiality declaration under the *Collection of Statistics Act*.
  3. Acceptance of terms preventing deanonymization or commercial redistribution.
  4. Unit-level files must be stored locally in private raw folders and **never committed to public version control** (guarded by root `.gitignore`).

---

## 2. Input Fields, Mapping Contracts & Composite Keys

### Field Mapping Contract
The pipeline processes unit-level household records (Schedule `HCQ` / `CSQ` / `FDQ`) with the following required dimensions:

| Dimension | Default Placeholder | MoSPI Typical Representation | Validation Rule |
| :--- | :--- | :--- | :--- |
| **State** | `state` | `State` / `State_Code` (MP = `23`) | Must match `mp_state_codes` (`["23", "MP", "MADHYA PRADESH"]`). |
| **Sector** | `sector` | `Sector` (`1` = Rural, `2` = Urban) | Must match `rural_sector_values` or `urban_sector_values`. |
| **Household ID** | `hh_id` | Single unique key or composite key | Enforces strict de-duplication within state/sector. |
| **Weight** | `weight` | `Multiplier` / `Wgt_SS` | Strictly positive float ($> 0$), scaled by `weight_scale`. |
| **Household Size** | `hh_size` | `HH_Size` | Strictly positive float / int ($\ge 1.0$). |
| **MPCE** | `mpce` | `MPCE_URP` / `MPCE_MMRP` | Non-negative monthly expenditure in INR ($\ge 0$). |
| **Item Spending** | `exp_<item>` | Item expenditure column | Requires verified 30-day monthly basis (`monthly_inr`). |

### Composite Household Key Support (Fix F-03)
In official NSSO/MoSPI datasets, sample households are identified by multi-stage sampling components (`FSU`, `SSS`, `HHD_NO`). The pipeline natively supports composite keys via `composite_household_id_cols`:
```json
{
  "composite_household_id_cols": ["FSU", "SSS", "HHD_NO"]
}
```
When configured, the pipeline concatenates components (e.g., `"FSU_SSS_HHD"`) and validates that no component is missing or null, strictly rejecting duplicate households within each sector.

### Custom Mapping Configuration (Fix F-02)
Default lowercase column names (`state`, `sector`, `weight`, `hh_size`, `mpce`) are placeholder defaults for pre-formatted extracts. For raw MoSPI extracts, always provide a custom mapping JSON via `--mapping-config`:
```json
{
  "state_col": "State",
  "sector_col": "Sector",
  "composite_household_id_cols": ["FSU", "SSS", "HHD_NO"],
  "weight_col": "Multiplier",
  "weight_scale": 0.01,
  "hh_size_col": "HH_Size",
  "mpce_col": "MPCE_URP",
  "mp_state_codes": ["23", "MADHYA PRADESH"],
  "rural_sector_values": ["1", "RURAL"],
  "urban_sector_values": ["2", "URBAN"],
  "item_expenditure_cols": {
    "petrol": "exp_petrol",
    "lpg": "exp_lpg",
    "vegetables": "exp_vegetables"
  },
  "item_recall_bases": {
    "petrol": "monthly_inr",
    "lpg": "monthly_inr",
    "vegetables": "monthly_inr"
  },
  "source_title": "MoSPI HCES 2023-24",
  "survey_year": "2023-24"
}
```

---

## 3. Recall Period Normalization & Verification Contract (Fix F-01)

In NSSO surveys, different consumption schedules use distinct recall reference periods:
* Food items (`FDQ`) typically use **7-day recall** (MMRP).
* Consumables (`CSQ`, petrol/LPG) use **30-day recall**.
* Durable goods (`DGQ`) use **365-day recall**.

### Strict Safety Invariants
1. **Verified 30-Day Monthly Basis Required:**
   Every item mapped in `item_expenditure_cols` **must** be explicitly declared in `item_recall_bases` with basis `"monthly_inr"`.
2. **Rejection of Unverified Bases:**
   If an item's recall basis is omitted, declared as `"unverified"`, or declared as a raw recall period (e.g., `"7_day_raw"`), the pipeline **strictly halts with `HCESMappingError`**.
3. **No Automatic `30/7` Multipliers:**
   The pipeline strictly forbids applying hardcoded conversion multipliers (such as `30/7`) unless the official survey methodology explicitly specifies that conversion factor for that specific variable. Raw input data must be normalized to monthly totals in verified pre-processing before ingestion.

---

## 4. Weighted Fractile Tie Convention (Fix F-04)

The pipeline derives the 20th and 80th percentiles using cumulative population person-weights:
$$W_h = \text{Multiplier}_h \times \text{weight\_scale} \times \text{hh\_size}_h$$
$$T_{20} = 0.20 \times W_{\text{total}}, \quad T_{80} = 0.80 \times W_{\text{total}}$$

### Interval Partitioning
The pipeline applies a standard **right-closed interval convention**:
* **Low Class (0–20%):** $\text{MPCE} \le p20$ ($[0, p20]$)
* **Middle Class (20–80%):** $p20 < \text{MPCE} \le p80$ ($(p20, p80]$)
* **High Class (80–100%):** $\text{MPCE} > p80$ ($(p80, \infty)$)

### Discrete Boundary Ties Behavior
In empirical survey samples with tied MPCE observations at the threshold boundaries:
* All households with $\text{MPCE} == p20$ are grouped into the **Low Class**.
* All households with $\text{MPCE} == p80$ are grouped into the **Middle Class**.
* As a result, the realized population weight in each demographic class may slightly deviate from exact theoretical $20.0\% / 60.0\% / 20.0\%$ proportions in the presence of tied boundary observations.

---

## 5. How to Run the Script

Run the extraction script using Python 3:

```bash
# Basic run with default column mapping
python scripts/extract_hces_personas.py \
  --input-dir /path/to/hces_raw_data/ \
  --output-path data/curated/household_personas.csv

# With custom variable mapping and item spending shares export
python scripts/extract_hces_personas.py \
  --input-dir /path/to/hces_raw_data/ \
  --output-path data/curated/household_personas.csv \
  --mapping-config config/hces_mapping.json \
  --item-shares-output data/curated/household_item_shares.csv \
  --overwrite
```

### Safety & Overwrite Protection
* The pipeline **refuses to overwrite** an existing output file by default. Pass `--overwrite` explicitly to confirm file updates.
* The pipeline **strictly halts** if required columns are missing, weights are non-positive, records contain negative MPCE, or item recall periods are unverified.

---

## 6. Output Schema & Provenance

The primary output strictly adheres to `data/templates/household-persona-template.csv`:

```csv
persona_id,state,sector,expenditure_class,survey_source,survey_year,mpce_value_inr,household_size_conversion_status,verified_status,notes
mp_rural_low,Madhya Pradesh,rural,low,MoSPI HCES 2023-24,2023-24,1850.50,per_capita_survey_basis (avg_hh_size=4.82),[VERIFIED],Official MoSPI HCES 2023-24 extraction...
```

### Stable Persona Identifiers
The pipeline produces exactly the six canonical personas required by the India Impact Graph MVP:
1. `mp_rural_low`: Rural Low Class (0–20% MPCE fractile)
2. `mp_rural_middle`: Rural Middle Class (20–80% MPCE fractile)
3. `mp_rural_high`: Rural High Class (80–100% MPCE fractile)
4. `mp_urban_low`: Urban Low Class (0–20% MPCE fractile)
5. `mp_urban_middle`: Urban Middle Class (20–80% MPCE fractile)
6. `mp_urban_high`: Urban High Class (80–100% MPCE fractile)

---

## 7. Current Data Limitations & Safeguards

1. **No Synthetic Production Data:** In adherence to `docs/DATA_AND_EVIDENCE_RULES.md`, synthetic or mock test fixtures must **never** be exported to `data/curated/household_personas.csv`.
2. **Missing Real Data State:** Until official unit-level microdata files are formally obtained from MoSPI, `data/curated/household_personas.csv` remains unpopulated, and candidate items remain `is_calculable=False`.
3. **Never Mix CPI Weights:** The pipeline strictly computes spending shares from empirical survey consumption records. Macro CPI weights are not substituted as proxies for persona MPCE shares.
