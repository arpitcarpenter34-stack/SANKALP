"""API package for India Impact Graph backend."""

from pathlib import Path
import sys
from fastapi import APIRouter

# Ensure repository root is in sys.path so sibling packages are discoverable
_root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from app.api.consensus import router as consensus_router
from app.api.time_series import router as time_series_router
from what_to_watch.api import router as what_to_watch_router
from app.api.calculator import router as calculator_router
from app.api.registries import router as registries_router

api_router = APIRouter()

# 1. Base route mounts (preserving existing paths)
api_router.include_router(consensus_router)
api_router.include_router(time_series_router)
api_router.include_router(what_to_watch_router)

# 2. Unified /api namespace mounts (for frontend consistency)
api_router.include_router(consensus_router, prefix="/api")
api_router.include_router(time_series_router, prefix="/api")
api_router.include_router(what_to_watch_router, prefix="/api")

# 3. Calculator and Persona impact engine (/api/calculator)
api_router.include_router(calculator_router)

# 4. Registries (/api/sources, /api/pass-through, /api/consumption-items, /api/cached-articles)
api_router.include_router(registries_router)

__all__ = [
    "api_router",
    "calculator_router",
    "consensus_router",
    "registries_router",
    "time_series_router",
    "what_to_watch_router",
]
