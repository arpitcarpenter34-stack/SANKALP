"""Pydantic schemas for Historical Time-Series Foundation.

Covers MoSPI CPI and PPAC crude-oil time series data definitions,
discrete observations, and API response models.
Conforms to project data governance and provenance standards.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class TimeSeriesDefinitionBase(BaseModel):
    """Base schema for time series definition and metadata."""

    model_config = ConfigDict(extra="forbid")

    series_id: str = Field(description="Unique identifier for the time series (e.g. 'cpi_2024_general')")
    series_name: str = Field(description="Display name of the series (e.g. 'CPI 2024 General Index')")
    publisher: str = Field(description="Authoritative publishing body (e.g. 'MoSPI', 'PPAC')")
    unit: str = Field(description="Unit of measurement (e.g. 'Index points', 'USD/barrel')")
    frequency: str = Field(description="Series observation frequency (e.g. 'Monthly', 'Sparse published snapshots')")
    geographic_scope: str = Field(default="All-India", description="Geographic boundary of the series")
    base_year: Optional[str] = Field(default=None, description="Index base year if applicable (e.g. '2024=100')")
    source_id: Optional[str] = Field(default=None, description="Reference to authoritative data source register (e.g. 'SRC-02')")
    notes: Optional[str] = Field(default=None, description="Contextual methodological notes")


class TimeSeriesDefinitionCreate(TimeSeriesDefinitionBase):
    """Schema for creating a time series definition."""

    pass


class TimeSeriesDefinitionResponse(TimeSeriesDefinitionBase):
    """Schema for returning a time series definition."""

    model_config = ConfigDict(from_attributes=True)


class TimeSeriesObservationBase(BaseModel):
    """Base schema for discrete time series observation."""

    model_config = ConfigDict(extra="forbid")

    series_id: str = Field(description="Series identifier linking to definition")
    reference_period: str = Field(description="Reference period (e.g. '2026-01' or '2026-01-02')")
    observation_date: Optional[str] = Field(default=None, description="Exact observation date in YYYY-MM-DD if daily/snapshot")
    geographic_scope: str = Field(default="All-India", description="Geographic boundary")
    sector: str = Field(default="Combined", description="Sector classification ('Rural', 'Urban', 'Combined')")
    observation_value: float = Field(description="Recorded observation numerical value")
    unit: str = Field(description="Measurement unit")
    release_status: str = Field(default="Final", description="Publication status ('Final', 'Provisional', 'As-on published snapshot')")
    source_title: Optional[str] = Field(default=None, description="Title of publishing bulletin or release")
    source_url: Optional[str] = Field(default=None, description="Source URL for provenance verification")
    publication_date: Optional[str] = Field(default=None, description="Date of release or publication")
    notes: Optional[str] = Field(default=None, description="Methodological or provenance notes")


class TimeSeriesObservationCreate(TimeSeriesObservationBase):
    """Schema for inserting a discrete time series observation."""

    pass


class TimeSeriesObservationResponse(TimeSeriesObservationBase):
    """Schema for returning a discrete time series observation."""

    model_config = ConfigDict(from_attributes=True)
    id: int


# --- API Compatibility Response Models ---

class CPIObservation(BaseModel):
    """Observation item model preserving existing CPI endpoint compatibility."""

    period: str
    geography: str
    sector: str
    group: str
    index_value: float
    base_year: str
    status: str
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    publication_date: Optional[str] = None


class PPACSnapshot(BaseModel):
    """Observation item model preserving existing PPAC snapshot endpoint compatibility."""

    period: str
    price_usd_per_bbl: float
    status: str
    source_title: Optional[str] = None
    source_url: Optional[str] = None
    publication_date: Optional[str] = None


class CPISeriesResponse(BaseModel):
    """Response model for CPI monthly series endpoint."""

    series_name: str
    metadata: Dict[str, Any]
    observations: List[CPIObservation]


class PPACSeriesResponse(BaseModel):
    """Response model for PPAC crude-oil snapshots endpoint."""

    series_name: str
    metadata: Dict[str, Any]
    observations: List[PPACSnapshot]
