#!/usr/bin/env python3
"""
HCES 2023-24 Household Persona Extraction Pipeline
===================================================

Extracts empirical Monthly Per Capita Consumption Expenditure (MPCE), average
household sizes, and item spending shares for six canonical Madhya Pradesh
household personas from official MoSPI HCES 2023-24 microdata / unit records.

Author: Backend Developer 1
Project: India Impact Graph (PS 5, Hackwave 3.0)
Rules: Strict evidence preservation. Never fabricates values or substitutes
       macro CPI weights. Validates survey weights, nonnegativity, and provenance.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


# ==============================================================================
# Exceptions
# ==============================================================================

class HCESExtractionError(Exception):
    """Base exception for HCES extraction pipeline errors."""
    pass


class HCESMappingError(HCESExtractionError):
    """Raised when variable mappings do not match source datasets."""
    pass


class HCESValidationError(HCESExtractionError):
    """Raised when input records violate validation constraints."""
    pass


# ==============================================================================
# Configuration Data Model
# ==============================================================================

@dataclass
class HCESMappingConfig:
    """
    Configurable column mapping and recall period validation for HCES unit datasets.

    NOTE ON OFFICIAL MoSPI FIELD NAMES:
    The default lowercase column names ('state', 'sector', 'weight', 'hh_size', 'mpce')
    are standard placeholder defaults for pre-formatted extracts. Official MoSPI ASCII
    and Stata/DTA microdata files typically use uppercase codes (e.g. 'State', 'Sector',
    'Multiplier', 'HH_Size', 'MPCE_URP'). For raw MoSPI extracts, provide a custom
    JSON mapping configuration via --mapping-config.
    """
    state_col: str = "state"
    sector_col: str = "sector"
    household_id_col: Optional[str] = "hh_id"
    composite_household_id_cols: Optional[List[str]] = None
    weight_col: str = "weight"
    weight_scale: float = 1.0
    hh_size_col: str = "hh_size"
    mpce_col: str = "mpce"
    mp_state_codes: List[str] = field(default_factory=lambda: ["23", "MP", "MADHYA PRADESH"])
    rural_sector_values: List[str] = field(default_factory=lambda: ["1", "RURAL", "R"])
    urban_sector_values: List[str] = field(default_factory=lambda: ["2", "URBAN", "U"])
    item_expenditure_cols: Dict[str, str] = field(default_factory=dict)
    item_recall_bases: Dict[str, str] = field(default_factory=dict)
    source_title: str = "MoSPI HCES 2023-24"
    survey_year: str = "2023-24"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> HCESMappingConfig:
        comp_cols = data.get("composite_household_id_cols")
        if comp_cols is not None:
            comp_cols = [str(c).strip() for c in comp_cols]

        raw_recall = data.get("item_recall_bases", {})
        recall_bases = {str(k).strip(): str(v).strip().lower() for k, v in raw_recall.items()}

        return cls(
            state_col=str(data.get("state_col", "state")),
            sector_col=str(data.get("sector_col", "sector")),
            household_id_col=data.get("household_id_col", "hh_id") if "household_id_col" in data else "hh_id",
            composite_household_id_cols=comp_cols,
            weight_col=str(data.get("weight_col", "weight")),
            weight_scale=float(data.get("weight_scale", 1.0)),
            hh_size_col=str(data.get("hh_size_col", "hh_size")),
            mpce_col=str(data.get("mpce_col", "mpce")),
            mp_state_codes=[str(x).strip().upper() for x in data.get("mp_state_codes", ["23", "MP", "MADHYA PRADESH"])],
            rural_sector_values=[str(x).strip().upper() for x in data.get("rural_sector_values", ["1", "RURAL", "R"])],
            urban_sector_values=[str(x).strip().upper() for x in data.get("urban_sector_values", ["2", "URBAN", "U"])],
            item_expenditure_cols=dict(data.get("item_expenditure_cols", {})),
            item_recall_bases=recall_bases,
            source_title=str(data.get("source_title", "MoSPI HCES 2023-24")),
            survey_year=str(data.get("survey_year", "2023-24")),
        )

    @classmethod
    def from_json_file(cls, path: Path | str) -> HCESMappingConfig:
        file_path = Path(path)
        if not file_path.is_file():
            raise HCESMappingError(f"Mapping configuration file not found: {file_path}")
        with open(file_path, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError as exc:
                raise HCESMappingError(f"Malformed JSON in mapping configuration file: {exc}") from exc
        return cls.from_dict(data)


@dataclass
class PersonaAggregate:
    """Aggregate statistics computed for a single persona class."""
    persona_id: str
    state: str
    sector: str
    expenditure_class: str
    survey_source: str
    survey_year: str
    mpce_value_inr: float
    avg_hh_size: float
    sample_households_count: int
    p20_cutoff: float
    p80_cutoff: float
    item_shares: Dict[str, float] = field(default_factory=dict)
    provenance_notes: str = ""


# Stable Persona ID list mandated by project specification
STABLE_PERSONA_IDS = [
    "mp_rural_low",
    "mp_rural_middle",
    "mp_rural_high",
    "mp_urban_low",
    "mp_urban_middle",
    "mp_urban_high",
]

TEMPLATE_HEADERS = [
    "persona_id",
    "state",
    "sector",
    "expenditure_class",
    "survey_source",
    "survey_year",
    "mpce_value_inr",
    "household_size_conversion_status",
    "verified_status",
    "notes",
]


# ==============================================================================
# Core Extraction and Aggregation Logic
# ==============================================================================

def validate_row_and_extract(
    row: Dict[str, str],
    mapping: HCESMappingConfig,
    row_idx: int,
) -> Optional[Dict[str, Any]]:
    """
    Validates a raw dictionary record against mapping rules.
    Returns cleaned typed record if belonging to Madhya Pradesh, else None.
    Raises HCESValidationError on invalid numbers, negative values, or nulls.
    """
    raw_state = row.get(mapping.state_col)
    if raw_state is None or raw_state.strip() == "":
        raise HCESValidationError(f"Row {row_idx}: Missing required state value in column '{mapping.state_col}'")

    clean_state = raw_state.strip().upper()
    if clean_state not in mapping.mp_state_codes:
        return None  # Skip non-MP records safely

    raw_sector = row.get(mapping.sector_col)
    if raw_sector is None or raw_sector.strip() == "":
        raise HCESValidationError(f"Row {row_idx}: Missing required sector value in column '{mapping.sector_col}'")

    clean_sector = raw_sector.strip().upper()
    if clean_sector in mapping.rural_sector_values:
        sector_name = "rural"
    elif clean_sector in mapping.urban_sector_values:
        sector_name = "urban"
    else:
        raise HCESValidationError(
            f"Row {row_idx}: Unrecognized sector value '{raw_sector}' in column '{mapping.sector_col}'"
        )

    # Validate weight
    raw_weight = row.get(mapping.weight_col)
    if raw_weight is None or raw_weight.strip() == "":
        raise HCESValidationError(f"Row {row_idx}: Missing survey weight in column '{mapping.weight_col}'")
    try:
        weight = float(raw_weight)
    except ValueError as exc:
        raise HCESValidationError(f"Row {row_idx}: Invalid numeric weight '{raw_weight}'") from exc
    if weight <= 0 or math.isnan(weight) or math.isinf(weight):
        raise HCESValidationError(f"Row {row_idx}: Survey weight must be strictly positive, got {weight}")

    # Validate household size
    raw_hh_size = row.get(mapping.hh_size_col)
    if raw_hh_size is None or raw_hh_size.strip() == "":
        raise HCESValidationError(f"Row {row_idx}: Missing household size in column '{mapping.hh_size_col}'")
    try:
        hh_size = float(raw_hh_size)
    except ValueError as exc:
        raise HCESValidationError(f"Row {row_idx}: Invalid numeric household size '{raw_hh_size}'") from exc
    if hh_size <= 0 or math.isnan(hh_size) or math.isinf(hh_size):
        raise HCESValidationError(f"Row {row_idx}: Household size must be strictly positive, got {hh_size}")

    # Validate MPCE
    raw_mpce = row.get(mapping.mpce_col)
    if raw_mpce is None or raw_mpce.strip() == "":
        raise HCESValidationError(f"Row {row_idx}: Missing MPCE in column '{mapping.mpce_col}'")
    try:
        mpce = float(raw_mpce)
    except ValueError as exc:
        raise HCESValidationError(f"Row {row_idx}: Invalid numeric MPCE '{raw_mpce}'") from exc
    if mpce <= 0 or math.isnan(mpce) or math.isinf(mpce):
        raise HCESValidationError(f"Row {row_idx}: MPCE must be strictly positive, got {mpce}")

    hh_id = None
    if mapping.composite_household_id_cols:
        parts = []
        for c in mapping.composite_household_id_cols:
            val = row.get(c)
            if val is None or val.strip() == "":
                raise HCESValidationError(
                    f"Row {row_idx}: Missing component '{c}' of composite household ID"
                )
            parts.append(val.strip())
        hh_id = "_".join(parts)
    elif mapping.household_id_col:
        raw_id = row.get(mapping.household_id_col)
        if raw_id is not None and raw_id.strip() != "":
            hh_id = raw_id.strip()

    # Validate optional item expenditures
    item_expenditures: Dict[str, float] = {}
    for item_key, col_name in mapping.item_expenditure_cols.items():
        raw_item_exp = row.get(col_name)
        if raw_item_exp is not None and raw_item_exp.strip() != "":
            try:
                exp_val = float(raw_item_exp)
            except ValueError as exc:
                raise HCESValidationError(
                    f"Row {row_idx}: Invalid numeric expenditure for '{item_key}' in column '{col_name}'"
                ) from exc
            if exp_val < 0 or math.isnan(exp_val) or math.isinf(exp_val):
                raise HCESValidationError(
                    f"Row {row_idx}: Item expenditure for '{item_key}' cannot be negative, got {exp_val}"
                )
            # Economic invariant: item per-capita expenditure cannot exceed total household MPCE
            pc_item_exp = exp_val / hh_size
            if pc_item_exp > mpce:
                raise HCESValidationError(
                    f"Row {row_idx}: Per-capita expenditure for '{item_key}' ({pc_item_exp:.2f} INR) "
                    f"cannot exceed total household MPCE ({mpce:.2f} INR)"
                )
            item_expenditures[item_key] = exp_val

    # Economic invariant: sum of item per-capita expenditures cannot exceed total household MPCE
    total_items_pc_exp = sum(item_expenditures.values()) / hh_size
    if total_items_pc_exp > mpce:
        raise HCESValidationError(
            f"Row {row_idx}: Sum of item per-capita expenditures ({total_items_pc_exp:.2f} INR) "
            f"cannot exceed total household MPCE ({mpce:.2f} INR)"
        )

    return {
        "hh_id": hh_id,
        "state": "Madhya Pradesh",
        "sector": sector_name,
        "weight": weight * mapping.weight_scale,
        "hh_size": hh_size,
        "mpce": mpce,
        "person_weight": weight * mapping.weight_scale * hh_size,
        "item_expenditures": item_expenditures,
    }


def compute_weighted_fractile_cutoffs(
    records: List[Dict[str, Any]],
) -> Tuple[float, float]:
    """
    Calculates weighted 20th and 80th percentile MPCE cutoffs from sorted records.
    Uses population person weights: W_h = multiplier * hh_size.

    TIE CONVENTION & BOUNDARY METHODOLOGY:
    Thresholds T_20 = 0.20 * Total_W and T_80 = 0.80 * Total_W define the empirical
    population person-weight boundaries. The cutoffs p20 and p80 are the MPCE values
    where cumulative person-weight first meets or exceeds T_20 and T_80 respectively.
    """
    if not records:
        raise HCESValidationError("Cannot calculate fractile cutoffs on empty record list.")

    sorted_records = sorted(records, key=lambda r: r["mpce"])
    total_person_weight = sum(r["person_weight"] for r in sorted_records)
    if total_person_weight <= 0:
        raise HCESValidationError("Total person weight must be strictly positive.")

    threshold_20 = 0.20 * total_person_weight
    threshold_80 = 0.80 * total_person_weight

    cum_weight = 0.0
    p20_cutoff = sorted_records[0]["mpce"]
    p80_cutoff = sorted_records[-1]["mpce"]
    p20_found = False
    p80_found = False

    for rec in sorted_records:
        cum_weight += rec["person_weight"]
        if not p20_found and cum_weight >= threshold_20:
            p20_cutoff = rec["mpce"]
            p20_found = True
        if not p80_found and cum_weight >= threshold_80:
            p80_cutoff = rec["mpce"]
            p80_found = True
            break

    if p20_cutoff > p80_cutoff:
        raise HCESValidationError(
            f"Mathematical anomaly: p20 cutoff ({p20_cutoff}) exceeds p80 cutoff ({p80_cutoff})"
        )

    return p20_cutoff, p80_cutoff


def partition_into_classes(
    records: List[Dict[str, Any]],
    p20: float,
    p80: float,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Partitions records into Low (0-20%), Middle (20-80%), and High (80-100%)
    expenditure classes based on verified cutoffs.

    DISCRETE TIE CONVENTION & REALIZED PERCENTAGES:
    Uses a standard right-closed interval convention:
    - Low Class:    MPCE <= p20        ([0, p20])
    - Middle Class: p20 < MPCE <= p80  ((p20, p80])
    - High Class:   MPCE > p80         ((p80, infinity))

    Households with MPCE exactly equal to p20 are grouped into Low, and those exactly
    equal to p80 are grouped into Middle. Consequently, in discrete sample distributions
    with tied observations at boundaries, realized class population weights may slightly
    deviate from exact 20.0% / 60.0% / 20.0% targets.
    """
    low_records: List[Dict[str, Any]] = []
    middle_records: List[Dict[str, Any]] = []
    high_records: List[Dict[str, Any]] = []

    for r in records:
        mpce = r["mpce"]
        if mpce <= p20:
            low_records.append(r)
        elif mpce <= p80:
            middle_records.append(r)
        else:
            high_records.append(r)

    return {
        "low": low_records,
        "middle": middle_records,
        "high": high_records,
    }


