/**
 * Data contracts and type definitions for the BharatImpact Comparison Dashboard.
 * Conforms to evidence-first governance and transparent platform benchmarking.
 */

export type PlatformId =
  | 'news_apps'
  | 'financial_tools'
  | 'research_platforms'
  | 'bharat_impact';

export type ComparisonTab =
  | 'overview'
  | 'features'
  | 'performance'
  | 'use_cases'
  | 'value_for_you';

export type FeatureSupportStatus =
  | 'supported'
  | 'partially_supported'
  | 'not_supported'
  | 'unknown';

export interface PlatformOverview {
  id: PlatformId;
  name: string;
  tagline: string;
  description: string;
  iconType: 'news' | 'finance' | 'research' | 'crown';
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  score: number;
  keyStrengths: string[];
  limitations: string[];
}

export interface FeatureMatrixRow {
  id: string;
  title: string;
  category: 'coverage' | 'analysis' | 'personalization' | 'action';
  description: string;
  statuses: Record<PlatformId, FeatureSupportStatus>;
  notes: Record<PlatformId, string>;
  evidenceBasis: string;
  lastReviewed: string;
}

export interface RadarCapabilityDimension {
  id: string;
  label: string;
  maxScore: number;
  scores: Record<PlatformId, number>;
  scoringCriteria: string;
}

export interface OverallPerformanceMetric {
  platformId: PlatformId;
  name: string;
  score: number; // Scale of 0 to 5.0
  maxScore: number;
  rank: number;
  color: string;
  confidenceBasis: 'curated_benchmarked' | 'qualitative_assessment';
  rationale: string;
}

export interface ImpactAnalysisScenario {
  id: string;
  title: string;
  subtitle: string;
  newsApps: {
    headline: string;
    subtext: string;
    bulletPoints: string[];
  };
  financialTools: {
    ticker: string;
    unit: string;
    currentValue: string;
    changePct: string;
    bulletPoints: string[];
  };
  researchPlatforms: {
    reportTitle: string;
    summary: string;
    bulletPoints: string[];
  };
  bharatImpact: {
    badge: string;
    keyPoints: string[];
    monthlyImpactInr: number;
    sipImpactPct: number;
  };
  householdBreakdown: {
    fuel: number;
    food: number;
    transport: number;
    utilities: number;
    total: number;
  };
  sipProjections: {
    monthLabels: string[];
    newsAppsTrajectory: number[];
    financialToolsTrajectory: number[];
    researchPlatformsTrajectory: number[];
    bharatImpactTrajectory: number[];
    sipCapacityAfter6m: Record<PlatformId, number>;
  };
}

export interface HouseholdComparisonCategory {
  id: string;
  name: string;
  amounts: Record<PlatformId, number | null>; // null indicates unsupported / unavailable metric
  unit: string;
}

export interface UserValuePersona {
  id: string;
  title: string;
  audienceNeed: string;
  iconType: 'family' | 'student' | 'analyst' | 'institution';
  features: string[];
  practicalCase: string;
  benchmarkMultiplier: string;
  qualitativeBadge: string;
  targetSection: string;
}
