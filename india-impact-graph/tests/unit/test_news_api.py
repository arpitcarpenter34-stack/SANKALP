"""Unit tests for News & Insights API endpoints.

Validates /api/news, /api/news/analytics, category filtering, search,
and source attribution integrity.
"""

from pathlib import Path
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app
from app.services.news_service import CURATED_NEWS_ARTICLES

client = TestClient(app)


def test_list_news_articles_success():
    """Verify listing all news articles returns 200 with valid structure."""
    response = client.get("/api/news")
    assert response.status_code == 200
    data = response.json()

    assert "articles" in data
    assert "total_count" in data
    assert "categories" in data
    assert "freshness_timestamp" in data
    assert "provenance_note" in data
    assert data["total_count"] == len(CURATED_NEWS_ARTICLES)
    assert len(data["articles"]) > 0

    # Ensure source attribution fields exist on each article
    for article in data["articles"]:
        assert article["article_id"]
        assert article["headline"]
        assert article["publisher"]
        assert article["source_url"].startswith(("https://", "http://"))
        assert article["publication_date"]


def test_list_news_articles_category_filter():
    """Verify category filtering isolates relevant articles."""
    response = client.get("/api/news?category=commodities")
    assert response.status_code == 200
    data = response.json()

    assert len(data["articles"]) > 0
    for article in data["articles"]:
        assert article["category"] == "commodities"


def test_list_news_articles_search_query():
    """Verify search query filters across headlines and summaries."""
    response = client.get("/api/news?q=crude")
    assert response.status_code == 200
    data = response.json()

    assert len(data["articles"]) > 0
    for article in data["articles"]:
        text = (article["headline"] + " " + article["summary"] + " " + article["publisher"]).lower()
        tags_text = " ".join(t["label"].lower() for t in article.get("economic_tags", []))
        assert "crude" in text or "crude" in tags_text


def test_get_single_news_article_success():
    """Verify retrieving single article by ID returns accurate metadata."""
    target_id = "art-brent-mideast-01"
    response = client.get(f"/api/news/{target_id}")
    assert response.status_code == 200
    article = response.json()

    assert article["article_id"] == target_id
    assert article["publisher"] == "Reuters"
    assert "Brent crude" in article["headline"]
    assert article["source_url"] == "https://www.reuters.com/business/energy/brent-crude-oil-escalates-supply-disruptions-2024-10-12/"


def test_get_single_news_article_not_found():
    """Verify 404 response for nonexistent article ID."""
    response = client.get("/api/news/non-existent-art-999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_news_analytics_success():
    """Verify analytics endpoint returns indicators, sector reactions, market snapshot, and sentiment."""
    response = client.get("/api/news/analytics")
    assert response.status_code == 200
    data = response.json()

    assert "key_indicators" in data
    assert "commodity_prices" in data["key_indicators"]
    assert "currency_markets" in data["key_indicators"]
    assert "sector_indices" in data["key_indicators"]

    assert "sector_reactions" in data
    assert len(data["sector_reactions"]) >= 5

    assert "market_snapshot" in data
    assert len(data["market_snapshot"]) == 4

    assert "sentiment" in data
    assert data["sentiment"]["total_analyzed"] == 128
    assert data["sentiment"]["positive_pct"] == 32.8
    assert data["sentiment"]["neutral_pct"] == 43.8
    assert data["sentiment"]["negative_pct"] == 23.4

    assert "trending_topics" in data
    assert len(data["trending_topics"]) == 5
    assert data["trending_topics"][0]["name"] == "Middle East Tensions"
