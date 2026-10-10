"""Unit tests for database configuration, session management, and health endpoints."""

from pathlib import Path
import sys
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.config import Settings
from app.database import get_db
from app.main import app

client = TestClient(app)


def test_settings_database_url_default():
    """Verify Settings provides a valid default psycopg 3 DATABASE_URL."""
    settings = Settings()
    assert settings.DATABASE_URL.startswith("postgresql+psycopg://")
    assert "india_impact_graph" in settings.DATABASE_URL


def test_settings_custom_env_override(monkeypatch):
    """Verify DATABASE_URL can be set via environment variable without exposing secrets."""
    mock_url = "postgresql+psycopg://custom_user:custom_pass@custom_host:5432/custom_db"
    monkeypatch.setenv("DATABASE_URL", mock_url)
    settings = Settings()
    assert settings.DATABASE_URL == mock_url


def test_get_db_session_cleanup():
    """Verify get_db generator properly closes the session on exit."""
    from app import database

    mock_session = MagicMock()
    orig_session_local = database.SessionLocal
    database.SessionLocal = MagicMock(return_value=mock_session)
    try:
        generator = get_db()
        session = next(generator)
        assert session == mock_session
        mock_session.close.assert_not_called()
        try:
            next(generator)
        except StopIteration:
            pass
        mock_session.close.assert_called_once()
    finally:
        database.SessionLocal = orig_session_local


def test_original_health_check_preserved():
    """Verify the original GET /api/health endpoint is preserved and unaffected."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_db_health_check_success():
    """Verify GET /api/health/db returns 200 and connected status on successful query."""
    mock_session = MagicMock()
    mock_session.execute.return_value = MagicMock()

    def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/health/db")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "database": "connected"}
    finally:
        app.dependency_overrides.clear()


def test_db_health_check_failure_graceful_and_safe():
    """Verify GET /api/health/db returns 503 and generic error without leaking secrets or traces."""
    mock_session = MagicMock()
    # Simulate a driver connection failure with a realistic error containing credentials/host
    mock_session.execute.side_effect = Exception(
        "connection to server at '127.0.0.1', port 5432 failed: FATAL: password authentication failed for user 'postgres'"
    )

    def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        response = client.get("/api/health/db")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"
        assert data["detail"] == "Connection error"
        # Ensure no raw driver message, password, or IP leaked to client
        assert "password" not in response.text
        assert "127.0.0.1" not in response.text
        assert "FATAL" not in response.text
    finally:
        app.dependency_overrides.clear()
