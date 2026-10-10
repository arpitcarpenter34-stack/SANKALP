"""Pydantic schemas for Cached Articles Catalog Registry.

Conforms strictly to `docs/DATA_AND_EVIDENCE_RULES.md` and
`data/templates/cached-articles-catalog.csv`.
"""

from pathlib import Path
import re
from typing import Any, Optional
from urllib.parse import urlparse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.consumption import VerificationStatus

ARTICLE_ID_PATTERN = re.compile(r"^[a-zA-Z0-9_\-]+$")
ALLOWED_URL_SCHEMES = ("https", "http")


class CachedArticleBase(BaseModel):
    """Base schema for cached news and scenario articles."""

    model_config = ConfigDict(extra="forbid")

    article_id: str = Field(
        description="Unique identifier matching pattern '^[a-zA-Z0-9_\\-]+$' (e.g. 'ART-01', 'ie-rbi-01')"
    )
    event_name: str = Field(
        description="Canonical economic event name or scenario identifier"
    )
    headline: str = Field(
        description="Reported article headline"
    )
    publisher: str = Field(
        description="News organization or media publishing entity"
    )
    publication_date: Optional[str] = Field(
        default=None,
        description="ISO publication date (YYYY-MM-DD) or reported publication timestamp",
    )
    event_date: Optional[str] = Field(
        default=None,
        description="Reported occurrence date of the financial event",
    )
    source_url: Optional[str] = Field(
        default=None,
        description="Original public web link to the reported news article",
    )
    local_cache_path: Optional[str] = Field(
        default=None,
        description="Relative file path to immutable locally cached article snapshot",
    )
    reported_event_magnitude: Optional[str] = Field(
        default=None,
        description="Reported percentage or absolute shock magnitude cited in source",
    )
    verification_status: VerificationStatus = Field(
        default=VerificationStatus.VERIFY,
        description="Evidence governance classification",
    )

    @field_validator("article_id")
    @classmethod
    def validate_article_id(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("article_id cannot be empty")
        if not ARTICLE_ID_PATTERN.match(clean):
            raise ValueError(
                f"Article ID '{v}' must match pattern '^[a-zA-Z0-9_\\-]+$' (e.g. 'ART-01', 'ie-rbi-01')"
            )
        return clean

    @field_validator("event_name", "headline", "publisher")
    @classmethod
    def validate_non_empty(cls, v: str, info) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError(f"{info.field_name} cannot be empty")
        return clean

    @field_validator("publication_date", "event_date", "reported_event_magnitude")
    @classmethod
    def clean_optional_strings(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        return clean if clean else None

    @field_validator("source_url")
    @classmethod
    def validate_safe_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            return None

        lower_url = clean.lower()
        if lower_url.startswith(("javascript:", "data:", "file:", "ftp:")):
            raise ValueError(f"Unsafe URL scheme in source_url: '{clean}'. Only HTTPS/HTTP permitted.")

        parsed = urlparse(clean)
        if parsed.scheme not in ALLOWED_URL_SCHEMES:
            raise ValueError(
                f"Invalid URL scheme '{parsed.scheme}'. Only HTTPS or HTTP URLs are allowed for external articles."
            )
        if not parsed.netloc:
            raise ValueError(f"Invalid source_url '{clean}': missing network domain host.")

        return clean

    @field_validator("local_cache_path")
    @classmethod
    def validate_cache_path(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        if not clean:
            return None

        normalized = clean.replace("\\", "/")
        parts = [p for p in normalized.split("/") if p]
        if ".." in parts:
            raise ValueError(f"Unsafe path traversal detected in local_cache_path: '{clean}'")
        if Path(clean).is_absolute() or normalized.startswith("/"):
            raise ValueError(f"Absolute paths not permitted in local_cache_path: '{clean}'")

        return clean

    @field_validator("verification_status", mode="before")
    @classmethod
    def parse_verification_status(cls, v: Any) -> VerificationStatus:
        if isinstance(v, VerificationStatus):
            return v
        if isinstance(v, str):
            clean = v.strip().upper()
            if not clean.startswith("[") and not clean.endswith("]"):
                bracketed = f"[{clean}]"
            else:
                bracketed = clean
            try:
                return VerificationStatus(bracketed)
            except ValueError as exc:
                allowed = [s.value for s in VerificationStatus]
                raise ValueError(
                    f"Unsupported verification_status '{v}'. Must be one of: {allowed}"
                ) from exc
        raise ValueError(f"Invalid verification_status type: {type(v)}")

    def is_locally_cached(self, base_dir: Optional[Path] = None) -> bool:
        """Verify whether the referenced local cache file actually exists on disk."""
        if not self.local_cache_path:
            return False
        root = base_dir or Path.cwd()
        resolved_path = (root / self.local_cache_path).resolve()
        try:
            resolved_path.relative_to(root.resolve())
        except ValueError:
            return False
        return resolved_path.is_file()


class CachedArticleCreate(CachedArticleBase):
    """Schema for registering a validated cached article record."""

    pass


class CachedArticleResponse(CachedArticleBase):
    """Schema for returning a cached article record from the catalog."""

    pass
