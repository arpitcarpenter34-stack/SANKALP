import { describe, it, expect } from 'vitest';
import {
  calculateRadarGeometry,
  calculateCompositePlatformScore,
  getHouseholdComparisonCategories,
  calculateSipComparisonTrajectories,
  formatRupees,
} from '../comparisonCalculation';
import {
  RADAR_DIMENSIONS,
  FEATURE_MATRIX_DATA,
  PLATFORMS_DATA,
  SCENARIOS_DATA,
  OVERALL_PERFORMANCE_METRICS,
} from '../comparisonData';

describe('BharatImpact Comparison Calculations & Data Integrity', () => {
  describe('calculateRadarGeometry', () => {
    it('generates 5 concentric web grid levels and 8 axis spokes', () => {
      const geo = calculateRadarGeometry(RADAR_DIMENSIONS, 200, 180, 130);

      expect(geo.gridLevels).toHaveLength(5);
      expect(geo.axisSpokes).toHaveLength(8);

      // Verify spoke labels correspond to the dimensions
      expect(geo.axisSpokes.map((s) => s.id)).toEqual([
        'event_coverage',
        'economic_analysis',
        'sector_insights',
        'household_impact',
        'sip_planning',
        'future_scenarios',
        'personalization',
        'actionable_recs',
      ]);
    });

    it('calculates bounded series coordinates for all 4 platform categories', () => {
      const geo = calculateRadarGeometry(RADAR_DIMENSIONS, 200, 180, 130);
      const platforms = ['news_apps', 'financial_tools', 'research_platforms', 'bharat_impact'] as const;

      for (const pId of platforms) {
        const series = geo.calculateSeries(pId);
        expect(series.platformId).toBe(pId);
        expect(series.points).toHaveLength(8);

        // Every calculated coordinate must be a finite number within canvas range
        for (const pt of series.points) {
          expect(Number.isFinite(pt.x)).toBe(true);
          expect(Number.isFinite(pt.y)).toBe(true);
          expect(pt.value).toBeGreaterThanOrEqual(0);
          expect(pt.value).toBeLessThanOrEqual(5);
        }
      }
    });
  });

  describe('calculateCompositePlatformScore', () => {
    it('computes transparent weighted composite scores matching benchmark references', () => {
      const newsScore = calculateCompositePlatformScore('news_apps');
      const finScore = calculateCompositePlatformScore('financial_tools');
      const resScore = calculateCompositePlatformScore('research_platforms');
      const bharatScore = calculateCompositePlatformScore('bharat_impact');

      expect(newsScore).toBe(2.1);
      expect(finScore).toBe(3.3);
      expect(resScore).toBe(3.8);
      expect(bharatScore).toBe(4.8);
    });

    it('matches the values configured in OVERALL_PERFORMANCE_METRICS', () => {
      for (const metric of OVERALL_PERFORMANCE_METRICS) {
        const computed = calculateCompositePlatformScore(metric.platformId);
        expect(computed).toBe(metric.score);
      }
    });
  });

  describe('getHouseholdComparisonCategories', () => {
    it('returns 5 categories with null for news apps and full breakdown for BharatImpact', () => {
      const crudeScenario = SCENARIOS_DATA[0];
      const categories = getHouseholdComparisonCategories(crudeScenario);

      expect(categories).toHaveLength(5);
      const ids = categories.map((c) => c.id);
      expect(ids).toEqual(['fuel', 'food', 'transport', 'utilities', 'total']);

      // News apps do not model household costs: must be null, not zero
      for (const cat of categories) {
        expect(cat.amounts.news_apps).toBeNull();
      }

      // BharatImpact amounts must exactly match the scenario breakdown
      const fuelCat = categories.find((c) => c.id === 'fuel')!;
      expect(fuelCat.amounts.bharat_impact).toBe(crudeScenario.householdBreakdown.fuel);

      const totalCat = categories.find((c) => c.id === 'total')!;
      expect(totalCat.amounts.bharat_impact).toBe(crudeScenario.householdBreakdown.total);
    });
  });

  describe('calculateSipComparisonTrajectories', () => {
    it('scales linearly when monthly contribution is adjusted', () => {
      const crudeScenario = SCENARIOS_DATA[0];

      const baseCalc = calculateSipComparisonTrajectories(5000, crudeScenario);
      const doubleCalc = calculateSipComparisonTrajectories(10000, crudeScenario);

      expect(baseCalc.capacityAfter6m.bharat_impact).toBe(45000);
      expect(doubleCalc.capacityAfter6m.bharat_impact).toBe(90000);

      expect(baseCalc.capacityAfter6m.news_apps).toBe(30000);
      expect(doubleCalc.capacityAfter6m.news_apps).toBe(60000);

      expect(doubleCalc.corpusAdvantageInr).toBe(baseCalc.corpusAdvantageInr * 2);
    });
  });

  describe('formatRupees', () => {
    it('formats Indian rupee values correctly', () => {
      expect(formatRupees(0)).toBe('₹0');
      expect(formatRupees(1250)).toBe('₹1,250');
      expect(formatRupees(45000)).toBe('₹45,000');
    });
  });

  describe('Evidence Basis & Data Integrity Provenance', () => {
    it('guarantees every feature row has documented evidence and last-reviewed date', () => {
      expect(FEATURE_MATRIX_DATA).toHaveLength(9);

      for (const feat of FEATURE_MATRIX_DATA) {
        expect(feat.evidenceBasis.length).toBeGreaterThan(10);
        expect(feat.lastReviewed).toMatch(/2026/);
        expect(feat.statuses.bharat_impact).toBe('supported');
      }
    });

    it('guarantees all 4 platform profiles document key strengths and honest limitations', () => {
      expect(PLATFORMS_DATA).toHaveLength(4);

      for (const p of PLATFORMS_DATA) {
        expect(p.keyStrengths.length).toBeGreaterThan(0);
        expect(p.limitations.length).toBeGreaterThan(0);
      }
    });
  });
});
