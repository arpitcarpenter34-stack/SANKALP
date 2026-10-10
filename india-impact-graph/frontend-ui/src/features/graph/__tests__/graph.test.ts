import { describe, it, assert } from 'vitest';
import { computeDeterministicLayout } from '../graph-layout';
import { sampleCrudeShockGraph } from '../fixtures/mockGraphData';

describe('Graph Feature Tests — Layout & Traversal', () => {
  it('Layout Test 1: returns empty array for null or empty data', () => {
    const res1 = computeDeterministicLayout(null);
    assert.strictEqual(res1.nodes.length, 0);
    assert.strictEqual(res1.edges.length, 0);

    const res2 = computeDeterministicLayout({ nodes: [], edges: [], availablePaths: [] });
    assert.strictEqual(res2.nodes.length, 0);
    assert.strictEqual(res2.edges.length, 0);
  });

  it('Layout Test 2: produces strictly deterministic identical coordinates on multiple runs', () => {
    const run1 = computeDeterministicLayout(sampleCrudeShockGraph);
    const run2 = computeDeterministicLayout(sampleCrudeShockGraph);

    assert.strictEqual(run1.nodes.length, sampleCrudeShockGraph.nodes.length);
    assert.strictEqual(run1.edges.length, sampleCrudeShockGraph.edges.length);

    for (let i = 0; i < run1.nodes.length; i++) {
      const n1 = run1.nodes[i];
      const n2 = run2.nodes[i];
      assert.strictEqual(n1.id, n2.id);
      assert.strictEqual(n1.x, n2.x, `Node ${n1.id} x coordinate differs across runs`);
      assert.strictEqual(n1.y, n2.y, `Node ${n1.id} y coordinate differs across runs`);
    }

    for (let i = 0; i < run1.edges.length; i++) {
      const e1 = run1.edges[i];
      const e2 = run2.edges[i];
      assert.strictEqual(e1.id, e2.id);
      assert.strictEqual(e1.pathD, e2.pathD);
    }
  });

  it('Layout Test 3: assigns valid SVG viewport coordinates within 1000x600 boundaries', () => {
    const layout = computeDeterministicLayout(sampleCrudeShockGraph, { width: 1000, height: 600 });
    for (const node of layout.nodes) {
      assert.ok(node.x >= 50 && node.x <= 950, `Node ${node.id} X (${node.x}) outside padding`);
      assert.ok(node.y >= 40 && node.y <= 560, `Node ${node.id} Y (${node.y}) outside padding`);
      assert.ok(node.radius >= 24 && node.radius <= 40, `Node ${node.id} radius out of bounds`);
    }
  });

  it('Edge Style Test: confirms observed and inferred edge classifications match spec', () => {
    const layout = computeDeterministicLayout(sampleCrudeShockGraph);
    const observedEdges = layout.edges.filter((e) => e.kind === 'observed');
    const inferredEdges = layout.edges.filter((e) => e.kind === 'inferred');

    assert.ok(observedEdges.length >= 3, 'Must have at least 3 observed edges in sample scenario');
    assert.ok(inferredEdges.length >= 4, 'Must have at least 4 inferred edges in sample scenario');

    // Crude -> Diesel is observed
    const crudeDiesel = layout.edges.find((e) => e.id === 'edge_crude_diesel');
    assert.strictEqual(crudeDiesel?.kind, 'observed');

    // Diesel -> Freight is inferred
    const dieselFreight = layout.edges.find((e) => e.id === 'edge_diesel_freight');
    assert.strictEqual(dieselFreight?.kind, 'inferred');
  });

  it('Path Filter Test: correctly isolates Path A (food_cost) propagation links', () => {
    const foodCostEdges = sampleCrudeShockGraph.edges.filter((e) => e.pathCategory === 'food_cost');
    assert.strictEqual(foodCostEdges.length, 4);

    const edgeIds = new Set(foodCostEdges.map((e) => e.id));
    assert.ok(edgeIds.has('edge_crude_diesel'));
    assert.ok(edgeIds.has('edge_diesel_freight'));
    assert.ok(edgeIds.has('edge_freight_vegetables'));
    assert.ok(edgeIds.has('edge_vegetables_persona'));
  });
});

import { DOMAIN_DATASETS, DOMAIN_OPTIONS } from '../domainGraphData';

