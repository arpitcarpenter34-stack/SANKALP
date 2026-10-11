import { describe, it, assert, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeDeterministicLayout } from '../graph-layout';
import { computeConnectedChain, computeCausalPaths } from '../graph-traversal';
import { ImpactGraph } from '../ImpactGraph';
import { sampleCrudeShockGraph } from '../fixtures/mockGraphData';
import { DOMAIN_DATASETS, DOMAIN_OPTIONS } from '../domainGraphData';

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

describe('Multi-Hop Connected Impact Chain Traversal Tests', () => {
  const edges = sampleCrudeShockGraph.edges;

  it('1. Selecting a Starting Node highlights all downstream paths and leaves upstream empty', () => {
    const result = computeConnectedChain('crude_oil', edges);

    // Starting node has no upstream causes
    expect(result.upstreamNodeIds.size).toBe(0);

    // Downstream effects must include all branches originating from crude_oil
    expect(result.downstreamNodeIds.has('diesel')).toBe(true);
    expect(result.downstreamNodeIds.has('petrol')).toBe(true);
    expect(result.downstreamNodeIds.has('freight_logistics')).toBe(true);
    expect(result.downstreamNodeIds.has('vegetables')).toBe(true);
    expect(result.downstreamNodeIds.has('commute_fuel')).toBe(true);
    expect(result.downstreamNodeIds.has('mp_rural_middle')).toBe(true);

    // Connected nodes include the root itself + all downstream nodes
    expect(result.connectedNodeIds.has('crude_oil')).toBe(true);
    expect(result.connectedNodeIds.size).toBe(sampleCrudeShockGraph.nodes.length);

    // Connected edges must include all edges on all paths
    expect(result.connectedEdgeIds.has('edge_crude_diesel')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_crude_petrol')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_diesel_freight')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_petrol_commute')).toBe(true);
  });

  it('2. Selecting an Intermediate Node highlights both upstream causes and downstream impacts', () => {
    const result = computeConnectedChain('diesel', edges);

    // Upstream must identify crude_oil as the root driver
    expect(result.upstreamNodeIds.has('crude_oil')).toBe(true);
    expect(result.upstreamNodeIds.size).toBe(1);

    // Downstream must follow the diesel food chain to freight, vegetables, and household persona
    expect(result.downstreamNodeIds.has('freight_logistics')).toBe(true);
    expect(result.downstreamNodeIds.has('vegetables')).toBe(true);
    expect(result.downstreamNodeIds.has('mp_rural_middle')).toBe(true);

    // Unrelated branches (petrol, commute_fuel, rbi_repo_rate, nifty_50) MUST be excluded (dimmed)
    expect(result.connectedNodeIds.has('petrol')).toBe(false);
    expect(result.connectedNodeIds.has('commute_fuel')).toBe(false);
    expect(result.connectedNodeIds.has('rbi_repo_rate')).toBe(false);
    expect(result.connectedNodeIds.has('nifty_50')).toBe(false);

    // Edges along diesel chain must be included
    expect(result.connectedEdgeIds.has('edge_crude_diesel')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_diesel_freight')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_freight_vegetables')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_vegetables_persona')).toBe(true);

    // Unrelated edges must NOT be connected
    expect(result.connectedEdgeIds.has('edge_crude_petrol')).toBe(false);
    expect(result.connectedEdgeIds.has('edge_petrol_commute')).toBe(false);
  });

  it('3. Selecting a Terminal Household Node highlights all upstream causal paths and zero downstream', () => {
    const result = computeConnectedChain('mp_rural_middle', edges);

    // Terminal node has no further downstream effects
    expect(result.downstreamNodeIds.size).toBe(0);

    // Upstream causes must include all paths converging on the household
    expect(result.upstreamNodeIds.has('vegetables')).toBe(true);
    expect(result.upstreamNodeIds.has('commute_fuel')).toBe(true);
    expect(result.upstreamNodeIds.has('freight_logistics')).toBe(true);
    expect(result.upstreamNodeIds.has('petrol')).toBe(true);
    expect(result.upstreamNodeIds.has('diesel')).toBe(true);
    expect(result.upstreamNodeIds.has('crude_oil')).toBe(true);

    expect(result.connectedNodeIds.has('mp_rural_middle')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_vegetables_persona')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_commute_persona')).toBe(true);
  });

  it('4. Switching Selected Node immediately recalculates the isolated connected chain', () => {
    const chainDiesel = computeConnectedChain('diesel', edges);
    const chainPetrol = computeConnectedChain('petrol', edges);

    // Diesel chain contains freight and vegetables, not commute
    expect(chainDiesel.connectedNodeIds.has('freight_logistics')).toBe(true);
    expect(chainDiesel.connectedNodeIds.has('commute_fuel')).toBe(false);

    // Petrol chain contains commute, not freight or vegetables
    expect(chainPetrol.connectedNodeIds.has('commute_fuel')).toBe(true);
    expect(chainPetrol.connectedNodeIds.has('freight_logistics')).toBe(false);
    expect(chainPetrol.connectedNodeIds.has('vegetables')).toBe(false);
  });

  it('5. Handles multiple branching paths without arbitrarily selecting only one path', () => {
    // In sampleCrudeShockGraph, crude_oil branches into diesel, petrol, and rbi_repo_rate
    const result = computeConnectedChain('crude_oil', edges);

    // Must preserve ALL 3 branches in the connected chain
    expect(result.downstreamNodeIds.has('diesel')).toBe(true);
    expect(result.downstreamNodeIds.has('petrol')).toBe(true);
    expect(result.downstreamNodeIds.has('rbi_repo_rate')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_crude_diesel')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_crude_petrol')).toBe(true);
    expect(result.connectedEdgeIds.has('edge_crude_repo')).toBe(true);
  });

  it('6. Cycle and edge-case safety: handles missing nodes, empty graphs, and cyclic edges gracefully', () => {
    const emptyResult = computeConnectedChain('', []);
    expect(emptyResult.connectedNodeIds.size).toBe(0);
    expect(emptyResult.connectedEdgeIds.size).toBe(0);

    const cyclicEdges = [
      { id: 'e1', from: 'A', to: 'B' },
      { id: 'e2', from: 'B', to: 'C' },
      { id: 'e3', from: 'C', to: 'A' },
    ];
    const cycleResult = computeConnectedChain('A', cyclicEdges);
    expect(cycleResult.connectedNodeIds.size).toBe(3);
    expect(cycleResult.connectedEdgeIds.size).toBe(3);
  });
});

