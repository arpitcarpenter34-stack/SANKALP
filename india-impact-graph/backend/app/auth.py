"""Clerk Authentication Dependencies and Verification for FastAPI.

Uses the official clerk-backend-api SDK to verify session JWT tokens, check
signatures, token expiry, and authorized parties (azp) without trusting client-provided IDs.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional
import logging

from fastapi import Depends, HTTPException, Request, status
import clerk_backend_api
from clerk_backend_api.security.types import AuthenticateRequestOptions, AuthStatus

from app.config import settings

logger = logging.getLogger("app.auth")


@dataclass
class AuthenticatedUser:
    """Represents a verified authenticated Clerk user identity."""

    user_id: str
    session_id: Optional[str] = None
    claims: Dict[str, Any] = field(default_factory=dict)


def _get_auth_options() -> AuthenticateRequestOptions:
    """Build AuthenticateRequestOptions from verified settings.
    
    Raises HTTPException(500) if backend authentication is unconfigured,
    ensuring no raw secrets or internal traces leak to clients.
    """
    if not settings.CLERK_SECRET_KEY:
        logger.error("CLERK_SECRET_KEY is not configured on the backend.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service configuration error.",
        )

    options_kwargs: Dict[str, Any] = {
        "secret_key": settings.CLERK_SECRET_KEY,
    }

    if settings.CLERK_AUTHORIZED_PARTIES:
        options_kwargs["authorized_parties"] = settings.CLERK_AUTHORIZED_PARTIES

    if settings.CLERK_JWT_KEY:
        options_kwargs["jwt_key"] = settings.CLERK_JWT_KEY

    return AuthenticateRequestOptions(**options_kwargs)


async def get_current_user(request: Request) -> AuthenticatedUser:
    """FastAPI dependency: Enforce verified Clerk session authentication.

    Rejects requests with missing or invalid tokens with HTTP 401 Unauthorized.
    Extracts the subject identity strictly from the verified JWT 'sub' claim.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header[7:].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or empty bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    options = _get_auth_options()

    try:
        req_state = clerk_backend_api.authenticate_request(request, options)
    except Exception as exc:
        logger.warning("Token verification exception: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token verification failed.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if req_state.status != AuthStatus.SIGNED_IN:
        logger.debug("Request not signed in. Reason: %s", req_state.reason)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = req_state.payload or {}
    user_id = payload.get("sub")
    if not user_id or not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token claims missing subject identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthenticatedUser(
        user_id=user_id,
        session_id=payload.get("sid"),
        claims=payload,
    )


async def get_optional_user(request: Request) -> Optional[AuthenticatedUser]:
    """FastAPI dependency: Optional user authentication.

    Returns AuthenticatedUser if valid Bearer token provided;
    Returns None if no Authorization header present;
    Raises HTTP 401 if an invalid Bearer token is provided.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header:
        return None

    return await get_current_user(request)
