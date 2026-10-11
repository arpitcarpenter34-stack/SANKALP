"""API package for India Impact Graph backend."""

from pathlib import Path
import sys
from fastapi import APIRouter

# Ensure repository root is in sys.path so what_to_watch package is discoverable
_root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from what_to_watch.api import router as what_to_watch_router

api_router = APIRouter()
api_router.include_router(what_to_watch_router)

__all__ = ["api_router", "what_to_watch_router"]