describe('Continuous Causal Path Computation & Sequencing Tests', () => {
  it('1. Computes valid ordered paths from root nodes to terminal nodes', () => {
    const paths = computeCausalPaths(sampleCrudeShockGraph.nodes, sampleCrudeShockGraph.edges);

    expect(paths.length).toBeGreaterThanOrEqual(2);

    for (const path of paths) {
      // Every path starts at a root node and ends at a terminal node
      expect(path.nodeIds[0]).toBe('crude_oil');
      expect(['mp_rural_middle', 'nifty_50']).toContain(path.nodeIds[path.nodeIds.length - 1]);

      // Every step must advance along a valid connected edge
      expect(path.edgeIds.length).toBe(path.nodeIds.length - 1);
      for (let i = 0; i < path.edgeIds.length; i++) {
        const edgeId = path.edgeIds[i];
        const edge = sampleCrudeShockGraph.edges.find((e) => e.id === edgeId);
        expect(edge).toBeTruthy();
        expect(edge?.from).toBe(path.nodeIds[i]);
        expect(edge?.to).toBe(path.nodeIds[i + 1]);
      }
    }
  });

  it('2. Correctly filters causal paths when propagation path filter is active', () => {
    const foodPaths = computeCausalPaths(
      sampleCrudeShockGraph.nodes,
      sampleCrudeShockGraph.edges,
      'food_cost'
    );
    expect(foodPaths.length).toBe(1);
    expect(foodPaths[0].nodeIds).toEqual([
      'crude_oil',
      'diesel',
      'freight_logistics',
      'vegetables',
      'mp_rural_middle',
    ]);

    const transportPaths = computeCausalPaths(
      sampleCrudeShockGraph.nodes,
      sampleCrudeShockGraph.edges,
      'transport_cost'
    );
    expect(transportPaths.length).toBe(1);
    expect(transportPaths[0].nodeIds).toEqual([
      'crude_oil',
      'petrol',
      'commute_fuel',
      'mp_rural_middle',
    ]);
  });
});

describe('Economic Impact Graph Component & Interaction Verification', () => {
  it('1. Header Verification: Top-center playback control bar is completely removed', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImpactGraph, {
        data: sampleCrudeShockGraph,
        selectedPath: 'all',
      })
    );

    // Playback control bar elements must be removed
    expect(html).not.toContain('Play Impact Chain');
    expect(html).not.toContain('Step 9 of 9');
    expect(html).not.toContain('stepProgressBar');
    expect(html).not.toContain('playbackSpeed');
    expect(html).not.toContain('speedSelect');
    expect(html).not.toContain('playbackControlsGroup');

    // Required controls must remain present
    expect(html).toContain('Economic Impact Graph');
    expect(html).toContain('From global events to your household and investments');
    expect(html).toContain('Transmission Flow');
    expect(html).toContain('Sector View');
    expect(html).toContain('Fit View');
    expect(html).toContain('Zoom In');
    expect(html).toContain('Zoom Out');
  });

  it('2. Domain Filters and Relationship Legend are preserved', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImpactGraph, {
        data: sampleCrudeShockGraph,
        selectedPath: 'all',
      })
    );

    expect(html).toContain('Explore domains:');
    expect(html).toContain('All domains');
    expect(html).toContain('Petrol &amp; Diesel');
    expect(html).toContain('LPG / CNG');
    expect(html).toContain('Semiconductors');
    expect(html).toContain('Food &amp; Agriculture');
    expect(html).toContain('Currency &amp; Markets');

    expect(html).toContain('Observed relationship');
    expect(html).toContain('Inferred relationship');
    expect(html).toContain('Potential impact');
  });

  it('3. Manual Node Selection highlights connected chain and dims unrelated nodes', () => {
    // When selectedNodeId is 'diesel', diesel's connected chain must be highlighted, while petrol is dimmed
    const html = renderToStaticMarkup(
      React.createElement(ImpactGraph, {
        data: sampleCrudeShockGraph,
        selectedNodeId: 'diesel',
        selectedPath: 'all',
      })
    );

    // Node elements are rendered in SVG
    expect(html).toContain('Diesel (HSD)');
    expect(html).toContain('nodeSelected');
    expect(html).toContain('nodeDimmed');
    expect(html).toContain('edgeDimmed');
  });
});

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
