"""Unit tests for Data Source Registry, Schema Validation, and CSV Loader.

Tests run against an isolated in-memory SQLite database, guaranteeing zero modifications
to the developer's normal PostgreSQL database.
"""

import csv
from pathlib import Path
import sys
import pytest
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import Base
from app.models.source import DataSourceModel
from app.schemas.consumption import VerificationStatus
from app.schemas.source import (
    DataSourceBase,
    DataSourceCreate,
    DataSourceResponse,
    SourceAccessCondition,
)
from app.services.source import (
    EXPECTED_CSV_COLUMNS,
    get_all_data_sources,
    get_data_source_by_id,
    load_data_sources_from_csv,
    validate_data_source_csv,
)

SOURCE_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "data-source-register.csv"
CONSUMPTION_CURATED_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "curated" / "consumption_items.csv"
PASS_THROUGH_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "pass-through-register.csv"

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
# Schema Validation Tests
# ==============================================================================

class TestDataSourceSchemaValidation:
    """Tests for Pydantic schema validation, regex patterns, URL safety, and enums."""

    def test_valid_data_source_record(self):
        source = DataSourceCreate(
            source_id="SRC-01",
            source_title="CPI Item Weights 2024 Base",
            publisher="MoSPI",
            series_or_table_id="Item Weight Matrix (358 items)",
            base_year="2024 Base",
            frequency="Monthly",
            geographic_coverage="All-India",
            source_url="https://mospi.gov.in/cpi-2024",
            verification_status=VerificationStatus.VERIFIED,
            access_condition=SourceAccessCondition.OFFICIAL_PORTAL,
            notes="Base year migration effective Jan 2026",
        )
        assert source.source_id == "SRC-01"
        assert source.source_title == "CPI Item Weights 2024 Base"
        assert source.publisher == "MoSPI"
        assert source.verification_status == VerificationStatus.VERIFIED
        assert source.access_condition == SourceAccessCondition.OFFICIAL_PORTAL

    def test_valid_case_insensitive_source_id_normalization(self):
        source = DataSourceCreate(
            source_id="src-02",
            source_title="HCES 2023-24 Factsheet",
            publisher="MoSPI",
        )
        assert source.source_id == "SRC-02"

    def test_rejects_malformed_source_ids(self):
        for bad_id in ["SRC_01", "SRC1", "SOURCE-01", "SRC-", "123", "SRC-A"]:
            with pytest.raises(ValidationError) as exc:
                DataSourceCreate(
                    source_id=bad_id,
                    source_title="Test Title",
                    publisher="Test Publisher",
                )
            assert "canonical identifier matching pattern '^SRC-\\d{2,4}$'" in str(exc.value)

    def test_rejects_empty_title_and_publisher(self):
        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-01",
                source_title="",
                publisher="MoSPI",
            )
        assert "source_title cannot be empty" in str(exc.value)

        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-01",
                source_title="Title",
                publisher="   ",
            )
        assert "publisher cannot be empty" in str(exc.value)

    def test_url_safety_and_scheme_validation(self):
        # Valid HTTPS and HTTP
        s1 = DataSourceCreate(
            source_id="SRC-01",
            source_title="Test",
            publisher="Test",
            source_url="https://example.gov.in/data",
        )
        assert s1.source_url == "https://example.gov.in/data"

        s2 = DataSourceCreate(
            source_id="SRC-02",
            source_title="Test",
            publisher="Test",
            source_url="http://example.org/bulletin",
        )
        assert s2.source_url == "http://example.org/bulletin"

        # Rejects unsafe javascript: scheme
        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-03",
                source_title="Test",
                publisher="Test",
                source_url="javascript:alert(1)",
            )
        assert "Unsafe URL scheme in source URL" in str(exc.value)

        # Rejects data: scheme
        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-04",
                source_title="Test",
                publisher="Test",
                source_url="data:text/html;base64,PHNjcmlwdD4=",
            )
        assert "Unsafe URL scheme in source URL" in str(exc.value)

        # Rejects file: scheme
        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-05",
                source_title="Test",
                publisher="Test",
                source_url="file:///etc/passwd",
            )
        assert "Unsafe URL scheme in source URL" in str(exc.value)

        # Rejects URL without host netloc
        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-06",
                source_title="Test",
                publisher="Test",
                source_url="https://",
            )
        assert "missing network domain host" in str(exc.value)

    def test_access_condition_enum_and_validation(self):
        # Valid values
        for cond in ["public_open", "official_portal", "paywalled", "cached_local", "requires_registration", "restricted"]:
            s = DataSourceCreate(
                source_id="SRC-01",
                source_title="Test",
                publisher="Test",
                access_condition=cond,
            )
            assert s.access_condition.value == cond

        # Unsupported access condition
        with pytest.raises(ValidationError) as exc:
            DataSourceCreate(
                source_id="SRC-01",
                source_title="Test",
                publisher="Test",
                access_condition="unsupported_custom_status",
            )
        assert "Unsupported access_condition" in str(exc.value)


# ==============================================================================
# CSV Validation & Service Tests
# ==============================================================================

