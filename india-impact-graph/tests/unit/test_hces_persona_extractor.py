"""
Unit Tests for HCES 2023-24 Household Persona Extraction Pipeline
=================================================================

Validates the data extraction, weighted fractile partitioning, schema conformance,
input validation constraints, composite household IDs, recall period safety,
and non-overwrite protections of the HCES pipeline.

All test fixtures use explicitly labeled SYNTHETIC data and never touch
or overwrite curated production datasets.
"""

from __future__ import annotations

import csv
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Dict, List

import pytest

# Ensure scripts directory is importable
SCRIPTS_DIR = Path(__file__).resolve().parent.parent.parent / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from extract_hces_personas import (  # noqa: E402
    HCESExtractionError,
    HCESMappingConfig,
    HCESMappingError,
    HCESPersonaExtractor,
    HCESValidationError,
    STABLE_PERSONA_IDS,
    TEMPLATE_HEADERS,
    compute_weighted_fractile_cutoffs,
    partition_into_classes,
)


# ==============================================================================
# Synthetic Test Fixtures Helper
# ==============================================================================

def generate_synthetic_hces_records(
    num_rural: int = 10,
    num_urban: int = 10,
    mp_state_code: str = "23",
    include_other_states: bool = True,
    include_items: bool = True,
    composite_ids: bool = False,
) -> List[Dict[str, str]]:
    """
    Generates deterministic, synthetic household survey records for testing.
    Synthetic labels prevent confusing test data with real survey values.
    """
    records: List[Dict[str, str]] = []

    # Rural records
    for i in range(1, num_rural + 1):
        mpce = 1000.0 + (i * 400.0)
        hh_size = 4.0
        rec = {
            "hh_id": f"SYN_RURAL_{i:04d}",
            "state": mp_state_code,
            "sector": "1",  # 1 = Rural
            "weight": "100.0",
            "hh_size": f"{hh_size:.1f}",
            "mpce": f"{mpce:.2f}",
        }
        if composite_ids:
            rec["fsu"] = f"FSU_{i:03d}"
            rec["sss"] = "1"
            rec["hhd_no"] = f"{i:02d}"

        if include_items:
            rec["exp_petrol"] = f"{mpce * hh_size * 0.05:.2f}"
            rec["exp_lpg"] = f"{mpce * hh_size * 0.04:.2f}"
            rec["exp_vegetables"] = f"{mpce * hh_size * 0.08:.2f}"
        records.append(rec)

    # Urban records
    for i in range(1, num_urban + 1):
        mpce = 2000.0 + (i * 800.0)
        hh_size = 3.5
        rec = {
            "hh_id": f"SYN_URBAN_{i:04d}",
            "state": mp_state_code,
            "sector": "2",  # 2 = Urban
            "weight": "150.0",
            "hh_size": f"{hh_size:.1f}",
            "mpce": f"{mpce:.2f}",
        }
        if composite_ids:
            rec["fsu"] = f"FSU_{i + 50:03d}"
            rec["sss"] = "2"
            rec["hhd_no"] = f"{i:02d}"

        if include_items:
            rec["exp_petrol"] = f"{mpce * hh_size * 0.08:.2f}"
            rec["exp_lpg"] = f"{mpce * hh_size * 0.03:.2f}"
            rec["exp_vegetables"] = f"{mpce * hh_size * 0.06:.2f}"
        records.append(rec)

    # Add other states to test state filtering
    if include_other_states:
        rec_up = {
            "hh_id": "SYN_UP_0001",
            "state": "09",  # Uttar Pradesh
            "sector": "1",
            "weight": "200.0",
            "hh_size": "5.0",
            "mpce": "2800.00",
            "exp_petrol": "100.00",
            "exp_lpg": "80.00",
            "exp_vegetables": "150.00",
        }
        if composite_ids:
            rec_up["fsu"] = "FSU_999"
            rec_up["sss"] = "1"
            rec_up["hhd_no"] = "01"
        records.append(rec_up)

        rec_mh = {
            "hh_id": "SYN_MH_0001",
            "state": "27",  # Maharashtra
            "sector": "2",
            "weight": "250.0",
            "hh_size": "3.0",
            "mpce": "6500.00",
            "exp_petrol": "300.00",
            "exp_lpg": "120.00",
            "exp_vegetables": "250.00",
        }
        if composite_ids:
            rec_mh["fsu"] = "FSU_998"
            rec_mh["sss"] = "2"
            rec_mh["hhd_no"] = "01"
        records.append(rec_mh)

    return records


# ==============================================================================
# Unit Tests
# ==============================================================================

