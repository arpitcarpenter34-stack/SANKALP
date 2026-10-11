"""Authentication and Verified User Identity API endpoints."""

from typing import Any, Dict
from fastapi import APIRouter, Depends, status

from app.auth import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get(
    "/me",
    summary="Get authenticated Clerk user identity",
    status_code=status.HTTP_200_OK,
)
def get_authenticated_me(
    user: AuthenticatedUser = Depends(get_current_user),
) -> Dict[str, Any]:
    """Return the verified identity of the current user.

    Reads user ID exclusively from the verified JWT 'sub' claim, never from client input.
    """
    return {
        "authenticated": True,
        "user_id": user.user_id,
        "session_id": user.session_id,
    }
