"""Unit tests for Registries API endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_list_data_sources():
    """Verify data sources registry endpoint returns verified sources."""
    response = client.get("/api/sources")
    assert response.status_code == 200
    sources = response.json()
    assert isinstance(sources, list)
    assert len(sources) > 0
    assert any("PPAC" in s["publisher"] or "PPAC" in s["source_id"] for s in sources)
    assert any("MOSPI" in s["publisher"].upper() or "MOSPI" in s["source_id"] for s in sources)


def test_list_pass_through_records():
    """Verify pass-through registry endpoint returns verified elasticities."""
    response = client.get("/api/pass-through")
    assert response.status_code == 200
    records = response.json()
    assert isinstance(records, list)
    assert len(records) >= 3

    items = {r["downstream_item"]: r for r in records}
    assert "petrol" in items
    assert items["petrol"]["pass_through_factor_low"] == 0.30
    assert items["petrol"]["pass_through_factor_high"] == 0.45
    assert items["petrol"]["verification_status"] == "[VERIFIED]"


def test_list_consumption_items():
    """Verify consumption items registry endpoint returns curated candidate items."""
    response = client.get("/api/consumption-items")
    assert response.status_code == 200
    items = response.json()
    assert isinstance(items, list)
    assert len(items) >= 10

    item_ids = {i["item_id"] for i in items}
    assert {"petrol", "diesel", "lpg", "vegetables", "gold"}.issubset(item_ids)

    # Gold should have is_capital_asset == True
    gold_item = next(i for i in items if i["item_id"] == "gold")
    assert gold_item["is_capital_asset"] is True


def test_list_cached_articles():
    """Verify cached articles catalog returns traceable news records."""
    response = client.get("/api/cached-articles")
    assert response.status_code == 200
    articles = response.json()
    assert isinstance(articles, list)
    assert len(articles) >= 3

    article_ids = {a["article_id"] for a in articles}
    assert {"ie-rbi-01", "fe-rbi-02", "mc-rbi-03"}.issubset(article_ids)
