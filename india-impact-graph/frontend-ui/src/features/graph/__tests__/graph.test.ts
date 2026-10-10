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
