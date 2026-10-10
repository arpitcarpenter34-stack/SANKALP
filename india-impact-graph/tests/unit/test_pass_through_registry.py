"""Unit tests for Pass-Through Register and CSV Loader.

Tests execute against an isolated in-memory SQLite database, guaranteeing zero modifications
to the developer's normal PostgreSQL database.
"""

import csv
from pathlib import Path
import sys
from unittest.mock import MagicMock
import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import Base
from app.models.pass_through import PassThroughRecordModel
from app.schemas.consumption import VerificationStatus
from app.schemas.pass_through import (
    PassThroughRecordBase,
    PassThroughRecordCreate,
    PassThroughRecordResponse,
)
from app.services.pass_through import (
    EXPECTED_CSV_COLUMNS,
    get_all_pass_through_records,
    get_pass_through_for_item,
    get_pass_through_record,
    load_pass_through_records_from_csv,
    validate_pass_through_csv,
)

TEMPLATE_CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "pass-through-register.csv"
CONSUMPTION_CURATED_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "curated" / "consumption_items.csv"

# In-memory SQLite engine configured for concurrent session isolation
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Create fresh schema before each test and drop it afterwards."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide an isolated database session bound to the test in-memory SQLite engine."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


# ==============================================================================
# Schema & Evidence Validation Tests
# ==============================================================================

class TestPassThroughSchemaValidation:
    """Tests for Pydantic schema constraints and evidence preservation."""

    def test_valid_verified_pass_through_record(self):
        record = PassThroughRecordCreate(
            upstream_commodity="crude_oil",
            downstream_item="petrol",
            pass_through_factor_low=0.30,
            pass_through_factor_high=0.45,
            unit="elasticity_coefficient",
            time_lag_months="1",
            historical_basis_source="PPAC Retail Price Build-up & MoPNG reports",
            verification_status=VerificationStatus.VERIFIED,
            caveats="Tax buffer and dealer commission cushion retail impact",
        )
        assert record.upstream_commodity == "crude_oil"
        assert record.downstream_item == "petrol"
        assert record.pass_through_factor_low == 0.30
        assert record.pass_through_factor_high == 0.45
        assert record.is_calculation_ready is True

    def test_valid_unverified_record_with_missing_factors(self):
        record = PassThroughRecordCreate(
            upstream_commodity="diesel",
            downstream_item="sugar",
            pass_through_factor_low=None,
            pass_through_factor_high=None,
            unit="elasticity_coefficient",
            time_lag_months=None,
            historical_basis_source=None,
            verification_status=VerificationStatus.UNVERIFIED,
            caveats="No empirical transmission study available for sugar freight",
        )
        assert record.pass_through_factor_low is None
        assert record.is_calculation_ready is False

    def test_verified_status_requires_bounds_and_source(self):
        # Missing factors with [VERIFIED]
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="crude_oil",
                downstream_item="petrol",
                pass_through_factor_low=None,
                pass_through_factor_high=None,
                verification_status=VerificationStatus.VERIFIED,
                historical_basis_source="Some Study",
            )
        assert "Cannot mark pass-through record as [VERIFIED] when pass-through factor bounds are missing" in str(exc.value)

        # Missing source citation with [VERIFIED]
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="crude_oil",
                downstream_item="petrol",
                pass_through_factor_low=0.30,
                pass_through_factor_high=0.45,
                verification_status=VerificationStatus.VERIFIED,
                historical_basis_source="",
            )
        assert "Cannot mark pass-through record as [VERIFIED] without a documented historical_basis_source citation" in str(exc.value)

    def test_rejects_negative_and_out_of_bounds_factors(self):
        # Negative factor
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="crude_oil",
                downstream_item="petrol",
                pass_through_factor_low=-0.05,
                pass_through_factor_high=0.30,
            )
        assert "normalized bounds [0.0, 1.0]" in str(exc.value)

        # Factor exceeding 1.0
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="crude_oil",
                downstream_item="petrol",
                pass_through_factor_low=0.20,
                pass_through_factor_high=1.50,
            )
        assert "normalized bounds [0.0, 1.0]" in str(exc.value)

    def test_rejects_inverted_bounds(self):
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="crude_oil",
                downstream_item="petrol",
                pass_through_factor_low=0.60,
                pass_through_factor_high=0.40,
            )
        assert "Contradictory bounds" in str(exc.value)

    def test_rejects_non_finite_factors(self):
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="crude_oil",
                downstream_item="petrol",
                pass_through_factor_low=float("nan"),
                pass_through_factor_high=0.40,
            )
        assert "finite number" in str(exc.value)

    def test_rejects_identical_upstream_and_downstream(self):
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="diesel",
                downstream_item="diesel",
                pass_through_factor_low=0.50,
                pass_through_factor_high=0.50,
            )
        assert "cannot both be 'diesel'" in str(exc.value)

    def test_rejects_non_snake_case_identifiers(self):
        with pytest.raises(ValidationError) as exc:
            PassThroughRecordCreate(
                upstream_commodity="Crude Oil",
                downstream_item="petrol",
            )
        assert "valid snake_case" in str(exc.value)


