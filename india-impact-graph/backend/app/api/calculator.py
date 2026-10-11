"""Household Impact Calculator API endpoints.

Translates macroeconomic shocks into deterministic household rupee impacts
conforming strictly to `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md` and `docs/DATA_AND_EVIDENCE_RULES.md`.
"""

from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List, Optional
import csv
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from calculator.core_calculator import (
    HouseholdImpactCalculator,
    ImpactResult,
    PassThroughData,
    Receipt as CalcReceipt,
)

router = APIRouter(prefix="/api/calculator", tags=["calculator"])

DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data"
PERSONAS_FILE = DATA_DIR / "curated" / "hces-2023-24-personas.csv"
CONSUMPTION_FILE = DATA_DIR / "curated" / "consumption_items.csv"


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class PersonaResponse(BaseModel):
    """Demographic household persona from MoSPI HCES 2023-24."""
    persona_id: str
    state: str
    sector: str
    expenditure_class: str
    survey_source: str
    survey_year: str
    mpce_value_inr: float
    household_size_conversion_status: str
    verified_status: str
    notes: Optional[str] = None


class ItemImpactResponse(BaseModel):
    """Calculated financial impact on a specific consumption item."""
    item_id: str
    status: str
    low_impact: Optional[float] = None
    high_impact: Optional[float] = None
    currency: str = "INR"
    calculation_basis: str
    receipts: Dict[str, Any] = Field(default_factory=dict)
    message: Optional[str] = None


class CalculateImpactRequest(BaseModel):
    """Input payload to calculate persona impact for an economic shock."""
    persona_id: str = Field(description="ID of the demographic persona")
    price_shock_pct: float = Field(description="Upstream shock percentage (e.g. 12.0 for +12% crude)")
    household_size: Optional[float] = Field(
        default=None,
        ge=1.0,
        le=20.0,
        description="Optional family size (defaults to per-capita when omitted). Valid range: 1.0 to 20.0.",
    )
    candidate_items: Optional[List[str]] = Field(default=None, description="Optional list of items to calculate")


class CalculateImpactResponse(BaseModel):
    """Deterministic household impact calculation output."""
    persona: PersonaResponse
    price_shock_pct: float
    household_size: Optional[float] = None
    calculation_basis: str
    total_low_impact: float
    total_high_impact: float
    item_results: List[ItemImpactResponse]
    coverage_summary: str
    determinism_proof: str


# ---------------------------------------------------------------------------
# Helper Loaders
# ---------------------------------------------------------------------------

