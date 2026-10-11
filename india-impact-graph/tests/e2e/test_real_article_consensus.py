import os
import csv
import pytest
from backend.app.api.consensus import ArticleClaim
from graph.consensus import NewsConsensusService

def test_real_article_consensus_rbi_event():
    # 1. Load the catalog
    catalog_path = os.path.join(os.path.dirname(__file__), '../../data/templates/cached-articles-catalog.csv')
    assert os.path.exists(catalog_path), "Cached articles catalog must exist."

    rbi_records = []
    article_ids = set()
    with open(catalog_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['event_name'] == 'rbi-dollar-window':
                # Detect duplicate article IDs
                assert row['article_id'] not in article_ids, f"Duplicate article ID found: {row['article_id']}"
                article_ids.add(row['article_id'])

                # Check required provenance fields
                assert row['publisher'], "Publisher must be present"
                assert row['source_url'], "Source URL must be present"
                assert row['publication_date'], "Publication date must be present"

                rbi_records.append(row)

    # 2. Assert exactly three records
    assert len(rbi_records) == 3, "There must be exactly three real accessible records for the RBI event."

    # 3. Construct schema-compatible claims
    claims = []
    for record in rbi_records:
        claims.append(
            ArticleClaim(
                article_id=record['article_id'],
                source_url=record['source_url'],
                publisher=record['publisher'],
                publication_date=record['publication_date'],
                extracted_event={
                    "event_id": "rbi-dollar-window",
                    "event_type": "policy_announcement",
                    "magnitude": {
                        "direction": "none",
                        "value": None
                    },
                    "evidence_snippets": [record['headline']],
                    "root_source": "RBI Press Release"
                }
            )
        )

    # 4. Evaluate consensus deterministically
    service = NewsConsensusService()
    result = service.compare_claims("rbi-dollar-window", claims)

    # 5. Assert consensus matches expectations for identical policy reporting
    assert result.status == "AGREEMENT", "The sources report the same policy action, should reach AGREEMENT."
    assert result.source_count == 3, "Should count 3 independent publishers."
    assert result.publisher_count == 3, "Should count 3 distinct publishers."
    assert result.root_source_count == 1, "Should identify exactly 1 root source (RBI Press Release)."
    assert result.source_lineage_status == "MULTI_PUBLISHER_SINGLE_ROOT", "Status should reflect multiple publishers reporting on a single root."
    assert "Agreement among published reports" in result.consensus_scope
    assert "Consensus describes source reporting" in result.limitations, "Source lineage limitations must be disclosed."
