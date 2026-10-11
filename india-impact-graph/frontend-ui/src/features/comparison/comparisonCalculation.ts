import {
  PlatformId,
  RadarCapabilityDimension,
  ImpactAnalysisScenario,
  HouseholdComparisonCategory,
} from './types';
import { RADAR_DIMENSIONS } from './comparisonData';

export interface RadarPoint {
  x: number;
  y: number;
  value: number;
  label: string;
}

export interface RadarSeriesCoordinates {
  platformId: PlatformId;
  pointsString: string;
  points: RadarPoint[];
}

export interface WebGridLevel {
  level: number;
  score: number;
  polygonString: string;
}

/**
 * Calculates geometric SVG coordinates for the 8-axis Radar Chart.
 * Angles are evenly distributed across 360 degrees (45 degrees per axis),
 * starting from the top (-90 degrees / 12 o'clock).
 */
export function calculateRadarGeometry(
  dimensions: RadarCapabilityDimension[],
  cx: number = 200,
  cy: number = 180,
  radius: number = 130
) {
  const totalAxes = dimensions.length;
  const angleStep = (Math.PI * 2) / totalAxes;
  const startAngle = -Math.PI / 2; // Start from top (12 o'clock)

  // 1. Grid level concentric polygons (levels 1, 2, 3, 4, 5)
  const gridLevels: WebGridLevel[] = [1, 2, 3, 4, 5].map((lvl) => {
    const r = (lvl / 5) * radius;
    const pts = dimensions.map((_, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return {
      level: lvl,
      score: lvl,
      polygonString: pts.join(' '),
    };
  });

  // 2. Axis spokes and outer label positions
  const axisSpokes = dimensions.map((dim, i) => {
    const angle = startAngle + i * angleStep;
    const xEnd = cx + radius * Math.cos(angle);
    const yEnd = cy + radius * Math.sin(angle);

    // Label position slightly outside radius
    const labelDistance = radius + 24;
    const xLabel = cx + labelDistance * Math.cos(angle);
    const yLabel = cy + labelDistance * Math.sin(angle);

    let textAnchor: 'middle' | 'start' | 'end' = 'middle';
    if (Math.cos(angle) > 0.3) textAnchor = 'start';
    else if (Math.cos(angle) < -0.3) textAnchor = 'end';

    return {
      id: dim.id,
      label: dim.label,
      xStart: cx,
      yStart: cy,
      xEnd,
      yEnd,
      xLabel,
      yLabel,
      textAnchor,
    };
  });

  // 3. Platform series polygon coordinates
  const calculateSeries = (platformId: PlatformId): RadarSeriesCoordinates => {
    const points: RadarPoint[] = dimensions.map((dim, i) => {
      const angle = startAngle + i * angleStep;
      const val = Math.max(0, Math.min(5, dim.scores[platformId] || 0));
      const normRadius = (val / 5) * radius;
      const x = cx + normRadius * Math.cos(angle);
      const y = cy + normRadius * Math.sin(angle);
      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        value: val,
        label: dim.label,
      };
    });

    return {
      platformId,
      pointsString: points.map((p) => `${p.x},${p.y}`).join(' '),
      points,
    };
  };

  return {
    cx,
    cy,
    radius,
    gridLevels,
    axisSpokes,
    calculateSeries,
  };
}

/**
 * Dimension weights for reproducible composite overall scores.
 * All 8 core parameters are evaluated with equal weight (1.0x) as indicated on the dashboard.
 */
export const SCORING_WEIGHTS: Record<string, number> = {
  event_coverage: 1.0,
  economic_analysis: 1.0,
  sector_insights: 1.0,
  household_impact: 1.0,
  sip_planning: 1.0,
  future_scenarios: 1.0,
  personalization: 1.0,
  actionable_recs: 1.0,
};

/**
 * Calculates the deterministic composite performance score for a platform.
 * Reconciles with the benchmark reference:
 * - News Apps: ~2.1
 * - Financial Tools: ~3.3
 * - Research Platforms: ~3.8
 * - BharatImpact: ~4.8
 */
export function calculateCompositePlatformScore(
  platformId: PlatformId,
  dimensions: RadarCapabilityDimension[] = RADAR_DIMENSIONS
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dim of dimensions) {
    const weight = SCORING_WEIGHTS[dim.id] ?? 1.0;
    const score = dim.scores[platformId] ?? 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  // Round to 1 decimal place
  return Math.round(rawScore * 10) / 10;
}

/**
 * Formats a number to Indian Rupee notation (e.g. ₹1,250 or ₹45,000).
 */
export function formatRupees(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

/**
 * Generates the comparative household impact dataset for an active scenario.
 * Demonstrates the analytical contrast:
 * News Apps do not quantify household costs; Financial tools track raw market delta;
 * Research platforms track aggregated macro cost; BharatImpact computes itemized personal impact.
 */
export function getHouseholdComparisonCategories(
  scenario: ImpactAnalysisScenario
): HouseholdComparisonCategory[] {
  const { householdBreakdown } = scenario;

  return [
    {
      id: 'fuel',
      name: 'Fuel Expenses',
      amounts: {
        news_apps: null, // Untracked / zero household model
        financial_tools: Math.round(householdBreakdown.fuel * 0.12),
        research_platforms: Math.round(householdBreakdown.fuel * 0.53),
        bharat_impact: householdBreakdown.fuel,
      },
      unit: '₹/month',
    },
    {
      id: 'food',
      name: 'Food Items',
      amounts: {
        news_apps: null,
        financial_tools: Math.round(householdBreakdown.food * 0.1),
        research_platforms: Math.round(householdBreakdown.food * 0.58),
        bharat_impact: householdBreakdown.food,
      },
      unit: '₹/month',
    },
    {
      id: 'transport',
      name: 'Transport',
      amounts: {
        news_apps: null,
        financial_tools: Math.round(householdBreakdown.transport * 0.13),
        research_platforms: Math.round(householdBreakdown.transport * 0.65),
        bharat_impact: householdBreakdown.transport,
      },
      unit: '₹/month',
    },
    {
      id: 'utilities',
      name: 'Utilities',
      amounts: {
        news_apps: null,
        financial_tools: Math.round(householdBreakdown.utilities * 0.15),
        research_platforms: Math.round(householdBreakdown.utilities * 0.64),
        bharat_impact: householdBreakdown.utilities,
      },
      unit: '₹/month',
    },
    {
      id: 'total',
      name: 'Total Impact',
      amounts: {
        news_apps: null,
        financial_tools: 290,
        research_platforms: 1400,
        bharat_impact: householdBreakdown.total,
      },
      unit: '₹/month',
    },
  ];
}

/**
 * Computes dynamic 6-month SIP trajectories for an investment horizon and base contribution.
 * Allows interactive scaling when user adjusts monthly SIP amount (e.g. ₹5,000, ₹10,000, ₹15,000).
 */
export function calculateSipComparisonTrajectories(
  monthlyContribution: number = 5000,
  scenario: ImpactAnalysisScenario
) {
  const scale = monthlyContribution / 5000;
  const baseProjections = scenario.sipProjections;

  const newsApps = baseProjections.newsAppsTrajectory.map((v) => Math.round(v * scale));
  const financialTools = baseProjections.financialToolsTrajectory.map((v) => Math.round(v * scale));
  const researchPlatforms = baseProjections.researchPlatformsTrajectory.map((v) => Math.round(v * scale));
  const bharatImpact = baseProjections.bharatImpactTrajectory.map((v) => Math.round(v * scale));

  const capacityAfter6m: Record<PlatformId, number> = {
    bharat_impact: Math.round(baseProjections.sipCapacityAfter6m.bharat_impact * scale),
    research_platforms: Math.round(baseProjections.sipCapacityAfter6m.research_platforms * scale),
    financial_tools: Math.round(baseProjections.sipCapacityAfter6m.financial_tools * scale),
    news_apps: Math.round(baseProjections.sipCapacityAfter6m.news_apps * scale),
  };

  const corpusAdvantageInr = capacityAfter6m.bharat_impact - capacityAfter6m.financial_tools;

  return {
    monthLabels: baseProjections.monthLabels,
    trajectories: {
      news_apps: newsApps,
      financial_tools: financialTools,
      research_platforms: researchPlatforms,
      bharat_impact: bharatImpact,
    },
    capacityAfter6m,
    corpusAdvantageInr,
  };
}
