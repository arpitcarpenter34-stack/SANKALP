"""India Impact Graph - FastAPI Application Entry Point."""

from fastapi import FastAPI

app = FastAPI(
    title="India Impact Graph API",
    description="Autonomous Financial Event Market Impact Graph API - HackWave 3.0",
    version="0.1.0",
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Health check endpoint confirming FastAPI service is running.

    Does not report database or external service state as those are not yet configured.
    """
    return {"status": "ok"}
