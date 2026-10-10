"""Unit tests for Impact Knowledge Graph API and deterministic service.

Tests run against an isolated in-memory SQLite database, guaranteeing zero
modifications to the developer's normal PostgreSQL database.
"""

from pathlib import Path
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend package directory is discoverable
backend_dir = Path(__file__).resolve().parent.parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database import Base, get_db
from app.main import app
from app.models.event import (
    EventEntityModel,
    EventEvidenceSnippetModel,
    FinancialEventModel,
)
from app.schemas.graph import (
    EdgeConfidence,
    EdgeDirection,
    EdgeKind,
    NodeType,
    PropagationPath,
    VerificationStatus,
)

# In-memory SQLite engine configured for concurrent session isolation
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Create fresh schema before each test and drop it afterwards."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provide an isolated database session bound to the test in-memory SQLite engine."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Provide a TestClient with overridden get_db dependency."""
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seed_crude_event(db_session: Session) -> FinancialEventModel:
    """Seed isolated in-memory crude oil shock event."""
    event = FinancialEventModel(
        event_id="crude-oil-shock-12pct",
        event_type="commodity_price_shock",
        headline="Brent crude surges 12% following Middle East supply disruption",
        is_scenario=True,
        event_date="2026-03-15",
        geography="Global",
        magnitude_direction="increase",
        magnitude_value=12.0,
        magnitude_unit="percent",
    )
    event.entities.append(
        EventEntityModel(
            entity_id="crude_oil",
            name="Crude Oil (Brent)",
            entity_type="commodity",
            mention_text="Brent crude oil futures jumped 12%",
        )
    )
    event.evidence_snippets.append(
        EventEvidenceSnippetModel(
            quote="Brent crude futures jumped 12% on Monday morning.",
            source_title="Financial Express Energy Desk",
            source_url="https://example.com/energy-shock",
            publication_date="2026-03-15",
        )
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)
    return event


@pytest.fixture
def seed_edible_oil_event(db_session: Session) -> FinancialEventModel:
    """Seed isolated in-memory edible oil shock event."""
    event = FinancialEventModel(
        event_id="edible-oil-shock",
        event_type="commodity_price_shock",
        headline="Edible oil prices rise amid export duties",
        is_scenario=True,
        event_date="2026-03-20",
        geography="India",
        magnitude_direction="increase",
        magnitude_value=8.5,
        magnitude_unit="percent",
    )
    db_session.add(event)
    db_session.commit()
    return event


@pytest.fixture
def seed_wheat_event(db_session: Session) -> FinancialEventModel:
    """Seed isolated in-memory wheat price shock event."""
    event = FinancialEventModel(
        event_id="wheat-price-shock",
        event_type="commodity_price_shock",
        headline="Wheat procurement prices increase on tight domestic supply",
        is_scenario=True,
        event_date="2026-03-22",
        geography="India",
        magnitude_direction="increase",
        magnitude_value=6.0,
        magnitude_unit="percent",
    )
    db_session.add(event)
    db_session.commit()
    return event


class TestGraphAPIEndpoints:
    """Test suite for GET /api/graph/{event_id} endpoint."""

    def test_missing_event_returns_404(self, client: TestClient):
        """Requesting a non-existent event must return HTTP 404 with descriptive detail."""
        response = client.get("/api/graph/non-existent-event-999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Financial event with ID 'non-existent-event-999' not found"

    def test_crude_oil_graph_structure_and_paths(self, client: TestClient, seed_crude_event: FinancialEventModel):
        """Crude oil event graph must contain Path A, Path B, and Path C conforming to schema."""
        response = client.get(f"/api/graph/{seed_crude_event.event_id}")
        assert response.status_code == 200
        payload = response.json()

        # Strict root structure check
        assert set(payload.keys()) == {"nodes", "edges"}
        nodes = payload["nodes"]
        edges = payload["edges"]

        assert len(nodes) > 0
        assert len(edges) > 0

        # Verify allowed node types
        allowed_node_types = {t.value for t in NodeType}
        for node in nodes:
            assert "id" in node
            assert "type" in node
            assert "label" in node
            assert node["type"] in allowed_node_types

        # Verify edge fields and 'from' alias
        allowed_edge_kinds = {k.value for k in EdgeKind}
        allowed_confidence = {c.value for c in EdgeConfidence}
        for edge in edges:
            assert "id" in edge
            assert "from" in edge
            assert "to" in edge
            assert "relation_type" in edge
            assert "kind" in edge
            assert edge["kind"] in allowed_edge_kinds
            assert "confidence" in edge
            assert edge["confidence"] in allowed_confidence
            assert "evidence_text" in edge
            assert "receipt" in edge
            # Strength must not be an invented pass-through factor
            assert edge.get("strength") is None

            # Verify receipt structure
            receipt = edge["receipt"]
            assert "source_title" in receipt
            assert "verification_status" in receipt
            assert receipt["verification_status"] in {s.value for s in VerificationStatus}

        # Check node IDs present for all 3 paths
        node_ids = {n["id"] for n in nodes}
        # Path A nodes
        assert {"crude_oil", "diesel", "transport_freight", "food_vegetables", "household_budget"}.issubset(node_ids)
        # Path B nodes
        assert {"petrol", "commuting_cost"}.issubset(node_ids)
        # Path C nodes
        assert {"inflation_expectations", "rbi_repo_rate", "banking_real_estate", "nifty_50"}.issubset(node_ids)

        # Check edge IDs present for all 3 paths
        edge_ids = {e["id"] for e in edges}
        # Path A edges
        assert {"crude_to_diesel", "diesel_to_freight", "freight_to_vegetables", "vegetables_to_budget"}.issubset(edge_ids)
        # Path B edges
        assert {"crude_to_petrol", "petrol_to_commuting", "commuting_to_budget"}.issubset(edge_ids)
        # Path C edges
        assert {"crude_to_inflation", "inflation_to_repo_rate", "repo_rate_to_banking_re", "banking_re_to_nifty"}.issubset(edge_ids)

    def test_observed_vs_inferred_distinction(self, client: TestClient, seed_crude_event: FinancialEventModel):
        """Observed edges (refining) must be distinguished from inferred edges (macro/transport)."""
        response = client.get(f"/api/graph/{seed_crude_event.event_id}")
        assert response.status_code == 200
        edges_by_id = {e["id"]: e for e in response.json()["edges"]}

        # Observed edges
        crude_to_diesel = edges_by_id["crude_to_diesel"]
        assert crude_to_diesel["kind"] == "observed"
        assert crude_to_diesel["receipt"]["verification_status"] == "[VERIFY]"

        crude_to_petrol = edges_by_id["crude_to_petrol"]
        assert crude_to_petrol["kind"] == "observed"
        assert crude_to_petrol["receipt"]["verification_status"] == "[VERIFY]"

        # Inferred edges
        diesel_to_freight = edges_by_id["diesel_to_freight"]
        assert diesel_to_freight["kind"] == "inferred"
        assert diesel_to_freight["receipt"]["verification_status"] == "[INFERENCE]"

        freight_to_veg = edges_by_id["freight_to_vegetables"]
        assert freight_to_veg["kind"] == "inferred"
        assert freight_to_veg["what_could_be_wrong"] is not None

        # Financial market inferred edge
        banking_to_nifty = edges_by_id["banking_re_to_nifty"]
        assert banking_to_nifty["kind"] == "inferred"
        assert banking_to_nifty["confidence"] == "low"
        assert banking_to_nifty["direction"] == "negative"

    def test_trailing_slash_route_parity(self, client: TestClient, seed_crude_event: FinancialEventModel):
        """GET /api/graph/{event_id}/ must return identical result to without trailing slash."""
        resp_no_slash = client.get(f"/api/graph/{seed_crude_event.event_id}")
        resp_slash = client.get(f"/api/graph/{seed_crude_event.event_id}/")

        assert resp_no_slash.status_code == 200
        assert resp_slash.status_code == 200
        assert resp_no_slash.json() == resp_slash.json()

    def test_edible_oil_shock_unverified_status(self, client: TestClient, seed_edible_oil_event: FinancialEventModel):
        """Edible oil shock must honestly report unverified transmission without empirical data."""
        response = client.get(f"/api/graph/{seed_edible_oil_event.event_id}")
        assert response.status_code == 200
        edges = response.json()["edges"]

        for edge in edges:
            assert edge["kind"] == "inferred"
            assert edge["confidence"] == "low"
            assert edge["receipt"]["verification_status"] == "[UNVERIFIED]"
            assert "unverified" in edge["what_could_be_wrong"].lower()

    def test_wheat_price_shock_unverified_status(self, client: TestClient, seed_wheat_event: FinancialEventModel):
        """Wheat price shock must mark unverified edges with [UNVERIFIED] receipt status."""
        response = client.get(f"/api/graph/{seed_wheat_event.event_id}")
        assert response.status_code == 200
        edges = response.json()["edges"]

        for edge in edges:
            assert edge["receipt"]["verification_status"] == "[UNVERIFIED]"
            assert edge["confidence"] == "low"

    def test_generic_event_graph_fallback(self, client: TestClient, db_session: Session):
        """Arbitrary event with extracted entities must generate valid fallback graph."""
        generic_event = FinancialEventModel(
            event_id="custom-policy-rate-hike",
            event_type="central_bank_policy_rate",
            headline="RBI increases repo rate by 25 bps",
            is_scenario=False,
            event_date="2026-04-01",
            geography="India",
        )
        generic_event.entities.append(
            EventEntityModel(
                entity_id="rbi_repo_rate",
                name="RBI Repo Rate",
                entity_type="economic_indicator",
                mention_text="repo rate by 25 bps",
            )
        )
        db_session.add(generic_event)
        db_session.commit()

        response = client.get(f"/api/graph/{generic_event.event_id}")
        assert response.status_code == 200
        payload = response.json()
        node_ids = {n["id"] for n in payload["nodes"]}
        assert "household_budget" in node_ids
        assert "rbi_repo_rate" in node_ids

        edge = payload["edges"][0]
        assert edge["from"] == "rbi_repo_rate"
        assert edge["to"] == "household_budget"
        assert edge["receipt"]["verification_status"] == "[UNVERIFIED]"

    def test_existing_event_api_regression(self, client: TestClient, seed_crude_event: FinancialEventModel):
        """Mounting graph router must not regress existing event endpoints."""
        list_resp = client.get("/api/events")
        assert list_resp.status_code == 200
        assert len(list_resp.json()) == 1

        get_resp = client.get(f"/api/events/{seed_crude_event.event_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["event_id"] == seed_crude_event.event_id

    def test_strict_schema_conformance_all_scenarios(
        self,
        client: TestClient,
        seed_crude_event: FinancialEventModel,
        seed_edible_oil_event: FinancialEventModel,
        seed_wheat_event: FinancialEventModel,
    ):
        """All scenarios must strictly conform to schemas/graph-node-edge-schema.json constraints."""
        allowed_node_keys = {"id", "type", "label", "description", "budget_share", "receipt"}
        allowed_edge_keys = {
            "id",
            "from",
            "to",
            "relation_type",
            "kind",
            "confidence",
            "evidence_text",
            "receipt",
            "direction",
            "strength",
            "propagation_path",
            "what_could_be_wrong",
        }
        allowed_receipt_keys = {
            "source_title",
            "verification_status",
            "source_url",
            "table_or_series_id",
            "year_or_date",
            "geography",
            "unit",
            "formula_details",
        }
        allowed_node_types = {"commodity", "household_item", "economic_indicator", "sector", "instrument_asset", "persona"}
        allowed_edge_kinds = {"observed", "inferred"}
        allowed_confidences = {"high", "medium", "low"}
        allowed_statuses = {"[VERIFIED]", "[VERIFY]", "[INFERENCE]", "[UNVERIFIED]"}

        for event_id in [seed_crude_event.event_id, seed_edible_oil_event.event_id, seed_wheat_event.event_id]:
            resp = client.get(f"/api/graph/{event_id}")
            assert resp.status_code == 200
            data = resp.json()

            # Root constraints
            assert set(data.keys()) == {"nodes", "edges"}

            # Node constraints
            for node in data["nodes"]:
                assert set(node.keys()).issubset(allowed_node_keys)
                assert {"id", "type", "label"}.issubset(set(node.keys()))
                assert node["type"] in allowed_node_types
                if node.get("receipt"):
                    assert set(node["receipt"].keys()).issubset(allowed_receipt_keys)
                    assert {"source_title", "verification_status"}.issubset(set(node["receipt"].keys()))
                    assert node["receipt"]["verification_status"] in allowed_statuses

            # Edge constraints
            for edge in data["edges"]:
                assert set(edge.keys()).issubset(allowed_edge_keys)
                assert "from_node" not in edge, "'from_node' should be serialized as 'from'"
                assert {"id", "from", "to", "relation_type", "kind", "confidence", "evidence_text", "receipt"}.issubset(set(edge.keys()))
                assert edge["kind"] in allowed_edge_kinds
                assert edge["confidence"] in allowed_confidences
                assert edge.get("strength") is None  # Never invent numerical factor

                # Receipt constraints
                receipt = edge["receipt"]
                assert set(receipt.keys()).issubset(allowed_receipt_keys)
                assert {"source_title", "verification_status"}.issubset(set(receipt.keys()))
                assert receipt["verification_status"] in allowed_statuses
