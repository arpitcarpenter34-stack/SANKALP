"""Unit tests for Clerk Authentication Dependency & /api/auth/me Endpoint."""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from clerk_backend_api.security.types import AuthStatus, RequestState

from app.main import app
from app.config import settings

client = TestClient(app)


def test_auth_me_missing_token_returns_401():
    """Verify accessing /api/auth/me without an Authorization header returns HTTP 401."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    assert "detail" in response.json()
    assert response.json()["detail"] == "Authentication credentials were not provided."


def test_auth_me_invalid_bearer_format_returns_401():
    """Verify non-Bearer Authorization header format is rejected with HTTP 401."""
    response = client.get("/api/auth/me", headers={"Authorization": "Basic dXNlcjpwYXNz"})
    assert response.status_code == 401
    assert "detail" in response.json()


def test_auth_me_empty_bearer_token_returns_401():
    """Verify empty Bearer token is rejected with HTTP 401."""
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer "})
    assert response.status_code == 401


def test_auth_me_invalid_token_returns_401():
    """Verify an invalid or forged token is rejected by the verification SDK."""
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not_a_valid_jwt_token"})
    assert response.status_code == 401
    assert "Invalid or expired" in response.json()["detail"] or "verification failed" in response.json()["detail"]


@patch("clerk_backend_api.authenticate_request")
def test_auth_me_valid_token_returns_verified_sub(mock_authenticate):
    """Verify valid token returns verified subject user ID and never trusts client-supplied identity."""
    # Simulate valid Clerk session verification with subject claim
    mock_authenticate.return_value = RequestState(
        status=AuthStatus.SIGNED_IN,
        token="valid_session_jwt",
        payload={
            "sub": "user_2testClerkUserId12345",
            "sid": "sess_2testSessionId67890",
            "azp": "http://localhost:3000",
        },
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer mock_valid_jwt_token"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["user_id"] == "user_2testClerkUserId12345"
    assert data["session_id"] == "sess_2testSessionId67890"


@patch("clerk_backend_api.authenticate_request")
def test_auth_me_token_without_sub_claim_returns_401(mock_authenticate):
    """Verify token lacking 'sub' claim is rejected with HTTP 401."""
    mock_authenticate.return_value = RequestState(
        status=AuthStatus.SIGNED_IN,
        token="valid_session_jwt",
        payload={"azp": "http://localhost:3000"},  # Missing 'sub'
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer token_without_sub"},
    )
    assert response.status_code == 401
    assert "subject identifier" in response.json()["detail"]


def test_auth_me_missing_backend_secret_returns_safe_500():
    """Verify unconfigured secret key returns safe 500 error without secret leakage."""
    original_secret = settings.CLERK_SECRET_KEY
    try:
        settings.CLERK_SECRET_KEY = None
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer some_token"},
        )
        assert response.status_code == 500
        assert response.json()["detail"] == "Authentication service configuration error."
    finally:
        settings.CLERK_SECRET_KEY = original_secret


def test_public_health_endpoints_remain_unauthenticated():
    """Verify /api/health and /api/health/db remain public and do not require tokens."""
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json() == {"status": "ok"}

    res_db = client.get("/api/health/db")
    # Health/db returns 200 or 503 depending on live DB, but NEVER 401 Unauthorized
    assert res_db.status_code in [200, 503]