def aggregate_class_metrics(
    class_name: str,
    sector: str,
    class_records: List[Dict[str, Any]],
    p20: float,
    p80: float,
    mapping: HCESMappingConfig,
    source_file_name: str,
) -> PersonaAggregate:
    """
    Computes persona-level weighted average MPCE, weighted household size,
    and item spending shares for a demographic class.
    """
    persona_id = f"mp_{sector}_{class_name}"
    count = len(class_records)
    if count == 0:
        raise HCESValidationError(
            f"Class '{class_name}' in sector '{sector}' contains 0 sample households. "
            f"Cannot compute empirical MPCE without observations."
        )

    sum_person_weight = sum(r["person_weight"] for r in class_records)
    if sum_person_weight <= 0:
        raise HCESValidationError(f"Non-positive person weight sum for persona '{persona_id}'")

    # Weighted MPCE
    weighted_mpce = sum(r["person_weight"] * r["mpce"] for r in class_records) / sum_person_weight

    # Weighted Average Household Size
    sum_hh_weights = sum(r["weight"] for r in class_records)
    if sum_hh_weights <= 0:
        raise HCESValidationError(f"Non-positive household weight sum for persona '{persona_id}'")
    weighted_hh_size = sum(r["weight"] * r["hh_size"] for r in class_records) / sum_hh_weights

    # Item Spending Shares (if available)
    item_shares: Dict[str, float] = {}
    for item_key in mapping.item_expenditure_cols.keys():
        total_item_pc_exp = 0.0
        has_item_data = False
        for r in class_records:
            if item_key in r["item_expenditures"]:
                has_item_data = True
                # Per-capita item expenditure for household
                pc_exp = r["item_expenditures"][item_key] / r["hh_size"]
                total_item_pc_exp += r["person_weight"] * pc_exp

        if has_item_data and weighted_mpce > 0:
            avg_pc_item_exp = total_item_pc_exp / sum_person_weight
            share = avg_pc_item_exp / weighted_mpce
            if share > 1.0:
                raise HCESValidationError(
                    f"Class '{class_name}' calculated spending share for '{item_key}' ({share:.6f}) exceeds 1.0"
                )
            item_shares[item_key] = round(share, 6)

    # Invariant: total sum of calculated item shares cannot exceed 1.0 (100% of household expenditure)
    total_shares = sum(item_shares.values())
    if total_shares > 1.0:
        raise HCESValidationError(
            f"Class '{class_name}' total calculated item spending shares ({total_shares:.6f}) exceeds 1.0"
        )

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
    notes = (
        f"Official MoSPI HCES {mapping.survey_year} extraction. Sector={sector}, "
        f"Class={class_name} (p20={p20:.2f}, p80={p80:.2f} INR). "
        f"Sample: N={count} households. Extracted: {timestamp} from {source_file_name}."
    )

    return PersonaAggregate(
        persona_id=persona_id,
        state="Madhya Pradesh",
        sector=sector,
        expenditure_class=class_name,
        survey_source=mapping.source_title,
        survey_year=mapping.survey_year,
        mpce_value_inr=round(weighted_mpce, 2),
        avg_hh_size=round(weighted_hh_size, 2),
        sample_households_count=count,
        p20_cutoff=round(p20, 2),
        p80_cutoff=round(p80, 2),
        item_shares=item_shares,
        provenance_notes=notes,
    )


