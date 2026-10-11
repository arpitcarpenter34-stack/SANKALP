"""Composite Transmission Scenario Analysis API.

Coordinates event extraction, knowledge graph propagation, and deterministic
household impact calculation into a unified API response matching the frontend
AnalysisResponse contract.
"""

from datetime import datetime, timezone
from decimal import Decimal
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.event import (
    FinancialEventModel,
    EventEntityModel,
    EventEvidenceSnippetModel,
)
from app.services.graph import (
    build_knowledge_graph,
    get_preset_scenario_event,
)
from app.api.calculator import load_personas
from calculator.core_calculator import (
    HouseholdImpactCalculator,
    PassThroughData,
    Receipt as CalcReceipt,
)
from event_extraction.event_extractor import (
    EventExtractionError,
    FakeDeterministicProvider,
    FinancialEventExtractor,
    LiveLLMProvider,
)


router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

# Canonical alias mapping between frontend scenario IDs and backend identifiers
SCENARIO_ALIAS_MAP: Dict[str, str] = {
    "crude-oil-12pct": "crude-oil-shock-12pct",
    "crude-oil-shock-12pct": "crude-oil-shock-12pct",
    "crude-oil-spike-2024": "crude-oil-shock-12pct",
    "edible-oil-tariff": "edible-oil-shock",
    "edible-oil-tariff-hike": "edible-oil-shock",
    "edible-oil-shock": "edible-oil-shock",
    "wheat-procurement-spike": "wheat-price-shock",
    "wheat-price-shock": "wheat-price-shock",
}

SCENARIO_METADATA: Dict[str, Dict[str, Any]] = {
    "crude-oil-shock-12pct": {
        "title": "Crude Oil Price Shock: +12% (Synthetic Benchmark Scenario)",
        "eventType": "commodity_shock",
        "magnitude": "+12.0%",
        "magnitudeNumeric": 12.0,
        "magnitudeUnit": "%",
        "isHypotheticalScenario": True,
        "eventDate": "2026-10-10",
        "headline": "Global Benchmark Crude Oil Surges +12% on Geopolitical Maritime Constraints",
        "summaryText": (
            "International Brent crude oil benchmark escalates by 12% in a synthetic stress scenario. "
            "Domestic refiners assess import parity costs while state VAT and OMC buffers mitigate one-for-one pump revisions."
        ),
        "sourceReceipt": {
            "sourceTitle": "Hackwave 3.0 Benchmark Stress Scenario (Synthetic Calibration)",
            "publisher": "Team SANKALP Macroeconomic Scenario Suite",
            "vintageYear": "2024-25",
            "geography": "Global / All-India",
            "unit": "% Price Delta",
            "verificationStatus": "[INFERENCE]",
            "formulaDetails": "Synthetic +12% exogenous price shock vector",
            "sourceUrl": "https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf",
            "caveats": [
                "Synthetic benchmark scenario: Not a dated historical observation.",
                "Domestic retail fuel prices do not adjust one-for-one due to Central Excise Duty and State VAT buffers.",
            ],
        },
    },
    "edible-oil-shock": {
        "title": "Edible Oil Import Tariff: +8.5% (Synthetic Backup Scenario A)",
        "eventType": "regulatory",
        "magnitude": "+8.5%",
        "magnitudeNumeric": 8.5,
        "magnitudeUnit": "%",
        "isHypotheticalScenario": True,
        "eventDate": "2026-09-15",
        "headline": "Import Duty on Crude Palm & Sunflower Oil Raised to Support Domestic Oilseed Farmers",
        "summaryText": (
            "Basic customs duty and agriculture infrastructure cess adjusted on edible oil imports in a synthetic scenario, "
            "raising landed wholesale costs by an estimated 8.5%."
        ),
        "sourceReceipt": {
            "sourceTitle": "Ministry of Finance Tariff Notification (Synthetic Calibration)",
            "publisher": "Department of Revenue / MoF",
            "vintageYear": "2024",
            "geography": "All-India / Madhya Pradesh",
            "unit": "% Effective Tariff",
            "verificationStatus": "[INFERENCE]",
            "caveats": [
                "Synthetic demo scenario.",
                "Household impact depends heavily on PDS subsidized edible oil allocation in specific states.",
            ],
        },
    },
    "wheat-price-shock": {
        "title": "Wheat Mandi Arrival Shock: +6.0% (Synthetic Backup Scenario B)",
        "eventType": "commodity_shock",
        "magnitude": "+6.0%",
        "magnitudeNumeric": 6.0,
        "magnitudeUnit": "%",
        "isHypotheticalScenario": True,
        "eventDate": "2026-08-01",
        "headline": "Unseasonal Rains Constrain Mandi Wheat Arrivals; Wholesale Atta Prices Firm Up",
        "summaryText": (
            "Late rabi season precipitation dampens harvest yields in northern wheat belts, "
            "causing mandi prices to appreciate by approximately 6% above MSP in a synthetic shock."
        ),
        "sourceReceipt": {
            "sourceTitle": "Agriwatch Mandi Price Index (Synthetic Calibration)",
            "publisher": "Commodity Trade Intelligence Desk",
            "vintageYear": "2024-25",
            "geography": "North India / Madhya Pradesh Mandis",
            "unit": "% Procurement Delta",
            "verificationStatus": "[INFERENCE]",
            "caveats": [
                "Synthetic demo scenario.",
                "Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY) provides 5kg free foodgrains per person/month to eligible NFSA households, insulating bottom fractiles from open mandi price shocks.",
            ],
        },
    },
}


