"""Pydantic schemas for BharatImpact News & Insights API.

Conforms to real source attribution, category filtering, economic tags,
and market indicators data contracts.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class EconomicTag(BaseModel):
    """Economic impact tag attached to a news story."""
    label: str = Field(description="Display tag (e.g. 'Crude Oil +4.2%', 'Inflation Risk')")
    kind: Literal["positive", "negative", "neutral", "risk"] = Field(
        default="neutral",
        description="Tag classification for color styling"
    )


class NewsArticleItem(BaseModel):
    """Normalized article representation with full source attribution."""
    article_id: str = Field(description="Unique article identifier")
    headline: str = Field(description="Verified reported headline")
    publisher: str = Field(description="Publishing news organization (e.g. Reuters, Bloomberg)")
    publication_date: str = Field(description="ISO publication date (YYYY-MM-DD)")
    relative_time: str = Field(description="Reported freshness relative time (e.g. '2 hours ago')")
    source_url: str = Field(description="Original public web URL to publisher article")
    category: str = Field(description="Domain category identifier (e.g. 'global_economy', 'energy')")
    category_label: str = Field(description="Human readable category name (e.g. 'Global Economy')")
    summary: str = Field(description="Factual summary or excerpt")
    image_url: Optional[str] = Field(default=None, description="Image URL or fallback placeholder key")
    image_key: Optional[str] = Field(default=None, description="Deterministic visual key (e.g. 'oil', 'rbi', 'chip', 'ship')")
    impact_severity: Literal["high", "medium", "low", "positive", "monitoring"] = Field(
        default="medium",
        description="Economic impact severity classification"
    )
    economic_tags: List[EconomicTag] = Field(default_factory=list, description="Associated economic indicator tags")
    related_event_id: Optional[str] = Field(default=None, description="Linked Global Event identifier if applicable")
    related_sector_id: Optional[str] = Field(default=None, description="Linked sector domain if applicable")
    is_top_story: bool = Field(default=False, description="Flag for prominent Top Stories card placement")
    verification_status: str = Field(default="VERIFIED", description="Evidence verification status")


class NewsCategoryItem(BaseModel):
    """Category filter descriptor."""
    id: str = Field(description="Category key (e.g. 'all', 'global_economy', 'commodities')")
    label: str = Field(description="Display label")
    icon: Optional[str] = Field(default=None, description="Icon identifier")
    article_count: int = Field(default=0, description="Number of matching articles")


class NewsListResponse(BaseModel):
    """Paginated or bounded list of news articles."""
    articles: List[NewsArticleItem]
    total_count: int
    categories: List[NewsCategoryItem]
    freshness_timestamp: str = Field(description="Last update timestamp of news catalog")
    provider_status: str = Field(default="live", description="Status of news catalog ('live' or 'cached')")
    provenance_note: str = Field(description="Data provenance disclosure")


class IndicatorPoint(BaseModel):
    """Single date point for economic indicator time series."""
    date: str
    label: str
    value: float


class IndicatorSeries(BaseModel):
    """Economic indicator time series line."""
    id: str
    name: str
    unit: str
    change_pct: float
    color: str
    data: List[IndicatorPoint]


class SectorReactionItem(BaseModel):
    """Sector movement and sentiment reaction."""
    sector_id: str
    name: str
    direction: Literal["up", "down", "neutral"]
    change_pct: float
    is_negative_for_economy: bool = Field(
        default=False,
        description="Whether positive change represents higher input cost risk"
    )
    article_count: int
    supporting_driver: str


class MarketSnapshotInstrument(BaseModel):
    """Market instrument snapshot card."""
    id: str
    name: str
    symbol: str
    current_value: float
    currency_prefix: str
    unit: str
    change_pct: float
    trend: Literal["up", "down", "neutral"]
    sparkline: List[float]
    source: str
    last_updated: str
    is_available: bool = True
    unavailable_reason: Optional[str] = None


class SentimentBreakdown(BaseModel):
    """Article sentiment distribution."""
    total_analyzed: int
    positive_count: int
    positive_pct: float
    neutral_count: int
    neutral_pct: float
    negative_count: int
    negative_pct: float
    methodology_note: str


class TrendingTopicItem(BaseModel):
    """Ranked trending topic."""
    rank: int
    name: str
    article_count_label: str
    growth_label: str
    category_id: str


class NewsAnalyticsResponse(BaseModel):
    """Aggregated analytics payload for News & Insights dashboard."""
    key_indicators: dict[str, List[IndicatorSeries]]
    sector_reactions: List[SectorReactionItem]
    market_snapshot: List[MarketSnapshotInstrument]
    sentiment: SentimentBreakdown
    trending_topics: List[TrendingTopicItem]
    as_of_date: str
    provenance_note: str