class TestHCESPersonaExtraction:
    """Tests the core extraction logic on synthetic fixtures."""

    def test_rural_and_urban_separation_and_all_six_persona_ids(self):
        """Verifies sector separation and presence of all 6 stable persona IDs."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10)
        mapping = HCESMappingConfig(
            item_expenditure_cols={
                "petrol": "exp_petrol",
                "lpg": "exp_lpg",
                "vegetables": "exp_vegetables",
            },
            item_recall_bases={
                "petrol": "monthly_inr",
                "lpg": "monthly_inr",
                "vegetables": "monthly_inr",
            },
        )
        extractor = HCESPersonaExtractor(mapping=mapping)

        personas = extractor.process_records(records, source_file_name="test_synthetic.csv")

        assert len(personas) == 6
        persona_ids = [p.persona_id for p in personas]
        assert persona_ids == STABLE_PERSONA_IDS

        # Check Rural personas
        rural_personas = [p for p in personas if p.sector == "rural"]
        assert len(rural_personas) == 3
        low_r = [p for p in rural_personas if p.expenditure_class == "low"][0]
        mid_r = [p for p in rural_personas if p.expenditure_class == "middle"][0]
        high_r = [p for p in rural_personas if p.expenditure_class == "high"][0]

        assert low_r.mpce_value_inr < mid_r.mpce_value_inr < high_r.mpce_value_inr
        assert low_r.avg_hh_size == 4.0

        # Check Urban personas
        urban_personas = [p for p in personas if p.sector == "urban"]
        assert len(urban_personas) == 3
        low_u = [p for p in urban_personas if p.expenditure_class == "low"][0]
        mid_u = [p for p in urban_personas if p.expenditure_class == "middle"][0]
        high_u = [p for p in urban_personas if p.expenditure_class == "high"][0]

        assert low_u.mpce_value_inr < mid_u.mpce_value_inr < high_u.mpce_value_inr
        assert low_u.avg_hh_size == 3.5

    def test_weighted_percentile_cutoffs(self):
        """Verifies mathematically correct cutoffs on unequal sample weights."""
        test_records = [
            {"mpce": 100.0, "person_weight": 10.0},  # cum: 10 (10%)
            {"mpce": 200.0, "person_weight": 10.0},  # cum: 20 (20% -> threshold 20)
            {"mpce": 300.0, "person_weight": 30.0},  # cum: 50 (50%)
            {"mpce": 400.0, "person_weight": 30.0},  # cum: 80 (80% -> threshold 80)
            {"mpce": 500.0, "person_weight": 20.0},  # cum: 100 (100%)
        ]
        p20, p80 = compute_weighted_fractile_cutoffs(test_records)
        assert p20 == 200.0
        assert p80 == 400.0

        partitioned = partition_into_classes(test_records, p20, p80)
        assert len(partitioned["low"]) == 2  # 100, 200 (right-closed [0, p20])
        assert len(partitioned["middle"]) == 2  # 300, 400 ((p20, p80])
        assert len(partitioned["high"]) == 1  # 500 ((p80, inf))

    def test_item_spending_shares_calculation(self):
        """Verifies item spending share computation from expenditure columns."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10)
        mapping = HCESMappingConfig(
            item_expenditure_cols={
                "petrol": "exp_petrol",
                "lpg": "exp_lpg",
                "vegetables": "exp_vegetables",
            },
            item_recall_bases={
                "petrol": "monthly_inr",
                "lpg": "monthly_inr",
                "vegetables": "monthly_inr",
            },
        )
        extractor = HCESPersonaExtractor(mapping=mapping)
        personas = extractor.process_records(records)

        for p in personas:
            expected_petrol = 0.05 if p.sector == "rural" else 0.08
            assert pytest.approx(p.item_shares["petrol"], rel=1e-2) == expected_petrol
            assert 0.0 < p.item_shares["lpg"] < 1.0
            assert 0.0 < p.item_shares["vegetables"] < 1.0

    def test_unverified_recall_basis_raises_mapping_error(self):
        """F-01 Fix: Pipeline must refuse to run if recall period is not 'monthly_inr'."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10)
        # Declaring 7_day_raw instead of monthly_inr
        mapping = HCESMappingConfig(
            item_expenditure_cols={"vegetables": "exp_vegetables"},
            item_recall_bases={"vegetables": "7_day_raw"},
        )
        extractor = HCESPersonaExtractor(mapping=mapping)

        with pytest.raises(HCESMappingError, match="Item 'vegetables' has unverified recall basis '7_day_raw'"):
            extractor.process_records(records)

    def test_missing_recall_basis_declaration_raises_mapping_error(self):
        """F-01 Fix: Omission of recall basis declaration must fail safely."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10)
        # Omitting item_recall_bases declaration entirely
        mapping = HCESMappingConfig(
            item_expenditure_cols={"petrol": "exp_petrol"},
        )
        extractor = HCESPersonaExtractor(mapping=mapping)

        with pytest.raises(HCESMappingError, match="Item 'petrol' has unverified recall basis 'unverified'"):
            extractor.process_records(records)

    def test_composite_household_id_success_and_deduplication(self):
        """F-03 Fix: Supports composite household key components and de-duplication."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10, composite_ids=True)
        mapping = HCESMappingConfig(
            composite_household_id_cols=["fsu", "sss", "hhd_no"],
        )
        extractor = HCESPersonaExtractor(mapping=mapping)
        personas = extractor.process_records(records)
        assert len(personas) == 6

        # Test duplicate detection with composite key
        dup_record = dict(records[0])
        records.append(dup_record)
        with pytest.raises(HCESValidationError, match="Duplicate household record with ID 'FSU_001_1_01'"):
            extractor.process_records(records)

    def test_composite_household_id_missing_component_raises_validation_error(self):
        """F-03 Fix: Row with empty composite key component must fail validation."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10, composite_ids=True)
        records[0]["hhd_no"] = ""  # blank component
        mapping = HCESMappingConfig(
            composite_household_id_cols=["fsu", "sss", "hhd_no"],
        )
        extractor = HCESPersonaExtractor(mapping=mapping)

        with pytest.raises(HCESValidationError, match="Missing component 'hhd_no' of composite household ID"):
            extractor.process_records(records)

    def test_composite_household_id_missing_column_in_header_raises_mapping_error(self):
        """F-03 Fix: Missing composite column in CSV header raises mapping error."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10, composite_ids=False)
        mapping = HCESMappingConfig(
            composite_household_id_cols=["non_existent_fsu", "sss", "hhd_no"],
        )
        extractor = HCESPersonaExtractor(mapping=mapping)

        with pytest.raises(HCESMappingError, match="Missing required columns in dataset.*non_existent_fsu"):
            extractor.process_records(records)

    def test_custom_mapping_config_json_roundtrip(self, tmp_path):
        """F-02 Fix: Verifies custom mapping loading from external JSON file."""
        config_data = {
            "state_col": "custom_state",
            "sector_col": "custom_sector",
            "household_id_col": "custom_id",
            "weight_col": "custom_weight",
            "weight_scale": 0.01,
            "hh_size_col": "custom_size",
            "mpce_col": "custom_mpce",
            "mp_state_codes": ["23"],
            "rural_sector_values": ["1"],
            "urban_sector_values": ["2"],
            "item_expenditure_cols": {"petrol": "custom_petrol"},
            "item_recall_bases": {"petrol": "monthly_inr"},
            "source_title": "Custom Test Survey",
            "survey_year": "2023-24",
        }
        cfg_file = tmp_path / "mapping.json"
        cfg_file.write_text(json.dumps(config_data), encoding="utf-8")

        mapping = HCESMappingConfig.from_json_file(cfg_file)
        assert mapping.state_col == "custom_state"
        assert mapping.weight_scale == 0.01
        assert mapping.item_recall_bases["petrol"] == "monthly_inr"

    def test_missing_required_columns_raises_mapping_error(self):
        """Pipeline must refuse to run if required columns are absent."""
        records = generate_synthetic_hces_records()
        for r in records:
            del r["mpce"]  # Remove required column

        extractor = HCESPersonaExtractor()
        with pytest.raises(HCESMappingError, match="Missing required columns in dataset.*mpce"):
            extractor.process_records(records)

    def test_missing_mapped_item_column_raises_mapping_error(self):
        """Pipeline must fail if mapped item column is missing."""
        records = generate_synthetic_hces_records(include_items=False)
        mapping = HCESMappingConfig(
            item_expenditure_cols={"petrol": "non_existent_petrol_col"},
            item_recall_bases={"petrol": "monthly_inr"},
        )
        extractor = HCESPersonaExtractor(mapping=mapping)

        with pytest.raises(HCESMappingError, match="Mapped item expenditure column.*is missing"):
            extractor.process_records(records)

    def test_invalid_and_negative_mpce_raises_validation_error(self):
        """Negative or non-numeric MPCE must trigger validation failure."""
        records = generate_synthetic_hces_records()
        records[0]["mpce"] = "-150.00"

        extractor = HCESPersonaExtractor()
        with pytest.raises(HCESValidationError, match="MPCE cannot be negative"):
            extractor.process_records(records)

        records[0]["mpce"] = "invalid_string"
        with pytest.raises(HCESValidationError, match="Invalid numeric MPCE"):
            extractor.process_records(records)

    def test_invalid_weight_and_household_size_raises_validation_error(self):
        """Non-positive weight or household size must be rejected."""
        records = generate_synthetic_hces_records()
        records[0]["weight"] = "0.0"

        extractor = HCESPersonaExtractor()
        with pytest.raises(HCESValidationError, match="Survey weight must be strictly positive"):
            extractor.process_records(records)

        records = generate_synthetic_hces_records()
        records[0]["hh_size"] = "0"
        with pytest.raises(HCESValidationError, match="Household size must be strictly positive"):
            extractor.process_records(records)

    def test_duplicate_household_records_rejected(self):
        """Duplicate household IDs within state/sector must be rejected."""
        records = generate_synthetic_hces_records()
        dup_record = dict(records[0])
        records.append(dup_record)

        extractor = HCESPersonaExtractor()
        with pytest.raises(HCESValidationError, match="Duplicate household record with ID"):
            extractor.process_records(records)

    def test_no_data_for_madhya_pradesh_raises_validation_error(self):
        """If dataset contains records but none for MP, pipeline must refuse to run."""
        records = [
            {
                "hh_id": "SYN_UP_0001",
                "state": "09",  # Uttar Pradesh
                "sector": "1",
                "weight": "200.0",
                "hh_size": "5.0",
                "mpce": "2800.00",
            }
        ]
        extractor = HCESPersonaExtractor()
        with pytest.raises(HCESValidationError, match="No valid records found for Madhya Pradesh"):
            extractor.process_records(records)

    def test_empty_dataset_raises_validation_error(self):
        """Empty input dataset must fail validation."""
        extractor = HCESPersonaExtractor()
        with pytest.raises(HCESValidationError, match="contains 0 records"):
            extractor.process_records([])


class TestHCESOutputSafety:
    """Tests file writing, schema conformance, non-overwrite, and registry protection."""

    def test_deterministic_output_and_schema_conformance(self, tmp_path):
        """Generated CSV must strictly conform to household-persona-template.csv schema."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10)
        extractor = HCESPersonaExtractor()
        personas = extractor.process_records(records)

        out_file = tmp_path / "test_personas.csv"
        extractor.write_output_csv(personas, out_file)

        assert out_file.is_file()

        with open(out_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            assert reader.fieldnames == TEMPLATE_HEADERS
            rows = list(reader)

        assert len(rows) == 6
        output_ids = [r["persona_id"] for r in rows]
        assert output_ids == STABLE_PERSONA_IDS

        for row in rows:
            assert row["state"] == "Madhya Pradesh"
            assert row["sector"] in ["rural", "urban"]
            assert row["expenditure_class"] in ["low", "middle", "high"]
            assert row["survey_source"] == "MoSPI HCES 2023-24"
            assert row["survey_year"] == "2023-24"
            assert float(row["mpce_value_inr"]) > 0
            assert "per_capita_survey_basis" in row["household_size_conversion_status"]
            assert row["verified_status"] == "[VERIFIED]"
            assert "p20=" in row["notes"]

    def test_no_overwrite_existing_file_without_flag(self, tmp_path):
        """Pipeline must refuse to overwrite an existing file unless overwrite=True."""
        records = generate_synthetic_hces_records(num_rural=10, num_urban=10)
        extractor = HCESPersonaExtractor()
        personas = extractor.process_records(records)

        out_file = tmp_path / "existing_personas.csv"
        out_file.write_text("existing content", encoding="utf-8")

        with pytest.raises(FileExistsError, match="already exists"):
            extractor.write_output_csv(personas, out_file, overwrite=False)

        # Overwrite with explicit flag
        extractor.write_output_csv(personas, out_file, overwrite=True)
        assert out_file.read_text(encoding="utf-8").startswith("persona_id,state")

    def test_curated_consumption_items_registry_remains_unmodified_and_not_calculable(self):
        """
        Integrity guard: Consumption items in data/curated/consumption_items.csv
        must NEVER have been promoted to is_calculable=true during this task.
        """
        registry_path = Path(__file__).resolve().parent.parent.parent / "data" / "curated" / "consumption_items.csv"
        assert registry_path.is_file()

        with open(registry_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        assert len(rows) == 10
        for row in rows:
            assert row["is_calculable"].lower() == "false", (
                f"Item {row['item_id']} was accidentally promoted to is_calculable=true!"
            )
