export type SectorId =
  | 'semiconductors'
  | 'petrol'
  | 'lpg'
  | 'food'
  | 'shipping'
  | 'currency'
  | 'energy';

export interface SectorCategoryItem {
  id: SectorId;
  name: string;
  subtitle: string;
  icon: string;
  domainId: string;
}

export interface SectorKPICardData {
  id: string;
  title: string;
  value: string;
  change: string;
  direction: 'up' | 'down' | 'neutral';
  isAdverse: boolean;
  comparisonPeriod: string;
  subtext: string;
  sparklineType: 'bar' | 'line' | 'donut';
  sparklineData: number[];
  sparklineDonutPct?: number;
}

export type TimeRangeKey = '6M' | '1Y' | '3Y' | '5Y';

export interface PriceRangeData {
  dates: string[];
  seriesA: number[];
  seriesB: number[];
}

export interface DualPriceChartConfig {
  title: string;
  infoTooltip: string;
  seriesAName: string;
  seriesBName: string;
  unit: string;
  ranges: Record<TimeRangeKey, PriceRangeData>;
  defaultRange: TimeRangeKey;
  currentComparison: {
    dateLabel: string;
    seriesAVal: string;
    seriesAChange: string;
    seriesBVal: string;
    seriesBChange: string;
  };
}

export interface ImportCategoryItem {
  id: string;
  name: string;
  percentage: number;
  color: string;
}

export interface ImportDependenceConfig {
  totalDependencePct: number;
  totalLabel: string;
  categories: ImportCategoryItem[];
  provenance: string;
}

export interface DownstreamIndustryRow {
  id: string;
  name: string;
  icon: string;
  severity: 'High' | 'Medium' | 'Low';
  keyEffectPct: string;
  keyEffectNum: number;
  effectColor: string;
  details: string;
  graphNodeId?: string;
}

export interface StockIndexSeries {
  id: string;
  name: string;
  currentValue: string;
  change: string;
  trend: 'up' | 'down';
  chartPoints: number[];
  months: string[];
  minY: number;
  maxY: number;
}

export interface StockPerformanceConfig {
  indices: StockIndexSeries[];
  defaultIndexId: string;
}

export interface SectorDetailsTabContent {
  summary: string;
  isActive: boolean;
  globalShare: string;
  importDependence: string;
  majorEndUseSectors: string;
  householdConnection: string;
  sourceNote: string;
  keyIndicators: {
    label: string;
    value: string;
    unit: string;
    trend: string;
  }[];
  relatedSectors: {
    name: string;
    relation: string;
    impact: string;
  }[];
}

export interface SectorNewsCardItem {
  id: string;
  headline: string;
  publisher: string;
  date: string;
  impactBadge: 'High Impact' | 'Medium' | 'Low';
  sourceUrl: string;
  thumbnailType: 'chip' | 'oil' | 'ship' | 'wheat' | 'coins' | 'energy' | 'news';
}

export interface SectorTakeawayItem {
  id: string;
  text: string;
  type: 'observed' | 'inference' | 'policy';
  icon: 'trend' | 'shield' | 'cart' | 'policy';
}

export interface SectorDashboardData {
  id: SectorId;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  domainId: string;
  statusLabel: string;
  kpis: SectorKPICardData[];
  priceComparison: DualPriceChartConfig;
  importDependence: ImportDependenceConfig;
  downstreamImpacts: DownstreamIndustryRow[];
  stockPerformance: StockPerformanceConfig;
  details: SectorDetailsTabContent;
  news: SectorNewsCardItem[];
  takeaways: SectorTakeawayItem[];
}