# ==============================================================================
# CSV Validation & Service Tests
# ==============================================================================

class TestPassThroughCSVValidation:
    """Tests for CSV parsing, integrity checks, and error reporting."""

    def test_template_csv_is_valid_empty_table(self):
        # Template CSV contains only headers and 0 data rows
        records = validate_pass_through_csv(TEMPLATE_CSV_PATH)
        assert records == []

    def test_valid_csv_parsing(self, tmp_path):
        csv_file = tmp_path / "valid_pass_through.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,pass_through_factor_low,pass_through_factor_high,unit,time_lag_months,historical_basis_source,verification_status,caveats\n"
            "crude_oil,petrol,0.30,0.45,elasticity_coefficient,1,PPAC Report,[VERIFIED],Central Excise buffer\n"
            "diesel,vegetables,0.05,0.15,elasticity_coefficient,1-2,RBI Bulletin,[VERIFY],Mandi transport margins\n"
            "diesel,sugar,,,,,None,[UNVERIFIED],No empirical data\n",
            encoding="utf-8",
        )
        records = validate_pass_through_csv(csv_file)
        assert len(records) == 3
        assert records[0].upstream_commodity == "crude_oil"
        assert records[0].downstream_item == "petrol"
        assert records[0].pass_through_factor_low == 0.30
        assert records[0].is_calculation_ready is True
        assert records[2].pass_through_factor_low is None
        assert records[2].is_calculation_ready is False

    def test_rejects_missing_headers(self, tmp_path):
        csv_file = tmp_path / "bad_headers.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,factor\n"
            "crude_oil,petrol,0.3\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_pass_through_csv(csv_file)
        assert "CSV header mismatch" in str(exc.value)

    def test_rejects_duplicate_pairs_with_line_number(self, tmp_path):
        csv_file = tmp_path / "duplicates.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,pass_through_factor_low,pass_through_factor_high,unit,time_lag_months,historical_basis_source,verification_status,caveats\n"
            "crude_oil,petrol,0.30,0.45,elasticity_coefficient,1,PPAC,[VERIFIED],Note\n"
            "crude_oil,petrol,0.35,0.50,elasticity_coefficient,1,Other,[VERIFY],Duplicate\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_pass_through_csv(csv_file)
        assert "Line 3: Duplicate pass-through relationship 'crude_oil' -> 'petrol'" in str(exc.value)

    def test_rejects_missing_required_identifiers(self, tmp_path):
        csv_file = tmp_path / "missing_id.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,pass_through_factor_low,pass_through_factor_high,unit,time_lag_months,historical_basis_source,verification_status,caveats\n"
            ",petrol,0.30,0.45,elasticity_coefficient,1,PPAC,[VERIFY],Note\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_pass_through_csv(csv_file)
        assert "Line 2: upstream_commodity cannot be empty" in str(exc.value)

    def test_rejects_non_numeric_factor_in_csv(self, tmp_path):
        csv_file = tmp_path / "invalid_num.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,pass_through_factor_low,pass_through_factor_high,unit,time_lag_months,historical_basis_source,verification_status,caveats\n"
            "crude_oil,petrol,not_a_number,0.45,elasticity_coefficient,1,PPAC,[VERIFY],Note\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_pass_through_csv(csv_file)
        assert "Line 2: Invalid numeric value 'not_a_number'" in str(exc.value)


