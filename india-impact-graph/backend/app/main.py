"""India Impact Graph - FastAPI Application Entry Point."""

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.events import router as events_router
from app.api.graph import router as graph_router
from app.api import api_router

from app.config import settings

# Explicit allowlist of documented local and trusted LAN origins
ALLOWED_ORIGINS = settings.CORS_ALLOWED_ORIGINS

app = FastAPI(
    title="India Impact Graph API",
    description="Autonomous Financial Event Market Impact Graph API - HackWave 3.0",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)

app.include_router(events_router)
app.include_router(graph_router)
app.include_router(api_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Health check endpoint confirming FastAPI service is running.

    Does not report database or external service state as those are not yet configured.
    """
    return {"status": "ok"}


@app.get("/api/health/db")
def db_health_check(db: Session = Depends(get_db)):
    """Truthful database health check endpoint.

    Executes a real SELECT 1 query to confirm connectivity.
    Does not leak connection strings, credentials, or internal stack traces.
    """
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "database": "disconnected",
                "detail": "Connection error",
            },
        )
