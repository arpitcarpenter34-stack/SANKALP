export type EconomicTagKind = 'positive' | 'negative' | 'neutral' | 'risk';

export interface EconomicTag {
  label: string;
  kind: EconomicTagKind;
}

export type ImpactSeverity = 'high' | 'medium' | 'low' | 'positive' | 'monitoring';

export interface NewsArticleRecord {
  article_id: string;
  headline: string;
  publisher: string;
  publication_date: string;
  relative_time: string;
  source_url: string;
  category: string;
  category_label: string;
  summary: string;
  image_url?: string;
  image_key?: 'oil' | 'rbi' | 'chip' | 'ship' | string;
  impact_severity: ImpactSeverity;
  economic_tags: EconomicTag[];
  related_event_id?: string;
  related_sector_id?: string;
  is_top_story: boolean;
  verification_status: string;
}

export interface NewsCategoryItem {
  id: string;
  label: string;
  icon?: string;
  article_count: number;
}

export interface IndicatorPoint {
  date: string;
  label: string;
  value: number;
}

export interface IndicatorSeries {
  id: string;
  name: string;
  unit: string;
  change_pct: number;
  color: string;
  data: IndicatorPoint[];
}

export interface SectorReactionItem {
  sector_id: string;
  name: string;
  direction: 'up' | 'down' | 'neutral';
  change_pct: number;
  is_negative_for_economy: boolean;
  article_count: number;
  supporting_driver: string;
}

export interface MarketSnapshotInstrument {
  id: string;
  name: string;
  symbol: string;
  current_value: number;
  currency_prefix: string;
  unit: string;
  change_pct: number;
  trend: 'up' | 'down' | 'neutral';
  sparkline: number[];
  source: string;
  last_updated: string;
  is_available: boolean;
  unavailable_reason?: string;
}

export interface SentimentBreakdown {
  total_analyzed: number;
  positive_count: number;
  positive_pct: number;
  neutral_count: number;
  neutral_pct: number;
  negative_count: number;
  negative_pct: number;
  methodology_note: string;
}

export interface TrendingTopicItem {
  rank: number;
  name: string;
  article_count_label: string;
  growth_label: string;
  category_id: string;
}

export interface NewsAnalyticsData {
  key_indicators: Record<string, IndicatorSeries[]>;
  sector_reactions: SectorReactionItem[];
  market_snapshot: MarketSnapshotInstrument[];
  sentiment: SentimentBreakdown;
  trending_topics: TrendingTopicItem[];
  as_of_date: string;
  provenance_note: string;
}

export interface NewsListResponse {
  articles: NewsArticleRecord[];
  total_count: number;
  categories: NewsCategoryItem[];
  freshness_timestamp: string;
  provider_status: string;
  provenance_note: string;
}
