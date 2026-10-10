"""India Impact Graph - FastAPI Application Entry Point."""

from fastapi import Depends, FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.events import router as events_router

app = FastAPI(
    title="India Impact Graph API",
    description="Autonomous Financial Event Market Impact Graph API - HackWave 3.0",
    version="0.1.0",
)

app.include_router(events_router)


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
