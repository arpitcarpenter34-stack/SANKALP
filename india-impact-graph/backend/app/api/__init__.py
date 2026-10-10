"""API package for India Impact Graph backend."""

from fastapi import APIRouter
from app.api.events import router as events_router

api_router = APIRouter()
api_router.include_router(events_router)
