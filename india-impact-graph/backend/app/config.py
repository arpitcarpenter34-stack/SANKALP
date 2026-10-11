"""Application configuration using Pydantic Settings.

Reads configuration from environment variables and local .env files.
"""

from typing import Any, Optional
from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_dir = Path(__file__).resolve().parent.parent
_default_env = _backend_dir / ".env"

DEFAULT_ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=(".env", str(_default_env)),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_TITLE: str = "India Impact Graph API"
    APP_VERSION: str = "0.1.0"
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/india_impact_graph",
        description="PostgreSQL connection string using psycopg 3 format. Falls back to local development defaults.",
    )
    CORS_ALLOWED_ORIGINS: Any = Field(
        default_factory=lambda: list(DEFAULT_ALLOWED_ORIGINS),
        description="Explicit allowlist of permitted CORS origins. Extensible via CORS_ALLOWED_ORIGINS environment variable.",
    )

    # Clerk Authentication Settings
    CLERK_SECRET_KEY: Optional[str] = Field(
        default=None,
        description="Clerk Secret Key for verifying session JWTs and authenticating backend requests.",
    )
    CLERK_PUBLISHABLE_KEY: Optional[str] = Field(
        default=None,
        description="Clerk Publishable Key for backend client identification.",
    )
    CLERK_AUTHORIZED_PARTIES: Any = Field(
        default_factory=lambda: list(DEFAULT_ALLOWED_ORIGINS),
        description="Allowed authorized parties (azp) in Clerk session JWTs.",
    )
    CLERK_JWT_KEY: Optional[str] = Field(
        default=None,
        description="Optional Clerk public JWT key for offline cryptographic verification.",
    )

    USE_LIVE_LLM: bool = Field(
        default=False,
        description="Whether to use live LLM for financial event extraction. Defaults to False for deterministic offline operation.",
    )
    LIVE_LLM_API_KEY: Optional[str] = Field(
        default=None,
        description="API key for live LLM extraction. Required when USE_LIVE_LLM is True.",
    )
    DATA_REFRESH_TIMEOUT_SECONDS: int = Field(
        default=10,
        description="HTTP request timeout in seconds for official data source refresh checks.",
    )
    DATA_REFRESH_MAX_RETRIES: int = Field(
        default=2,
        description="Maximum retry attempts on transient network errors.",
    )
    DATA_REFRESH_MAX_RESPONSE_BYTES: int = Field(
        default=5_000_000,
        description="Maximum permitted response payload size (5MB).",
    )
    MOSPI_CPI_URL: str = Field(
        default="https://esankhyiki.mospi.gov.in/catalogue-main/catalogue?product=CPI",
        description="Official MoSPI CPI catalog and publication portal URL.",
    )
    PPAC_CRUDE_URL: str = Field(
        default="https://ppac.gov.in/archives/impnews",
        description="Official PPAC Important News archive URL for Indian Basket crude oil prices.",
    )
    CPI_FRESHNESS_DAYS: int = Field(
        default=45,
        description="Freshness SLA for monthly CPI series before flagged as stale.",
    )
    PPAC_FRESHNESS_DAYS: int = Field(
        default=21,
        description="Freshness threshold for sparse PPAC crude oil snapshots before flagged as stale.",
    )

    @field_validator("CORS_ALLOWED_ORIGINS", "CLERK_AUTHORIZED_PARTIES", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse comma-separated or JSON string origins and disallow wildcards."""
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return list(DEFAULT_ALLOWED_ORIGINS)
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    parsed = json.loads(v)
                    if isinstance(parsed, list):
                        v = parsed
                except Exception:
                    pass
            if isinstance(v, str):
                v = [origin.strip() for origin in v.split(",") if origin.strip()]

        if isinstance(v, (list, tuple, set)):
            # Disallow indiscriminate wildcard or null origin for security
            cleaned = []
            for item in v:
                item_str = str(item).strip()
                if item_str and item_str != "*" and item_str.lower() != "null":
                    cleaned.append(item_str)
            # Ensure local defaults are retained
            combined = list(DEFAULT_ALLOWED_ORIGINS)
            for origin in cleaned:
                if origin not in combined:
                    combined.append(origin)
            return combined

        return list(DEFAULT_ALLOWED_ORIGINS)


settings = Settings()
