"""Knowledge Graph generation service for the India Impact Graph MVP.

Implements deterministic graph construction tracing exogenous financial event shocks
through intermediate sectors and indicators down to household consumer budgets and asset markets,
conforming strictly to `docs/KNOWLEDGE_GRAPH_SPEC.md` and `schemas/graph-node-edge-schema.json`.
"""

from typing import Optional
from app.models.event import FinancialEventModel
from app.schemas.graph import (
    EdgeConfidence,
    EdgeDirection,
    EdgeKind,
    GraphEdge,
    GraphNode,
    ImpactKnowledgeGraph,
    NodeType,
    PropagationPath,
    ReceiptDefinition,
    VerificationStatus,
)


def _build_crude_oil_graph(event: FinancialEventModel) -> ImpactKnowledgeGraph:
    """Build the canonical three-path propagation graph for crude oil shocks.

    Path A (Food Cost Chain):
        Crude Oil -> Diesel -> Freight Logistics -> Food/Vegetables -> Household Budget
    Path B (Transport Cost Chain):
        Crude Oil -> Petrol -> Commuting Costs -> Household Budget
    Path C (Financial Market Chain):
        Crude Oil -> Inflation Expectations -> RBI Repo Rate -> Banking/Real Estate -> Nifty 50
    """
    # Nodes Definition
    nodes = [
        # Root commodity
        GraphNode(
            id="crude_oil",
            type=NodeType.COMMODITY,
            label="Crude Oil (Brent)",
            description="Exogenous energy benchmark and primary feedstock for Indian refining.",
            receipt=ReceiptDefinition(
                source_title="Petroleum Planning & Analysis Cell (PPAC) Price Reports",
                verification_status=VerificationStatus.VERIFIED,
                table_or_series_id="PPAC-CRUDE-BRENT",
                geography="Global / India",
                unit="USD/barrel",
            ),
        ),
        # Path A: Food Cost Chain Entities
        GraphNode(
            id="diesel",
            type=NodeType.COMMODITY,
            label="High-Speed Diesel (HSD)",
            description="Primary commercial transport fuel refined from imported crude oil.",
            receipt=ReceiptDefinition(
                source_title="PPAC (Petroleum Planning & Analysis Cell) Price Reports",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Retail Selling Price (RSP) of Diesel",
                geography="India",
                unit="INR/Litre",
            ),
        ),
        GraphNode(
            id="transport_freight",
            type=NodeType.SECTOR,
            label="Freight & Logistics Sector",
            description="Inter-state road freight transport connecting farmgate mandis and distribution centers.",
            receipt=ReceiptDefinition(
                source_title="Ministry of Road Transport and Highways (MoRTH) Fleet Survey",
                verification_status=VerificationStatus.INFERENCE,
                geography="All India",
            ),
        ),
        GraphNode(
            id="food_vegetables",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Vegetables & Perishables",
            description="Essential kitchen food basket (onions, potatoes, tomatoes) sensitive to logistics tariffs.",
            budget_share=None,
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Table 3 (MPCE by State/Sector) & Table 4",
                year_or_date="2023-24",
                geography="All India",
                unit="% share (pending fractile audit)",
            ),
        ),
        # Path B: Transport Cost Chain Entities
        GraphNode(
            id="petrol",
            type=NodeType.COMMODITY,
            label="Motor Spirit (Petrol)",
            description="Refined motor fuel driving private commuter mobility.",
            receipt=ReceiptDefinition(
                source_title="PPAC Price Build-up Reports",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Retail Selling Price (RSP) of Petrol",
                geography="India",
                unit="INR/Litre",
            ),
        ),
        GraphNode(
            id="commuting_cost",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Personal Commuting Cost",
            description="Monthly commuting fuel and local travel expense for working households.",
            budget_share=None,
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Table 3 (MPCE by State/Sector) & Table 4",
                year_or_date="2023-24",
                geography="All India",
                unit="% share (pending fractile audit)",
            ),
        ),
        # Target Household Budget
        GraphNode(
            id="household_budget",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Household Budget",
            description="Monthly consumption expenditure envelope across representative Indian demographic personas.",
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFIED,
                table_or_series_id="Table 3 (MPCE by State/Sector)",
                year_or_date="2023-24",
                geography="All India",
            ),
        ),
        # Path C: Financial Market Chain Entities
        GraphNode(
            id="inflation_expectations",
            type=NodeType.ECONOMIC_INDICATOR,
            label="Inflation Expectations (CPI)",
            description="Forward-looking consumer and financial market headline CPI inflation expectations.",
            receipt=ReceiptDefinition(
                source_title="Reserve Bank of India Monetary Policy Report",
                verification_status=VerificationStatus.INFERENCE,
                year_or_date="2024",
                geography="India",
            ),
        ),
        GraphNode(
            id="rbi_repo_rate",
            type=NodeType.ECONOMIC_INDICATOR,
            label="RBI Policy Repo Rate",
            description="Policy interest rate set by the RBI Monetary Policy Committee.",
            receipt=ReceiptDefinition(
                source_title="Reserve Bank of India MPC Framework",
                verification_status=VerificationStatus.INFERENCE,
                geography="India",
                unit="%",
            ),
        ),
        GraphNode(
            id="banking_real_estate",
            type=NodeType.SECTOR,
            label="Banking & Real Estate Sectors",
            description="Interest-rate-sensitive credit institutions, housing developers, and mortgage borrowers.",
            receipt=ReceiptDefinition(
                source_title="RBI Financial Stability Report",
                verification_status=VerificationStatus.INFERENCE,
                geography="India",
            ),
        ),
        GraphNode(
            id="nifty_50",
            type=NodeType.INSTRUMENT_ASSET,
            label="Nifty 50 Index",
            description="Benchmark National Stock Exchange large-cap equity market index.",
            receipt=ReceiptDefinition(
                source_title="National Stock Exchange (NSE) Index Factsheet",
                verification_status=VerificationStatus.INFERENCE,
                geography="India",
            ),
        ),
    ]

    # Edges Definition
    edges = [
        # --- PATH A: FOOD COST CHAIN ---
        GraphEdge(
            id="crude_to_diesel",
            from_node="crude_oil",
            to="diesel",
            relation_type="refines_into",
            kind=EdgeKind.OBSERVED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.HIGH,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Crude oil is the essential physical feedstock refined into high-speed diesel; "
                "refinery gate pricing directly transmits crude import parity costs."
            ),
            what_could_be_wrong=(
                "Central or state governments may reduce excise duties or VAT to cushion domestic pump prices."
            ),
            receipt=ReceiptDefinition(
                source_title="Petroleum Planning & Analysis Cell (PPAC) Price Build-up Reports",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Retail Selling Price Build-up of Diesel",
                year_or_date="2024",
                geography="India",
                unit="INR/Litre",
            ),
        ),
        GraphEdge(
            id="diesel_to_freight",
            from_node="diesel",
            to="transport_freight",
            relation_type="operational_cost_for",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.HIGH,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Diesel accounts for over 50% of operating expenses for commercial long-haul freight trucks in India."
            ),
            what_could_be_wrong=(
                "Transporters operating on fixed medium-term corporate contracts may absorb price increases "
                "before adjusting tariff rates."
            ),
            receipt=ReceiptDefinition(
                source_title="Ministry of Road Transport and Highways (MoRTH) Fleet Survey",
                verification_status=VerificationStatus.INFERENCE,
                year_or_date="2023",
                geography="All India",
            ),
        ),
        GraphEdge(
            id="freight_to_vegetables",
            from_node="transport_freight",
            to="food_vegetables",
            relation_type="mandi_transport_for",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.MEDIUM,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Perishable food and vegetables travel significant inter-state distances via diesel trucks, "
                "linking wholesale mandi logistics charges to transport operating costs."
            ),
            what_could_be_wrong=(
                "Local seasonal harvests and supply gluts can crash farmgate prices despite elevated freight rates; "
                "freight subsidies can also attenuate pass-through."
            ),
            receipt=ReceiptDefinition(
                source_title="Ministry of Agriculture & Farmers Welfare / Mandi Logistics Studies",
                verification_status=VerificationStatus.INFERENCE,
                geography="India",
            ),
        ),
        GraphEdge(
            id="vegetables_to_budget",
            from_node="food_vegetables",
            to="household_budget",
            relation_type="kitchen_basket_share",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.HIGH,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Vegetables and food form an inelastic, recurrent component of consumer expenditure, "
                "transmitting retail food inflation into overall monthly household budgets."
            ),
            what_could_be_wrong=(
                "Households may substitute towards cheaper seasonal alternatives or curtail discretionary non-food spending."
            ),
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFIED,
                table_or_series_id="Table 3 (MPCE by State/Sector)",
                year_or_date="2023-24",
                geography="All India",
                unit="% share",
            ),
        ),
        # --- PATH B: TRANSPORT COST CHAIN ---
        GraphEdge(
            id="crude_to_petrol",
            from_node="crude_oil",
            to="petrol",
            relation_type="refines_into",
            kind=EdgeKind.OBSERVED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.HIGH,
            propagation_path=PropagationPath.TRANSPORT_COST,
            evidence_text=(
                "Crude oil is the primary input refined into motor spirit (petrol); "
                "refinery transfer pricing reflects international import parity benchmark shifts."
            ),
            what_could_be_wrong=(
                "Oil Marketing Companies (OMCs) may temporarily freeze pump prices during global crude spikes, "
                "absorbing margin losses."
            ),
            receipt=ReceiptDefinition(
                source_title="Petroleum Planning & Analysis Cell (PPAC) Price Build-up Reports",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Retail Selling Price Build-up of Petrol",
                year_or_date="2024",
                geography="India",
                unit="INR/Litre",
            ),
        ),
        GraphEdge(
            id="petrol_to_commuting",
            from_node="petrol",
            to="commuting_cost",
            relation_type="fuel_input_for",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.HIGH,
            propagation_path=PropagationPath.TRANSPORT_COST,
            evidence_text=(
                "Retail pump prices for petrol directly determine fuel expenses for two-wheeler and four-wheeler personal transport."
            ),
            what_could_be_wrong=(
                "Commuters may shift towards public mass transit (metro, bus) or carpooling when pump prices escalate."
            ),
            receipt=ReceiptDefinition(
                source_title="PPAC / Ministry of Petroleum & Natural Gas",
                verification_status=VerificationStatus.INFERENCE,
                geography="All India",
            ),
        ),
        GraphEdge(
            id="commuting_to_budget",
            from_node="commuting_cost",
            to="household_budget",
            relation_type="mobility_basket_share",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.HIGH,
            propagation_path=PropagationPath.TRANSPORT_COST,
            evidence_text=(
                "Personal commuting fuel is a recurring non-discretionary monthly allocation for vehicle-owning households."
            ),
            what_could_be_wrong=(
                "Fuel price elasticity is higher for discretionary trips than daily workplace journeys."
            ),
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFIED,
                table_or_series_id="Table 3 (MPCE by State/Sector)",
                year_or_date="2023-24",
                geography="All India",
                unit="% share",
            ),
        ),
        # --- PATH C: FINANCIAL MARKET CHAIN ---
        GraphEdge(
            id="crude_to_inflation",
            from_node="crude_oil",
            to="inflation_expectations",
            relation_type="drives_expectations_of",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.MEDIUM,
            propagation_path=PropagationPath.FINANCIAL_MARKET,
            evidence_text=(
                "Because India imports over 85% of crude requirements, large crude price shocks widen the current account deficit "
                "and push up imported inflation and headline CPI expectations."
            ),
            what_could_be_wrong=(
                "Favorable rupee exchange rate movements or bumper domestic food harvests can offset fuel-driven inflation."
            ),
            receipt=ReceiptDefinition(
                source_title="Reserve Bank of India Monetary Policy Report",
                verification_status=VerificationStatus.INFERENCE,
                year_or_date="2024",
                geography="India",
            ),
        ),
        GraphEdge(
            id="inflation_to_repo_rate",
            from_node="inflation_expectations",
            to="rbi_repo_rate",
            relation_type="monetary_policy_response",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.MEDIUM,
            propagation_path=PropagationPath.FINANCIAL_MARKET,
            evidence_text=(
                "Persistent headline inflation pressures prompt the RBI Monetary Policy Committee (MPC) to adopt a hawkish rate stance "
                "or raise the policy repo rate."
            ),
            what_could_be_wrong=(
                "The MPC may look through transient imported supply shocks to prioritize domestic economic growth."
            ),
            receipt=ReceiptDefinition(
                source_title="Reserve Bank of India MPC Framework",
                verification_status=VerificationStatus.INFERENCE,
                geography="India",
            ),
        ),
        GraphEdge(
            id="repo_rate_to_banking_re",
            from_node="rbi_repo_rate",
            to="banking_real_estate",
            relation_type="credit_cost_impact",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.NEGATIVE,
            strength=None,
            confidence=EdgeConfidence.MEDIUM,
            propagation_path=PropagationPath.FINANCIAL_MARKET,
            evidence_text=(
                "Higher policy rates raise benchmark lending rates (EBLR/MCLR), increasing loan servicing costs and dampening credit demand "
                "in rate-sensitive sectors such as real estate."
            ),
            what_could_be_wrong=(
                "Resilient corporate balance sheets and strong demographic housing demand can sustain loan growth despite rate hikes."
            ),
            receipt=ReceiptDefinition(
                source_title="RBI Financial Stability Report",
                verification_status=VerificationStatus.INFERENCE,
                year_or_date="2024",
                geography="India",
            ),
        ),
        GraphEdge(
            id="banking_re_to_nifty",
            from_node="banking_real_estate",
            to="nifty_50",
            relation_type="equity_valuation_impact",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.NEGATIVE,
            strength=None,
            confidence=EdgeConfidence.LOW,
            propagation_path=PropagationPath.FINANCIAL_MARKET,
            evidence_text=(
                "Financial services and interest-rate-sensitive stocks hold significant aggregate weight in benchmark indices like the Nifty 50, "
                "driving valuation compressions during tightening cycles."
            ),
            what_could_be_wrong=(
                "These are macroeconomic correlations, not guaranteed causal outcomes; robust domestic institutional investor (DII) and SIP inflows "
                "can counteract foreign selling and support equity indices."
            ),
            receipt=ReceiptDefinition(
                source_title="National Stock Exchange (NSE) Index Factsheet",
                verification_status=VerificationStatus.INFERENCE,
                geography="India",
            ),
        ),
    ]

    return ImpactKnowledgeGraph(nodes=nodes, edges=edges)


