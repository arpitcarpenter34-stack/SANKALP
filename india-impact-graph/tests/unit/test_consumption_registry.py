"""Unit tests for Household Consumption Item Registry and Loader.

Tests run against an isolated in-memory SQLite database, guaranteeing zero modifications
to the developer's normal PostgreSQL database.
"""

import csv
from pathlib import Path
import sys
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from pydantic import ValidationError
from app.database import Base, get_db
from app.main import app
from app.models.consumption import ConsumptionItemModel
from app.models.event import FinancialEventModel
from app.schemas.consumption import (
    ConsumptionItemBase,
    ConsumptionItemCategory,
    ConsumptionItemCreate,
    DataAvailabilityStatus,
    VerificationStatus,
)
from app.services.consumption import (
    EXPECTED_CSV_COLUMNS,
    get_all_consumption_items,
    get_consumption_item_by_id,
    load_consumption_items_from_csv,
    validate_consumption_csv,
)

# Project curated CSV and template paths
CURATED_CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "curated" / "consumption_items.csv"
PASS_THROUGH_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "pass-through-register.csv"
SOURCE_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "data-source-register.csv"
PERSONA_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "household-persona-template.csv"

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


@pytest.fixture
def client():
    """Provide a TestClient with overridden get_db dependency."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


class TestConsumptionSchemaValidation:
    """Test suite for Pydantic schema validation and economic constraint invariants."""

    def test_valid_consumption_item_creation(self):
        """Valid inputs must construct cleanly and normalize strings."""
        item = ConsumptionItemCreate(
            item_id="petrol_fuel",
            name="Petrol Fuel",
            category=ConsumptionItemCategory.TRANSPORT_FUEL,
            canonical_unit="INR/Litre",
            is_calculable=False,
            is_capital_asset=False,
            verification_status=VerificationStatus.VERIFY,
            data_availability=DataAvailabilityStatus.PENDING_VERIFICATION,
            source_title="PPAC",
        )
        assert item.item_id == "petrol_fuel"
        assert item.name == "Petrol Fuel"

    def test_rejects_malformed_item_ids(self):
        """Item IDs must strictly conform to snake_case pattern."""
        bad_ids = [
            "Petrol",
            "petrol-fuel",
            "petrol fuel",
            "123petrol",
            "petrol@fuel",
            "",
            "   ",
        ]
        for bad_id in bad_ids:
            with pytest.raises(ValidationError):
                ConsumptionItemCreate(
                    item_id=bad_id,
                    name="Petrol",
                    category=ConsumptionItemCategory.TRANSPORT_FUEL,
                    canonical_unit="INR/Litre",
                    verification_status=VerificationStatus.VERIFY,
                    data_availability=DataAvailabilityStatus.PENDING_VERIFICATION,
                )

    def test_rejects_empty_name_and_unit(self):
        """Name and canonical unit cannot be empty or whitespace."""
        with pytest.raises(ValidationError):
            ConsumptionItemCreate(
                item_id="petrol",
                name="   ",
                category=ConsumptionItemCategory.TRANSPORT_FUEL,
                canonical_unit="INR/Litre",
                verification_status=VerificationStatus.VERIFY,
                data_availability=DataAvailabilityStatus.PENDING_VERIFICATION,
            )

        with pytest.raises(ValidationError):
            ConsumptionItemCreate(
                item_id="petrol",
                name="Petrol",
                category=ConsumptionItemCategory.TRANSPORT_FUEL,
                canonical_unit="",
                verification_status=VerificationStatus.VERIFY,
                data_availability=DataAvailabilityStatus.PENDING_VERIFICATION,
            )

    def test_enforces_capital_asset_exclusivity(self):
        """Capital asset cannot be marked calculable or have contradictory category/availability."""
        # Contradiction: capital asset marked calculable
        with pytest.raises(ValidationError, match="capital assets are stores of value excluded from MPCE"):
            ConsumptionItemCreate(
                item_id="gold",
                name="Gold",
                category=ConsumptionItemCategory.CAPITAL_ASSET,
                canonical_unit="INR/10 grams",
                is_calculable=True,
                is_capital_asset=True,
                verification_status=VerificationStatus.VERIFIED,
                data_availability=DataAvailabilityStatus.EXCLUDED_CAPITAL_ASSET,
                source_title="IBJA",
            )

        # Contradiction: is_capital_asset=True but category is not capital_asset
        with pytest.raises(ValidationError, match="Expected category 'capital_asset'"):
            ConsumptionItemCreate(
                item_id="gold",
                name="Gold",
                category=ConsumptionItemCategory.UTILITY,
                canonical_unit="INR/10 grams",
                is_calculable=False,
                is_capital_asset=True,
                verification_status=VerificationStatus.VERIFY,
                data_availability=DataAvailabilityStatus.EXCLUDED_CAPITAL_ASSET,
            )

    def test_rejects_calculable_when_unverified_or_missing_source(self):
        """Calculable items must be verified, have empirical source citation, and available data."""
        # Not verified
        with pytest.raises(ValidationError, match=r"Must be '\[VERIFIED\]'"):
            ConsumptionItemCreate(
                item_id="petrol",
                name="Petrol",
                category=ConsumptionItemCategory.TRANSPORT_FUEL,
                canonical_unit="INR/Litre",
                is_calculable=True,
                is_capital_asset=False,
                verification_status=VerificationStatus.VERIFY,
                data_availability=DataAvailabilityStatus.PENDING_VERIFICATION,
                source_title="PPAC",
            )

        # Missing source title
        with pytest.raises(ValidationError, match="has no source_title citation"):
            ConsumptionItemCreate(
                item_id="petrol",
                name="Petrol",
                category=ConsumptionItemCategory.TRANSPORT_FUEL,
                canonical_unit="INR/Litre",
                is_calculable=True,
                is_capital_asset=False,
                verification_status=VerificationStatus.VERIFIED,
                data_availability=DataAvailabilityStatus.PENDING_VERIFICATION,
                source_title=None,
            )

        # Data not available cannot be calculable
        with pytest.raises(ValidationError, match="cannot be calculable"):
            ConsumptionItemCreate(
                item_id="petrol",
                name="Petrol",
                category=ConsumptionItemCategory.TRANSPORT_FUEL,
                canonical_unit="INR/Litre",
                is_calculable=True,
                is_capital_asset=False,
                verification_status=VerificationStatus.VERIFIED,
                data_availability=DataAvailabilityStatus.DATA_NOT_AVAILABLE,
                source_title="PPAC",
            )


class TestCuratedCSVValidation:
    """Test suite for validating data/curated/consumption_items.csv integrity."""

    def test_curated_csv_contains_exactly_10_known_items(self):
        """Curated CSV must validate cleanly and contain exactly the 10 candidate item IDs."""
        items = validate_consumption_csv(CURATED_CSV_PATH)
        assert len(items) == 10

        expected_ids = {
            "petrol",
            "diesel",
            "lpg",
            "edible_oil",
            "wheat_cereals",
            "pulses",
            "sugar",
            "vegetables",
            "electricity",
            "gold",
        }
        actual_ids = {item.item_id for item in items}
        assert actual_ids == expected_ids

    def test_gold_capital_asset_exclusion(self):
        """Gold must be marked as capital asset and excluded from monthly MPCE calculations."""
        items = validate_consumption_csv(CURATED_CSV_PATH)
        gold_item = next(item for item in items if item.item_id == "gold")

        assert gold_item.is_capital_asset is True
        assert gold_item.is_calculable is False
        assert gold_item.category == ConsumptionItemCategory.CAPITAL_ASSET
        assert gold_item.data_availability == DataAvailabilityStatus.EXCLUDED_CAPITAL_ASSET
        assert "excluded" in gold_item.notes.lower()

    def test_unsupported_items_data_not_available(self):
        """Pulses, sugar, and electricity must follow spec and show 'data_not_available'."""
        items = validate_consumption_csv(CURATED_CSV_PATH)
        items_by_id = {item.item_id: item for item in items}

        for item_id in ("pulses", "sugar", "electricity"):
            item = items_by_id[item_id]
            assert item.is_calculable is False
            assert item.is_capital_asset is False
            assert item.data_availability == DataAvailabilityStatus.DATA_NOT_AVAILABLE
            assert item.verification_status == VerificationStatus.UNVERIFIED

    def test_candidate_items_not_auto_calculable(self):
        """Candidate items (petrol, diesel, LPG, edible oil, veg) must not be marked calculable without verified data."""
        items = validate_consumption_csv(CURATED_CSV_PATH)
        items_by_id = {item.item_id: item for item in items}

        for item_id in ("petrol", "diesel", "lpg", "edible_oil", "wheat_cereals", "vegetables"):
            item = items_by_id[item_id]
            # Must be False until official fractile weights and empirical coefficients are verified in repo
            assert item.is_calculable is False


class TestCSVValidationErrors:
    """Test suite for error detection in CSV validation utility."""

    def test_missing_file_raises_filenotfound(self, tmp_path: Path):
        """Non-existent CSV file path must raise FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            validate_consumption_csv(tmp_path / "non_existent.csv")

    def test_header_mismatch_raises_valueerror(self, tmp_path: Path):
        """CSV with missing or incorrect headers must raise ValueError."""
        bad_csv = tmp_path / "bad_headers.csv"
        with open(bad_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["item_id", "name", "category"])  # missing other columns
            writer.writerow(["petrol", "Petrol", "transport_fuel"])

        with pytest.raises(ValueError, match="CSV header mismatch"):
            validate_consumption_csv(bad_csv)

    def test_duplicate_item_id_raises_valueerror(self, tmp_path: Path):
        """CSV with duplicate item_id rows must be rejected."""
        dup_csv = tmp_path / "dup.csv"
        with open(dup_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(EXPECTED_CSV_COLUMNS)
            writer.writerow(["petrol", "Petrol 1", "transport_fuel", "INR/Litre", "False", "False", "[VERIFY]", "pending_verification", "", "", "", ""])
            writer.writerow(["petrol", "Petrol 2", "transport_fuel", "INR/Litre", "False", "False", "[VERIFY]", "pending_verification", "", "", "", ""])

        with pytest.raises(ValueError, match="Duplicate item_id 'petrol'"):
            validate_consumption_csv(dup_csv)

    def test_invalid_category_enum_raises_valueerror(self, tmp_path: Path):
        """Invalid enum value must be rejected by Pydantic validation."""
        invalid_csv = tmp_path / "invalid_enum.csv"
        with open(invalid_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(EXPECTED_CSV_COLUMNS)
            writer.writerow(["petrol", "Petrol", "invalid_category", "INR/Litre", "False", "False", "[VERIFY]", "pending_verification", "", "", "", ""])

        with pytest.raises(ValueError, match="validation error"):
            validate_consumption_csv(invalid_csv)

    def test_rejects_malformed_item_id_in_csv(self, tmp_path: Path):
        """CSV with non-snake_case item_id must be rejected."""
        bad_csv = tmp_path / "bad_id.csv"
        with open(bad_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(EXPECTED_CSV_COLUMNS)
            writer.writerow(["Petrol Fuel", "Petrol", "transport_fuel", "INR/Litre", "False", "False", "[VERIFY]", "pending_verification", "", "", "", ""])

        with pytest.raises(ValueError, match="validation error"):
            validate_consumption_csv(bad_csv)

    def test_rejects_empty_item_id_in_csv(self, tmp_path: Path):
        """CSV with empty item_id must raise ValueError with line number."""
        bad_csv = tmp_path / "empty_id.csv"
        with open(bad_csv, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(EXPECTED_CSV_COLUMNS)
            writer.writerow(["", "Petrol", "transport_fuel", "INR/Litre", "False", "False", "[VERIFY]", "pending_verification", "", "", "", ""])

        with pytest.raises(ValueError, match="Line 2: item_id cannot be empty"):
            validate_consumption_csv(bad_csv)


class TestConsumptionDataLoaderAndDB:
    """Test suite for database loading, idempotency, and querying."""

    def test_idempotent_loading_and_retrieval(self, db_session: Session):
        """Loading the same curated file twice must be idempotent without duplicates."""
        # First load: creates 10 items
        result1 = load_consumption_items_from_csv(CURATED_CSV_PATH, db_session)
        assert result1["total"] == 10
        assert result1["created"] == 10
        assert result1["skipped"] == 0

        # Verify DB contents
        items = get_all_consumption_items(db_session)
        assert len(items) == 10

        # Second load: skips all 10 existing items
        result2 = load_consumption_items_from_csv(CURATED_CSV_PATH, db_session)
        assert result2["total"] == 10
        assert result2["created"] == 0
        assert result2["skipped"] == 10

        # Items in DB remain exactly 10
        items_after = get_all_consumption_items(db_session)
        assert len(items_after) == 10

        # Test single item lookup
        petrol = get_consumption_item_by_id("petrol", db_session)
        assert petrol is not None
        assert petrol.name == "Petrol"
        assert petrol.canonical_unit == "INR/Litre"
        assert petrol.is_capital_asset is False
        assert petrol.is_calculable is False

        gold = get_consumption_item_by_id("gold", db_session)
        assert gold is not None
        assert gold.is_capital_asset is True
        assert gold.canonical_unit == "INR/10 grams"

    def test_loader_rollback_on_failure(self, db_session: Session):
        """Database transaction must rollback cleanly if persistence fails."""
        # Mock session to raise an error during commit
        mock_db = MagicMock(spec=Session)
        mock_db.execute.return_value.scalars.return_value.all.return_value = []
        mock_db.commit.side_effect = RuntimeError("Simulated DB failure")

        with pytest.raises(RuntimeError, match="Simulated DB failure"):
            load_consumption_items_from_csv(CURATED_CSV_PATH, mock_db)

        # Verify rollback was called
        mock_db.rollback.assert_called_once()

    def test_existing_event_and_graph_api_regression(self, client: TestClient, db_session: Session):
        """New consumption model and loader must not regress existing event or graph endpoints."""
        # Seed an event
        event = FinancialEventModel(
            event_id="test-crude-shock",
            event_type="commodity_price_shock",
            headline="Brent crude rises 10%",
            is_scenario=True,
        )
        db_session.add(event)
        db_session.commit()

        # Check /api/events
        events_resp = client.get("/api/events")
        assert events_resp.status_code == 200
        assert len(events_resp.json()) == 1

        # Check /api/graph/{event_id}
        graph_resp = client.get("/api/graph/test-crude-shock")
        assert graph_resp.status_code == 200
        assert "nodes" in graph_resp.json()
        assert "edges" in graph_resp.json()


class TestProjectScopeInvariants:
    """Verifies that shared contracts, templates, and registries remain untouched."""

    def test_template_csvs_remain_unmodified_header_only(self):
        """All shared template files must remain clean single-line header files."""
        for path in (PASS_THROUGH_TEMPLATE_CSV, SOURCE_TEMPLATE_CSV, PERSONA_TEMPLATE_CSV):
            assert path.is_file(), f"Template file missing: {path}"
            with open(path, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f if line.strip()]
            assert len(lines) == 1, f"Template {path.name} was unexpectedly populated"

    def test_consumption_items_registry_remains_not_calculable(self):
        """Integrity invariant: No consumption item is promoted to calculable without empirical proof."""
        assert CURATED_CSV_PATH.is_file()
        with open(CURATED_CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                assert row["is_calculable"].strip().lower() == "false", (
                    f"Item '{row['item_id']}' in curated registry has is_calculable=True!"
                )
