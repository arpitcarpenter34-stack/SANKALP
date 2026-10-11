"""FastAPI router for News & Insights endpoints.

Conforms to real source attribution, category filtering, search,
and macroeconomic indicator analytics.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.news import (
    NewsArticleItem,
    NewsListResponse,
    NewsAnalyticsResponse,
)
from app.services.news_service import NewsService

router = APIRouter(prefix="/api/news", tags=["news"])


@router.get(
    "",
    response_model=NewsListResponse,
    status_code=status.HTTP_200_OK,
    summary="List news articles with category filtering and search",
)
def list_news(
    category: Optional[str] = Query(default=None, description="Category filter (e.g. 'all', 'commodities', 'energy')"),
    q: Optional[str] = Query(default=None, description="Search query across headlines and summaries"),
    limit: int = Query(default=20, ge=1, le=100, description="Page size limit"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
) -> NewsListResponse:
    """Retrieve verified economic news articles with category counts and attribution."""
    return NewsService.get_news_articles(category=category, q=q, limit=limit, offset=offset)


@router.get(
    "/",
    response_model=NewsListResponse,
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def list_news_trailing_slash(
    category: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> NewsListResponse:
    """Handle trailing slash for GET /api/news/."""
    return list_news(category=category, q=q, limit=limit, offset=offset)


@router.get(
    "/analytics",
    response_model=NewsAnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve news analytics, key indicators, sector reactions, and sentiment",
)
def get_news_analytics() -> NewsAnalyticsResponse:
    """Retrieve multi-series economic indicators, sector movements, market pulse, and sentiment."""
    return NewsService.get_news_analytics()


@router.get(
    "/{article_id}",
    response_model=NewsArticleItem,
    status_code=status.HTTP_200_OK,
    summary="Get single news article by ID",
)
def get_news_article(article_id: str) -> NewsArticleItem:
    """Retrieve single verified article by its unique ID."""
    article = NewsService.get_article_by_id(article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"News article with ID '{article_id}' not found",
        )
    return article
