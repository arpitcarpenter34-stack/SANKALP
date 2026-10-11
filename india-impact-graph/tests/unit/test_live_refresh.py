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
