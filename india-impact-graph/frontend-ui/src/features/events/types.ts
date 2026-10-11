export type EventCategory =
  | 'all'
  | 'geopolitics'
  | 'commodities'
  | 'economy'
  | 'technology'
  | 'trade'
  | 'climate'
  | 'finance';

export type ImpactSeverity = 'high' | 'medium' | 'low' | 'monitoring';

export type GeographicRegion =
  | 'all'
  | 'asia_pacific'
  | 'middle_east'
  | 'north_america'
  | 'europe'
  | 'south_asia'
  | 'latin_america'
  | 'africa';

export interface SectorImpact {
  sector: string;
  impactRange: string;
  metricLabel: string;
  direction: 'up' | 'down' | 'neutral';
  icon: string;
}

export type DataSourceProvenance =
  | 'api_backed'
  | 'curated_benchmark'
  | 'demo_scenario'
  | 'unavailable';

export interface GlobalEventRecord {
  id: string;
  rank: number;
  title: string;
  shortDescription: string;
  fullSummary: string;
  category: EventCategory;
  categoryLabel: string;
  categories?: EventCategory[];
  tags?: string[];
  region: GeographicRegion;
  regionLabel: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  severity: ImpactSeverity;
  trend: 'up' | 'down' | 'neutral';
  eventDate: string;
  eventDateIso: string;
  dataSourceKind: DataSourceProvenance;
  publisher: string;
  publishedRelative: string;
  sourceUrl: string;
  imageUrl?: string;
  potentialImpactHeadline: string;
  sectorImpacts: SectorImpact[];
  historicalContext: string;
  expertViews: {
    expertName: string;
    organization: string;
    quote: string;
  }[];
  keyTakeaways: string[];
  linkedScenarioId?: string;
}

export type MarketFeedState =
  | 'loading'
  | 'available'
  | 'no_data'
  | 'offline'
  | 'unsupported'
  | 'error';

export interface MarketInstrumentData {
  id: string;
  name: string;
  symbol: string;
  unit: string;
  currentValue: number;
  currencyPrefix: string;
  absoluteChange: number;
  pctChange: number;
  trend: 'up' | 'down';
  timeSeries: {
    date: string;
    label: string;
    value: number;
  }[];
  source: string;
  lastUpdated: string;
  isAvailable: boolean;
  unavailableReason?: string;
  dataSourceKind: DataSourceProvenance;
  provenanceNote?: string;
  feedStatus?: MarketFeedState;
  feedEndpoint?: string;
}

export interface NewsArticleRecord {
  id: string;
  title: string;
  publisher: string;
  publishedDate: string;
  eventDateIso: string;
  relativeTime: string;
  category: EventCategory;
  categoryLabel: string;
  region: GeographicRegion;
  severity: ImpactSeverity;
  sourceUrl: string;
  imageThumbnail: string;
  relatedEventId?: string;
  summary: string;
  dataSourceKind?: DataSourceProvenance;
}
