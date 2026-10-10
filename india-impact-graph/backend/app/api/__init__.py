"""API package for India Impact Graph backend."""

from fastapi import APIRouter
from app.api.events import router as events_router
from app.api.graph import router as graph_router
from app.api.time_series import router as time_series_router
from app.api.consensus import router as consensus_router

api_router = APIRouter()
api_router.include_router(events_router)
api_router.include_router(graph_router)
api_router.include_router(time_series_router)
api_router.include_router(consensus_router)
