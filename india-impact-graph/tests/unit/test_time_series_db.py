"""Unit and integration tests for PostgreSQL-backed historical time-series foundation.

Tests schema constraints, idempotency, observation preservation, sparse handling,
PostgreSQL query execution, and CSV fallback behavior.
"""

import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError

from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models.source import DataSourceModel
from app.models.time_series import (
    TimeSeriesDefinitionModel,
    TimeSeriesObservationModel,
)
from app.services.time_series import (
    ingest_all_time_series,
    ingest_time_series_definitions,
    ingest_cpi_observations_from_csv,
    ingest_ppac_snapshots_from_csv,
    get_cpi_observations_from_db,
    get_ppac_snapshots_from_db,
    DEFAULT_CPI_PATH,
    DEFAULT_PPAC_PATH,
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
    db.add_all([src1, src2])
    db.commit()
    db.close()

    yield engine, TestingSession

    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def in_memory_db(db_engine):
    """Provide a database session from the shared test engine."""
    _, TestingSession = db_engine
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


class TestTimeSeriesSchemaAndConstraints:
    """Validate ORM models, unique constraints, and foreign key references."""

    def test_unique_natural_key_constraint(self, in_memory_db):
        """Ensure duplicate (series_id, reference_period, geographic_scope, sector) is rejected."""
        # Ensure definition exists
        defn = in_memory_db.query(TimeSeriesDefinitionModel).filter_by(series_id="test_series").first()
        if not defn:
            defn = TimeSeriesDefinitionModel(
                series_id="test_series",
                series_name="Test Series",
                publisher="Test",
                unit="Points",
                frequency="Monthly",
                geographic_scope="All-India",
            )
            in_memory_db.add(defn)
            in_memory_db.commit()

        obs1 = TimeSeriesObservationModel(
            series_id="test_series",
            reference_period="2026-01",
            geographic_scope="All-India",
            sector="Combined",
            observation_value=100.5,
            unit="Points",
            release_status="Final",
        )
        in_memory_db.add(obs1)
        in_memory_db.commit()

        # Duplicate natural key
        obs2 = TimeSeriesObservationModel(
            series_id="test_series",
            reference_period="2026-01",
            geographic_scope="All-India",
            sector="Combined",
            observation_value=105.0,
            unit="Points",
            release_status="Final",
        )
        in_memory_db.add(obs2)
        with pytest.raises(IntegrityError):
            in_memory_db.commit()
        in_memory_db.rollback()


class TestTimeSeriesIngestionIdempotency:
    """Validate repeatable ingestion and observation integrity."""

    def test_ingestion_and_repeat_idempotency(self, in_memory_db):
        """Verify initial ingestion loads 2 definitions, 24 CPI, and 31 PPAC rows, and second run skips all."""
        # 1. First run
        result1 = ingest_all_time_series(in_memory_db, DEFAULT_CPI_PATH, DEFAULT_PPAC_PATH)
        assert result1["definitions"]["created"] == 2
        assert result1["cpi"]["created"] == 24
        assert result1["cpi"]["skipped"] == 0
        assert result1["ppac"]["created"] == 31
        assert result1["ppac"]["skipped"] == 0

        # 2. Second run - must be 100% idempotent
        result2 = ingest_all_time_series(in_memory_db, DEFAULT_CPI_PATH, DEFAULT_PPAC_PATH)
        assert result2["definitions"]["created"] == 0
        assert result2["definitions"]["skipped"] == 2
        assert result2["cpi"]["created"] == 0
        assert result2["cpi"]["skipped"] == 24
        assert result2["ppac"]["created"] == 0
        assert result2["ppac"]["skipped"] == 31

    def test_cpi_observation_accuracy_and_provenance(self, in_memory_db):
        """Verify CPI observation counts, months, values, and status flags."""
        obs = get_cpi_observations_from_db(in_memory_db)
        assert len(obs) == 24

        months = sorted({o.period for o in obs})
        assert months == ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"]

        # Check Rural / Urban / Combined for Jan 2026
        jan_obs = {o.sector: o.index_value for o in obs if o.period == "2026-01"}
        assert jan_obs["Rural"] == 104.59
        assert jan_obs["Urban"] == 104.28
        assert jan_obs["Combined"] == 104.45

        # Check Provisional status for May and August
        may_combined = next(o for o in obs if o.period == "2026-05" and o.sector == "Combined")
        assert may_combined.status == "Provisional"
        assert may_combined.index_value == 105.91

        aug_combined = next(o for o in obs if o.period == "2026-08" and o.sector == "Combined")
        assert aug_combined.status == "Provisional"
        assert aug_combined.index_value == 108.74

        # Provenance URL presence
        assert all(o.source_url and o.source_url.startswith("https://") for o in obs)

    def test_ppac_snapshots_sparsity_and_chronology(self, in_memory_db):
        """Verify PPAC snapshots preserve sparsity and chronological sequence without interpolation."""
        snapshots = get_ppac_snapshots_from_db(in_memory_db)
        assert len(snapshots) == 31

        periods = [s.period for s in snapshots]
        assert periods == sorted(periods)
        assert periods[0] == "2026-01-02"
        assert periods[-1] == "2026-02-19"

        # Verify exact prices
        assert snapshots[0].price_usd_per_bbl == 60.56
        assert snapshots[-1].price_usd_per_bbl == 70.70

        # Check snapshot status
        assert all(s.status == "As-on published snapshot" for s in snapshots)


class TestTimeSeriesAPIEndpoints:
    """Validate FastAPI endpoints backed by database and fallback paths."""

    def test_api_cpi_with_db(self, db_engine):
        """Test GET /time-series/cpi returns PostgreSQL-backed observations."""
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
            response = client.get("/time-series/cpi")
            assert response.status_code == 200
            data = response.json()
            assert data["series_name"] == "CPI 2024 General Index"
            assert data["metadata"]["data_source"] == "postgresql"
            assert len(data["observations"]) == 24

            # Sector filter
            rural_resp = client.get("/time-series/cpi?sector=Rural")
            assert rural_resp.status_code == 200
            rural_data = rural_resp.json()
            assert len(rural_data["observations"]) == 8
            assert all(o["sector"] == "Rural" for o in rural_data["observations"])

            # Non-existent sector
            invalid_resp = client.get("/time-series/cpi?sector=InvalidSector")
            assert invalid_resp.status_code == 404
        finally:
            app.dependency_overrides.pop(get_db, None)

    def test_api_crude_oil_with_db(self, db_engine):
        """Test GET /time-series/crude-oil returns PostgreSQL-backed snapshots."""
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
            response = client.get("/time-series/crude-oil")
            assert response.status_code == 200
            data = response.json()
            assert data["series_name"] == "PPAC Indian Basket Crude Oil"
            assert data["metadata"]["data_source"] == "postgresql"
            assert len(data["observations"]) == 31
            assert data["observations"][0]["price_usd_per_bbl"] == 60.56
        finally:
            app.dependency_overrides.pop(get_db, None)

    def test_api_cpi_csv_fallback(self):
        """Test GET /time-series/cpi falls back to CSV when database has no records or fails."""
        mock_db = MagicMock()
        # Mocking an empty query result
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        app.dependency_overrides[get_db] = lambda: mock_db
        client = TestClient(app)

        try:
            response = client.get("/time-series/cpi")
            assert response.status_code == 200
            data = response.json()
            assert data["series_name"] == "CPI 2024 General Index"
            assert data["metadata"]["data_source"] == "csv_fallback"
            assert len(data["observations"]) == 24
        finally:
            app.dependency_overrides.pop(get_db, None)

    def test_api_crude_oil_csv_fallback(self):
        """Test GET /time-series/crude-oil falls back to CSV when database has no records or fails."""
        mock_db = MagicMock()
        mock_db.execute.return_value.scalars.return_value.all.return_value = []

        app.dependency_overrides[get_db] = lambda: mock_db
        client = TestClient(app)

        try:
            response = client.get("/time-series/crude-oil")
            assert response.status_code == 200
            data = response.json()
            assert data["series_name"] == "PPAC Indian Basket Crude Oil"
            assert data["metadata"]["data_source"] == "csv_fallback"
            assert len(data["observations"]) == 31
        finally:
            app.dependency_overrides.pop(get_db, None)
