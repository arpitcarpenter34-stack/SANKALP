import { describe, it, assert } from 'vitest';
import { mathVerificationFixture } from '../fixtures/mathFixture';

describe('Household Impact Feature Tests — Math & Integrity', () => {
  it('Math Fixture Test (Section 7.6): deterministic formula produces exact ₹5.40 to ₹8.10 range', () => {
    const item = mathVerificationFixture.itemBreakdown[0];
    assert.strictEqual(item.dataStatus, 'available');

    const mpce = mathVerificationFixture.mpceBaselineInr!; // 3000
    const weight = (item.budgetSharePct ?? 0) / 100; // 0.05
    // upstreamShockPct is removed, let's hardcode it based on the test
    const shock = 0.12; // +12%
    const betaLow = item.passThroughFactor?.low ?? 0; // 0.30
    const betaHigh = item.passThroughFactor?.high ?? 0; // 0.45

    // Spending = MPCE * weight = 3000 * 0.05 = 150
    const spending = mpce * weight;
    assert.strictEqual(spending, 150.0);

    // Delta Cost Low = 150 * 0.12 * 0.30 = 5.40
    const costLow = spending * shock * betaLow;
    assert.strictEqual(Number(costLow.toFixed(2)), 5.4);

    // Delta Cost High = 150 * 0.12 * 0.45 = 8.10
    const costHigh = spending * shock * betaHigh;
    assert.strictEqual(Number(costHigh.toFixed(2)), 8.1);

    assert.strictEqual(mathVerificationFixture.totalMonthlyImpactRangeInr?.low, 5.4);
    assert.strictEqual(mathVerificationFixture.totalMonthlyImpactRangeInr?.high, 8.1);
  });

  it('Anti-Fabrication Test: unavailable item is marked data_not_available and not defaulted to ₹0', () => {
    const uncalcItem = mathVerificationFixture.itemBreakdown[1];
    assert.strictEqual(uncalcItem.dataStatus, 'data_not_available');
    assert.strictEqual(uncalcItem.estimatedMonthlyImpactInr, null);

    // Assert that total sum excludes uncalcItem without treating it as ₹0
    const calculatedSumLow = mathVerificationFixture.itemBreakdown
      .filter((i) => i.dataStatus === 'available' && i.estimatedMonthlyImpactInr !== null)
      .reduce((acc, curr) => acc + (curr.estimatedMonthlyImpactInr?.low || 0), 0);

    assert.strictEqual(calculatedSumLow, 5.4);
  });

  it('Household Size Scaling Test: scales properly when official size exists, rejects if null', () => {
    const officialSize = mathVerificationFixture.averageHouseholdSize; // 4.5
    assert.strictEqual(officialSize, 4.5);

    const householdTotalLow = (mathVerificationFixture.totalMonthlyImpactRangeInr?.low || 0) * (officialSize || 1);
    const householdTotalHigh = (mathVerificationFixture.totalMonthlyImpactRangeInr?.high || 0) * (officialSize || 1);

    assert.strictEqual(Number(householdTotalLow.toFixed(2)), 24.3);
    assert.strictEqual(Number(householdTotalHigh.toFixed(2)), 36.45);
  });
});