class TestDataSourceCSVValidation:
    """Tests for CSV reading, header enforcement, line-numbered errors, and uniqueness."""

    def test_template_csv_is_valid_empty_table(self):
        # Template CSV contains only headers and 0 data rows
        records = validate_data_source_csv(SOURCE_TEMPLATE_CSV)
        assert records == []

    def test_valid_csv_parsing(self, tmp_path):
        csv_file = tmp_path / "valid_sources.csv"
        csv_file.write_text(
            "source_id,source_title,publisher,series_or_table_id,base_year,frequency,geographic_coverage,source_url,verification_status,access_condition,notes\n"
            "SRC-01,CPI Item Weights,MoSPI,Weight Matrix,2024 Base,Monthly,All-India,https://mospi.gov.in,[VERIFY],official_portal,358 items\n"
            "SRC-02,HCES Factsheet,MoSPI,Table 3 & 4,2023-24,Quinquennial,Madhya Pradesh,https://mospi.gov.in/hces,[VERIFIED],public_open,MP fractiles\n"
            "SRC-07,Truck Freight Rates,Freightos,,2023-2025,Monthly,Interstate,,[VERIFY],paywalled,Commercial index\n",
            encoding="utf-8",
        )
        records = validate_data_source_csv(csv_file)
        assert len(records) == 3
        assert records[0].source_id == "SRC-01"
        assert records[1].verification_status == VerificationStatus.VERIFIED
        assert records[2].access_condition == SourceAccessCondition.PAYWALLED
        assert records[2].source_url is None

    def test_rejects_missing_and_mismatched_headers(self, tmp_path):
        csv_file = tmp_path / "bad_headers.csv"
        csv_file.write_text(
            "source_id,source_title,publisher\n"
            "SRC-01,Title,Publisher\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_data_source_csv(csv_file)
        assert "CSV header mismatch" in str(exc.value)

    def test_rejects_duplicate_source_ids_with_line_number(self, tmp_path):
        csv_file = tmp_path / "duplicates.csv"
        csv_file.write_text(
            "source_id,source_title,publisher,series_or_table_id,base_year,frequency,geographic_coverage,source_url,verification_status,access_condition,notes\n"
            "SRC-01,Title 1,Publisher 1,,,,,,[VERIFY],public_open,\n"
            "SRC-01,Title 2,Publisher 2,,,,,,[VERIFY],public_open,\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_data_source_csv(csv_file)
        assert "Line 3: Duplicate source_id 'SRC-01'" in str(exc.value)

    def test_rejects_empty_required_id_in_csv(self, tmp_path):
        csv_file = tmp_path / "empty_id.csv"
        csv_file.write_text(
            "source_id,source_title,publisher,series_or_table_id,base_year,frequency,geographic_coverage,source_url,verification_status,access_condition,notes\n"
            ",Title 1,Publisher 1,,,,,,[VERIFY],public_open,\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError) as exc:
            validate_data_source_csv(csv_file)
        assert "Line 2: source_id cannot be empty" in str(exc.value)


# ==============================================================================
# Database Persistence & Idempotency Tests
# ==============================================================================

class TestDataSourceDatabaseOperations:
    """Tests for SQLite database persistence, retrieval, and atomic idempotency."""

    def test_idempotent_loading_and_retrieval(self, tmp_path, db_session):
        csv_file = tmp_path / "test_sources_load.csv"
        csv_file.write_text(
            "source_id,source_title,publisher,series_or_table_id,base_year,frequency,geographic_coverage,source_url,verification_status,access_condition,notes\n"
            "SRC-01,CPI Item Weights,MoSPI,Table A,2024 Base,Monthly,All-India,https://mospi.gov.in,[VERIFY],official_portal,Notes\n"
            "SRC-02,HCES MPCE,MoSPI,Table B,2023-24,Annual,Madhya Pradesh,https://mospi.gov.in/hces,[VERIFIED],public_open,Notes\n",
            encoding="utf-8",
        )

        # Initial load
        res1 = load_data_sources_from_csv(csv_file, db_session)
        assert res1["total"] == 2
        assert res1["created"] == 2
        assert res1["skipped"] == 0

        # Duplicate load (idempotent skip)
        res2 = load_data_sources_from_csv(csv_file, db_session)
        assert res2["total"] == 2
        assert res2["created"] == 0
        assert res2["skipped"] == 2

        # Query all
        all_sources = get_all_data_sources(db_session)
        assert len(all_sources) == 2
        assert all_sources[0].source_id == "SRC-01"
        assert all_sources[1].source_id == "SRC-02"

        # Query single
        src1 = get_data_source_by_id("SRC-01", db_session)
        assert src1 is not None
        assert src1.publisher == "MoSPI"
        assert src1.access_condition == "official_portal"

        # Query case-insensitive
        src2 = get_data_source_by_id("src-02", db_session)
        assert src2 is not None
        assert src2.source_id == "SRC-02"

        # Non-existent query
        assert get_data_source_by_id("SRC-99", db_session) is None


# ==============================================================================
# Protected Files & Scope Boundary Invariant Tests
# ==============================================================================

class TestProjectScopeInvariants:
    """Verifies that shared contracts, templates, and registries remain untouched."""

    def test_template_csv_remains_unmodified_header_only(self):
        assert SOURCE_TEMPLATE_CSV.is_file()
        with open(SOURCE_TEMPLATE_CSV, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        assert len(lines) == 1
        assert lines[0] == ",".join(EXPECTED_CSV_COLUMNS)

    def test_pass_through_template_remains_unmodified(self):
        assert PASS_THROUGH_TEMPLATE_CSV.is_file()
        with open(PASS_THROUGH_TEMPLATE_CSV, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        assert len(lines) == 1

    def test_consumption_items_registry_remains_not_calculable(self):
        assert CONSUMPTION_CURATED_CSV.is_file()
        with open(CONSUMPTION_CURATED_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                assert row["is_calculable"].strip().lower() == "false", (
                    f"Item '{row['item_id']}' has is_calculable=True. "
                    f"Must remain False until verified evidence is confirmed."
                )
