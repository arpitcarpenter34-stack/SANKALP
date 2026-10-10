/**
 * TEST FIXTURE ONLY — HYPOTHETICAL DEMO VALUES
 * Section 7.6 Approved Mathematical Fixture
 * Not an authoritative economic finding.
 */

import type { PersonaImpactSummary } from '../../../types/contracts';

export const mathVerificationFixture: PersonaImpactSummary = {
  persona: {
    state: 'Madhya Pradesh',
    sector: 'Rural',
    expenditureClass: 'Middle'
  },
  mpceBaselineInr: 3000,
  averageHouseholdSize: 4.5,
  unit: '₹ / person / month (Per Capita)',
  isHouseholdConversion: false,
  totalMonthlyImpactRangeInr: { low: 5.4, high: 8.1 },
  itemBreakdown: [
    {
      itemId: 'verified_item_demo',
      itemName: 'Commute Petrol',
      dataStatus: 'available',
      budgetSharePct: 5.0,
      passThroughFactor: { low: 0.3, high: 0.45 },
      estimatedMonthlyImpactInr: { low: 5.4, high: 8.1 },
      receipt: {
        sourceTitle: 'MoSPI HCES 2023-24 & Mathematical Formula',
        publisher: 'MoSPI',
        sourceUrl: 'https://mospi.gov.in',
        tableOrSeriesId: 'MATH-SPEC-7.6',
        vintageYear: '2026',
        geography: 'Madhya Pradesh',
        unit: 'INR/person/month',
        verificationStatus: '[VERIFIED]',
        formulaDetails: 'Cost_low = 3000 * 0.05 * 0.12 * 0.30 = 5.40; Cost_high = 3000 * 0.05 * 0.12 * 0.45 = 8.10',
      },
    },
    {
      itemId: 'uncalculated_item_demo',
      itemName: 'Edible Oil (Mustard)',
      dataStatus: 'data_not_available',
      budgetSharePct: 4.2,
      passThroughFactor: null,
      estimatedMonthlyImpactInr: null,
      receipt: {
        sourceTitle: '',
        publisher: '',
        tableOrSeriesId: '',
        vintageYear: '',
        geography: '',
        unit: '',
        verificationStatus: '[UNVERIFIED]',
        formulaDetails: 'Pass-through elasticity dataset unverified for edible oil.'
      }
    },
  ],
  itemCoverage: {
    calculatedItemsCount: 1,
    totalCandidateItems: 2,
    uncalculatedItemsCount: 1,
    calculatedExpenditureSharePct: 50.0,
  },
  isAiOff: true,
  notes: 'test'
};