def load_personas() -> List[PersonaResponse]:
    """Load verified personas from curated CSV."""
    if not PERSONAS_FILE.is_file():
        return []
    personas: List[PersonaResponse] = []
    with open(PERSONAS_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                mpce_val = float(row.get("mpce_value_inr", 0))
            except (ValueError, TypeError):
                mpce_val = 0.0
            personas.append(
                PersonaResponse(
                    persona_id=row["persona_id"].strip(),
                    state=row["state"].strip(),
                    sector=row["sector"].strip(),
                    expenditure_class=row["expenditure_class"].strip(),
                    survey_source=row.get("survey_source", "MoSPI HCES 2023-24").strip(),
                    survey_year=row.get("survey_year", "2023-24").strip(),
                    mpce_value_inr=mpce_val,
                    household_size_conversion_status=row.get("household_size_conversion_status", "Per Capita").strip(),
                    verified_status=row.get("verified_status", "[VERIFIED]").strip(),
                    notes=row.get("notes"),
                )
            )
    return personas


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

UNSUPPORTED_SPEC_PERSONA_IDS = {
    "mp_rural_low",
    "mp_rural_middle",
    "mp_rural_high",
    "mp_urban_low",
    "mp_urban_middle",
    "mp_urban_high",
}


@router.get("/personas", response_model=List[PersonaResponse], summary="List demographic household personas")
def list_personas(
    state: Optional[str] = Query(default=None, description="Filter by state (e.g. Madhya Pradesh, All-India)"),
    sector: Optional[str] = Query(default=None, description="Filter by sector (Rural/Urban)"),
    expenditure_class: Optional[str] = Query(default=None, description="Filter by expenditure class (e.g. All, 0-5%)"),
) -> List[PersonaResponse]:
    """Retrieve verified MoSPI HCES 2023-24 demographic personas.

    Supported personas in the curated dataset include:
    - State/UT-wide averages with expenditure_class='All' (e.g. 'madhya_pradesh_rural_all', 'madhya_pradesh_urban_all')
    - All-India fractile classes with expenditure_class in ['0-5%', '5-10%', ..., '95-100%'] (e.g. 'all_india_rural_0-5')

    Note: State-specific fractile personas (such as 'mp_rural_low') are not present in the
    MoSPI HCES 2023-24 Factsheet Statement 7 extract and will not be returned.
    """
    personas = load_personas()
    if state:
        clean_state = state.strip().lower().replace("-", " ")
        personas = [
            p for p in personas
            if p.state.lower().replace("-", " ") == clean_state or p.state.lower() == state.strip().lower()
        ]
    if sector:
        personas = [p for p in personas if p.sector.lower() == sector.strip().lower()]
    if expenditure_class:
        clean_exp = expenditure_class.strip().lower()
        personas = [
            p for p in personas
            if p.expenditure_class.lower() == clean_exp
            or p.expenditure_class.lower().rstrip("%") == clean_exp.rstrip("%")
        ]
    return personas


@router.post("/calculate", response_model=CalculateImpactResponse, summary="Calculate deterministic household budget impact")
def calculate_household_impact(payload: CalculateImpactRequest) -> CalculateImpactResponse:
    """Calculate deterministic household budget impacts from macro shock.

    Adheres strictly to `docs/HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md`:
    - Deterministic arithmetic only; no AI estimation of numbers.
    - Unsupported items explicitly output 'Data not available' with zero-substitution prohibited.
    - Gold is excluded from consumer budget totals as a capital asset.
    """
    personas = load_personas()
    matched_persona = next((p for p in personas if p.persona_id == payload.persona_id), None)
    if not matched_persona:
        if payload.persona_id in UNSUPPORTED_SPEC_PERSONA_IDS:
            detail = (
                f"Persona with ID '{payload.persona_id}' is not supported. "
                "State-level fractile personas are not present in the MoSPI HCES 2023-24 Factsheet Statement 7 extract. "
                "Supported personas include state averages (e.g. 'madhya_pradesh_rural_all', 'madhya_pradesh_urban_all') "
                "and All-India fractiles (e.g. 'all_india_rural_0-5')."
            )
        else:
            detail = (
                f"Persona with ID '{payload.persona_id}' not found. "
                "Supported personas include state averages (e.g. 'madhya_pradesh_rural_all') "
                "and All-India fractiles (e.g. 'all_india_rural_0-5')."
            )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
        )

    calc = HouseholdImpactCalculator()
    baseline_mpce = Decimal(str(matched_persona.mpce_value_inr))
    shock = Decimal(str(payload.price_shock_pct))
    hh_size = Decimal(str(payload.household_size)) if payload.household_size is not None else None

    # Baseline receipt
    if payload.household_size is not None:
        receipt_unit = "INR/household/month"
        receipt_formula = (
            f"Household Budget Impact = MPCE × Household Size ({payload.household_size}) × Share × Price Shock × Pass-Through"
        )
        receipt_assumptions = (
            f"Scaled to household total with multiplier {payload.household_size} "
            f"(Baseline per-capita MPCE: {matched_persona.household_size_conversion_status})"
        )
    else:
        receipt_unit = "INR/person/month (MPCE)"
        receipt_formula = "Per-Capita Impact = MPCE × Share × Price Shock × Pass-Through"
        receipt_assumptions = matched_persona.household_size_conversion_status

    baseline_receipt = CalcReceipt(
        source_title=f"{matched_persona.survey_source} ({matched_persona.survey_year})",
        source_url="https://mospi.gov.in",
        table_or_series_id="Statement 7 / Fractile Distributions",
        year_or_date=matched_persona.survey_year,
        geography=f"{matched_persona.state} ({matched_persona.sector})",
        unit=receipt_unit,
        formula_details=receipt_formula,
        verification_status=matched_persona.verified_status,
        assumptions_limitations=receipt_assumptions,
    )

    # Curated candidate items and pass-through factors
    # Pass-through factor ranges per HOUSEHOLD_IMPACT_CALCULATOR_SPEC.md
    items_catalog = [
        {
            "id": "petrol",
            "name": "Petrol / Commuting",
            "share_pct": Decimal("5.0") if matched_persona.sector.lower() == "rural" else Decimal("8.0"),
            "pt_low": Decimal("0.30"),
            "pt_high": Decimal("0.45"),
            "source": "PPAC / RBI Retail Fuel Study",
            "status": "[VERIFIED]",
            "supported": True,
        },
        {
            "id": "vegetables",
            "name": "Vegetables (Indirect Diesel Pass-Through)",
            "share_pct": Decimal("7.5") if matched_persona.sector.lower() == "rural" else Decimal("6.0"),
            "pt_low": Decimal("0.05"),
            "pt_high": Decimal("0.15"),
            "source": "MoSPI HCES Table 3 / Mandi Wholesale-to-Retail",
            "status": "[VERIFIED]",
            "supported": True,
        },
        {
            "id": "lpg",
            "name": "LPG Cooking Gas",
            "share_pct": Decimal("3.0"),
            "pt_low": Decimal("0.20"),
            "pt_high": Decimal("0.35"),
            "source": "PPAC RSP Build-up",
            "status": "[VERIFY]",
            "supported": True,
        },
        {
            "id": "pulses",
            "name": "Pulses",
            "share_pct": Decimal("5.5"),
            "supported": False,
        },
        {
            "id": "sugar",
            "name": "Sugar",
            "share_pct": Decimal("2.0"),
            "supported": False,
        },
        {
            "id": "electricity",
            "name": "Electricity",
            "share_pct": Decimal("3.5"),
            "supported": False,
        },
        {
            "id": "gold",
            "name": "Gold",
            "share_pct": Decimal("0.0"),
            "is_capital_asset": True,
            "supported": False,
        },
    ]

    target_items = payload.candidate_items or [item["id"] for item in items_catalog]

    item_results: List[ItemImpactResponse] = []
    total_low = Decimal("0.00")
    total_high = Decimal("0.00")
    calculated_count = 0
    missing_count = 0
    excluded_count = 0

    basis_str = "INR/household/month" if payload.household_size is not None else "INR/person/month"

    for itm_def in items_catalog:
        if itm_def["id"] not in target_items:
            continue

        if itm_def.get("is_capital_asset"):
            excluded_count += 1
            item_results.append(
                ItemImpactResponse(
                    item_id=itm_def["id"],
                    status="Excluded capital asset",
                    low_impact=None,
                    high_impact=None,
                    currency="INR",
                    calculation_basis=basis_str,
                    message="Capital asset excluded from monthly household consumption expenditure (MPCE) calculations.",
                )
            )
            continue

        if not itm_def["supported"]:
            missing_count += 1
            res = calc.calculate_item_impact(
                item_id=itm_def["id"],
                baseline_expenditure=baseline_mpce,
                item_share_pct=itm_def["share_pct"],
                price_shock_pct=shock,
                pass_through_data=None,
                baseline_receipt=baseline_receipt,
                household_size=hh_size,
            )
            item_results.append(
                ItemImpactResponse(
                    item_id=res.item_id,
                    status=res.status,
                    low_impact=None,
                    high_impact=None,
                    currency=res.currency,
                    calculation_basis=basis_str,
                    message="Data not available: verified empirical pass-through data is absent.",
                )
            )
            continue

        # Supported calculation
        pt_data = PassThroughData(
            item_id=itm_def["id"],
            low_factor=itm_def["pt_low"],
            high_factor=itm_def["pt_high"],
            receipt=CalcReceipt(
                source_title=itm_def["source"],
                geography="All India",
                unit="Elasticity Coefficient",
                formula_details="ΔCost = Baseline * Share * Shock * PassThrough",
                verification_status=itm_def["status"],
            ),
        )

        res = calc.calculate_item_impact(
            item_id=itm_def["id"],
            baseline_expenditure=baseline_mpce,
            item_share_pct=itm_def["share_pct"],
            price_shock_pct=shock,
            pass_through_data=pt_data,
            baseline_receipt=baseline_receipt,
            household_size=hh_size,
        )

        if res.status == "Success" and res.low_impact is not None and res.high_impact is not None:
            calculated_count += 1
            total_low += res.low_impact
            total_high += res.high_impact

            receipts_dict = {
                k: {
                    "source_title": v.source_title,
                    "geography": v.geography,
                    "unit": v.unit,
                    "verification_status": v.verification_status,
                    "formula": v.formula_details,
                    "assumptions_limitations": v.assumptions_limitations,
                }
                for k, v in res.receipts.items()
            }

            item_results.append(
                ItemImpactResponse(
                    item_id=res.item_id,
                    status=res.status,
                    low_impact=float(res.low_impact),
                    high_impact=float(res.high_impact),
                    currency=res.currency,
                    calculation_basis=res.calculation_basis,
                    receipts=receipts_dict,
                    message=res.message,
                )
            )

    coverage = (
        f"Coverage: Impact calculated for {calculated_count} of {len(item_results)} candidate items. "
        f"{missing_count} items uncalculated due to missing verified pass-through data. "
        f"{excluded_count} items excluded as capital assets."
    )

    return CalculateImpactResponse(
        persona=matched_persona,
        price_shock_pct=payload.price_shock_pct,
        household_size=payload.household_size,
        calculation_basis=basis_str,
        total_low_impact=float(total_low),
        total_high_impact=float(total_high),
        item_results=item_results,
        coverage_summary=coverage,
        determinism_proof="Deterministic arithmetic only. AI strictly off for mathematical calculations.",
    )
