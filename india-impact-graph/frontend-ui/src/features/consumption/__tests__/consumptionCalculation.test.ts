import { describe, it, expect } from 'vitest';
import {
  calculateConsumptionDashboard,
  formatRupees,
  formatRupeesCompact,
  formatPercent,
} from '../consumptionCalculation';
import { PROFILE_PRESETS } from '../consumptionData';

describe('BharatImpact Consumption Dashboard Calculation Engine', () => {
  it('formats rupees and percentages correctly', () => {
    expect(formatRupees(42550)).toBe('₹42,550');
    expect(formatRupees(0)).toBe('₹0');
    expect(formatRupeesCompact(42550)).toBe('₹42.5K');
    expect(formatRupeesCompact(150000)).toBe('₹1.5 L');
    expect(formatRupeesCompact(15000000)).toBe('₹1.50 Cr');
    expect(formatPercent(4.3)).toBe('+4.3%');
    expect(formatPercent(-2.5)).toBe('-2.5%');
  });

  it('reconciles total monthly consumption arithmetic at urban middle baseline', () => {
    const data = calculateConsumptionDashboard(
      PROFILE_PRESETS.urban_middle,
      '6m',
      'India (All States)'
    );

    const { kpis, categorySlices } = data;

    // Check exact baseline numbers from screenshot
    expect(kpis.totalMonthly.amount).toBe(42550);
    expect(kpis.fuel.amount).toBe(12800);
    expect(kpis.food.amount).toBe(12720);
    expect(kpis.utilities.amount).toBe(8280);
    expect(kpis.otherServices.amount).toBe(8750);

    // Exact arithmetic reconciliation
    const sumOfKpis =
      kpis.fuel.amount +
      kpis.food.amount +
      kpis.utilities.amount +
      kpis.otherServices.amount;
    expect(sumOfKpis).toBe(kpis.totalMonthly.amount);

    // Verify 7-category donut slices and reconciliation with 4 KPIs
    const fuelSlice = categorySlices.find((s) => s.id === 'fuel')!;
    const foodSlice = categorySlices.find((s) => s.id === 'food')!;
    const utilSlice = categorySlices.find((s) => s.id === 'utilities')!;
    const transportSlice = categorySlices.find((s) => s.id === 'transport')!;
    const healthSlice = categorySlices.find((s) => s.id === 'healthcare')!;
    const eduSlice = categorySlices.find((s) => s.id === 'education')!;
    const othersSlice = categorySlices.find((s) => s.id === 'others')!;

    expect(fuelSlice.amount).toBe(12800);
    expect(fuelSlice.sharePct).toBe(30.1);

    expect(foodSlice.amount).toBe(12720);
    expect(foodSlice.sharePct).toBe(29.9);

    expect(utilSlice.amount).toBe(8280);
    expect(utilSlice.sharePct).toBe(19.5);

    expect(transportSlice.amount).toBe(3500);
    expect(transportSlice.sharePct).toBe(8.2);

    expect(healthSlice.amount).toBe(2720);
    expect(healthSlice.sharePct).toBe(6.4);

    expect(eduSlice.amount).toBe(1750);
    expect(eduSlice.sharePct).toBe(4.1);

    expect(othersSlice.amount).toBe(780);
    expect(othersSlice.sharePct).toBe(1.8);

    // Prompt 7.1 taxonomy reconciliation:
    // Other Services (₹8,750) = Transport (₹3,500) + Healthcare (₹2,720) + Education (₹1,750) + Others (₹780)
    const aggregatedOtherServices =
      transportSlice.amount + healthSlice.amount + eduSlice.amount + othersSlice.amount;
    expect(aggregatedOtherServices).toBe(kpis.otherServices.amount);

    // Category shares must sum to exactly 100%
    const totalSharePct = categorySlices.reduce((acc, s) => acc + s.sharePct, 0);
    expect(Math.round(totalSharePct * 10) / 10).toBe(100.0);

    // Total of category slice amounts must equal total monthly
    const sumOfSliceAmounts = categorySlices.reduce((acc, s) => acc + s.amount, 0);
    expect(sumOfSliceAmounts).toBe(kpis.totalMonthly.amount);
  });

  it('handles household scaling correctly with income, family size and lifestyle', () => {
    // Test higher income household
    const highIncomeData = calculateConsumptionDashboard(
      PROFILE_PRESETS.high_income,
      '6m',
      'Maharashtra'
    );
    expect(highIncomeData.kpis.totalMonthly.amount).toBeGreaterThan(42550);

    // Test rural household
    const ruralData = calculateConsumptionDashboard(
      PROFILE_PRESETS.rural,
      '6m',
      'Madhya Pradesh'
    );
    expect(ruralData.kpis.totalMonthly.amount).toBeLessThan(42550);

    // Frugal vs Discretionary lifestyle scaling
    const baseAssumptions = PROFILE_PRESETS.urban_middle;
    const frugalData = calculateConsumptionDashboard({
      ...baseAssumptions,
      lifestyle: 'frugal',
    });
    const discData = calculateConsumptionDashboard({
      ...baseAssumptions,
      lifestyle: 'discretionary',
    });

    expect(frugalData.kpis.totalMonthly.amount).toBeLessThan(42550);
    expect(discData.kpis.totalMonthly.amount).toBeGreaterThan(42550);
  });

  it('clamps invalid income and minimum family size bounds gracefully', () => {
    const edgeData = calculateConsumptionDashboard({
      profileType: 'custom',
      monthlyIncome: -5000,
      familySize: 0,
      location: 'India (All States)',
      lifestyle: 'moderate',
    });

    expect(edgeData.kpis.totalMonthly.amount).toBeGreaterThan(0);
    expect(Number.isFinite(edgeData.kpis.totalMonthly.amount)).toBe(true);
    expect(Number.isNaN(edgeData.kpis.totalMonthly.amount)).toBe(false);
  });

  it('computes trend points for 3m, 6m, and 1y periods with physical units', () => {
    const data3m = calculateConsumptionDashboard(PROFILE_PRESETS.urban_middle, '3m');
    expect(data3m.trendPoints.length).toBe(3);

    const data6m = calculateConsumptionDashboard(PROFILE_PRESETS.urban_middle, '6m');
    expect(data6m.trendPoints.length).toBe(6);

    const data1y = calculateConsumptionDashboard(PROFILE_PRESETS.urban_middle, '1y');
    expect(data1y.trendPoints.length).toBe(12);

    // Check physical units exist and are positive
    data6m.trendPoints.forEach((pt) => {
      expect(pt.fuelUnits).toBeGreaterThan(0);
      expect(pt.foodUnits).toBeGreaterThan(0);
      expect(pt.utilitiesUnits).toBeGreaterThan(0);
    });
  });

  it('calculates 12-month projections and summary metrics consistently', () => {
    const data = calculateConsumptionDashboard(PROFILE_PRESETS.urban_middle, '6m');

    expect(data.projectionPoints.length).toBe(12);

    const { projectionSummary, kpis } = data;
    expect(projectionSummary.currentEstimate).toBe(kpis.totalMonthly.amount);
    expect(projectionSummary.pessimistic).toBeGreaterThan(projectionSummary.currentEstimate);
    expect(projectionSummary.optimistic).toBeLessThan(projectionSummary.currentEstimate);

    // Reconciles with screenshot estimates: ~+10.2% and ~-9.7%
    expect(projectionSummary.pessimisticPct).toBeCloseTo(10.2, 0);
    expect(projectionSummary.optimisticPct).toBeCloseTo(-9.7, 0);
  });

  it('provides coherent commodities and state rankings', () => {
    const data = calculateConsumptionDashboard(PROFILE_PRESETS.urban_middle, '6m');

    expect(data.commodities.length).toBeGreaterThan(10);
    expect(data.stateVariations.length).toBe(8);

    // Top state must be Delhi
    expect(data.stateVariations[0].stateName).toBe('Delhi');
    expect(data.stateVariations[0].rank).toBe(1);

    // All commodity costs must be quantity * unitPrice * lifestyle
    data.commodities.forEach((c) => {
      expect(c.monthlyCost).toBeGreaterThan(0);
      expect(c.sparkline.length).toBe(6);
    });
  });
});
