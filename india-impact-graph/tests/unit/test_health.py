"""Unit tests for FastAPI health check endpoint."""

from pathlib import Path
import sys

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402

client = TestClient(app)


def test_health_check_status_code() -> None:
    """Verify GET /api/health returns HTTP 200."""
    response = client.get("/api/health")
    assert response.status_code == 200


def test_health_check_payload() -> None:
    """Verify GET /api/health returns the expected JSON contract."""
    response = client.get("/api/health")
    assert response.headers["content-type"].startswith("application/json")
    data = response.json()
    assert data == {"status": "ok"}


def test_cors_configuration_defaults() -> None:
    """Verify default CORS allowed origins contain standard local development ports."""
    from app.config import DEFAULT_ALLOWED_ORIGINS, settings
    assert "http://localhost:3000" in settings.CORS_ALLOWED_ORIGINS
    assert "http://127.0.0.1:5173" in settings.CORS_ALLOWED_ORIGINS
    for default in DEFAULT_ALLOWED_ORIGINS:
        assert default in settings.CORS_ALLOWED_ORIGINS


def test_cors_configuration_custom_lan_origin() -> None:
    """Verify custom LAN origin can be added via environment configuration without removing defaults."""
    from app.config import Settings
    custom = Settings(CORS_ALLOWED_ORIGINS="http://192.168.31.144:5173,http://192.168.3.12:3000")
    assert "http://192.168.31.144:5173" in custom.CORS_ALLOWED_ORIGINS
    assert "http://192.168.3.12:3000" in custom.CORS_ALLOWED_ORIGINS
    assert "http://localhost:3000" in custom.CORS_ALLOWED_ORIGINS


def test_cors_configuration_disallows_wildcard_and_null() -> None:
    """Verify wildcard '*' and 'null' origins are rejected from allowlist."""
    from app.config import Settings
    custom = Settings(CORS_ALLOWED_ORIGINS="*,null,http://192.168.31.144:5173")
    assert "*" not in custom.CORS_ALLOWED_ORIGINS
    assert "null" not in custom.CORS_ALLOWED_ORIGINS
    assert "http://192.168.31.144:5173" in custom.CORS_ALLOWED_ORIGINS