# ==============================================================================
# Database Persistence & Idempotency Tests
# ==============================================================================

class TestPassThroughDatabaseOperations:
    """Tests for database storage, retrieval, and atomic idempotency."""

    def test_idempotent_loading_and_retrieval(self, tmp_path, db_session):
        csv_file = tmp_path / "test_load.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,pass_through_factor_low,pass_through_factor_high,unit,time_lag_months,historical_basis_source,verification_status,caveats\n"
            "crude_oil,petrol,0.30,0.45,elasticity_coefficient,1,PPAC Study,[VERIFIED],Tax buffer\n"
            "diesel,vegetables,0.05,0.15,elasticity_coefficient,1-2,RBI Bulletin,[VERIFY],Freight buffer\n",
            encoding="utf-8",
        )

        # First load
        res1 = load_pass_through_records_from_csv(csv_file, db_session)
        assert res1["total"] == 2
        assert res1["created"] == 2
        assert res1["skipped"] == 0

        # Second load (idempotent skip)
        res2 = load_pass_through_records_from_csv(csv_file, db_session)
        assert res2["total"] == 2
        assert res2["created"] == 0
        assert res2["skipped"] == 2

        # Query all
        all_records = get_all_pass_through_records(db_session)
        assert len(all_records) == 2
        assert all_records[0].upstream_commodity == "crude_oil"
        assert all_records[1].upstream_commodity == "diesel"

        # Query single by composite key
        record = get_pass_through_record("crude_oil", "petrol", db_session)
        assert record is not None
        assert record.pass_through_factor_low == 0.30
        assert record.verification_status == "[VERIFIED]"

        # Query non-existent
        assert get_pass_through_record("crude_oil", "gold", db_session) is None

        # Query for item
        item_records = get_pass_through_for_item("vegetables", db_session)
        assert len(item_records) == 1
        assert item_records[0].upstream_commodity == "diesel"

    def test_loader_rollback_on_failure(self, tmp_path):
        """Database transaction must rollback cleanly if commit fails."""
        csv_file = tmp_path / "test_rollback.csv"
        csv_file.write_text(
            "upstream_commodity,downstream_item,pass_through_factor_low,pass_through_factor_high,unit,time_lag_months,historical_basis_source,verification_status,caveats\n"
            "crude_oil,petrol,0.30,0.45,elasticity_coefficient,1,PPAC Study,[VERIFIED],Tax buffer\n",
            encoding="utf-8",
        )

        mock_db = MagicMock(spec=Session)
        mock_db.execute.return_value.all.return_value = []
        mock_db.commit.side_effect = RuntimeError("Simulated DB failure")

        with pytest.raises(RuntimeError, match="Simulated DB failure"):
            load_pass_through_records_from_csv(csv_file, mock_db)

        mock_db.rollback.assert_called_once()


# ==============================================================================
# Protected Files & Scope Boundary Invariant Tests
# ==============================================================================

class TestProjectScopeInvariants:
    """Verifies that shared contracts, templates, and registries remain untouched."""

    def test_template_csv_remains_unmodified_header_only(self):
        assert TEMPLATE_CSV_PATH.is_file()
        with open(TEMPLATE_CSV_PATH, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        assert len(lines) == 1
        assert lines[0] == ",".join(EXPECTED_CSV_COLUMNS)

    def test_consumption_items_registry_remains_not_calculable(self):
        assert CONSUMPTION_CURATED_CSV.is_file()
        with open(CONSUMPTION_CURATED_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                assert row["is_calculable"].strip().lower() == "false", (
                    f"Item '{row['item_id']}' has is_calculable=True. "
                    f"Must remain False until verified evidence is confirmed."
                )
