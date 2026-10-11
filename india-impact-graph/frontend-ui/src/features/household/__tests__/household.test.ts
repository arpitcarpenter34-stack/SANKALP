import { describe, it, expect } from 'vitest';
import {
  PROFILE_PRESETS,
  calculateHouseholdImpact,
  calculateSipCorpus,
} from '../householdData';

describe('Household Impact Calculation Engine & Financial Logic Audit', () => {
  it('correctly calculates Urban Middle Class baseline scenario matching exact accounting identity', () => {
    const data = calculateHouseholdImpact(PROFILE_PRESETS.urban_middle);

    // 1. Income & Expenses
    expect(data.financials.monthlyIncome).toBe(60000);
    expect(data.financials.totalMonthlyExpenses).toBe(42550);
    expect(data.financials.baselineExpenses).toBe(40100);
    expect(data.financials.expenseImpact).toBe(2450);
    expect(data.financials.expensesChangePct).toBeCloseTo(6.1, 0.5);

    // 2. Category Breakdown increases sum exactly to expenseImpact (no double counting)
    const sumCategoryIncreases = data.categories.reduce(
      (sum, cat) => sum + cat.increaseAmount,
      0
    );
    expect(sumCategoryIncreases).toBe(data.financials.expenseImpact);

    // 3. Category Shares sum to 100%
    const sumShares = data.categories.reduce((sum, cat) => sum + cat.sharePct, 0);
    expect(sumShares).toBeCloseTo(100, 0.1);

    // 4. Personal Finance Terminology Separation (Prompt 5.2 Priority One)
    // Gross Savings = Income - Expenses = 60,000 - 42,550 = 17,450
    expect(data.financials.grossSavings).toBe(17450);
    expect(data.financials.baselineGrossSavings).toBe(19900);

    // Net Remaining Surplus = Gross Savings - Current SIP = 17,450 - 5,000 = 12,450
    expect(data.financials.remainingSurplus).toBe(12450);
    expect(data.financials.baselineRemainingSurplus).toBe(14900);

    // Exact Accounting Identity Verification:
    // Income = Total Expenses + Current SIP + Remaining Net Surplus
    expect(
      data.financials.totalMonthlyExpenses +
      data.assumptions.currentSip +
      data.financials.remainingSurplus
    ).toBe(data.financials.monthlyIncome);

    // 5. SIP Affordability Capacity derived from gross savings (no double counting)
    expect(data.financials.sipCapacity).toBe(4000);
    expect(data.financials.baselineSipCapacity).toBe(5000);
    expect(data.financials.sipChangePct).toBe(-20.0);
  });

  it('handles family size scaling deterministically', () => {
    const base4 = calculateHouseholdImpact({
      ...PROFILE_PRESETS.urban_middle,
      familySize: 4,
    });
    const larger5 = calculateHouseholdImpact({
      ...PROFILE_PRESETS.urban_middle,
      familySize: 5,
    });

    // A larger family size increases monthly expenses
    expect(larger5.financials.totalMonthlyExpenses).toBeGreaterThan(
      base4.financials.totalMonthlyExpenses
    );
  });

  it('handles consumption pattern scaling correctly', () => {
    const frugal = calculateHouseholdImpact({
      ...PROFILE_PRESETS.urban_middle,
      consumptionPattern: 'frugal',
    });
    const discretionary = calculateHouseholdImpact({
      ...PROFILE_PRESETS.urban_middle,
      consumptionPattern: 'discretionary',
    });

    expect(frugal.financials.totalMonthlyExpenses).toBeLessThan(
      discretionary.financials.totalMonthlyExpenses
    );
  });

  it('clamps invalid or extreme income values safely without NaN', () => {
    const extremeLow = calculateHouseholdImpact({
      ...PROFILE_PRESETS.urban_middle,
      monthlyIncome: -5000,
    });

    expect(extremeLow.financials.monthlyIncome).toBeGreaterThanOrEqual(10000);
    expect(Number.isNaN(extremeLow.financials.totalMonthlyExpenses)).toBe(false);
    expect(Number.isNaN(extremeLow.financials.grossSavings)).toBe(false);
    expect(Number.isNaN(extremeLow.financials.remainingSurplus)).toBe(false);
    expect(Number.isNaN(extremeLow.financials.sipCapacity)).toBe(false);
  });

  it('generates traceable causal insights referencing actual numbers', () => {
    const data = calculateHouseholdImpact(PROFILE_PRESETS.urban_middle);
    expect(data.insights.length).toBeGreaterThanOrEqual(5);

    const fuelInsight = data.insights.find((i) => i.id === 'fuel');
    expect(fuelInsight).toBeDefined();
    expect(fuelInsight?.text).toContain('Fuel price increase');

    const sipInsight = data.insights.find((i) => i.id === 'sip');
    expect(sipInsight).toBeDefined();
    expect(sipInsight?.text).toContain('5,000');
  });
});

