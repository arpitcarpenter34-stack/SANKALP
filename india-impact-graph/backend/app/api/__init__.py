from pathlib import Path
import sys
from fastapi import APIRouter

# Ensure repository root is in sys.path so sibling packages are discoverable
_root_dir = Path(__file__).resolve().parent.parent.parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from app.api.events import router as events_router
from app.api.graph import router as graph_router
from app.api.consensus import router as consensus_router
from app.api.time_series import router as time_series_router
from what_to_watch.api import router as what_to_watch_router

api_router = APIRouter()
api_router.include_router(events_router)
api_router.include_router(graph_router)
api_router.include_router(consensus_router)
api_router.include_router(time_series_router)
api_router.include_router(what_to_watch_router)

__all__ = [
    "api_router",
    "events_router",
    "graph_router",
    "consensus_router",
    "time_series_router",
    "what_to_watch_router",
]

