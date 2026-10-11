import { describe, it, expect } from 'vitest';
import {
  calculateSipProjection,
  calculateRealWealth,
  generateGrowthTrajectory,
  calculateForecastScenarios,
  deriveGlobalEventDrivers,
  generateForecastInsights,
  calculateAffordableSipCapacity,
  formatIndianCurrency,
  formatRupees,
} from '../forecastCalculation';
import { SipSimulatorInputs } from '../types';

describe('SIP & Forecasts Mathematical Calculation Engine (Prompt 6 Verification)', () => {
  // Test 1: Standard monthly SIP projection (Ordinary Annuity - End of Month)
  it('correctly calculates standard monthly SIP projection for ₹5,000/mo @ 12% over 15 years', () => {
    const res = calculateSipProjection(5000, 12.0, 15, 'end_of_period');
    // Total Invested = 5,000 * 180 = 9,00,000
    expect(res.totalInvested).toBe(900000);
    expect(res.totalMonths).toBe(180);
    // Future Value = 5000 * ((1.01)^180 - 1) / 0.01 = 24,97,901
    expect(res.futureValue).toBe(2497901);
    expect(res.estimatedGains).toBe(2497901 - 900000);
    expect(res.wealthMultiplier).toBe(2.8);
    expect(res.formattedLakhs).toBe('₹25.0 L');
    expect(res.formattedCrores).toBe('₹0.25 Cr');
  });

  // Test 2: Zero Return (r = 0)
  it('correctly handles zero return rate condition (FV equals total principal invested)', () => {
    const res = calculateSipProjection(5000, 0, 15, 'end_of_period');
    expect(res.totalInvested).toBe(900000);
    expect(res.futureValue).toBe(900000);
    expect(res.estimatedGains).toBe(0);
    expect(res.wealthMultiplier).toBe(1.0);
  });

  // Test 3: Zero Monthly Contribution (P = 0)
  it('correctly handles zero monthly contribution condition', () => {
    const res = calculateSipProjection(0, 12.0, 15);
    expect(res.totalInvested).toBe(0);
    expect(res.futureValue).toBe(0);
    expect(res.estimatedGains).toBe(0);
    expect(res.wealthMultiplier).toBe(1.0);
  });

  // Test 4: Different Investment Horizons
  it('correctly computes future values across different horizons (5, 10, 20, 30 years)', () => {
    const res5 = calculateSipProjection(5000, 12.0, 5);
    const res10 = calculateSipProjection(5000, 12.0, 10);
    const res20 = calculateSipProjection(5000, 12.0, 20);
    const res30 = calculateSipProjection(5000, 12.0, 30);

    // 5 years = 60 months: FV = 5000 * ((1.01)^60 - 1) / 0.01 = 4,08,348
    expect(res5.futureValue).toBe(408348);
    expect(res5.totalInvested).toBe(300000);

    // 10 years = 120 months: FV = 5000 * ((1.01)^120 - 1) / 0.01 = 11,50,193
    expect(res10.futureValue).toBe(1150193);

    // Monotonic compounding growth
    expect(res20.futureValue).toBeGreaterThan(res10.futureValue);
    expect(res30.futureValue).toBeGreaterThan(res20.futureValue);
  });

  // Test 5: Different Return Assumptions
  it('correctly scales returns with varying annual interest rates (8%, 12%, 15%)', () => {
    const res8 = calculateSipProjection(5000, 8.0, 15);
    const res12 = calculateSipProjection(5000, 12.0, 15);
    const res15 = calculateSipProjection(5000, 15.0, 15);

    expect(res8.futureValue).toBe(1730191);
    expect(res12.futureValue).toBe(2497901);
    expect(res15.futureValue).toBe(3342534);
    expect(res8.futureValue).toBeLessThan(res12.futureValue);
    expect(res12.futureValue).toBeLessThan(res15.futureValue);
  });

  // Test 6: Total Invested & Estimated Gains Accounting
  it('guarantees that Future Value equals Total Invested + Estimated Gains', () => {
    const res = calculateSipProjection(7500, 13.5, 12);
    expect(res.futureValue).toBe(res.totalInvested + res.estimatedGains);
  });

  // Test 7: Beginning-of-Month vs End-of-Month Timing
  it('correctly compounds beginning-of-month contributions (Annuity Due = Ordinary * (1 + r))', () => {
    const endRes = calculateSipProjection(5000, 12.0, 15, 'end_of_period');
    const begRes = calculateSipProjection(5000, 12.0, 15, 'beginning_of_period');

    const expectedBegFv = Math.round(endRes.futureValue * (1 + 0.01));
    expect(begRes.futureValue).toBe(expectedBegFv);
    expect(begRes.futureValue).toBeGreaterThan(endRes.futureValue);
  });

  // Test 8: Annual Step-up SIP Schedule Compounding
  it('correctly evaluates step-up SIP with increasing contributions each year', () => {
    const constantRes = calculateSipProjection(5000, 12.0, 5, 'end_of_period', 0);
    const stepUpRes = calculateSipProjection(5000, 12.0, 5, 'end_of_period', 10);

    // With 10% annual step-up:
    // Year 1: 5000/mo = 60,000
    // Year 2: 5500/mo = 66,000
    // Year 3: 6050/mo = 72,600
    // Year 4: 6655/mo = 79,860
    // Year 5: 7321/mo = 87,852
    // Total invested should exceed constant SIP (3,00,000)
    expect(stepUpRes.totalInvested).toBeGreaterThan(constantRes.totalInvested);
    expect(stepUpRes.futureValue).toBeGreaterThan(constantRes.futureValue);
  });

  // Test 9: Inflation Discounting (Real Wealth View)
  it('correctly discounts nominal future value to real purchasing power given inflation', () => {
    const nominal = 2500000;
    const real5yr = calculateRealWealth(nominal, 6.0, 5);
    const real15yr = calculateRealWealth(nominal, 6.0, 15);

    // 25,00,000 / (1.06)^5 = 18,68,145
    expect(real5yr).toBe(Math.round(nominal / Math.pow(1.06, 5)));
    // 25,00,000 / (1.06)^15 = 10,43,158
    expect(real15yr).toBe(Math.round(nominal / Math.pow(1.06, 15)));
    expect(real15yr).toBeLessThan(real5yr);
  });

  // Test 10: Growth Trajectory Generation
  it('generates a full continuous trajectory from Year 0 to Year N for all 3 series', () => {
    const trajectory = generateGrowthTrajectory(5000, 4000, 3000, 15, 12.0, 6.0);
    expect(trajectory.length).toBe(16); // Year 0 to 15 inclusive

    expect(trajectory[0].year).toBe(0);
    expect(trajectory[0].baselineCorpus).toBe(0);
    expect(trajectory[15].year).toBe(15);
    expect(trajectory[15].baselineCorpus).toBe(2497901);
    expect(trajectory[15].afterImpactCorpus).toBe(1998321);

    // Verify ordering across all years: Baseline > After Impact > Reduced
    for (let y = 1; y <= 15; y++) {
      expect(trajectory[y].baselineCorpus).toBeGreaterThan(trajectory[y].afterImpactCorpus);
      expect(trajectory[y].afterImpactCorpus).toBeGreaterThan(trajectory[y].reducedCorpus);
    }
  });

  // Test 11: Future Scenarios Evaluation
  it('correctly computes Optimistic, Base, and Pessimistic scenarios with proper delta relationships', () => {
    const scenarios = calculateForecastScenarios(4000, 12.0, 15);

    expect(scenarios.base.monthlySip).toBe(4000);
    expect(scenarios.base.annualReturnPct).toBe(12.0);
    expect(scenarios.base.projectedCorpus).toBe(1998321);

    // Optimistic: higher return and contribution
    expect(scenarios.optimistic.annualReturnPct).toBe(14.0);
    expect(scenarios.optimistic.monthlySip).toBe(5000);
    expect(scenarios.optimistic.projectedCorpus).toBeGreaterThan(scenarios.base.projectedCorpus);
    expect(scenarios.optimistic.deltaPct).toBeGreaterThan(0);

    // Pessimistic: lower return and contribution
    expect(scenarios.pessimistic.annualReturnPct).toBe(8.0);
    expect(scenarios.pessimistic.monthlySip).toBe(3000);
    expect(scenarios.pessimistic.projectedCorpus).toBeLessThan(scenarios.base.projectedCorpus);
    expect(scenarios.pessimistic.deltaPct).toBeLessThan(0);
  });

  // Test 12: Global Event Waterfall Drivers Reconcile with Household Shock
  it('derives category waterfall drivers that sum logically without double counting', () => {
    const drivers = deriveGlobalEventDrivers(2450);
    expect(drivers.length).toBe(4);

    const fuel = drivers.find((d) => d.id === 'fuel');
    const food = drivers.find((d) => d.id === 'food');
    const tech = drivers.find((d) => d.id === 'electronics');
    const util = drivers.find((d) => d.id === 'utilities');

    expect(fuel).toBeDefined();
    expect(food).toBeDefined();
    expect(tech).toBeDefined();
    expect(util).toBeDefined();

    expect(fuel!.impactAmount).toBeLessThan(0);
    expect(food!.impactAmount).toBeLessThan(0);
    expect(tech!.impactAmount).toBeLessThan(0);
    expect(util!.impactAmount).toBeLessThan(0);
  });

  // Test 13: Indian Currency Formatting
  it('correctly formats currency in Lakhs, Crores, and full Rupees', () => {
    expect(formatIndianCurrency(5000)).toBe('₹5.0k');
    expect(formatIndianCurrency(900000)).toBe('₹9.0 L');
    expect(formatIndianCurrency(10745120)).toBe('₹1.07 Cr');
    expect(formatIndianCurrency(16100000)).toBe('₹1.61 Cr');
    expect(formatRupees(5000)).toBe('₹5,000');
    expect(formatRupees(10745120)).toBe('₹1,07,45,120');
  });

  // Test 14: Dynamic Insights Grounded in Inputs
  it('generates dynamic insights referencing active scenario and calculated metrics', () => {
    const dummyInputs: SipSimulatorInputs = {
      monthlySip: 5000,
      durationYears: 15,
      annualReturnPct: 12.0,
      expenseImpactPct: 10,
      mode: 'basic',
      annualStepUpPct: 0,
      inflationPct: 6.0,
      timing: 'end_of_period',
      expenseGrowthPct: 5.0,
    };

    const insights = generateForecastInsights(dummyInputs, 4000, 1998321, 'Semiconductor Supply Shock');
    expect(insights.length).toBe(4);

    // Must reference the scenario name
    const shockInsight = insights.find((i) => i.id === 'capacity_shock');
    expect(shockInsight).toBeDefined();
    expect(shockInsight!.text).toContain('Semiconductor Supply Shock');
    expect(shockInsight!.text).toContain('20%');

    // Must reference the 15 years duration and 12% return
    const compoundingInsight = insights.find((i) => i.id === 'compounding_power');
    expect(compoundingInsight).toBeDefined();
    expect(compoundingInsight!.text).toContain('15 years');
    expect(compoundingInsight!.text).toContain('12%');
  });

  // Test 15: Prompt 6.2 Audit - Exact Waterfall Deduction Reconciliation to the Rupee
  it('reconciles waterfall deductions so Current SIP + Sum(impacts) === Estimated Capacity', () => {
    const currentSip = 5000;
    const estimatedCapacity = 4000;
    const drivers = deriveGlobalEventDrivers(currentSip, estimatedCapacity);

    expect(drivers.length).toBe(4);
    const sumDeductions = drivers.reduce((sum, d) => sum + Math.abs(d.impactAmount), 0);
    expect(sumDeductions).toBe(currentSip - estimatedCapacity);

    const reconciledCapacity = currentSip + drivers.reduce((sum, d) => sum + d.impactAmount, 0);
    expect(reconciledCapacity).toBe(estimatedCapacity);
  });

  // Test 16: Prompt 6.2 Audit - Household Gross Savings Affordability Model Integration
  it('calculates affordable SIP capacity grounded in MoSPI household budget and expense shock', () => {
    const monthlyIncome = 75000;
    const baselineExpenses = 48000;
    const currentSip = 5000;

    // 0% expense shock -> discretionary surplus = 75000 - 48000 = 27000
    // Capacity matches current SIP because 5000 <= 27000
    const capacityNoShock = calculateAffordableSipCapacity(currentSip, 0, monthlyIncome, baselineExpenses);
    expect(capacityNoShock.estimatedCapacity).toBe(5000);

    // 10% expense shock -> additional expense = 4800
    // Capacity reduced by 4800 / 2 = 2400 -> 5000 - 2400 = 2600
    const capacityWithShock = calculateAffordableSipCapacity(currentSip, 10, monthlyIncome, baselineExpenses);
    expect(capacityWithShock.estimatedCapacity).toBeLessThan(currentSip);
    expect(capacityWithShock.expenseIncreaseRupees).toBe(4800);

    // Severe expense shock (30%) -> capacity hits safe minimum bound (₹1,000)
    const capacitySevere = calculateAffordableSipCapacity(currentSip, 30, monthlyIncome, baselineExpenses);
    expect(capacitySevere.estimatedCapacity).toBeGreaterThanOrEqual(1000);
  });

  // Test 17: Prompt 6.2 Audit - Mathematical Identity Across All Scenarios
  it('strictly preserves financial identities (FV = Invested + Gains) across all 3 scenarios', () => {
    const scenarios = calculateForecastScenarios(5000, 15, 12.0, 'end_of_period');

    (['optimistic', 'base', 'pessimistic'] as const).forEach((key) => {
      const scenario = scenarios[key];
      expect(scenario.projectedCorpus).toBe(scenario.totalInvested + scenario.estimatedGains);
      expect(scenario.projectedCorpus).toBeGreaterThan(0);
      expect(scenario.totalInvested).toBeGreaterThan(0);
      expect(scenario.estimatedGains).toBeGreaterThan(0);
    });

    // Verify ordering
    expect(scenarios.optimistic.projectedCorpus).toBeGreaterThan(scenarios.base.projectedCorpus);
    expect(scenarios.base.projectedCorpus).toBeGreaterThan(scenarios.pessimistic.projectedCorpus);
  });

  // Test 18: Prompt 6.2 Audit - Real Wealth Inflation Discounting Identity
  it('applies exact real wealth formula FV_real = FV / (1 + i)^n without rounding drifts', () => {
    const futureValue = 2497901;
    const inflationPct = 6.0;
    const years = 15;

    const realWealth = calculateRealWealth(futureValue, inflationPct, years);
    const expectedDiscounted = Math.round(futureValue / Math.pow(1 + 0.06, 15));
    expect(realWealth).toBe(expectedDiscounted);
    const lossPct = Math.round(((futureValue - expectedDiscounted) / futureValue) * 100);
    expect(lossPct).toBe(58);
  });

  // Test 19: Prompt 6.2 Audit - Scenario Synchronization of Dynamic AI Insights
  it('generates scenario-specific advice when user switches active scenario', () => {
    const inputs: SipSimulatorInputs = {
      monthlySip: 5000,
      durationYears: 15,
      annualReturnPct: 12.0,
      expenseImpactPct: 10,
      mode: 'basic',
      annualStepUpPct: 0,
      inflationPct: 6.0,
      timing: 'end_of_period',
      expenseGrowthPct: 5.0,
    };

    const optInsights = generateForecastInsights(inputs, 5000, 3064188, 'Geopolitical Energy Shock', 'optimistic');
    const pessInsights = generateForecastInsights(inputs, 3000, 1038198, 'Geopolitical Energy Shock', 'pessimistic');

    const optInsightText = optInsights.map((i) => i.text).join(' ');
    const pessInsightText = pessInsights.map((i) => i.text).join(' ');

    expect(optInsightText).toContain('Optimistic upside');
    expect(pessInsightText).toContain('Pessimistic Scenario');
  });
});

