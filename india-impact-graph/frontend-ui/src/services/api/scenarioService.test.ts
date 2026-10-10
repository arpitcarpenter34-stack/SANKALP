import { describe, it, expect } from 'vitest';
import { scenarioService } from './scenarioService';
import {
  calculatePersonaImpact,
  MOSPI_HCES_FACTSHEET_URL,
  MOSPI_HCES_FINAL_REPORT_URL,
} from './mockData';
import { isValidAnalysisPayload } from './apiClient';

describe('scenarioService & Deterministic Engine (Phase 3.1 Corrective Audit)', () => {
  it('retrieves pre-configured benchmark scenarios', async () => {
    const scenarios = await scenarioService.getScenarios();
    expect(scenarios.length).toBeGreaterThanOrEqual(3);

    const ids = scenarios.map((s) => s.id);
    expect(ids).toContain('crude-oil-12pct');
    expect(ids).toContain('edible-oil-tariff');
    expect(ids).toContain('wheat-procurement-spike');
  });

  it('evaluates Crude Oil scenario with deterministic calculation anchored to Table 2', async () => {
    const result = await scenarioService.analyzeScenario('crude-oil-12pct');

    expect(result.scenario.id).toBe('crude-oil-12pct');
    expect(result.graph.nodes.length).toBeGreaterThanOrEqual(5);

    // Official State Average MPCE from Table 2 (Rural MP: ₹3,441)
    expect(result.persona.mpceBaselineInr).toBe(3441);
    expect(result.persona.mpceBaselineReceipt?.verificationStatus).toBe('[VERIFIED]');
    expect(result.persona.mpceBaselineReceipt?.tableOrSeriesId).toBe('Table 2');
    expect(result.persona.mpceBaselineReceipt?.sourceUrl).toBe(MOSPI_HCES_FACTSHEET_URL);

    // Conveyance Fuel has unverified pass-through now, so impact is null
    expect(result.persona.totalMonthlyImpactRangeInr).toBeNull();
    expect(result.isLiveBackend).toBe(false);
    expect(result.dataSourceLabel).toContain('DEMO FIXTURE');

    // Unsupported fuel-to-vegetable factor must be strictly null
    const vegItem = result.persona.itemBreakdown.find((i) => i.itemId === 'food_vegetables');
    expect(vegItem).toBeDefined();
    expect(vegItem?.passThroughFactor).toBeNull();
    expect(vegItem?.estimatedMonthlyImpactInr).toBeNull();
    expect(vegItem?.dataStatus).toBe('data_not_available');
  });

  it('evaluates Edible Oil scenario with tailored nodes', async () => {
    const result = await scenarioService.analyzeScenario('edible-oil-tariff');

    expect(result.scenario.id).toBe('edible-oil-tariff');
    expect(result.graph.nodes.some((n) => n.id === 'tariff_hike')).toBe(true);
    expect(result.persona.itemBreakdown.some((i) => i.itemId === 'edible_oil_pack')).toBe(true);
  });

  it('evaluates Wheat Procurement scenario with PMGKAY caveat', async () => {
    const result = await scenarioService.analyzeScenario('wheat-procurement-spike');

    expect(result.scenario.id).toBe('wheat-procurement-spike');
    expect(result.graph.nodes.some((n) => n.id === 'pmgkay_safety')).toBe(true);
  });

  it('handles custom news dispatch and marks it strictly as [UNVERIFIED] with null impact', async () => {
    const customText = 'OPEC unexpectedly announces 2 million barrel per day quota reduction.';
    const result = await scenarioService.analyzeScenario('custom', customText);

    expect(result.scenario.id).toBe('custom');
    expect(result.scenario.sourceReceipt.verificationStatus).toBe('[UNVERIFIED]');
    // Never substitute 0 for missing data: totalMonthlyImpactRangeInr must be null for unverified text!
    expect(result.persona.totalMonthlyImpactRangeInr).toBeNull();
    expect(result.persona.notes).toContain('No numerical estimate is produced — Data not available');
    expect(result.persona.itemBreakdown[0].dataStatus).toBe('data_not_available');
    expect(result.persona.itemBreakdown[0].estimatedMonthlyImpactInr).toBeNull();
  });

  it('recalculates persona impact dynamically when sector switches to Urban', () => {
    const rural = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Middle',
    });

    const urban = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Urban',
      expenditureClass: 'Middle',
    });

    // Official State Average MPCE from Table 2: Rural MP = ₹3,441, Urban MP = ₹5,538
    expect(rural.mpceBaselineInr).toBe(3441);
    expect(urban.mpceBaselineInr).toBe(5538);
    // Since crude oil has no verified pass-through, both should be null
    expect(urban.totalMonthlyImpactRangeInr).toBeNull();
    expect(rural.totalMonthlyImpactRangeInr).toBeNull();
  });

  it('strictly verifies official Table 2 baselines vs explicitly labeled synthetic fractiles', () => {
    // Middle classes: Official State Averages from Table 2
    const ruralMiddle = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Middle',
    });
    expect(ruralMiddle.mpceBaselineInr).toBe(3441);
    expect(ruralMiddle.mpceBaselineReceipt?.verificationStatus).toBe('[VERIFIED]');
    expect(ruralMiddle.mpceBaselineReceipt?.sourceUrl).toBe(MOSPI_HCES_FACTSHEET_URL);

    const urbanMiddle = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Urban',
      expenditureClass: 'Middle',
    });
    expect(urbanMiddle.mpceBaselineInr).toBe(5538);
    expect(urbanMiddle.mpceBaselineReceipt?.verificationStatus).toBe('[VERIFIED]');
    expect(urbanMiddle.mpceBaselineReceipt?.sourceUrl).toBe(MOSPI_HCES_FACTSHEET_URL);

    // Low & High classes: Explicitly labeled synthetic demo calibrations
    const ruralLow = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Low',
    });
    expect(ruralLow.mpceBaselineInr).toBe(1850);
    expect(ruralLow.mpceBaselineReceipt?.verificationStatus).toBe('[UNVERIFIED]');
    expect(ruralLow.mpceBaselineReceipt?.sourceTitle).toContain('Synthetic Demo Fractile');

    const ruralHigh = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'High',
    });
    expect(ruralHigh.mpceBaselineInr).toBe(6120);
    expect(ruralHigh.mpceBaselineReceipt?.verificationStatus).toBe('[UNVERIFIED]');

    const urbanLow = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Urban',
      expenditureClass: 'Low',
    });
    expect(urbanLow.mpceBaselineInr).toBe(2940);
    expect(urbanLow.mpceBaselineReceipt?.verificationStatus).toBe('[UNVERIFIED]');

    const urbanHigh = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Urban',
      expenditureClass: 'High',
    });
    expect(urbanHigh.mpceBaselineInr).toBe(10450);
    expect(urbanHigh.mpceBaselineReceipt?.verificationStatus).toBe('[UNVERIFIED]');
  });

  it('proves that unsupported fuel-to-vegetable factor is removed and excluded from numerical totals', () => {
    const persona = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Middle',
    });

    const vegItem = persona.itemBreakdown.find((i) => i.itemId === 'food_vegetables');
    expect(vegItem).toBeDefined();
    expect(vegItem?.passThroughFactor).toBeNull();
    expect(vegItem?.estimatedMonthlyImpactInr).toBeNull();
    expect(vegItem?.dataStatus).toBe('data_not_available');
    expect(vegItem?.receipt.sourceUrl).toBe(MOSPI_HCES_FINAL_REPORT_URL);
    expect(vegItem?.receipt.caveats).toContain(
      'Per strict data-integrity rule: Factor set to null; no numerical monetary estimate is produced.'
    );

    // Total monthly impact range is null because Conveyance fuel pass-through is unverified
    const commuteItem = persona.itemBreakdown.find((i) => i.itemId === 'commute_fuel');
    expect(commuteItem).toBeDefined();
    expect(commuteItem?.estimatedMonthlyImpactInr).toBeNull();
    expect(persona.totalMonthlyImpactRangeInr).toBeNull();
  });

  it('guarantees unavailable data is never converted to 0 and transparent coverage is displayed', () => {
    const persona = calculatePersonaImpact('crude-oil-12pct', {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Middle',
    });

    const uncalculated = persona.itemBreakdown.filter((i) => i.dataStatus === 'data_not_available');
    expect(uncalculated.length).toBeGreaterThan(0);

    for (const item of uncalculated) {
      expect(item.estimatedMonthlyImpactInr).toBeNull();
      expect(item.estimatedMonthlyImpactInr).not.toBe(0);
      expect(item.passThroughFactor).toBeNull();
    }

    expect(persona.itemCoverage.calculatedItemsCount).toBe(0);
    expect(persona.itemCoverage.uncalculatedItemsCount).toBe(10);
    // Calculated share is strictly 0 because crude oil pass-through is unverified
    expect(persona.itemCoverage.calculatedExpenditureSharePct).toBe(0);
  });

  it('validates backend API payload contract and rejects malformed responses even on HTTP 200', () => {
    // Valid payload structure
    const validPayload = {
      scenario: {
        id: 'test-scenario',
        title: 'Test Shock',
        sourceReceipt: { sourceTitle: 'Test Source', verificationStatus: '[VERIFIED]' },
      },
      graph: {
        nodes: [{ id: 'n1', label: 'Node 1', type: 'commodity' }],
        edges: [],
      },
      persona: {
        persona: { state: 'MP', sector: 'Rural', expenditureClass: 'Middle' },
        itemBreakdown: [],
        itemCoverage: { totalCandidateItems: 5, calculatedItemsCount: 1 },
      },
    };
    expect(isValidAnalysisPayload(validPayload)).toBe(true);

    // Missing scenario
    expect(isValidAnalysisPayload({ ...validPayload, scenario: null })).toBe(false);

    // Empty nodes array
    expect(
      isValidAnalysisPayload({
        ...validPayload,
        graph: { nodes: [], edges: [] },
      })
    ).toBe(false);

    // Missing persona or itemBreakdown
    expect(
      isValidAnalysisPayload({
        ...validPayload,
        persona: { persona: null },
      })
    ).toBe(false);

    // Non-object or null
    expect(isValidAnalysisPayload(null)).toBe(false);
    expect(isValidAnalysisPayload('invalid string')).toBe(false);
  });

  it('properly throws when error simulation is enabled for testing error states', async () => {
    await expect(
      scenarioService.analyzeScenario('crude-oil-12pct', undefined, false, undefined, true)
    ).rejects.toThrow('Simulated transmission evaluation error');
  });
});
