"""Application configuration using Pydantic Settings.

Reads configuration from environment variables and local .env files.
"""

from typing import Any
from pathlib import Path
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_backend_dir = Path(__file__).resolve().parent.parent
_default_env = _backend_dir / ".env"

DEFAULT_ALLOWED_ORIGINS: list[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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
    CORS_ALLOWED_ORIGINS: list[str] = Field(
        default_factory=lambda: list(DEFAULT_ALLOWED_ORIGINS),
        description="Explicit allowlist of permitted CORS origins. Extensible via CORS_ALLOWED_ORIGINS environment variable.",
    )

    @field_validator("CORS_ALLOWED_ORIGINS", mode="before")
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
