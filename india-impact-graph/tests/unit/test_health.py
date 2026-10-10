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
