import { describe, it, expect } from 'vitest';
import {
  MOCK_SCENARIOS,
  MOCK_GRAPH_FIXTURE,
  MOCK_PERSONA_FIXTURE,
} from '../services/api/mockData';

describe('Contracts & Missing Data Guarantees', () => {
  it('guarantees that all scenarios have valid source receipts and verification status', () => {
    for (const scenario of MOCK_SCENARIOS) {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.sourceReceipt).toBeDefined();
      expect(['[VERIFIED]', '[VERIFY]', '[INFERENCE]', '[UNVERIFIED]']).toContain(
        scenario.sourceReceipt.verificationStatus
      );
    }
  });

  it('guarantees knowledge graph nodes have valid types and optional receipts', () => {
    for (const node of MOCK_GRAPH_FIXTURE.nodes) {
      expect(node.id).toBeTruthy();
      expect(node.label).toBeTruthy();
      expect([
        'commodity',
        'household_item',
        'economic_indicator',
        'sector',
        'instrument_asset',
        'persona',
      ]).toContain(node.type);
    }
  });

  it('guarantees knowledge graph edges differentiate observed vs inferred relations', () => {
    for (const edge of MOCK_GRAPH_FIXTURE.edges) {
      expect(edge.id).toBeTruthy();
      expect(edge.from).toBeTruthy();
      expect(edge.to).toBeTruthy();
      expect(['observed', 'inferred']).toContain(edge.kind);
      expect(['positive', 'negative', 'ambiguous']).toContain(edge.direction);
      expect(edge.receipt).toBeDefined();
      expect(edge.evidenceQuote).toBeTruthy();
    }
  });

  it('guarantees that missing data items in persona breakdown use null and are not replaced by 0', () => {
    const uncalculatedItems = MOCK_PERSONA_FIXTURE.itemBreakdown.filter(
      (item) => item.dataStatus === 'data_not_available'
    );

    expect(uncalculatedItems.length).toBeGreaterThan(0);

    for (const item of uncalculatedItems) {
      // NON-NEGOTIABLE RULE: NEVER SUBSTITUTE ZERO FOR MISSING DATA!
      expect(item.estimatedMonthlyImpactInr).toBeNull();
      expect(item.estimatedMonthlyImpactInr).not.toBe(0);
      expect(item.passThroughFactor).toBeNull();
      expect(item.receipt.caveats?.length).toBeGreaterThan(0);
    }
  });

  it('guarantees baseline MPCE receipt is present with verified attribution for official average', () => {
    expect(MOCK_PERSONA_FIXTURE.mpceBaselineReceipt).toBeDefined();
    expect(MOCK_PERSONA_FIXTURE.mpceBaselineReceipt?.verificationStatus).toBe('[VERIFIED]');
    expect(MOCK_PERSONA_FIXTURE.mpceBaselineReceipt?.tableOrSeriesId).toBe('Table 2');
    expect(MOCK_PERSONA_FIXTURE.mpceBaselineInr).toBe(3441);
  });

  it('guarantees unsupported fuel-to-vegetable factor is strictly null in fixtures', () => {
    const vegItem = MOCK_PERSONA_FIXTURE.itemBreakdown.find((i) => i.itemId === 'food_vegetables');
    expect(vegItem).toBeDefined();
    expect(vegItem?.passThroughFactor).toBeNull();
    expect(vegItem?.estimatedMonthlyImpactInr).toBeNull();
    expect(vegItem?.dataStatus).toBe('data_not_available');
  });
});