def _build_edible_oil_graph(event: FinancialEventModel) -> ImpactKnowledgeGraph:
    """Build deterministic propagation graph for edible oil shocks.

    Where empirical data is not yet calibrated, intermediate edges are honestly
    marked as [UNVERIFIED] with low confidence, following KNOWLEDGE_GRAPH_SPEC Section 5.
    """
    nodes = [
        GraphNode(
            id="edible_oil",
            type=NodeType.COMMODITY,
            label="Edible Oil",
            description="Imported palm, soy, and sunflower oils providing cooking fats in domestic food baskets.",
            receipt=ReceiptDefinition(
                source_title="Ministry of Consumer Affairs Price Monitoring",
                verification_status=VerificationStatus.VERIFIED,
                geography="India",
            ),
        ),
        GraphNode(
            id="cooking_oil_costs",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Cooking Oil & Fats",
            description="Retail household expenditure on packaged edible oils and culinary fats.",
            budget_share=None,
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Table 3 (MPCE by State/Sector) & Table 4",
                year_or_date="2023-24",
                geography="All India",
                unit="% share (pending fractile audit)",
            ),
        ),
        GraphNode(
            id="household_budget",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Household Budget",
            description="Monthly consumption expenditure envelope across representative Indian demographic personas.",
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFIED,
                table_or_series_id="Table 3 (MPCE by State/Sector)",
                year_or_date="2023-24",
                geography="All India",
            ),
        ),
    ]

    edges = [
        GraphEdge(
            id="edible_oil_to_cooking",
            from_node="edible_oil",
            to="cooking_oil_costs",
            relation_type="direct_retail_input",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.LOW,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Imported vegetable oil prices transmit to packaged retail edible oils; "
                "however, import duty adjustments frequently buffer retail pass-through."
            ),
            what_could_be_wrong="Official empirical pass-through dataset is unverified.",
            receipt=ReceiptDefinition(
                source_title="Department of Consumer Affairs Retail Price Monitoring",
                verification_status=VerificationStatus.UNVERIFIED,
                geography="India",
            ),
        ),
        GraphEdge(
            id="cooking_to_budget",
            from_node="cooking_oil_costs",
            to="household_budget",
            relation_type="kitchen_basket_share",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.LOW,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Cooking oil is an essential non-discretionary cooking medium in Indian kitchens."
            ),
            what_could_be_wrong="Official pass-through dataset is unverified.",
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.UNVERIFIED,
                geography="All India",
            ),
        ),
    ]

    return ImpactKnowledgeGraph(nodes=nodes, edges=edges)