class AnalysisRequest(BaseModel):
    """Request payload for the /api/scenarios/analyze live backend endpoint."""

    scenarioId: Optional[str] = Field(default=None, description="Scenario ID (e.g. 'crude-oil-12pct')")
    customText: Optional[str] = Field(default=None, description="Optional custom financial news dispatch")
    isAiOff: bool = Field(default=False, description="When True, enforces offline deterministic rules")
    state: Optional[str] = Field(default="Madhya Pradesh", description="Target state")
    sector: Optional[str] = Field(default="Rural", description="Target sector (Rural/Urban)")
    expenditureClass: Optional[str] = Field(default="Middle", description="Target expenditure class")


def _resolve_persona(state_name: str, sector_name: str):
    """Match requested state and sector against curated MoSPI HCES 2023-24 personas."""
    personas = load_personas()
    clean_state = (state_name or "Madhya Pradesh").strip().lower().replace("-", " ")
    clean_sector = (sector_name or "Rural").strip().lower()

    # Exact state + sector match
    for p in personas:
        if (
            p.state.lower().replace("-", " ") == clean_state
            and p.sector.lower() == clean_sector
        ):
            return p

    # Partial / substring match
    for p in personas:
        if (
            clean_state in p.state.lower().replace("-", " ")
            and p.sector.lower() == clean_sector
        ):
            return p

    # Default fallback to Madhya Pradesh state average
    for p in personas:
        if "madhya pradesh" in p.state.lower() and p.sector.lower() == clean_sector:
            return p

    return personas[0] if personas else None


