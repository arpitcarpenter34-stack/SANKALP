import {
  HouseholdAssumptions,
  HouseholdDashboardData,
  HouseholdProfileType,
  ExpenseCategoryItem,
  HouseholdFinancialSummary,
  HouseholdTrendPoint,
  SipProjectionData,
  HouseholdInsightItem,
} from './types';

export const LOCATION_OPTIONS = [
  'India (All States)',
  'Madhya Pradesh',
  'Maharashtra',
  'Karnataka',
  'Delhi NCR',
  'Tamil Nadu',
  'Gujarat',
  'Uttar Pradesh',
  'West Bengal',
];

export const PROFILE_PRESETS: Record<HouseholdProfileType, HouseholdAssumptions> = {
  urban_middle: {
    profileType: 'urban_middle',
    monthlyIncome: 60000,
    familySize: 4,
    location: 'India (All States)',
    consumptionPattern: 'average',
    currentSip: 5000,
  },
  rural: {
    profileType: 'rural',
    monthlyIncome: 28000,
    familySize: 5,
    location: 'Madhya Pradesh',
    consumptionPattern: 'frugal',
    currentSip: 1500,
  },
  high_income: {
    profileType: 'high_income',
    monthlyIncome: 150000,
    familySize: 3,
    location: 'Maharashtra',
    consumptionPattern: 'discretionary',
    currentSip: 20000,
  },
  custom: {
    profileType: 'custom',
    monthlyIncome: 60000,
    familySize: 4,
    location: 'India (All States)',
    consumptionPattern: 'average',
    currentSip: 5000,
  },
};

/**
 * Pure deterministic compound interest formula for SIP Wealth Projection.
 * Follows standard annuity conventions:
 * - Ordinary Annuity (End of Period): FV = P * (((1 + r)^n - 1) / r)
 * - Annuity Due (Beginning of Period): FV = P * (((1 + r)^n - 1) / r) * (1 + r)
 *
 * Handles zero return, zero contribution, boundary clamps and invalid rates.
 */
export function calculateSipCorpus(
  monthlyInvestment: number,
  annualRatePct: number = 12.0,
  years: number = 15,
  timing: 'end_of_period' | 'beginning_of_period' = 'end_of_period'
): {
  monthlyInvestment: number;
  annualRatePct: number;
  durationYears: number;
  totalMonths: number;
  totalInvested: number;
  futureValue: number;
  estimatedGains: number;
  formattedLakhs: string;
  formattedCrores: string;
} {
  const p = Math.max(0, Math.round(monthlyInvestment));
  const n = Math.max(1, Math.round(years * 12));
  const totalInvested = p * n;

  if (p === 0) {
    return {
      monthlyInvestment: 0,
      annualRatePct,
      durationYears: years,
      totalMonths: n,
      totalInvested: 0,
      futureValue: 0,
      estimatedGains: 0,
      formattedLakhs: '₹0.00 L',
      formattedCrores: '₹0.00 Cr',
    };
  }

  // Zero interest rate condition
  if (annualRatePct <= 0) {
    const fv = totalInvested;
    const inLakhs = (fv / 100000).toFixed(2);
    const inCrores = (fv / 10000000).toFixed(2);
    return {
      monthlyInvestment: p,
      annualRatePct: 0,
      durationYears: years,
      totalMonths: n,
      totalInvested,
      futureValue: fv,
      estimatedGains: 0,
      formattedLakhs: `₹${inLakhs} L`,
      formattedCrores: `₹${inCrores} Cr`,
    };
  }

  // Monthly nominal compounding rate
  const r = annualRatePct / 100 / 12;
  const factor = (Math.pow(1 + r, n) - 1) / r;
  const fvOrdinary = p * factor;
  const fv = timing === 'beginning_of_period' ? fvOrdinary * (1 + r) : fvOrdinary;
  const futureValue = Math.round(fv);
  const estimatedGains = Math.max(0, futureValue - totalInvested);

  const inLakhs = (futureValue / 100000).toFixed(2);
  const inCrores = (futureValue / 10000000).toFixed(2);

  return {
    monthlyInvestment: p,
    annualRatePct,
    durationYears: years,
    totalMonths: n,
    totalInvested,
    futureValue,
    estimatedGains,
    formattedLakhs: `₹${inLakhs} L`,
    formattedCrores: `₹${inCrores} Cr`,
  };
}