describe('Domain Graph Datasets & Multi-Domain Integrity', () => {
  it('Domain Registry: supports all 8 expected domains with distinct metadata', () => {
    assert.strictEqual(DOMAIN_OPTIONS.length, 8);
    const domainIds = DOMAIN_OPTIONS.map((d) => d.id);
    assert.ok(domainIds.includes('semiconductors'));
    assert.ok(domainIds.includes('petrol'));
    assert.ok(domainIds.includes('lpg'));
    assert.ok(domainIds.includes('food'));
    assert.ok(domainIds.includes('currency'));
    assert.ok(domainIds.includes('shipping'));
    assert.ok(domainIds.includes('energy'));
    assert.ok(domainIds.includes('all'));

    for (const d of DOMAIN_OPTIONS) {
      assert.ok(DOMAIN_DATASETS[d.id], `Dataset missing for domain: ${d.id}`);
      const data = DOMAIN_DATASETS[d.id];
      assert.ok(data.nodes.length >= 6, `Domain ${d.id} has insufficient nodes`);
      assert.ok(data.edges.length >= 5, `Domain ${d.id} has insufficient edges`);
      assert.strictEqual(data.keyMetrics.length, 5, `Domain ${d.id} must have 5 key metrics`);
      assert.strictEqual(data.priceChart.months.length, 10, `Domain ${d.id} must have 10-month chart`);
      assert.ok(data.affectedSectors.length >= 5, `Domain ${d.id} must have at least 5 affected sectors`);
      assert.strictEqual(data.pathwayInsights.keyTakeaways.length, 5, `Domain ${d.id} must have 5 takeaways`);
    }
  });

  it('Semiconductors Domain: conforms 100% to reference screenshot specifications', () => {
    const semi = DOMAIN_DATASETS.semiconductors;
    assert.strictEqual(semi.defaultSelectedNodeId, 'taiwan_semi_tensions');

    // Check Root Node
    const taiwanNode = semi.nodes.find((n) => n.id === 'taiwan_semi_tensions');
    assert.ok(taiwanNode);
    assert.strictEqual(taiwanNode?.category, 'global-event');
    assert.strictEqual(taiwanNode?.impactBadge, '+25%');
    assert.strictEqual(taiwanNode?.impactDescription, 'Chip supply risk');

    // Check Key Metrics match screenshot
    const globalChipMetric = semi.keyMetrics.find((m) => m.label === 'Global Chip Price Index');
    assert.ok(globalChipMetric);
    assert.strictEqual(globalChipMetric?.value, '+18% ↑');

    const sipMetric = semi.keyMetrics.find((m) => m.label.includes('SIP Capacity'));
    assert.ok(sipMetric);
    assert.strictEqual(sipMetric?.value, '-4.2% ↓');

    // Check Price Chart values and Oct tooltip
    assert.strictEqual(semi.priceChart.tooltipData.month, 'Oct 2024');
    assert.strictEqual(semi.priceChart.tooltipData.valA, '218');
    assert.strictEqual(semi.priceChart.tooltipData.valB, '189');

    // Check Top Affected Sector
    const topSector = semi.affectedSectors[0];
    assert.strictEqual(topSector.name, 'Consumer Electronics');
    assert.strictEqual(topSector.percentage, 85);
  });

  it('Domain Isolation: no node ID or metric value leakage across domains', () => {
    const semi = DOMAIN_DATASETS.semiconductors;
    const petrol = DOMAIN_DATASETS.petrol;
    const lpg = DOMAIN_DATASETS.lpg;

    const semiNodeIds = new Set(semi.nodes.map((n) => n.id));
    const petrolNodeIds = new Set(petrol.nodes.map((n) => n.id));
    const lpgNodeIds = new Set(lpg.nodes.map((n) => n.id));

    // Semi nodes must not exist in Petrol
    assert.ok(!petrolNodeIds.has('taiwan_semi_tensions'));
    assert.ok(!petrolNodeIds.has('global_chip_prices'));

    // Petrol nodes must not exist in Semi
    assert.ok(!semiNodeIds.has('brent_crude_escalation'));
    assert.ok(!semiNodeIds.has('retail_diesel_petrol'));

    // LPG nodes must not exist in Semi
    assert.ok(!semiNodeIds.has('global_lng_spike'));
    assert.ok(!lpgNodeIds.has('taiwan_semi_tensions'));
  });

  it('Edge Integrity: every edge source and target exists in the same domain', () => {
    for (const [domainId, dataset] of Object.entries(DOMAIN_DATASETS)) {
      const nodeIds = new Set(dataset.nodes.map((n) => n.id));
      for (const edge of dataset.edges) {
        assert.ok(
          nodeIds.has(edge.from),
          `Edge ${edge.id} in domain ${domainId} has missing source node: ${edge.from}`
        );
        assert.ok(
          nodeIds.has(edge.to),
          `Edge ${edge.id} in domain ${domainId} has missing target node: ${edge.to}`
        );
      }
    }
  });
});
