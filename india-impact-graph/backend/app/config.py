"""Application configuration using Pydantic Settings.

Reads configuration from environment variables and local .env files.
"""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable support."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_TITLE: str = "India Impact Graph API"
    APP_VERSION: str = "0.1.0"
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/india_impact_graph",
        description="PostgreSQL connection string using psycopg 3 format. Falls back to local development defaults.",
    )


settings = Settings()