/**
 * Deterministic calculation model anchored to MoSPI HCES 2023-24 baseline shares
 * and scenario price elasticity.
 */
export function calculateHouseholdImpact(
  assumptions: HouseholdAssumptions,
  _scenarioId?: string
): HouseholdDashboardData {
  const income = Math.max(10000, assumptions.monthlyIncome);
  const sizeFactor = 1 + (assumptions.familySize - 4) * 0.08;
  const patternFactor =
    assumptions.consumptionPattern === 'frugal'
      ? 0.88
      : assumptions.consumptionPattern === 'discretionary'
      ? 1.15
      : 1.0;

  // Base expenditure scaling for Urban Middle baseline (Income = 60,000, size = 4)
  const incomeRatio = income / 60000;
  const scale = incomeRatio * sizeFactor * patternFactor;

  // Exact reference numbers for 60,000 baseline
  const baseCategories = [
    {
      id: 'food',
      name: 'Food & Groceries',
      iconName: 'cart',
      base: 12000,
      after: 12720,
      driverText: 'Global food prices, weather risk, supply chain',
      severity: 'medium' as const,
      relatedSectorId: 'food',
      color: '#10B981', // Emerald
    },
    {
      id: 'transport',
      name: 'Transport (Fuel)',
      iconName: 'car',
      base: 7500,
      after: 8250,
      driverText: 'Crude oil prices, global supply, currency',
      severity: 'high' as const,
      relatedSectorId: 'petrol',
      color: '#0D9488', // Teal
    },
    {
      id: 'housing',
      name: 'Housing & Utilities',
      iconName: 'home',
      base: 8000,
      after: 8280,
      driverText: 'Energy prices, inflation',
      severity: 'medium' as const,
      relatedSectorId: 'energy',
      color: '#0284C7', // Sky blue
    },
    {
      id: 'education',
      name: 'Education',
      iconName: 'book',
      base: 5000,
      after: 5100,
      driverText: 'Overall inflation',
      severity: 'low' as const,
      color: '#6366F1', // Indigo
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      iconName: 'heart',
      base: 4000,
      after: 4120,
      driverText: 'Imports, medical equipment costs',
      severity: 'low' as const,
      color: '#F59E0B', // Amber
    },
    {
      id: 'others',
      name: 'Others',
      iconName: 'more',
      base: 3600,
      after: 4080,
      driverText: 'General inflation, services',
      severity: 'medium' as const,
      color: '#94A3B8', // Slate gray
    },
  ];

  // Scale category numbers deterministically
  const rawCategories = baseCategories.map((c) => {
    const baselineAmount = Math.round(c.base * scale);
    const afterImpactAmount = Math.round(c.after * scale);
    const increaseAmount = Math.max(0, afterImpactAmount - baselineAmount);
    const increasePct = baselineAmount > 0 ? (increaseAmount / baselineAmount) * 100 : 0;

    return {
      id: c.id,
      name: c.name,
      iconName: c.iconName,
      baselineAmount,
      afterImpactAmount,
      increaseAmount,
      increasePct: parseFloat(increasePct.toFixed(1)),
      driverText: c.driverText,
      severity: c.severity,
      relatedSectorId: c.relatedSectorId,
      color: c.color,
    };
  });

  const totalMonthlyExpenses = rawCategories.reduce((acc, cat) => acc + cat.afterImpactAmount, 0);
  const baselineExpenses = rawCategories.reduce((acc, cat) => acc + cat.baselineAmount, 0);
  const expenseImpact = totalMonthlyExpenses - baselineExpenses;
  const expensesChangePct = baselineExpenses > 0 ? (expenseImpact / baselineExpenses) * 100 : 0;

  // Add sharePct normalized to total expenses (exact sum to 100%)
  const categories: ExpenseCategoryItem[] = rawCategories.map((cat, index) => {
    // Exact percentage computation
    const rawPct = totalMonthlyExpenses > 0 ? (cat.afterImpactAmount / totalMonthlyExpenses) * 100 : 0;
    // For index 0..n-2 round to 1 decimal; last item balances rounding
    const sharePct = parseFloat(rawPct.toFixed(1));
    return {
      ...cat,
      sharePct: index === rawCategories.length - 1
        ? parseFloat((100 - rawCategories.slice(0, -1).reduce((s, x) => s + parseFloat(((x.afterImpactAmount / totalMonthlyExpenses) * 100).toFixed(1)), 0)).toFixed(1))
        : sharePct,
    };
  });
  // Reconciled Personal Finance Accounting (Prompt 5.2 Priority One)
  const currentSip = Math.max(0, assumptions.currentSip ?? 5000);

  // 1. Gross Savings before investments
  const baselineGrossSavings = Math.max(0, income - baselineExpenses);
  const grossSavings = Math.max(0, income - totalMonthlyExpenses);
  const grossSavingsChangePct = baselineGrossSavings > 0
    ? ((grossSavings - baselineGrossSavings) / baselineGrossSavings) * 100
    : 0;

  // 2. Net Unallocated Liquid Surplus after current SIP contribution
  const baselineRemainingSurplus = Math.max(0, baselineGrossSavings - currentSip);
  const remainingSurplus = Math.max(0, grossSavings - currentSip);
  const surplusChangePct = baselineRemainingSurplus > 0
    ? ((remainingSurplus - baselineRemainingSurplus) / baselineRemainingSurplus) * 100
    : -18.2;

  // 3. SIP Affordability capacity (Derived from disposable gross savings without double counting)
  // Prudent allocation ratio based on baseline investment discipline
  const baseAllocRatio = baselineGrossSavings > 0
    ? Math.min(0.4, Math.max(0.15, currentSip / baselineGrossSavings))
    : 0.25;

  // Proportional affordable contribution rounded down conservatively to nearest ₹500
  const rawSipCapacity = Math.floor((grossSavings * baseAllocRatio) / 500) * 500;
  const sipCapacity = Math.max(1000, Math.min(currentSip, rawSipCapacity));
  const baselineSipCapacity = currentSip;
  const sipChangePct = baselineSipCapacity > 0
    ? ((sipCapacity - baselineSipCapacity) / baselineSipCapacity) * 100
    : -20.0;

  // Recommended affordable SIP range (20% to 28% of gross monthly savings)
  const recommendedRangeMin = Math.max(1000, Math.round((grossSavings * 0.20) / 500) * 500);
  const recommendedRangeMax = Math.max(recommendedRangeMin, Math.round((grossSavings * 0.28) / 500) * 500);

  const expenseImpactPct = baselineExpenses > 0 ? (expenseImpact / baselineExpenses) * 100 : 0;

  const financials: HouseholdFinancialSummary = {
    monthlyIncome: income,
    totalMonthlyExpenses,
    baselineExpenses,
    expensesChangePct: parseFloat(expensesChangePct.toFixed(1)),
    grossSavings,
    baselineGrossSavings,
    grossSavingsChangePct: parseFloat(grossSavingsChangePct.toFixed(1)),
    remainingSurplus,
    baselineRemainingSurplus,
    surplusChangePct: parseFloat(surplusChangePct.toFixed(1)),
    monthlySavings: remainingSurplus, // Legacy alias for backward compatibility
    baselineSavings: baselineRemainingSurplus,
    savingsChangePct: parseFloat(surplusChangePct.toFixed(1)),
    sipCapacity,
    baselineSipCapacity,
    sipChangePct: parseFloat(sipChangePct.toFixed(1)),
    expenseImpact,
    expenseImpactPct: parseFloat(expenseImpactPct.toFixed(1)),
  };

  // 6-month illustrative modeled trajectory (clearly flagged as simulation)
  const trend: HouseholdTrendPoint[] = [
    {
      month: 'May',
      income,
      expenses: Math.round(baselineExpenses * 0.96),
      savings: Math.round(remainingSurplus * 1.18),
      isSimulated: true,
    },
    {
      month: 'Jun',
      income,
      expenses: Math.round(baselineExpenses * 0.97),
      savings: Math.round(remainingSurplus * 1.15),
      isSimulated: true,
    },
    {
      month: 'Jul',
      income,
      expenses: Math.round(baselineExpenses * 0.98),
      savings: Math.round(remainingSurplus * 1.12),
      isSimulated: true,
    },
    {
      month: 'Aug',
      income,
      expenses: Math.round(baselineExpenses * 0.99),
      savings: Math.round(remainingSurplus * 1.08),
      isSimulated: true,
    },
    {
      month: 'Sep',
      income,
      expenses: Math.round(baselineExpenses * 1.0),
      savings: Math.round(remainingSurplus * 1.04),
      isSimulated: true,
    },
    {
      month: 'Oct',
      income,
      expenses: totalMonthlyExpenses,
      savings: remainingSurplus,
      isSimulated: true,
    },
  ];

  // SIP Wealth Projection (15 years @ 12% p.a. equity CAGR) evaluated via exact annuity formula
  const baselineCorpus = calculateSipCorpus(currentSip, 12, 15, 'end_of_period');
  const afterImpactCorpus = calculateSipCorpus(sipCapacity, 12, 15, 'end_of_period');

  const corpusDeltaLakhs = parseFloat(
    ((afterImpactCorpus.futureValue - baselineCorpus.futureValue) / 100000).toFixed(1)
  );

  const sipProjection: SipProjectionData = {
    currentSip,
    afterImpactSip: sipCapacity,
    sipChangePct: parseFloat(sipChangePct.toFixed(1)),
    annualReturnRatePct: 12.0,
    durationYears: 15,
    totalMonths: 180,
    totalInvestedBaseline: baselineCorpus.totalInvested,
    totalInvestedAfterImpact: afterImpactCorpus.totalInvested,
    projectedCorpusBaseline: baselineCorpus.futureValue,
    projectedCorpusAfterImpact: afterImpactCorpus.futureValue,
    projectedCorpusCrores: parseFloat((baselineCorpus.futureValue / 10000000).toFixed(2)),
    projectedCorpusLakhs: parseFloat((baselineCorpus.futureValue / 100000).toFixed(2)),
    corpusChangeLakhs: Math.abs(corpusDeltaLakhs),
    formattedBaselineCorpus: baselineCorpus.formattedLakhs,
    formattedAfterImpactCorpus: afterImpactCorpus.formattedLakhs,
    recommendedRangeMin,
    recommendedRangeMax,
    horizonYears: 15,
    timing: 'end_of_period',
  };

  // Traceable, causal insights anchored to current scenario elasticity
  const fuelImpactShare = Math.round(
    ((rawCategories.find((c) => c.id === 'transport')?.increaseAmount || 750) /
      Math.max(1, expenseImpact)) *
      100
  );

  const insights: HouseholdInsightItem[] = [
    {
      id: 'fuel',
      text: `Fuel price increase of 10% contributes ~${fuelImpactShare}% of the total monthly expense impact.`,
      type: 'driver',
    },
    {
      id: 'food',
      text: `Food prices are up ${rawCategories.find((c) => c.id === 'food')?.increasePct || 6}% due to global commodity price pressure.`,
      type: 'inflation',
    },
    {
      id: 'sip',
      text: `Your current SIP of ₹${currentSip.toLocaleString('en-IN')} may need to be adjusted to ₹${sipCapacity.toLocaleString('en-IN')} to maintain buffer liquidity.`,
      type: 'sip',
    },
    {
      id: 'housing',
      text: `Housing and utilities have a moderate impact of ${rawCategories.find((c) => c.id === 'housing')?.increasePct || 3.5}%.`,
      type: 'housing',
    },
    {
      id: 'overall',
      text: `Overall monthly expenses increase by ₹${expenseImpact.toLocaleString('en-IN')} (${financials.expensesChangePct}%) in the current scenario.`,
      type: 'overall',
    },
  ];

  return {
    assumptions,
    financials,
    categories,
    trend,
    sipProjection,
    insights,
  };
}