def _build_wheat_graph(event: FinancialEventModel) -> ImpactKnowledgeGraph:
    """Build deterministic propagation graph for wheat price shocks.

    Where empirical data is not yet calibrated, intermediate edges are honestly
    marked as [UNVERIFIED] with low confidence, following KNOWLEDGE_GRAPH_SPEC Section 5.
    """
    nodes = [
        GraphNode(
            id="wheat_grain",
            type=NodeType.COMMODITY,
            label="Wheat Grain",
            description="Domestic staple grain commodity and primary input for flour milling.",
            receipt=ReceiptDefinition(
                source_title="Food Corporation of India / Ministry of Agriculture",
                verification_status=VerificationStatus.VERIFY,
                geography="India",
            ),
        ),
        GraphNode(
            id="cereal_flour_costs",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Wheat Flour (Atta) & Cereals",
            description="Core staple grain and flour expenditure in household food consumption.",
            budget_share=None,
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.VERIFY,
                table_or_series_id="Table 3 (MPCE by State/Sector) & Table 4",
                year_or_date="2023-24",
                geography="All India",
                unit="% share (pending fractile audit)",
            ),
        ),
        GraphNode(
            id="household_budget",
            type=NodeType.HOUSEHOLD_ITEM,
            label="Household Budget",
            description="Monthly consumption expenditure envelope across representative Indian demographic personas.",
            receipt=ReceiptDefinition(
                source_title="MoSPI HCES 2023-24",
                verification_status=VerificationStatus.VERIFIED,
                year_or_date="2023-24",
                geography="All India",
            ),
        ),
    ]

    edges = [
        GraphEdge(
            id="wheat_to_flour",
            from_node="wheat_grain",
            to="cereal_flour_costs",
            relation_type="milling_cost_input",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.LOW,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Wholesale wheat grain prices transmit to retail packaged atta and flour products; "
                "Open Market Sale Scheme (OMSS) interventions frequently stabilize domestic milling costs."
            ),
            what_could_be_wrong="Official empirical pass-through dataset is unverified.",
            receipt=ReceiptDefinition(
                source_title="Food Corporation of India OMSS Price Series",
                verification_status=VerificationStatus.UNVERIFIED,
                geography="India",
            ),
        ),
        GraphEdge(
            id="flour_to_budget",
            from_node="cereal_flour_costs",
            to="household_budget",
            relation_type="kitchen_basket_share",
            kind=EdgeKind.INFERRED,
            direction=EdgeDirection.POSITIVE,
            strength=None,
            confidence=EdgeConfidence.LOW,
            propagation_path=PropagationPath.FOOD_COST,
            evidence_text=(
                "Staple cereals form a primary daily dietary requirement across rural and urban households."
            ),
            what_could_be_wrong="Official pass-through dataset is unverified.",
            receipt=ReceiptDefinition(
                source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
                verification_status=VerificationStatus.UNVERIFIED,
                geography="All India",
            ),
        ),
    ]

    return ImpactKnowledgeGraph(nodes=nodes, edges=edges)