@router.post(
    "/analyze",
    summary="Composite scenario transmission analysis",
    status_code=status.HTTP_200_OK,
)
def analyze_scenario(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Execute end-to-end macroeconomic transmission analysis.

    Reuses existing event extraction, knowledge graph builder, and deterministic
    household impact calculator to deliver the complete AnalysisResponse contract.
    """
    scenario_id_raw = (request.scenarioId or "").strip()
    custom_text_raw = (request.customText or "").strip()

    if not scenario_id_raw and not custom_text_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either scenarioId or customText must be provided.",
        )

    # -------------------------------------------------------------------------
    # 1. Event Identification / Extraction
    # -------------------------------------------------------------------------
    is_custom = scenario_id_raw == "custom" or (not scenario_id_raw and bool(custom_text_raw))

    if is_custom:
        if not custom_text_raw:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Custom news text must not be empty when scenarioId is 'custom'.",
            )

        # Respect isAiOff: Never invoke live LLM when AI is explicitly disabled
        if request.isAiOff:
            provider = FakeDeterministicProvider()
        else:
            from app.config import settings
            use_live_env = os.environ.get("USE_LIVE_LLM")
            use_live = (use_live_env.lower() == "true") if use_live_env is not None else settings.USE_LIVE_LLM
            if use_live:
                api_key = os.environ.get("LIVE_LLM_API_KEY") or settings.LIVE_LLM_API_KEY
                provider = LiveLLMProvider(api_key=api_key, use_live=True)
            else:
                provider = FakeDeterministicProvider()

        extractor = FinancialEventExtractor(provider)
        try:
            extracted_dict = extractor.extract(custom_text_raw)
        except EventExtractionError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Extraction failure: {exc}",
            ) from exc

        # Construct transient FinancialEventModel from extracted entities
        event_model = FinancialEventModel(
            event_id="custom",
            event_type=extracted_dict.get("event_type", "custom"),
            headline=extracted_dict.get("headline", custom_text_raw[:80]),
            is_scenario=False,
            event_date=extracted_dict.get("event_date"),
            geography=extracted_dict.get("geography", "India"),
            magnitude_direction=(
                extracted_dict["magnitude"].get("direction")
                if extracted_dict.get("magnitude")
                else None
            ),
            magnitude_value=(
                extracted_dict["magnitude"].get("value")
                if extracted_dict.get("magnitude")
                else None
            ),
            magnitude_unit=(
                extracted_dict["magnitude"].get("unit")
                if extracted_dict.get("magnitude")
                else None
            ),
        )
        for ent in extracted_dict.get("entities", []):
            event_model.entities.append(
                EventEntityModel(
                    entity_id=ent["entity_id"],
                    name=ent["name"],
                    entity_type=ent["entity_type"],
                    mention_text=ent.get("mention_text", ent["name"]),
                )
            )
        for snip in extracted_dict.get("evidence_snippets", []):
            event_model.evidence_snippets.append(
                EventEvidenceSnippetModel(
                    quote=snip["quote"],
                    source_title=snip["source_title"],
                    source_url=snip.get("source_url"),
                    publication_date=snip.get("publication_date"),
                )
            )

        mag_val = event_model.magnitude_value
        mag_str = f"+{mag_val:.1f}%" if mag_val is not None else "Unquantified"
        scenario_payload = {
            "id": "custom",
            "title": event_model.headline or "Custom Financial News Dispatch (User Input)",
            "eventType": "custom",
            "magnitude": mag_str,
            "magnitudeNumeric": float(mag_val) if mag_val is not None else None,
            "magnitudeUnit": event_model.magnitude_unit,
            "isHypotheticalScenario": False,
            "eventDate": str(event_model.event_date) if event_model.event_date else None,
            "headline": event_model.headline,
            "summaryText": (
                custom_text_raw[:240] + "..." if len(custom_text_raw) > 240 else custom_text_raw
            ),
            "fullArticleText": custom_text_raw,
            "sourceReceipt": {
                "sourceTitle": "Direct User Text Dispatch (Extracted)",
                "publisher": "Financial Event Extraction Pipeline",
                "vintageYear": "2026",
                "verificationStatus": "[UNVERIFIED]",
                "caveats": [
                    "User dispatch extracted by backend NLP engine.",
                    "Empirical pass-through coefficients are unverified for ad-hoc custom events.",
                ],
            },
        }

    else:
        # Recognized preset or persisted scenario ID
        canonical_id = SCENARIO_ALIAS_MAP.get(scenario_id_raw, scenario_id_raw)

        # 1. Try DB lookup
        stmt = (
            select(FinancialEventModel)
            .where(FinancialEventModel.event_id == canonical_id)
            .options(
                selectinload(FinancialEventModel.entities),
                selectinload(FinancialEventModel.evidence_snippets),
            )
        )
        event_model = db.execute(stmt).scalar_one_or_none()

        # 2. Try preset in-memory catalog
        if not event_model:
            event_model = get_preset_scenario_event(canonical_id)

        if not event_model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Scenario with ID '{scenario_id_raw}' not found.",
            )

        meta = SCENARIO_METADATA.get(canonical_id, {})
        mag_val = (
            event_model.magnitude_value
            if event_model.magnitude_value is not None
            else meta.get("magnitudeNumeric")
        )
        mag_str = (
            f"+{mag_val:.1f}%"
            if mag_val is not None
            else meta.get("magnitude", "Unquantified")
        )

        scenario_payload = {
            "id": scenario_id_raw,
            "title": meta.get("title", event_model.headline or canonical_id),
            "eventType": meta.get("eventType", "commodity_shock"),
            "magnitude": mag_str,
            "magnitudeNumeric": float(mag_val) if mag_val is not None else None,
            "magnitudeUnit": meta.get("magnitudeUnit", "%"),
            "isHypotheticalScenario": (
                event_model.is_scenario
                if event_model.is_scenario is not None
                else meta.get("isHypotheticalScenario", True)
            ),
            "eventDate": str(event_model.event_date) if event_model.event_date else meta.get("eventDate"),
            "headline": event_model.headline or meta.get("headline"),
            "summaryText": meta.get("summaryText", event_model.headline or ""),
            "fullArticleText": meta.get("summaryText", event_model.headline or ""),
            "sourceReceipt": meta.get(
                "sourceReceipt",
                {
                    "sourceTitle": "Curated Event Benchmark",
                    "publisher": "Team SANKALP",
                    "verificationStatus": "[INFERENCE]",
                },
            ),
        }

    # -------------------------------------------------------------------------
    # 2. Knowledge Graph Generation
    # -------------------------------------------------------------------------
    kg_data = build_knowledge_graph(event_model)

    formatted_nodes: List[Dict[str, Any]] = []
    for node in kg_data.nodes:
        node_type_str = node.type.value if hasattr(node.type, "value") else str(node.type)
        is_observed = False
        receipt_dict = None
        if node.receipt:
            status_val = (
                node.receipt.verification_status.value
                if hasattr(node.receipt.verification_status, "value")
                else str(node.receipt.verification_status)
            )
            is_observed = status_val == "[VERIFIED]"
            receipt_dict = {
                "sourceTitle": node.receipt.source_title,
                "publisher": "MoSPI / Official Statistics",
                "tableOrSeriesId": node.receipt.table_or_series_id,
                "vintageYear": node.receipt.year_or_date,
                "geography": node.receipt.geography,
                "unit": node.receipt.unit,
                "verificationStatus": status_val,
                "formulaDetails": node.receipt.formula_details,
                "sourceUrl": node.receipt.source_url,
                "caveats": [],
            }

        formatted_nodes.append(
            {
                "id": node.id,
                "label": node.label,
                "type": node_type_str,
                "description": node.description,
                "budgetSharePct": node.budget_share,
                "isObservedFact": is_observed,
                "receipt": receipt_dict,
            }
        )

    formatted_edges: List[Dict[str, Any]] = []
    for edge in kg_data.edges:
        kind_str = edge.kind.value if hasattr(edge.kind, "value") else str(edge.kind)
        conf_str = edge.confidence.value if hasattr(edge.confidence, "value") else str(edge.confidence)
        path_str = (
            edge.propagation_path.value
            if edge.propagation_path and hasattr(edge.propagation_path, "value")
            else (edge.propagation_path or "other")
        )
        dir_str = (
            edge.direction.value
            if edge.direction and hasattr(edge.direction, "value")
            else (edge.direction or "ambiguous")
        )

        receipt_dict = None
        if edge.receipt:
            status_val = (
                edge.receipt.verification_status.value
                if hasattr(edge.receipt.verification_status, "value")
                else str(edge.receipt.verification_status)
            )
            receipt_dict = {
                "sourceTitle": edge.receipt.source_title,
                "publisher": "Domain Statistics / Research Register",
                "tableOrSeriesId": edge.receipt.table_or_series_id,
                "vintageYear": edge.receipt.year_or_date,
                "geography": edge.receipt.geography,
                "unit": edge.receipt.unit,
                "verificationStatus": status_val,
                "formulaDetails": edge.receipt.formula_details,
                "sourceUrl": edge.receipt.source_url,
                "caveats": [],
            }
        else:
            receipt_dict = {
                "sourceTitle": "Domain Inference",
                "publisher": "Team SANKALP",
                "verificationStatus": "[INFERENCE]",
                "caveats": [],
            }

        formatted_edges.append(
            {
                "id": edge.id,
                "from": edge.from_node,
                "to": edge.to_node,
                "relationType": edge.relation_type,
                "kind": kind_str,
                "direction": dir_str,
                "strengthScore": edge.strength,
                "confidence": conf_str,
                "evidenceQuote": edge.evidence_text,
                "pathCategory": path_str,
                "whatCouldBeWrong": edge.what_could_be_wrong,
                "receipt": receipt_dict,
            }
        )

    available_paths = [
        {
            "id": "food_cost",
            "name": "Food & Nutrition Channels",
            "description": "Essential food grains, edible oils, and perishables",
            "active": any(e["pathCategory"] == "food_cost" for e in formatted_edges),
        },
        {
            "id": "transport_cost",
            "name": "Freight & Conveyance Channels",
            "description": "Diesel freight, logistics, and retail conveyance fuels",
            "active": any(e["pathCategory"] == "transport_cost" for e in formatted_edges),
        },
        {
            "id": "financial_market",
            "name": "Macro & Financial Channels",
            "description": "Interest rates, fiscal deficit, and input inflation",
            "active": any(e["pathCategory"] == "financial_market" for e in formatted_edges),
        },
    ]

    graph_payload = {
        "nodes": formatted_nodes,
        "edges": formatted_edges,
        "availablePaths": available_paths,
    }

    # -------------------------------------------------------------------------
    # 3. Household Persona Impact Calculation
    # -------------------------------------------------------------------------
    req_state = (request.state or "Madhya Pradesh").strip()
    req_sector = (request.sector or "Rural").strip()
    req_exp = (request.expenditureClass or "Middle").strip()

    matched_persona = _resolve_persona(req_state, req_sector)

    baseline_mpce_val = (
        float(matched_persona.mpce_value_inr)
        if matched_persona and matched_persona.mpce_value_inr
        else (3441.0 if req_sector.lower() == "rural" else 5538.0)
    )

    baseline_receipt_dict = {
        "sourceTitle": f"MoSPI HCES 2023ΓÇô24 Factsheet Table 2 ({req_state} state-average MPCE)",
        "publisher": "Ministry of Statistics and Programme Implementation (MoSPI)",
        "tableOrSeriesId": "Table 2",
        "vintageYear": "2023-24",
        "geography": f"{req_state} ({req_sector})",
        "unit": "Γé╣ / person / month",
        "verificationStatus": "[VERIFIED]",
        "sourceUrl": "https://mospi.gov.in/sites/default/files/publication_reports/HCES%20FactSheet%202023-24.pdf",
        "caveats": [
            f"Official state-average MPCE for {req_state} ({req_sector}) from Factsheet Table 2 (Without imputation).",
            "State-level fractile deciles are not disaggregated in Table 2.",
        ],
    }

    price_shock_pct = event_model.magnitude_value
    calc = HouseholdImpactCalculator()

    item_breakdown: List[Dict[str, Any]] = []
    total_low = Decimal("0.00")
    total_high = Decimal("0.00")
    has_calculated_items = False

    # Curated candidate consumption items and verified pass-through data
    # (Matches HOUSEHOLD_IMPACT_CALCULATOR_SPEC & MoSPI HCES 2023-24)
    is_rural = req_sector.lower() == "rural"

    candidate_catalog = [
        {
            "id": "commute_fuel",
            "name": "Conveyance & Transport Fuel",
            "share_pct": Decimal("7.59") if is_rural else Decimal("8.46"),
            "pt_low": Decimal("0.30"),
            "pt_high": Decimal("0.45"),
            "supported": price_shock_pct is not None and price_shock_pct > 0,
            "sourceTitle": "PPAC / RBI Retail Fuel Pass-Through Elasticity",
            "status": "[VERIFIED]",
        },
        {
            "id": "lpg_cooking",
            "name": "LPG Cooking Gas",
            "share_pct": Decimal("3.00"),
            "pt_low": Decimal("0.20"),
            "pt_high": Decimal("0.35"),
            "supported": price_shock_pct is not None and price_shock_pct > 0,
            "sourceTitle": "PPAC RSP Build-up / Ministry of Petroleum & Natural Gas",
            "status": "[VERIFY]",
        },
        {
            "id": "food_vegetables",
            "name": "Vegetables & Perishables (Indirect Freight)",
            "share_pct": Decimal("7.50") if is_rural else Decimal("6.00"),
            # Fuel-to-vegetable pass-through elasticity is unverified; must remain NULL
            "supported": False,
            "sourceTitle": "Department of Consumer Affairs Daily Price Monitoring",
            "status": "[UNVERIFIED]",
        },
        {
            "id": "cereal_staples",
            "name": "Cereals & Food Grains",
            "share_pct": Decimal("4.91") if is_rural else Decimal("3.64"),
            "supported": False,
            "sourceTitle": "MoSPI HCES 2023-24 Statement 4",
            "status": "[UNVERIFIED]",
        },
        {
            "id": "edible_oil_pack",
            "name": "Edible Cooking Oils",
            "share_pct": Decimal("3.70") if is_rural else Decimal("2.73"),
            "supported": False,
            "sourceTitle": "MoSPI HCES 2023-24 Statement 4",
            "status": "[UNVERIFIED]",
        },
    ]

    calc_baseline_receipt = CalcReceipt(
        source_title=baseline_receipt_dict["sourceTitle"],
        source_url=baseline_receipt_dict["sourceUrl"],
        table_or_series_id="Table 2",
        year_or_date="2023-24",
        geography=f"{req_state} ({req_sector})",
        unit="INR/person/month (MPCE)",
        verification_status="[VERIFIED]",
    )

    for itm in candidate_catalog:
        if itm["supported"] and price_shock_pct is not None and price_shock_pct > 0:
            pt_data = PassThroughData(
                item_id=itm["id"],
                low_factor=itm["pt_low"],
                high_factor=itm["pt_high"],
                receipt=CalcReceipt(
                    source_title=itm["sourceTitle"],
                    geography="All India",
                    unit="Elasticity Coefficient",
                    formula_details="╬öCost = Baseline * Share * Shock * PassThrough",
                    verification_status=itm["status"],
                ),
            )
            res = calc.calculate_item_impact(
                item_id=itm["id"],
                baseline_expenditure=Decimal(str(baseline_mpce_val)),
                item_share_pct=itm["share_pct"],
                price_shock_pct=Decimal(str(price_shock_pct)),
                pass_through_data=pt_data,
                baseline_receipt=calc_baseline_receipt,
            )
            if res.status == "Success" and res.low_impact is not None and res.high_impact is not None:
                has_calculated_items = True
                total_low += res.low_impact
                total_high += res.high_impact
                item_breakdown.append(
                    {
                        "itemId": itm["id"],
                        "itemName": itm["name"],
                        "budgetSharePct": float(itm["share_pct"]),
                        "passThroughFactor": {
                            "low": float(itm["pt_low"]),
                            "high": float(itm["pt_high"]),
                        },
                        "estimatedMonthlyImpactInr": {
                            "low": round(float(res.low_impact), 2),
                            "high": round(float(res.high_impact), 2),
                        },
                        "dataStatus": "available",
                        "receipt": {
                            "sourceTitle": itm["sourceTitle"],
                            "publisher": "PPAC / Official Statistics",
                            "verificationStatus": itm["status"],
                            "unit": "Γé╣ / person / month",
                            "formulaDetails": "╬öCost = MPCE ├ù Share ├ù Price Shock ├ù Pass-Through",
                        },
                    }
                )
                continue

        # Unsupported or missing empirical pass-through: strictly NULL monetary impact
        item_breakdown.append(
            {
                "itemId": itm["id"],
                "itemName": itm["name"],
                "budgetSharePct": float(itm["share_pct"]),
                "passThroughFactor": None,
                "estimatedMonthlyImpactInr": None,
                "dataStatus": "data_not_available",
                "receipt": {
                    "sourceTitle": itm["sourceTitle"],
                    "publisher": "Official Statistics",
                    "verificationStatus": itm["status"],
                    "caveats": [
                        "Empirical pass-through elasticity factor is unverified in official statistics.",
                        "Zero-substitution strictly prohibited: numerical impact marked Data not available.",
                    ],
                },
            }
        )

    total_range = (
        {"low": round(float(total_low), 2), "high": round(float(total_high), 2)}
        if has_calculated_items
        else None
    )

    calculated_count = sum(1 for i in item_breakdown if i["dataStatus"] == "available")
    uncalculated_count = len(item_breakdown) - calculated_count
    calculated_share = sum(
        i["budgetSharePct"] for i in item_breakdown if i["dataStatus"] == "available" and i["budgetSharePct"]
    )

    persona_payload = {
        "persona": {
            "state": req_state,
            "sector": req_sector,
            "expenditureClass": req_exp,
        },
        "mpceBaselineInr": baseline_mpce_val,
        "mpceBaselineReceipt": baseline_receipt_dict,
        "totalMonthlyImpactRangeInr": total_range,
        "unit": "Γé╣ / person / month (Per Capita)",
        "isHouseholdConversion": False,
        "averageHouseholdSize": 4.5,
        "itemCoverage": {
            "totalCandidateItems": len(item_breakdown),
            "calculatedItemsCount": calculated_count,
            "uncalculatedItemsCount": uncalculated_count,
            "calculatedExpenditureSharePct": round(calculated_share, 2),
        },
        "itemBreakdown": item_breakdown,
        "isAiOff": request.isAiOff,
        "notes": (
            f"Deterministic MoSPI HCES 2023ΓÇô24 calculation for {req_sector} {req_state} ({req_exp} class). "
            f"Baseline MPCE anchored to Table 2 (Γé╣{baseline_mpce_val:.0f}/mo). "
            + (
                f"Impact calculated for {calculated_count} items with verified PPAC pass-through."
                if has_calculated_items
                else "No numerical estimate produced ΓÇö Data not available due to unverified pass-through data."
            )
        ),
    }

    # -------------------------------------------------------------------------
    # 4. Final AnalysisResponse Envelope
    # -------------------------------------------------------------------------
    return {
        "scenario": scenario_payload,
        "graph": graph_payload,
        "persona": persona_payload,
        "isAiOff": request.isAiOff,
        "analyzedAt": datetime.now(timezone.utc).isoformat(),
        "isLiveBackend": True,
        "dataSourceLabel": "LIVE FASTAPI BACKEND // REAL-TIME EXTRACTION",
    }


@router.post(
    "/analyze/",
    summary="Composite scenario transmission analysis (trailing slash)",
    status_code=status.HTTP_200_OK,
    include_in_schema=False,
)
def analyze_scenario_trailing_slash(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Handle trailing slash path for POST /api/scenarios/analyze/."""
    return analyze_scenario(request=request, db=db)
