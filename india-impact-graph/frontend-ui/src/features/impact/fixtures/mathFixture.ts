/**
 * TEST FIXTURE ONLY — HYPOTHETICAL DEMO VALUES
 * Section 7.6 Approved Mathematical Fixture
 * Not an authoritative economic finding.
 */

import type { PersonaImpactSummary } from '../../../types/contracts';

export const mathVerificationFixture: PersonaImpactSummary = {
  personaId: 'mp_rural_middle_fixture',
  mpceValueInr: 3000,
  officialAvgHouseholdSize: 4.5,
  unit: '₹ / person / month (Per Capita)',
  isPerCapita: true,
  totalImpactLowInr: 5.4,
  totalImpactHighInr: 8.1,
  items: [
    {
      itemId: 'verified_item_demo',
      itemName: 'Commute Petrol',
      status: 'calculated',
      spendingInr: 150.0, // MPCE (3000) * weight (0.05)
      expenditureWeightPct: 5.0,
      upstreamShockPct: 12.0, // +12%
      passThroughLow: 0.3,
      passThroughHigh: 0.45,
      monthlyImpactLowInr: 5.4, // 150 * 0.12 * 0.30
      monthlyImpactHighInr: 8.1, // 150 * 0.12 * 0.45
      receipt: {
        source_title: 'MoSPI HCES 2023-24 & Mathematical Formula',
        source_url: 'https://mospi.gov.in',
        table_or_series_id: 'MATH-SPEC-7.6',
        year_or_date: '2026',
        geography: 'Madhya Pradesh',
        unit: 'INR/person/month',
        verification_status: '[VERIFIED]',
        formula_details: 'Cost_low = 3000 * 0.05 * 0.12 * 0.30 = 5.40; Cost_high = 3000 * 0.05 * 0.12 * 0.45 = 8.10',
      },
    },
    {
      itemId: 'uncalculated_item_demo',
      itemName: 'Edible Oil (Mustard)',
      status: 'data_not_available',
      spendingInr: undefined,
      expenditureWeightPct: 4.2,
      upstreamShockPct: undefined,
      passThroughLow: undefined,
      passThroughHigh: undefined,
      monthlyImpactLowInr: undefined,
      monthlyImpactHighInr: undefined,
      receipt: undefined,
      unavailableReason: 'Pass-through elasticity dataset unverified for edible oil.',
    },
  ],
  coverage: {
    calculatedItemsCount: 1,
    totalCandidateItemsCount: 2,
    expenditureCoveragePct: 50.0,
    uncalculatedItemNames: ['Edible Oil (Mustard)'],
  },
};