def _build_generic_event_graph(event: FinancialEventModel) -> ImpactKnowledgeGraph:
    """Build a deterministic baseline graph for arbitrary financial events.

    Maps extracted entities into graph nodes, and constructs honest unverified edges
    towards the household budget or relevant sector.
    """
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []

    # Map existing entities to graph nodes
    type_mapping = {
        "commodity": NodeType.COMMODITY,
        "household_item": NodeType.HOUSEHOLD_ITEM,
        "economic_indicator": NodeType.ECONOMIC_INDICATOR,
        "sector": NodeType.SECTOR,
        "instrument_asset": NodeType.INSTRUMENT_ASSET,
        "institution": NodeType.SECTOR,
    }

    # Always ensure household budget node exists as anchor
    budget_node = GraphNode(
        id="household_budget",
        type=NodeType.HOUSEHOLD_ITEM,
        label="Household Budget",
        description="Monthly consumption expenditure envelope across representative Indian demographic personas.",
        receipt=ReceiptDefinition(
            source_title="MoSPI Household Consumption Expenditure Survey (HCES) 2023-24",
            verification_status=VerificationStatus.VERIFIED,
            year_or_date="2023-24",
            geography="All India",
        ),
    )
    nodes.append(budget_node)

    seen_node_ids = {"household_budget"}

    for ent in event.entities:
        if ent.entity_id in seen_node_ids:
            continue
        mapped_type = type_mapping.get(ent.entity_type, NodeType.COMMODITY)
        node = GraphNode(
            id=ent.entity_id,
            type=mapped_type,
            label=ent.name,
            description=f"Extracted entity from event: {ent.mention_text}",
            receipt=ReceiptDefinition(
                source_title="Event Extraction Context",
                verification_status=VerificationStatus.UNVERIFIED,
            ),
        )
        nodes.append(node)
        seen_node_ids.add(ent.entity_id)

        # Connect each entity honestly to household budget with unverified status
        edges.append(
            GraphEdge(
                id=f"{ent.entity_id}_to_budget",
                from_node=ent.entity_id,
                to="household_budget",
                relation_type="potential_impact_on",
                kind=EdgeKind.INFERRED,
                direction=EdgeDirection.UNSPECIFIED,
                strength=None,
                confidence=EdgeConfidence.LOW,
                propagation_path=PropagationPath.OTHER,
                evidence_text=f"Extracted from event headline: '{event.headline or event.event_id}'.",
                what_could_be_wrong="Official empirical pass-through dataset is unverified.",
                receipt=ReceiptDefinition(
                    source_title="Unverified Empirical Link",
                    verification_status=VerificationStatus.UNVERIFIED,
                ),
            )
        )

    return ImpactKnowledgeGraph(nodes=nodes, edges=edges)


