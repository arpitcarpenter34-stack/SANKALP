/**
 * Types for BharatImpact Consumption Dashboard
 * Grounded in MoSPI HCES 2023–24 consumption shares and deterministic household scaling
 */

export type ConsumptionTimePeriod = '3m' | '6m' | '1y';

export type ConsumptionProfileType =
  | 'urban_middle'
  | 'rural'
  | 'high_income'
  | 'custom';

export type LifestyleType = 'frugal' | 'moderate' | 'discretionary';

export interface ConsumptionAssumptions {
  profileType: ConsumptionProfileType;
  monthlyIncome: number;
  familySize: number;
  location: string;
  lifestyle: LifestyleType;
}

export interface ConsumptionKpiItem {
  id: string;
  title: string;
  amount: number;
  periodLabel: string;
  changePct: number;
  direction: 'up' | 'down' | 'neutral';
  comparisonText: string;
  subcategoriesText: string;
  iconName: 'cart' | 'fuel' | 'basket' | 'bolt' | 'more';
}

export interface CategoryCompositionSlice {
  id: string;
  name: string;
  amount: number;
  sharePct: number;
  color: string;
  iconName: string;
}

export interface TrendDataPoint {
  month: string;
  fuel: number;
  food: number;
  utilities: number;
  others: number;
  total: number;
  // Units (physical quantities calibrated for middle class household)
  fuelUnits?: number; // Litres (petrol + diesel equivalent)
  foodUnits?: number; // kg staples & essentials
  utilitiesUnits?: number; // kWh electricity + gas SCM
  othersUnits?: number; // service units
}

export interface CommodityItem {
  id: string;
  name: string;
  category: 'fuel' | 'food' | 'utilities' | 'others';
  quantity: number;
  unit: string;
  unitPrice: number;
  monthlyCost: number;
  changePct: number;
  sparkline: number[];
  iconName: string;
  relatedSectorId?: string;
}

export interface StateConsumptionItem {
  id: string;
  stateName: string;
  monthlyAverage: number;
  deltaPctVsNational: number;
  tier: 'high' | 'medium' | 'moderate';
  rank: number;
}

export interface NationalAverageComparisonItem {
  id: string;
  category: string;
  householdAmount: number;
  nationalAverageAmount: number;
  deltaRupees: number;
  deltaPct: number;
}

export interface GlobalEventImpactItem {
  id: string;
  title: string;
  impactMechanism: string;
  monthlyImpactRupees: number;
  severity: 'high' | 'medium' | 'low';
  iconType: 'oil' | 'chip' | 'food' | 'shipping';
  relatedSectorId?: string;
  relatedDomainId?: string;
}

export interface ProjectedConsumptionPoint {
  month: string;
  baseCase: number;
  optimistic: number;
  pessimistic: number;
}

export interface ConsumptionInsightItem {
  id: string;
  text: string;
  iconName: 'fuel' | 'leaf' | 'bolt' | 'cart' | 'shield';
  highlightNumber?: string;
  categoryLink?: string;
}

export interface ConsumptionDashboardData {
  assumptions: ConsumptionAssumptions;
  timePeriod: ConsumptionTimePeriod;
  activeLocation: string;
  kpis: {
    totalMonthly: ConsumptionKpiItem;
    fuel: ConsumptionKpiItem;
    food: ConsumptionKpiItem;
    utilities: ConsumptionKpiItem;
    otherServices: ConsumptionKpiItem;
  };
  categorySlices: CategoryCompositionSlice[];
  trendPoints: TrendDataPoint[];
  stateVariations: StateConsumptionItem[];
  commodities: CommodityItem[];
  nationalComparisons: NationalAverageComparisonItem[];
  globalEventImpacts: GlobalEventImpactItem[];
  projectionPoints: ProjectedConsumptionPoint[];
  projectionSummary: {
    currentEstimate: number;
    pessimistic: number;
    pessimisticPct: number;
    optimistic: number;
    optimisticPct: number;
  };
  insights: ConsumptionInsightItem[];
}
