"""Unit tests for Cached Articles Catalog Registry, Schema Validation, and CSV Loader.

Tests run against an isolated in-memory SQLite database, guaranteeing zero modifications
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
from app.models.article import CachedArticleModel
from app.schemas.article import (
    CachedArticleBase,
    CachedArticleCreate,
    CachedArticleResponse,
)
from app.schemas.consumption import VerificationStatus
from app.services.article import (
    EXPECTED_CSV_COLUMNS,
    get_all_cached_articles,
    get_cached_article_by_id,
    get_cached_articles_by_event,
    load_cached_articles_from_csv,
    validate_cached_articles_csv,
)

ARTICLES_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "cached-articles-catalog.csv"
DATA_SOURCE_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "data-source-register.csv"
PASS_THROUGH_TEMPLATE_CSV = Path(__file__).resolve().parent.parent.parent / "data" / "templates" / "pass-through-register.csv"
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
# Schema Validation Tests
# ==============================================================================

class TestCachedArticleSchemaValidation:
    """Tests for Pydantic schema validation, regex patterns, URL safety, and cache paths."""

    def test_valid_cached_article_record(self):
        article = CachedArticleCreate(
            article_id="ART-01",
            event_name="crude_oil_price_spike_2026",
            headline="Brent crude surges 15% amid geopolitical disruption",
            publisher="The Economic Times",
            publication_date="2026-02-15",
            event_date="2026-02-14",
            source_url="https://economictimes.indiatimes.com/markets/commodities/brent-crude-surges",
            local_cache_path="data/raw/news/2026-02-15-brent-crude.html",
            reported_event_magnitude="+15%",
            verification_status=VerificationStatus.VERIFIED,
        )
        assert article.article_id == "ART-01"
        assert article.event_name == "crude_oil_price_spike_2026"
        assert article.headline == "Brent crude surges 15% amid geopolitical disruption"
        assert article.publisher == "The Economic Times"
        assert article.publication_date == "2026-02-15"
        assert article.event_date == "2026-02-14"
        assert article.source_url == "https://economictimes.indiatimes.com/markets/commodities/brent-crude-surges"
        assert article.local_cache_path == "data/raw/news/2026-02-15-brent-crude.html"
        assert article.reported_event_magnitude == "+15%"
        assert article.verification_status == VerificationStatus.VERIFIED

    def test_article_id_patterns(self):
        # Supports standard ID formats and slug conventions
        valid_ids = ["ART-01", "ie-rbi-01", "fe-rbi-02", "article_123", "EVENT-SHOCK-99"]
        for aid in valid_ids:
            art = CachedArticleCreate(
                article_id=aid,
                event_name="rbi_repo_rate_hike",
                headline="RBI raises repo rate by 25 bps",
                publisher="Indian Express",
            )
            assert art.article_id == aid

    def test_invalid_article_id_rejected(self):
        invalid_ids = ["", "   ", "art id with spaces", "art@123", "art#1!"]
        for bad_id in invalid_ids:
            with pytest.raises(ValidationError):
                CachedArticleCreate(
                    article_id=bad_id,
                    event_name="event_test",
                    headline="Test Headline",
                    publisher="Test Publisher",
                )

    def test_mandatory_fields_non_empty(self):
        # event_name cannot be empty or whitespace
        with pytest.raises(ValidationError):
            CachedArticleCreate(
                article_id="ART-01",
                event_name="   ",
                headline="Test Headline",
                publisher="Test Publisher",
            )

        # headline cannot be empty
        with pytest.raises(ValidationError):
            CachedArticleCreate(
                article_id="ART-01",
                event_name="event_test",
                headline="",
                publisher="Test Publisher",
            )

        # publisher cannot be empty
        with pytest.raises(ValidationError):
            CachedArticleCreate(
                article_id="ART-01",
                event_name="event_test",
                headline="Test Headline",
                publisher="  ",
            )

    def test_safe_url_validation(self):
        # Valid HTTPS and HTTP
        art_https = CachedArticleCreate(
            article_id="ART-01",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            source_url="https://www.reuters.com/markets/article-1",
        )
        assert art_https.source_url == "https://www.reuters.com/markets/article-1"

        art_http = CachedArticleCreate(
            article_id="ART-02",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            source_url="http://news.portal.in/report",
        )
        assert art_http.source_url == "http://news.portal.in/report"

    def test_unsafe_url_schemes_rejected(self):
        unsafe_urls = [
            "javascript:alert(1)",
            "data:text/html;base64,PHNjcmlwdD4=",
            "file:///etc/passwd",
            "ftp://ftp.news.org/article.txt",
            "not-a-url",
            "http://",  # missing domain
        ]
        for bad_url in unsafe_urls:
            with pytest.raises(ValidationError):
                CachedArticleCreate(
                    article_id="ART-01",
                    event_name="event_test",
                    headline="Headline",
                    publisher="Publisher",
                    source_url=bad_url,
                )

    def test_local_cache_path_traversal_prevention(self):
        # Path traversal with ../ must be rejected
        with pytest.raises(ValidationError, match="path traversal"):
            CachedArticleCreate(
                article_id="ART-01",
                event_name="event_test",
                headline="Headline",
                publisher="Publisher",
                local_cache_path="../secret/config.env",
            )

        with pytest.raises(ValidationError, match="path traversal"):
            CachedArticleCreate(
                article_id="ART-01",
                event_name="event_test",
                headline="Headline",
                publisher="Publisher",
                local_cache_path="data/raw/../../etc/passwd",
            )

        # Absolute paths must be rejected
        with pytest.raises(ValidationError, match="Absolute paths"):
            CachedArticleCreate(
                article_id="ART-01",
                event_name="event_test",
                headline="Headline",
                publisher="Publisher",
                local_cache_path="/var/log/news.html",
            )

    def test_verification_status_normalization(self):
        art1 = CachedArticleCreate(
            article_id="ART-01",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            verification_status="[VERIFIED]",
        )
        assert art1.verification_status == VerificationStatus.VERIFIED

        art2 = CachedArticleCreate(
            article_id="ART-02",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            verification_status="VERIFY",  # unbracketed string normalized
        )
        assert art2.verification_status == VerificationStatus.VERIFY

        art3 = CachedArticleCreate(
            article_id="ART-03",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            verification_status="[UNVERIFIED]",
        )
        assert art3.verification_status == VerificationStatus.UNVERIFIED

        with pytest.raises(ValidationError):
            CachedArticleCreate(
                article_id="ART-04",
                event_name="event_test",
                headline="Headline",
                publisher="Publisher",
                verification_status="INVALID_STATUS",
            )

    def test_is_locally_cached_check(self, tmp_path):
        # File exists
        test_file = tmp_path / "cache" / "article.html"
        test_file.parent.mkdir(parents=True, exist_ok=True)
        test_file.write_text("<html>Article content</html>", encoding="utf-8")

        art = CachedArticleCreate(
            article_id="ART-01",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            local_cache_path="cache/article.html",
        )
        assert art.is_locally_cached(base_dir=tmp_path) is True

        # Referenced file does not exist
        art_missing = CachedArticleCreate(
            article_id="ART-02",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            local_cache_path="cache/nonexistent.html",
        )
        assert art_missing.is_locally_cached(base_dir=tmp_path) is False

        # No local_cache_path specified
        art_none = CachedArticleCreate(
            article_id="ART-03",
            event_name="event_test",
            headline="Headline",
            publisher="Publisher",
            local_cache_path=None,
        )
        assert art_none.is_locally_cached(base_dir=tmp_path) is False


# ==============================================================================
# CSV Validation Tests
# ==============================================================================

class TestCachedArticleCSVValidation:
    """Tests for CSV parsing, column structure, malformed rows, and duplicate IDs."""

    def test_missing_csv_file_raises_not_found(self):
        with pytest.raises(FileNotFoundError):
            validate_cached_articles_csv(Path("nonexistent/cached_articles.csv"))

    def test_empty_template_csv_validates_successfully(self):
        records = validate_cached_articles_csv(ARTICLES_TEMPLATE_CSV)
        assert records == []

    def test_csv_header_mismatch_raises_error(self, tmp_path):
        bad_csv = tmp_path / "bad_headers.csv"
        bad_csv.write_text("id,name,text\nART-01,event,headline\n", encoding="utf-8")
        with pytest.raises(ValueError, match="CSV header mismatch"):
            validate_cached_articles_csv(bad_csv)

    def test_duplicate_article_id_in_csv_raises_error(self, tmp_path):
        dup_csv = tmp_path / "dup.csv"
        header = ",".join(EXPECTED_CSV_COLUMNS)
        dup_csv.write_text(
            f"{header}\n"
            "ART-01,event_a,Headline 1,Publisher A,,,,,,[VERIFY]\n"
            "ART-01,event_b,Headline 2,Publisher B,,,,,,[VERIFY]\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError, match="Line 3: Duplicate article_id 'ART-01'"):
            validate_cached_articles_csv(dup_csv)

    def test_empty_article_id_raises_error(self, tmp_path):
        bad_csv = tmp_path / "empty_id.csv"
        header = ",".join(EXPECTED_CSV_COLUMNS)
        bad_csv.write_text(
            f"{header}\n"
            ",event_a,Headline 1,Publisher A,,,,,,[VERIFY]\n",
            encoding="utf-8",
        )
        with pytest.raises(ValueError, match="Line 2: article_id cannot be empty"):
            validate_cached_articles_csv(bad_csv)

    def test_verify_cache_presence_enforcement(self, tmp_path):
        test_csv = tmp_path / "cache_presence.csv"
        header = ",".join(EXPECTED_CSV_COLUMNS)
        test_csv.write_text(
            f"{header}\n"
            "ART-01,event_a,Headline 1,Publisher A,,,https://news.com,cached/art1.html,,[VERIFY]\n",
            encoding="utf-8",
        )
        # Without cache verification, schema validates path
        records = validate_cached_articles_csv(test_csv, verify_cache_presence=False)
        assert len(records) == 1

        # With cache verification, raises error because file does not exist on disk
        with pytest.raises(ValueError, match="Referenced local cache file 'cached/art1.html' does not exist on disk"):
            validate_cached_articles_csv(test_csv, verify_cache_presence=True, base_dir=tmp_path)


# ==============================================================================
# Database Persistence & Idempotency Tests
# ==============================================================================

class TestCachedArticleDatabaseOperations:
    """Tests for SQLite database persistence, retrieval, idempotency, and rollback."""

    def test_idempotent_loading_and_retrieval(self, tmp_path, db_session):
        csv_file = tmp_path / "test_articles_load.csv"
        header = ",".join(EXPECTED_CSV_COLUMNS)
        csv_file.write_text(
            f"{header}\n"
            "ART-01,crude_spike,Crude Surges 15%,ET,2026-02-15,2026-02-14,https://et.indiatimes.com/crude,,+15%,[VERIFY]\n"
            "ART-02,rbi_rate_hike,RBI Hikes Repo,FE,2026-03-01,2026-03-01,https://financialexpress.com/rbi,,+25 bps,[VERIFIED]\n",
            encoding="utf-8",
        )

        # Initial load
        res1 = load_cached_articles_from_csv(csv_file, db_session)
        assert res1["total"] == 2
        assert res1["created"] == 2
        assert res1["skipped"] == 0

        # Duplicate load (idempotent skip)
        res2 = load_cached_articles_from_csv(csv_file, db_session)
        assert res2["total"] == 2
        assert res2["created"] == 0
        assert res2["skipped"] == 2

        # Query all
        all_articles = get_all_cached_articles(db_session)
        assert len(all_articles) == 2
        assert all_articles[0].article_id == "ART-01"
        assert all_articles[1].article_id == "ART-02"

        # Query single by ID
        art1 = get_cached_article_by_id("ART-01", db_session)
        assert art1 is not None
        assert art1.headline == "Crude Surges 15%"
        assert art1.publisher == "ET"
        assert art1.reported_event_magnitude == "+15%"

        # Non-existent query
        assert get_cached_article_by_id("NONEXISTENT", db_session) is None

        # Query by event
        crude_articles = get_cached_articles_by_event("crude_spike", db_session)
        assert len(crude_articles) == 1
        assert crude_articles[0].article_id == "ART-01"

    def test_loader_rollback_on_failure(self, tmp_path):
        """Database transaction must rollback cleanly if commit fails."""
        csv_file = tmp_path / "test_rollback.csv"
        header = ",".join(EXPECTED_CSV_COLUMNS)
        csv_file.write_text(
            f"{header}\n"
            "ART-01,crude_spike,Crude Surges 15%,ET,2026-02-15,2026-02-14,https://et.indiatimes.com/crude,,+15%,[VERIFY]\n",
            encoding="utf-8",
        )

        mock_db = MagicMock(spec=Session)
        mock_db.execute.return_value.scalars.return_value.all.return_value = []
        mock_db.commit.side_effect = RuntimeError("Simulated DB failure")

        with pytest.raises(RuntimeError, match="Simulated DB failure"):
            load_cached_articles_from_csv(csv_file, mock_db)

        mock_db.rollback.assert_called_once()


# ==============================================================================
# Protected Files & Scope Boundary Invariant Tests
# ==============================================================================

class TestProjectScopeInvariants:
    """Verifies that shared contracts, templates, and registries remain untouched."""

    def test_cached_articles_template_csv_remains_unmodified_header_only(self):
        assert ARTICLES_TEMPLATE_CSV.is_file()
        with open(ARTICLES_TEMPLATE_CSV, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        assert len(lines) == 1
        assert lines[0] == ",".join(EXPECTED_CSV_COLUMNS)

    def test_data_source_template_remains_unmodified(self):
        assert DATA_SOURCE_TEMPLATE_CSV.is_file()
        with open(DATA_SOURCE_TEMPLATE_CSV, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f if line.strip()]
        assert len(lines) == 1

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