def build_knowledge_graph(event: FinancialEventModel) -> ImpactKnowledgeGraph:
    """Build a deterministic Knowledge Graph for a persisted FinancialEventModel.

    Distinguishes observed and inferred relationships, strictly enforces
    receipt provenance metadata, and avoids inventing empirical pass-through coefficients.
    """
    event_id_lower = event.event_id.lower()
    headline_lower = (event.headline or "").lower()

    # Route to canonical scenarios based on verified event identification
    if "edible" in event_id_lower or "edible" in headline_lower:
        return _build_edible_oil_graph(event)

    if "wheat" in event_id_lower or "wheat" in headline_lower:
        return _build_wheat_graph(event)

    if "crude" in event_id_lower or "crude" in headline_lower or "brent" in headline_lower:
        return _build_crude_oil_graph(event)

    return _build_generic_event_graph(event)


PRESET_SCENARIOS: dict[str, dict] = {
    "crude-oil-shock-12pct": {
        "event_id": "crude-oil-shock-12pct",
        "event_type": "commodity_price_shock",
        "headline": "Brent crude surges 12% following Middle East supply disruption",
        "is_scenario": True,
        "event_date": "2026-03-15",
        "geography": "Global",
        "magnitude_direction": "increase",
        "magnitude_value": 12.0,
        "magnitude_unit": "percent",
        "entities": [
            {
                "entity_id": "crude_oil",
                "name": "Crude Oil (Brent)",
                "entity_type": "commodity",
                "mention_text": "Brent crude oil futures jumped 12%",
            }
        ],
        "evidence_snippets": [
            {
                "quote": "Brent crude futures jumped 12% on Monday morning.",
                "source_title": "Financial Express Energy Desk",
                "source_url": "https://example.com/energy-shock",
                "publication_date": "2026-03-15",
            }
        ],
    },
    "edible-oil-shock": {
        "event_id": "edible-oil-shock",
        "event_type": "commodity_price_shock",
        "headline": "Edible oil prices rise amid export duties",
        "is_scenario": True,
        "event_date": "2026-03-20",
        "geography": "India",
        "magnitude_direction": "increase",
        "magnitude_value": 8.5,
        "magnitude_unit": "percent",
        "entities": [
            {
                "entity_id": "edible_oil",
                "name": "Edible Oil",
                "entity_type": "commodity",
                "mention_text": "edible oil",
            }
        ],
        "evidence_snippets": [],
    },
    "wheat-price-shock": {
        "event_id": "wheat-price-shock",
        "event_type": "commodity_price_shock",
        "headline": "Wheat procurement prices increase on tight domestic supply",
        "is_scenario": True,
        "event_date": "2026-03-22",
        "geography": "India",
        "magnitude_direction": "increase",
        "magnitude_value": 6.0,
        "magnitude_unit": "percent",
        "entities": [
            {
                "entity_id": "wheat",
                "name": "Wheat Grain",
                "entity_type": "commodity",
                "mention_text": "wheat",
            }
        ],
        "evidence_snippets": [],
    },
}


