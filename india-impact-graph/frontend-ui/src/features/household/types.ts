/**
 * BharatImpact Household Impact Dashboard Types
 * Grounded in MoSPI HCES 2023–24 consumption shares & deterministic scenario elasticity
 */

export type HouseholdProfileType = 'urban_middle' | 'rural' | 'high_income' | 'custom';

export interface HouseholdAssumptions {
  profileType: HouseholdProfileType;
  monthlyIncome: number;
  familySize: number;
  location: string;
  consumptionPattern: 'frugal' | 'average' | 'discretionary';
  currentSip: number;
}

export interface ExpenseCategoryItem {
  id: string;
  name: string;
  iconName: string;
  baselineAmount: number;
  afterImpactAmount: number;
  increaseAmount: number;
  increasePct: number;
  sharePct: number;
  driverText: string;
  severity: 'high' | 'medium' | 'low';
  relatedSectorId?: string;
  color: string;
}

export interface HouseholdFinancialSummary {
  monthlyIncome: number;
  totalMonthlyExpenses: number;
  baselineExpenses: number;
  expensesChangePct: number;
  // Explicit personal finance terminology separation (Prompt 5.2 Priority One)
  grossSavings: number; // Gross Savings before investments = Monthly Income - Monthly Expenses
  baselineGrossSavings: number; // Baseline Income - Baseline Expenses
  grossSavingsChangePct: number;
  remainingSurplus: number; // Net unallocated liquid surplus = Monthly Income - Monthly Expenses - Current SIP
  baselineRemainingSurplus: number;
  surplusChangePct: number;
  // Maintained for backward compatibility:
  monthlySavings: number; // Set equal to remainingSurplus (₹12,450 in reference)
  baselineSavings: number;
  savingsChangePct: number;
  // SIP Capacity
  sipCapacity: number;
  baselineSipCapacity: number;
  sipChangePct: number;
  expenseImpact: number;
  expenseImpactPct: number;
}

export interface HouseholdTrendPoint {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  isSimulated?: boolean;
}

export interface HouseholdInsightItem {
  id: string;
  text: string;
  type: 'driver' | 'inflation' | 'sip' | 'housing' | 'overall';
}

export interface SipProjectionData {
  currentSip: number;
  afterImpactSip: number;
  sipChangePct: number;
  annualReturnRatePct: number;
  durationYears: number;
  totalMonths: number;
  totalInvestedBaseline: number;
  totalInvestedAfterImpact: number;
  projectedCorpusBaseline: number;
  projectedCorpusAfterImpact: number;
  projectedCorpusCrores: number;
  projectedCorpusLakhs: number;
  corpusChangeLakhs: number;
  formattedBaselineCorpus: string;
  formattedAfterImpactCorpus: string;
  recommendedRangeMin: number;
  recommendedRangeMax: number;
  horizonYears: number;
  timing: 'end_of_period' | 'beginning_of_period';
}

export interface HouseholdDashboardData {
  assumptions: HouseholdAssumptions;
  financials: HouseholdFinancialSummary;
  categories: ExpenseCategoryItem[];
  trend: HouseholdTrendPoint[];
  sipProjection: SipProjectionData;
  insights: HouseholdInsightItem[];
}
