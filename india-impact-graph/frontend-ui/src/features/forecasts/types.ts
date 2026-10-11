/**
 * BharatImpact SIP & Forecasts Dashboard Types
 * Rigorous financial definitions connecting Macro Shocks -> Household Savings -> SIP Wealth
 */

export type SimulatorMode = 'basic' | 'advanced';
export type ContributionTiming = 'end_of_period' | 'beginning_of_period';
export type ForecastViewMode = 'amount' | 'wealth';
export type ForecastScenarioId = 'optimistic' | 'base' | 'pessimistic';

export interface SipSimulatorInputs {
  monthlySip: number; // Current chosen contribution (₹)
  durationYears: number; // Investment duration (1 - 30 yrs)
  annualReturnPct: number; // Expected equity/portfolio return (4% - 20%)
  expenseImpactPct: number; // Assumed increase in household expenses (0% - 20%)
  mode: SimulatorMode;
  // Advanced parameters
  annualStepUpPct: number; // Annual contribution increase (0% - 15%)
  inflationPct: number; // Consumer inflation discount rate (0% - 10%)
  timing: ContributionTiming; // End or beginning of month
  expenseGrowthPct: number; // Annual household expense growth (0% - 10%)
}

export interface GrowthTrajectoryPoint {
  year: number;
  baselineInvested: number;
  baselineCorpus: number;
  afterImpactInvested: number;
  afterImpactCorpus: number;
  reducedInvested: number;
  reducedCorpus: number;
  // Real wealth (inflation adjusted)
  baselineWealthReal: number;
  afterImpactWealthReal: number;
  reducedWealthReal: number;
}

export interface ForecastScenarioItem {
  id: ForecastScenarioId;
  name: string;
  subtitle: string;
  monthlySip: number;
  annualReturnPct: number;
  projectedCorpus: number;
  totalInvested: number;
  estimatedGains: number;
  deltaPct: number;
  deltaLabel: string;
  badgeType: 'positive' | 'current' | 'negative';
}

export interface GlobalEventDriver {
  id: string;
  name: string;
  impactAmount: number; // Negative value (₹), e.g. -600
  percentageOfImpact: number;
  description: string;
  categoryKey: string;
  sectorId?: string;
}

export interface SipCalculationSummary {
  monthlyInvestment: number;
  annualRatePct: number;
  durationYears: number;
  totalMonths: number;
  totalInvested: number;
  futureValue: number;
  estimatedGains: number;
  wealthMultiplier: number;
  formattedLakhs: string;
  formattedCrores: string;
}

export interface SipForecastsData {
  inputs: SipSimulatorInputs;
  viewMode: ForecastViewMode;
  activeScenarioId: ForecastScenarioId;
  // Core KPI values
  currentSip: number;
  estimatedCapacity: number;
  capacityChangePct: number;
  totalInvested: number;
  projectedCorpus: number;
  estimatedReturns: number;
  wealthMultiplier: number;
  corpusDifferenceLakhs: number;
  // Trajectory & Scenarios
  trajectory: GrowthTrajectoryPoint[];
  scenarios: Record<ForecastScenarioId, ForecastScenarioItem>;
  drivers: GlobalEventDriver[];
}