def get_preset_scenario_event(event_id: str) -> Optional[FinancialEventModel]:
    """Retrieve an in-memory, read-only FinancialEventModel for recognized preset demo scenarios.

    Provides canonical preset scenario definitions for graph generation when absent from the database,
    avoiding database seeding or persistence side-effects.
    """
    preset_data = PRESET_SCENARIOS.get(event_id)
    if not preset_data:
        return None

    from app.models.event import EventEntityModel, EventEvidenceSnippetModel

    event = FinancialEventModel(
        event_id=preset_data["event_id"],
        event_type=preset_data["event_type"],
        headline=preset_data["headline"],
        is_scenario=preset_data["is_scenario"],
        event_date=preset_data.get("event_date"),
        geography=preset_data.get("geography"),
        magnitude_direction=preset_data.get("magnitude_direction"),
        magnitude_value=preset_data.get("magnitude_value"),
        magnitude_unit=preset_data.get("magnitude_unit"),
    )
    for ent in preset_data.get("entities", []):
        event.entities.append(
            EventEntityModel(
                entity_id=ent["entity_id"],
                name=ent["name"],
                entity_type=ent["entity_type"],
                mention_text=ent["mention_text"],
            )
        )
    for snip in preset_data.get("evidence_snippets", []):
        event.evidence_snippets.append(
            EventEvidenceSnippetModel(
                quote=snip["quote"],
                source_title=snip["source_title"],
                source_url=snip.get("source_url"),
                publication_date=snip.get("publication_date"),
            )
        )
    return event
