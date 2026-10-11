"""Unit and integration tests for live official data refresh and monitoring.

Tests:
- Successful refresh and new observation ingestion
- No-change detection when no new publications exist
- Official revisions (e.g., promotional status change)
- Source failure handling (HTTP 503, timeout, connection drop)
- Bounded retries and sanitization of secrets in error logs
- Freshness policy evaluations with source-specific SLAs
- API status endpoint: GET /api/data-sources/status
"""

from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch
import urllib.error

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.source import DataSourceModel
from app.models.source_sync import (
    DataSourceRefreshRunModel,
    DataSourceSyncStatusModel,
)
from app.models.time_series import (
    TimeSeriesDefinitionModel,
    TimeSeriesObservationModel,
)
from app.services.live_refresh import (
    calculate_freshness,
    get_data_sources_status,
    parse_mospi_cpi_content,
    parse_ppac_archive_html,
    refresh_mospi_cpi_source,
    refresh_ppac_crude_source,
    safe_fetch_url,
    sanitize_message,
)


@pytest.fixture(scope="module")
def db_engine():
    """Create in-memory SQLite engine configured for multi-threaded TestClient access."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Seed mock data source registry for foreign keys
    db = TestingSession()
    src1 = DataSourceModel(
        source_id="SRC-01",
        source_title="PPAC Archive",
        publisher="PPAC",
        verification_status="[VERIFIED]",
    )
    src2 = DataSourceModel(
        source_id="SRC-02",
        source_title="MoSPI CPI",
        publisher="MoSPI",
        verification_status="[VERIFIED]",
    )
    defn1 = TimeSeriesDefinitionModel(
        series_id="crude_oil_indian_basket",
        series_name="PPAC Indian Basket Crude Oil",
        publisher="PPAC",
        unit="USD/barrel",
        frequency="Sparse snapshots",
        geographic_scope="All-India",
        source_id="SRC-01",
    )
    defn2 = TimeSeriesDefinitionModel(
        series_id="cpi_2024_general",
        series_name="CPI 2024 General Index",
        publisher="MoSPI",
        unit="Index points",
        frequency="Monthly",
        geographic_scope="All-India",
        source_id="SRC-02",
    )
    db.add_all([src1, src2, defn1, defn2])
    db.commit()
    db.close()

    yield engine, TestingSession

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session(db_engine):
    """Provide a database session from the shared test engine."""
    _, TestingSession = db_engine
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


class TestSanitizationAndSafeFetch:
    """Validate sanitization and safe network fetch wrapper."""

    def test_sanitize_message_redacts_credentials(self):
        raw = "Failed to connect: api_key=secret_123456 with password=MySecretPass! to server"
        sanitized = sanitize_message(raw)
        assert "secret_123456" not in sanitized
        assert "MySecretPass!" not in sanitized
        assert "api_key=[REDACTED]" in sanitized
        assert "password=[REDACTED]" in sanitized

    @patch("urllib.request.urlopen")
    def test_safe_fetch_url_retry_and_timeout(self, mock_urlopen):
        mock_urlopen.side_effect = urllib.error.URLError("Connection timed out")
        success, content, error = safe_fetch_url("https://example.com/test", timeout=1, max_retries=1)
        assert success is False
        assert content is None
        assert "Connection timed out" in error
        assert mock_urlopen.call_count == 2  # 1 initial + 1 retry


class TestPPACLiveRefresh:
    """Validate PPAC Indian Basket crude oil live refresh workflow."""

    def test_ppac_refresh_new_snapshot(self, db_session):
        new_point = [
            {
                "observation_date": "2026-03-01",
                "price_usd_per_bbl": 71.50,
                "observation_kind": "As-on published snapshot",
                "source_title": "PPAC Important News March 2026",
            }
        ]
        res = refresh_ppac_crude_source(db_session, mock_payload=new_point)
        assert res.status == "success"
        assert res.records_inserted == 1
        assert res.records_updated == 0

        # Verify DB insertion
        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="crude_oil_indian_basket", reference_period="2026-03-01"
        ).first()
        assert obs is not None
        assert obs.observation_value == 71.50

    def test_ppac_refresh_no_change(self, db_session):
        # Ingest the same point again
        existing_point = [
            {
                "observation_date": "2026-03-01",
                "price_usd_per_bbl": 71.50,
            }
        ]
        res = refresh_ppac_crude_source(db_session, mock_payload=existing_point)
        assert res.status == "no_change"
        assert res.records_inserted == 0
        assert res.records_updated == 0

    def test_ppac_refresh_official_revision(self, db_session):
        # Revision to existing point
        revised_point = [
            {
                "observation_date": "2026-03-01",
                "price_usd_per_bbl": 71.85,
            }
        ]
        res = refresh_ppac_crude_source(db_session, mock_payload=revised_point)
        assert res.status == "success"
        assert res.records_updated == 1

        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="crude_oil_indian_basket", reference_period="2026-03-01"
        ).first()
        assert obs.observation_value == 71.85


class TestMoSPICPILiveRefresh:
    """Validate MoSPI CPI monthly series live refresh workflow."""

    def test_mospi_cpi_new_monthly_observation(self, db_session):
        new_cpi = [
            {
                "reference_month": "2026-09",
                "sector": "Combined",
                "index_value": 109.15,
                "release_status": "Provisional",
                "source_title": "Press Release of CPI for September 2026",
            }
        ]
        res = refresh_mospi_cpi_source(db_session, mock_payload=new_cpi)
        assert res.status == "success"
        assert res.records_inserted == 1

        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="cpi_2024_general", reference_period="2026-09", sector="Combined"
        ).first()
        assert obs is not None
        assert obs.observation_value == 109.15
        assert obs.release_status == "Provisional"

    def test_mospi_cpi_official_status_promotion_to_final(self, db_session):
        promoted_cpi = [
            {
                "reference_month": "2026-09",
                "sector": "Combined",
                "index_value": 109.18,
                "release_status": "Final",
            }
        ]
        res = refresh_mospi_cpi_source(db_session, mock_payload=promoted_cpi)
        assert res.status == "success"
        assert res.records_updated == 1

        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="cpi_2024_general", reference_period="2026-09", sector="Combined"
        ).first()
        assert obs.observation_value == 109.18
        assert obs.release_status == "Final"

    @patch("app.services.live_refresh.safe_fetch_url")
    def test_mospi_cpi_portal_failure_handling(self, mock_fetch, db_session):
        mock_fetch.return_value = (False, None, "HTTP 503: Service Unavailable")
        res = refresh_mospi_cpi_source(db_session)
        assert res.status == "error"
        assert "503" in res.error_message


class TestFreshnessPolicyCalculations:
    """Validate source-specific freshness SLA rules."""

    def test_monthly_freshness_within_threshold(self):
        now = datetime(2026, 9, 15, tzinfo=timezone.utc)
        freshness = calculate_freshness("2026-08", policy="monthly", threshold_days=45, now=now)
        assert freshness.is_fresh is True
        assert freshness.threshold_days == 45

    def test_monthly_freshness_exceeded(self):
        now = datetime(2026, 11, 1, tzinfo=timezone.utc)
        freshness = calculate_freshness("2026-08", policy="monthly", threshold_days=45, now=now)
        assert freshness.is_fresh is False

    def test_sparse_snapshot_freshness(self):
        now = datetime(2026, 3, 1, tzinfo=timezone.utc)
        freshness = calculate_freshness("2026-02-19", policy="sparse_snapshot", threshold_days=21, now=now)
        assert freshness.is_fresh is True

        now_stale = datetime(2026, 3, 20, tzinfo=timezone.utc)
        freshness_stale = calculate_freshness("2026-02-19", policy="sparse_snapshot", threshold_days=21, now=now_stale)
        assert freshness_stale.is_fresh is False


class TestSourceStatusAPI:
    """Validate FastAPI status endpoints."""

    def test_get_data_sources_status_api(self, db_engine):
        _, TestingSession = db_engine

        def override_get_db():
            db = TestingSession()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        client = TestClient(app)

        try:
            resp = client.get("/api/data-sources/status")
            assert resp.status_code == 200
            data = resp.json()
            assert "total_sources" in data
            assert data["total_sources"] >= 2
            assert any(s["source_id"] == "SRC-01" for s in data["sources"])
            assert any(s["source_id"] == "SRC-02" for s in data["sources"])

            # Verify alias endpoint
            alias_resp = client.get("/api/sources/status")
            assert alias_resp.status_code == 200
        finally:
            app.dependency_overrides.pop(get_db, None)


class TestTransactionSafetyAndSyncStatus:
    """Validate transaction isolation, rollback behavior, and concurrency handling."""

    def test_get_or_create_sync_status_does_not_commit_caller_session(self, db_session):
        """Helper must not commit unrelated dirty rows in the session."""
        from app.services.live_refresh import get_or_create_sync_status

        # Create an uncommitted pending record in session
        test_obs = TimeSeriesObservationModel(
            series_id="cpi_2024_general",
            reference_period="1999-01",
            observation_value=999.9,
            unit="Index points",
            geographic_scope="All-India",
        )
        db_session.add(test_obs)

        # Call get_or_create_sync_status for a missing status row
        status_row = get_or_create_sync_status(
            db_session,
            source_id="SRC-TEST-01",
            series_id="cpi_2024_general",
            refresh_policy="monthly",
            freshness_threshold_days=30,
        )
        assert status_row is not None
        assert status_row.source_id == "SRC-TEST-01"

        # The session must still have an active transaction that has NOT been committed.
        # Specifically, check that rolling back the session causes the uncommitted row to be discarded
        db_session.rollback()

        # Both the pending observation and the uncommitted status row must no longer be in the database
        assert db_session.get(DataSourceSyncStatusModel, "SRC-TEST-01") is None
        assert db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="cpi_2024_general", reference_period="1999-01"
        ).first() is None

    def test_get_or_create_sync_status_existing_row(self, db_session):
        """Calling helper on an existing row returns it without adding duplicate."""
        from app.services.live_refresh import get_or_create_sync_status

        existing = DataSourceSyncStatusModel(
            source_id="SRC-EXISTING-01",
            series_id="crude_oil_indian_basket",
            is_enabled=True,
            refresh_policy="sparse_snapshot",
            freshness_threshold_days=21,
            status="idle",
        )
        db_session.add(existing)
        db_session.commit()

        retrieved = get_or_create_sync_status(
            db_session,
            source_id="SRC-EXISTING-01",
            series_id="crude_oil_indian_basket",
            refresh_policy="sparse_snapshot",
            freshness_threshold_days=21,
        )
        assert retrieved.source_id == "SRC-EXISTING-01"
        assert retrieved.series_id == "crude_oil_indian_basket"

        # Clean up
        db_session.delete(retrieved)
        db_session.commit()

    def test_get_or_create_sync_status_concurrent_integrity_error_recovery(self, db_engine):
        """Simulate real concurrent insert race triggering IntegrityError inside savepoint and recovering."""
        from app.services.live_refresh import get_or_create_sync_status

        _, TestingSession = db_engine
        source_id = "SRC-CONCURRENT-01"

        session_a = TestingSession()
        session_b = TestingSession()

        try:
            # Seed foreign key data source if needed
            if not session_b.get(DataSourceModel, source_id):
                session_b.add(
                    DataSourceModel(
                        source_id=source_id,
                        source_title="Test Concurrent Source",
                        publisher="Test",
                        verification_status="[VERIFIED]",
                    )
                )
                session_b.commit()

            orig_flush = session_a.flush

            def race_flush(*args, **kwargs):
                # Restore original flush immediately so subsequent flushes behave normally
                session_a.flush = orig_flush
                # Simulate a concurrent transaction committing the exact row right after
                # session_a checks and finds nothing, causing session_a's flush to raise IntegrityError.
                concurrent_row = DataSourceSyncStatusModel(
                    source_id=source_id,
                    series_id="cpi_2024_general",
                    is_enabled=True,
                    refresh_policy="monthly",
                    freshness_threshold_days=45,
                    status="idle",
                )
                session_b.add(concurrent_row)
                session_b.commit()
                # Calling original flush triggers real database IntegrityError on UNIQUE(source_id)
                orig_flush(*args, **kwargs)

            session_a.flush = race_flush

            recovered = get_or_create_sync_status(
                session_a,
                source_id=source_id,
                series_id="cpi_2024_general",
                refresh_policy="monthly",
                freshness_threshold_days=45,
            )
            assert recovered is not None
            assert recovered.source_id == source_id
            assert recovered.series_id == "cpi_2024_general"
        finally:
            session_a.rollback()
            cleanup = session_b.get(DataSourceSyncStatusModel, source_id)
            if cleanup:
                session_b.delete(cleanup)
            src_cleanup = session_b.get(DataSourceModel, source_id)
            if src_cleanup:
                session_b.delete(src_cleanup)
            session_b.commit()
            session_a.close()
            session_b.close()

    def test_ensure_sync_status_records_persists_baseline(self, db_session):
        """ensure_sync_status_records must persist both SRC-01 and SRC-02."""
        from app.services.live_refresh import ensure_sync_status_records

        ensure_sync_status_records(db_session)

        src1 = db_session.get(DataSourceSyncStatusModel, "SRC-01")
        src2 = db_session.get(DataSourceSyncStatusModel, "SRC-02")
        assert src1 is not None
        assert src2 is not None
        assert src1.series_id == "crude_oil_indian_basket"
        assert src2.series_id == "cpi_2024_general"

    def test_refresh_exception_triggers_rollback(self, db_session):
        """If an exception occurs during refresh ingestion, changes are rolled back."""
        # Establish baseline sync status state
        sync_status = db_session.get(DataSourceSyncStatusModel, "SRC-01")
        if not sync_status:
            from app.services.live_refresh import ensure_sync_status_records
            ensure_sync_status_records(db_session)
            sync_status = db_session.get(DataSourceSyncStatusModel, "SRC-01")

        period_before = sync_status.last_observation_period
        status_before = sync_status.status

        # Count runs before test
        initial_run_count = db_session.query(DataSourceRefreshRunModel).filter_by(source_id="SRC-01").count()

        new_point = [
            {
                "observation_date": "2026-04-01",
                "price_usd_per_bbl": 85.0,
            }
        ]

        # Fail during run-log insertion after observations were added to session but before commit
        orig_add = db_session.add

        def fail_on_run_log(instance):
            if isinstance(instance, DataSourceRefreshRunModel):
                raise RuntimeError("Database failure writing refresh run log")
            return orig_add(instance)

        with patch.object(db_session, "add", side_effect=fail_on_run_log):
            with pytest.raises(RuntimeError, match="Database failure writing refresh run log"):
                refresh_ppac_crude_source(db_session, mock_payload=new_point)

        # Confirm partially added observation was rolled back and is NOT in database
        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="crude_oil_indian_basket", reference_period="2026-04-01"
        ).first()
        assert obs is None

        # Confirm run log was NOT persisted (count unchanged)
        current_run_count = db_session.query(DataSourceRefreshRunModel).filter_by(source_id="SRC-01").count()
        assert current_run_count == initial_run_count

        # Confirm sync_status rolled back to pre-refresh values
        db_session.expire_all()
        status_after = db_session.get(DataSourceSyncStatusModel, "SRC-01")
        assert status_after.status == status_before
        assert status_after.last_observation_period == period_before


class TestOfficialPublicationParsers:
    """Validate HTML and JSON parser extraction against official publication formats."""

    def test_ppac_archive_html_parsing_valid_headlines(self):
        html_fixture = """
        <html>
        <body>
        <div class="news-list">
            <li><a href="/1">Indian Basket of Crude oil was US$ 71.50 per bbl on 01.03.2026</a></li>
            <li><a href="/2">Indian Basket crude price was $72.40/bbl as on 02-03-2026</a></li>
            <li><a href="/3">Indian Basket was 68.52 USD/bbl on 2026-02-06</a></li>
            <li><a href="/4">Unrelated news item: Safety protocols reviewed</a></li>
        </div>
        </body>
        </html>
        """
        parsed = parse_ppac_archive_html(html_fixture)
        assert len(parsed) == 3
        assert parsed[0]["observation_date"] == "2026-03-01"
        assert parsed[0]["price_usd_per_bbl"] == 71.50
        assert parsed[1]["observation_date"] == "2026-03-02"
        assert parsed[1]["price_usd_per_bbl"] == 72.40
        assert parsed[2]["observation_date"] == "2026-02-06"
        assert parsed[2]["price_usd_per_bbl"] == 68.52

    def test_ppac_archive_html_parsing_empty_and_unsupported(self):
        assert parse_ppac_archive_html("") == []
        assert parse_ppac_archive_html("<html><body><p>No crude headlines here</p></body></html>") == []

    def test_mospi_cpi_json_parsing_valid_releases(self):
        json_fixture = """
        {
            "product": "CPI",
            "base": "2024=100",
            "releases": [
                {
                    "reference_month": "2026-09",
                    "sector": "Rural",
                    "index_value": 109.80,
                    "status": "Provisional"
                },
                {
                    "reference_month": "2026-09",
                    "sector": "Urban",
                    "index_value": 108.90,
                    "status": "Provisional"
                },
                {
                    "reference_month": "2026-09",
                    "sector": "Combined",
                    "index_value": 109.40,
                    "status": "Provisional",
                    "source_release_date": "2026-10-12"
                }
            ]
        }
        """
        parsed = parse_mospi_cpi_content(json_fixture)
        assert len(parsed) == 3
        assert parsed[0]["sector"] == "Rural"
        assert parsed[0]["index_value"] == 109.80
        assert parsed[0]["release_status"] == "Provisional"
        assert parsed[2]["sector"] == "Combined"
        assert parsed[2]["index_value"] == 109.40

    def test_mospi_cpi_html_table_parsing_valid(self):
        html_fixture = """
        <div class="cpi-table">
          <table>
            <thead><tr><th>Month</th><th>Sector</th><th>Index Value</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>2026-09</td><td>Rural</td><td>109.80</td><td>Provisional</td></tr>
              <tr><td>2026-09</td><td>Urban</td><td>108.90</td><td>Provisional</td></tr>
              <tr><td>2026-09</td><td>Combined</td><td>109.40</td><td>Provisional</td></tr>
            </tbody>
          </table>
        </div>
        """
        parsed = parse_mospi_cpi_content(html_fixture)
        assert len(parsed) == 3
        assert parsed[0]["reference_month"] == "2026-09"
        assert parsed[0]["sector"] == "Rural"
        assert parsed[0]["index_value"] == 109.80

    def test_mospi_cpi_parsing_empty_and_unsupported(self):
        assert parse_mospi_cpi_content("") == []
        assert parse_mospi_cpi_content("<html><body><h1>Maintenance</h1></body></html>") == []

    @patch("app.services.live_refresh.safe_fetch_url")
    def test_ppac_automated_network_live_parse(self, mock_fetch, db_session):
        html_fixture = """
        <html><body>
        <a href="#">Indian Basket of Crude oil was US$ 73.10 per bbl on 01.05.2026</a>
        </body></html>
        """
        mock_fetch.return_value = (True, html_fixture, None)
        res = refresh_ppac_crude_source(db_session)
        assert res.status == "success"
        assert res.records_inserted == 1

        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="crude_oil_indian_basket", reference_period="2026-05-01"
        ).first()
        assert obs is not None
        assert obs.observation_value == 73.10

    @patch("app.services.live_refresh.safe_fetch_url")
    def test_ppac_automated_network_no_new_data(self, mock_fetch, db_session):
        html_fixture = "<html><body><p>No new crude headlines available</p></body></html>"
        mock_fetch.return_value = (True, html_fixture, None)
        res = refresh_ppac_crude_source(db_session)
        assert res.status == "no_change"
        assert res.records_inserted == 0

    @patch("app.services.live_refresh.safe_fetch_url")
    def test_mospi_automated_network_live_parse(self, mock_fetch, db_session):
        json_fixture = """
        {
            "product": "CPI",
            "releases": [
                {
                    "reference_month": "2026-10",
                    "sector": "Combined",
                    "index_value": 110.25,
                    "status": "Provisional"
                }
            ]
        }
        """
        mock_fetch.return_value = (True, json_fixture, None)
        res = refresh_mospi_cpi_source(db_session)
        assert res.status == "success"
        assert res.records_inserted == 1

        obs = db_session.query(TimeSeriesObservationModel).filter_by(
            series_id="cpi_2024_general", reference_period="2026-10", sector="Combined"
        ).first()
        assert obs is not None
        assert obs.observation_value == 110.25
        assert obs.release_status == "Provisional"

    @patch("app.services.live_refresh.safe_fetch_url")
    def test_mospi_automated_network_no_new_data(self, mock_fetch, db_session):
        html_fixture = "<html><body><p>Portal Catalog</p></body></html>"
        mock_fetch.return_value = (True, html_fixture, None)
        res = refresh_mospi_cpi_source(db_session)
        assert res.status == "no_change"
        assert res.records_inserted == 0