# ==============================================================================
# Pipeline Execution Engine
# ==============================================================================

class HCESPersonaExtractor:
    """End-to-end extractor for HCES unit-level survey datasets."""

    def __init__(self, mapping: Optional[HCESMappingConfig] = None):
        self.mapping = mapping or HCESMappingConfig()

    def process_records(
        self,
        records: List[Dict[str, str]],
        source_file_name: str = "in_memory_dataset",
    ) -> List[PersonaAggregate]:
        """Processes raw CSV dictionary records and produces 6 PersonaAggregates."""
        if not records:
            raise HCESValidationError("Input dataset contains 0 records.")

        # Check required columns
        header_keys = set(records[0].keys())
        required_cols = [
            self.mapping.state_col,
            self.mapping.sector_col,
            self.mapping.weight_col,
            self.mapping.hh_size_col,
            self.mapping.mpce_col,
        ]
        if self.mapping.composite_household_id_cols:
            for c in self.mapping.composite_household_id_cols:
                if c not in required_cols:
                    required_cols.append(c)
        elif self.mapping.household_id_col:
            if self.mapping.household_id_col not in required_cols:
                required_cols.append(self.mapping.household_id_col)

        missing_cols = [c for c in required_cols if c not in header_keys]
        if missing_cols:
            raise HCESMappingError(
                f"Missing required columns in dataset: {missing_cols}. Available columns: {sorted(header_keys)}"
            )

        # Check optional item expenditure columns and verified recall period
        for item_key, col in self.mapping.item_expenditure_cols.items():
            if col not in header_keys:
                raise HCESMappingError(
                    f"Mapped item expenditure column '{col}' for item '{item_key}' is missing from dataset."
                )
            # F-01 Fix: Enforce verified 30-day monthly recall basis
            basis = self.mapping.item_recall_bases.get(item_key, "unverified")
            if basis != "monthly_inr":
                raise HCESMappingError(
                    f"Item '{item_key}' has unverified recall basis '{basis}'. "
                    f"The pipeline requires explicit verification that input expenditure is on a 30-day "
                    f"monthly basis ('monthly_inr'). Automatic conversion of raw recall periods "
                    f"(such as 7-day food recall or 365-day durables recall) is strictly forbidden "
                    f"without verified survey documentation."
                )

        # Validate and filter
        cleaned_records: List[Dict[str, Any]] = []
        seen_hh_ids = set()

        for idx, row in enumerate(records, start=1):
            clean = validate_row_and_extract(row, self.mapping, idx)
            if clean is not None:
                if clean["hh_id"]:
                    dedup_key = (clean["sector"], clean["hh_id"])
                    if dedup_key in seen_hh_ids:
                        raise HCESValidationError(
                            f"Row {idx}: Duplicate household record with ID '{clean['hh_id']}' in sector '{clean['sector']}'"
                        )
                    seen_hh_ids.add(dedup_key)
                cleaned_records.append(clean)

        if not cleaned_records:
            raise HCESValidationError("No valid records found for Madhya Pradesh in dataset.")

        rural_records = [r for r in cleaned_records if r["sector"] == "rural"]
        urban_records = [r for r in cleaned_records if r["sector"] == "urban"]

        if not rural_records:
            raise HCESValidationError("No Madhya Pradesh Rural records found in dataset.")
        if not urban_records:
            raise HCESValidationError("No Madhya Pradesh Urban records found in dataset.")

        # Compute rural classes
        rural_p20, rural_p80 = compute_weighted_fractile_cutoffs(rural_records)
        rural_classes = partition_into_classes(rural_records, rural_p20, rural_p80)

        # Compute urban classes
        urban_p20, urban_p80 = compute_weighted_fractile_cutoffs(urban_records)
        urban_classes = partition_into_classes(urban_records, urban_p20, urban_p80)

        results: List[PersonaAggregate] = []

        # Rural Low, Middle, High
        for c_name in ["low", "middle", "high"]:
            res = aggregate_class_metrics(
                c_name, "rural", rural_classes[c_name], rural_p20, rural_p80, self.mapping, source_file_name
            )
            results.append(res)

        # Urban Low, Middle, High
        for c_name in ["low", "middle", "high"]:
            res = aggregate_class_metrics(
                c_name, "urban", urban_classes[c_name], urban_p20, urban_p80, self.mapping, source_file_name
            )
            results.append(res)

        # Final invariant: verify exactly 6 stable persona IDs present
        produced_ids = [r.persona_id for r in results]
        if produced_ids != STABLE_PERSONA_IDS:
            raise HCESValidationError(
                f"Generated persona IDs mismatch. Expected {STABLE_PERSONA_IDS}, got {produced_ids}"
            )

        return results

    def extract_from_file(self, file_path: Path | str) -> List[PersonaAggregate]:
        """Reads CSV file and processes records."""
        path = Path(file_path)
        if not path.is_file():
            raise HCESExtractionError(f"Input source data file not found: {path}")

        records: List[Dict[str, str]] = []
        with open(path, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                raise HCESValidationError(f"File '{path}' is empty or lacks CSV header.")
            for row in reader:
                records.append(row)

        return self.process_records(records, source_file_name=path.name)

    def write_output_csv(
        self,
        personas: List[PersonaAggregate],
        output_path: Path | str,
        overwrite: bool = False,
    ) -> None:
        """
        Writes extracted personas to output CSV strictly conforming to
        data/templates/household-persona-template.csv schema.
        """
        out = Path(output_path)
        if out.exists() and not overwrite:
            raise FileExistsError(
                f"Target output file '{out}' already exists. Pass overwrite=True to allow overwriting."
            )

        out.parent.mkdir(parents=True, exist_ok=True)

        rows: List[Dict[str, Any]] = []
        for p in personas:
            rows.append({
                "persona_id": p.persona_id,
                "state": p.state,
                "sector": p.sector,
                "expenditure_class": p.expenditure_class,
                "survey_source": p.survey_source,
                "survey_year": p.survey_year,
                "mpce_value_inr": f"{p.mpce_value_inr:.2f}",
                "household_size_conversion_status": f"per_capita_survey_basis (avg_hh_size={p.avg_hh_size:.2f})",
                "verified_status": "[VERIFIED]",
                "notes": p.provenance_notes,
            })

        # Deterministic sorting by persona_id order
        rows.sort(key=lambda r: STABLE_PERSONA_IDS.index(r["persona_id"]))

        with open(out, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=TEMPLATE_HEADERS)
            writer.writeheader()
            writer.writerows(rows)

    def write_item_shares_csv(
        self,
        personas: List[PersonaAggregate],
        item_shares_output_path: Path | str,
        overwrite: bool = False,
    ) -> None:
        """Writes item spending shares if item expenditure columns were configured."""
        out = Path(item_shares_output_path)
        if out.exists() and not overwrite:
            raise FileExistsError(
                f"Target item shares file '{out}' already exists. Pass overwrite=True to allow overwriting."
            )

        out.parent.mkdir(parents=True, exist_ok=True)

        shares_headers = [
            "persona_id",
            "item_id",
            "expenditure_share",
            "monthly_spending_inr",
            "verification_status",
            "notes",
        ]

        rows: List[Dict[str, Any]] = []
        for p in personas:
            for item_id, share in sorted(p.item_shares.items()):
                monthly_spending = round(p.mpce_value_inr * share, 2)
                rows.append({
                    "persona_id": p.persona_id,
                    "item_id": item_id,
                    "expenditure_share": f"{share:.6f}",
                    "monthly_spending_inr": f"{monthly_spending:.2f}",
                    "verification_status": "[VERIFIED]",
                    "notes": f"Empirical share for {item_id} from HCES {p.survey_year}.",
                })

        with open(out, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=shares_headers)
            writer.writeheader()
            writer.writerows(rows)


# ==============================================================================
# CLI Entrypoint
# ==============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract empirical MP household personas from official MoSPI HCES 2023-24 microdata.",
    )
    parser.add_argument(
        "--input-dir",
        "-i",
        required=True,
        type=str,
        help="Directory containing HCES 2023-24 unit record CSV files.",
    )
    parser.add_argument(
        "--output-path",
        "-o",
        required=True,
        type=str,
        help="Target output CSV path for household personas.",
    )
    parser.add_argument(
        "--mapping-config",
        "-m",
        required=False,
        type=str,
        default=None,
        help="Optional path to JSON variable mapping configuration file.",
    )
    parser.add_argument(
        "--item-shares-output",
        required=False,
        type=str,
        default=None,
        help="Optional target CSV path to store item spending shares.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        default=False,
        help="Allow overwriting target output file if it already exists.",
    )

    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    if not input_dir.is_dir():
        print(f"ERROR: Input directory '{input_dir}' does not exist or is not a directory.", file=sys.stderr)
        return 1

    # Locate candidate CSV in input directory
    candidate_files = list(input_dir.glob("*.csv")) + list(input_dir.glob("*.tsv"))
    if not candidate_files:
        print(f"ERROR: No CSV/TSV data files found in input directory '{input_dir}'.", file=sys.stderr)
        return 1

    # Select primary data file
    source_file = candidate_files[0]
    print(f"[INFO] Using source data file: {source_file}")

    # Load mapping
    if args.mapping_config:
        try:
            mapping = HCESMappingConfig.from_json_file(args.mapping_config)
            print(f"[INFO] Loaded custom mapping configuration from {args.mapping_config}")
        except HCESMappingError as exc:
            print(f"ERROR: Failed to load mapping configuration: {exc}", file=sys.stderr)
            return 1
    else:
        mapping = HCESMappingConfig()
        print("[INFO] Using default standard HCES mapping configuration.")

    extractor = HCESPersonaExtractor(mapping=mapping)

    try:
        personas = extractor.extract_from_file(source_file)
        extractor.write_output_csv(personas, args.output_path, overwrite=args.overwrite)
        print(f"[SUCCESS] Successfully generated 6 personas written to '{args.output_path}'.")

        if args.item_shares_output:
            extractor.write_item_shares_csv(personas, args.item_shares_output, overwrite=args.overwrite)
            print(f"[SUCCESS] Successfully wrote item spending shares to '{args.item_shares_output}'.")

        return 0
    except (HCESExtractionError, FileExistsError) as exc:
        print(f"ERROR: Pipeline execution aborted: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"UNEXPECTED ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