describe('SIP Wealth Projection & Compound Interest Engine (Prompt 5.2 Priority Two)', () => {
  it('correctly calculates standard 15-year SIP at 12% p.a. (End of Period)', () => {
    const result = calculateSipCorpus(5000, 12.0, 15, 'end_of_period');

    // Total months: 180
    expect(result.totalMonths).toBe(180);
    // Total principal invested: 5000 * 180 = 9,00,000 (9.0 Lakhs)
    expect(result.totalInvested).toBe(900000);
    // Exact future value: ~24,97,902
    expect(result.futureValue).toBeCloseTo(2497902, -2);
    // Estimated gains = FV - principal: ~15,97,902
    expect(result.estimatedGains).toBeCloseTo(1597902, -2);
    expect(result.formattedLakhs).toBe('₹24.98 L');
  });

  it('correctly calculates beginning-of-period timing (Annuity Due)', () => {
    const endResult = calculateSipCorpus(5000, 12.0, 15, 'end_of_period');
    const begResult = calculateSipCorpus(5000, 12.0, 15, 'beginning_of_period');

    // Beginning of period accrues 1 extra month of interest: FV_beg = FV_end * (1 + r)
    const monthlyRate = 0.12 / 12;
    expect(begResult.futureValue).toBeCloseTo(Math.round(endResult.futureValue * (1 + monthlyRate)), -2);
    expect(begResult.formattedLakhs).toBe('₹25.23 L');
  });

  it('handles zero interest rate condition correctly', () => {
    const zeroRate = calculateSipCorpus(5000, 0, 15);
    // At 0% return, FV must equal total principal invested
    expect(zeroRate.totalInvested).toBe(900000);
    expect(zeroRate.futureValue).toBe(900000);
    expect(zeroRate.estimatedGains).toBe(0);
    expect(zeroRate.formattedLakhs).toBe('₹9.00 L');
  });

  it('handles zero contribution correctly', () => {
    const zeroContrib = calculateSipCorpus(0, 12.0, 15);
    expect(zeroContrib.totalInvested).toBe(0);
    expect(zeroContrib.futureValue).toBe(0);
    expect(zeroContrib.estimatedGains).toBe(0);
    expect(zeroContrib.formattedLakhs).toBe('₹0.00 L');
  });

  it('handles different durations (5, 10, 20 years)', () => {
    const res5 = calculateSipCorpus(5000, 12.0, 5);
    const res10 = calculateSipCorpus(5000, 12.0, 10);
    const res20 = calculateSipCorpus(5000, 12.0, 20);

    expect(res5.futureValue).toBeLessThan(res10.futureValue);
    expect(res10.futureValue).toBeLessThan(res20.futureValue);

    // 5 years (60 months) @ 12%: FV is ~4.08 Lakhs
    expect(res5.totalInvested).toBe(300000);
    expect(res5.futureValue).toBeCloseTo(408348, -2);
  });

  it('handles different annual return assumptions (8%, 12%, 15%)', () => {
    const res8 = calculateSipCorpus(5000, 8.0, 15);
    const res12 = calculateSipCorpus(5000, 12.0, 15);
    const res15 = calculateSipCorpus(5000, 15.0, 15);

    expect(res8.futureValue).toBeLessThan(res12.futureValue);
    expect(res12.futureValue).toBeLessThan(res15.futureValue);
  });

  it('calculates corpus difference between baseline and after-impact contributions accurately', () => {
    const baseline = calculateSipCorpus(5000, 12.0, 15);
    const afterImpact = calculateSipCorpus(4000, 12.0, 15);

    const delta = baseline.futureValue - afterImpact.futureValue;
    // Delta between 5K/mo and 4K/mo over 15 yrs is ~4.99 Lakhs
    expect(delta).toBeCloseTo(499580, -2);
    expect(afterImpact.formattedLakhs).toBe('₹19.98 L');
  });
});
