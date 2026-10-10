import math
from decimal import Decimal, InvalidOperation
from dataclasses import dataclass, field
from typing import Optional, Dict, Union

@dataclass
class Receipt:
    source_title: str
    source_url: Optional[str] = None
    table_or_series_id: Optional[str] = None
    year_or_date: Optional[str] = None
    geography: Optional[str] = None
    unit: Optional[str] = None
    formula_details: Optional[str] = None
    verification_status: str = "[VERIFIED]"
    assumptions_limitations: Optional[str] = None

@dataclass
class PassThroughData:
    item_id: str
    low_factor: Decimal
    high_factor: Decimal
    receipt: Receipt

@dataclass
class ImpactResult:
    item_id: str
    status: str
    low_impact: Optional[Decimal]
    high_impact: Optional[Decimal]
    currency: str
    calculation_basis: str
    receipts: Dict[str, Receipt] = field(default_factory=dict)
    message: Optional[str] = None

class HouseholdImpactCalculator:
    """
    Deterministic Household Impact Calculator
    
    Rule: Never fabricate data. Uses purely deterministic arithmetic.
    Rounding policy: Round impact to 2 decimal places (standard for INR).
    Units: Impact is returned in INR (Indian Rupee).
    Basis: 'INR/person/month' if household_size is not provided/1, otherwise 'INR/household/month'.
    """
    
    def calculate_item_impact(
        self,
        item_id: str,
        baseline_expenditure: Union[Decimal, str, float, None],
        item_share_pct: Union[Decimal, str, float, None],
        price_shock_pct: Union[Decimal, str, float, None],
        pass_through_data: Optional[PassThroughData],
        baseline_receipt: Optional[Receipt],
        household_size: Optional[Union[Decimal, str, int]] = None
    ) -> ImpactResult:
        receipts = {}
        if baseline_receipt:
            receipts["baseline"] = baseline_receipt
            
        # Check for explicitly missing core inputs
        if baseline_expenditure is None or item_share_pct is None or price_shock_pct is None:
            return ImpactResult(
                item_id=item_id,
                status="Data not available",
                low_impact=None,
                high_impact=None,
                currency="INR",
                calculation_basis="unknown",
                receipts=receipts,
                message="Missing required input fields (baseline, share, or shock)."
            )

        if pass_through_data is None:
            return ImpactResult(
                item_id=item_id,
                status="Data not available",
                low_impact=None,
                high_impact=None,
                currency="INR",
                calculation_basis="unknown",
                receipts=receipts,
                message="Missing pass-through data."
            )
            
        receipts["pass_through"] = pass_through_data.receipt
        
        try:
            baseline = Decimal(str(baseline_expenditure))
            share = Decimal(str(item_share_pct))
            shock = Decimal(str(price_shock_pct))
            hh_size = Decimal(str(household_size)) if household_size is not None else Decimal('1')
        except (InvalidOperation, ValueError, TypeError):
            return ImpactResult(
                item_id=item_id,
                status="Invalid input",
                low_impact=None,
                high_impact=None,
                currency="INR",
                calculation_basis="unknown",
                receipts=receipts,
                message="Non-numeric or invalid type provided."
            )
            
        # Mathematical Validation Checks
        if not baseline.is_finite() or not share.is_finite() or not shock.is_finite() or not hh_size.is_finite():
            return ImpactResult(item_id, "Invalid input", None, None, "INR", "unknown", receipts, "Infinity or NaN not allowed.")
        if baseline < 0:
            return ImpactResult(item_id, "Invalid input", None, None, "INR", "unknown", receipts, "Negative baseline expenditure.")
        if share < 0 or share > 100:
            return ImpactResult(item_id, "Invalid input", None, None, "INR", "unknown", receipts, "Item share must be between 0 and 100.")
        if pass_through_data.low_factor > pass_through_data.high_factor:
            return ImpactResult(item_id, "Invalid input", None, None, "INR", "unknown", receipts, "Low pass-through > high pass-through.")
        if hh_size <= 0:
            return ImpactResult(item_id, "Invalid input", None, None, "INR", "unknown", receipts, "Household size must be positive.")

        # Define calculation basis
        if hh_size > Decimal('1'):
            basis = "INR/household/month"
            total_baseline = baseline * hh_size
        else:
            basis = "INR/person/month"
            total_baseline = baseline
            
        affected_baseline = total_baseline * (share / Decimal('100.0'))
        
        # Impact = affected_baseline * (shock / 100) * pass_through
        impact_1 = affected_baseline * (shock / Decimal('100.0')) * pass_through_data.low_factor
        impact_2 = affected_baseline * (shock / Decimal('100.0')) * pass_through_data.high_factor
        
        low_impact = min(impact_1, impact_2)
        high_impact = max(impact_1, impact_2)
        
        # Rounding policy: round to 2 decimal places.
        low_impact = low_impact.quantize(Decimal('0.01'))
        high_impact = high_impact.quantize(Decimal('0.01'))
        
        return ImpactResult(
            item_id=item_id,
            status="Success",
            low_impact=low_impact,
            high_impact=high_impact,
            currency="INR",
            calculation_basis=basis,
            receipts=receipts,
            message="Calculated successfully."
        )
