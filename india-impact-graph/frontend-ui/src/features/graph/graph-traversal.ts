/**
 * BharatImpact — Economic Impact Graph Traversal & Causal Path Utilities
 * Pure, deterministic graph traversal algorithms for:
 * 1. Multi-hop connected impact chain discovery (upstream ancestors + downstream descendants)
 * 2. Causal transmission path sequencing for continuous automatic animation
 */

export interface ConnectedChainResult {
  /** Target node + all upstream ancestors + all downstream descendants */
  connectedNodeIds: Set<string>;
  /** All directed edges along the upstream and downstream connected paths */
  connectedEdgeIds: Set<string>;
  /** Upstream causal causes leading into target node */
  upstreamNodeIds: Set<string>;
  /** Downstream causal effects flowing out of target node */
  downstreamNodeIds: Set<string>;
}

export interface EdgeInput {
  id: string;
  from: string;
  to: string;
  pathCategory?: string;
}

export interface NodeInput {
  id: string;
  x?: number;
  y?: number;
  type?: string;
}

export interface CausalPath {
  id: string;
  name?: string;
  nodeIds: string[];
  edgeIds: string[];
}

/**
 * Traverses directed graph relationships to find the complete connected impact chain
 * for any clicked node (upstream causes + downstream impacts + connecting edges).
 * Handles multiple branching paths, converging paths, and cycles safely.
 */
export function computeConnectedChain(
  targetNodeId: string,
  edges: EdgeInput[]
): ConnectedChainResult {
  const upstreamNodes = new Set<string>();
  const downstreamNodes = new Set<string>();
  const connectedEdges = new Set<string>();

  if (!targetNodeId || !edges || edges.length === 0) {
    return {
      connectedNodeIds: new Set(targetNodeId ? [targetNodeId] : []),
      connectedEdgeIds: new Set(),
      upstreamNodeIds: new Set(),
      downstreamNodeIds: new Set(),
    };
  }

  // Build adjacency maps
  const incomingMap = new Map<string, { edgeId: string; from: string }[]>();
  const outgoingMap = new Map<string, { edgeId: string; to: string }[]>();

  for (const edge of edges) {
    if (!incomingMap.has(edge.to)) incomingMap.set(edge.to, []);
    incomingMap.get(edge.to)!.push({ edgeId: edge.id, from: edge.from });

    if (!outgoingMap.has(edge.from)) outgoingMap.set(edge.from, []);
    outgoingMap.get(edge.from)!.push({ edgeId: edge.id, to: edge.to });
  }

  // 1. Traverse Upstream (Ancestors: What caused this node?)
  const upQueue: string[] = [targetNodeId];
  const visitedUp = new Set<string>([targetNodeId]);

  while (upQueue.length > 0) {
    const curr = upQueue.shift()!;
    const incoming = incomingMap.get(curr) || [];
    for (const { edgeId, from } of incoming) {
      connectedEdges.add(edgeId);
      if (!visitedUp.has(from)) {
        visitedUp.add(from);
        upstreamNodes.add(from);
        upQueue.push(from);
      }
    }
  }

  // 2. Traverse Downstream (Descendants: What does this node impact?)
  const downQueue: string[] = [targetNodeId];
  const visitedDown = new Set<string>([targetNodeId]);

  while (downQueue.length > 0) {
    const curr = downQueue.shift()!;
    const outgoing = outgoingMap.get(curr) || [];
    for (const { edgeId, to } of outgoing) {
      connectedEdges.add(edgeId);
      if (!visitedDown.has(to)) {
        visitedDown.add(to);
        downstreamNodes.add(to);
        downQueue.push(to);
      }
    }
  }

  const allConnectedNodes = new Set<string>([targetNodeId, ...upstreamNodes, ...downstreamNodes]);

  return {
    connectedNodeIds: allConnectedNodes,
    connectedEdgeIds: connectedEdges,
    upstreamNodeIds: upstreamNodes,
    downstreamNodeIds: downstreamNodes,
  };
}

/**
 * Computes all complete directed causal paths from root nodes (in-degree = 0)
 * to terminal impact nodes (out-degree = 0) along valid directed edges.
 * Used for automatic continuous impact-chain animation.
 */
export function computeCausalPaths(
  nodes: NodeInput[] = [],
  edges: EdgeInput[] = [],
  selectedPathFilter?: string
): CausalPath[] {
  if (!nodes || nodes.length === 0) return [];

  // Filter edges if a specific propagation path category is selected
  const activeEdges =
    selectedPathFilter && selectedPathFilter !== 'all'
      ? edges.filter((e) => e.pathCategory === selectedPathFilter)
      : edges;

  // Build graph adjacency and degree tables
  const adj = new Map<string, { to: string; edgeId: string }[]>();
  const inDegree = new Map<string, number>();

  for (const n of nodes) {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  }

  for (const e of activeEdges) {
    if (!adj.has(e.from)) adj.set(e.from, []);
    adj.get(e.from)!.push({ to: e.to, edgeId: e.id });
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
  }

  // Identify root starting nodes (nodes with 0 incoming edges among active edges)
  const rootNodeCandidates = nodes.filter((n) => (inDegree.get(n.id) || 0) === 0);

  // If no node has 0 in-degree (e.g. cycles), find nodes with minimum in-degree
  const startNodes =
    rootNodeCandidates.length > 0
      ? rootNodeCandidates
      : [...nodes].sort((a, b) => (inDegree.get(a.id) || 0) - (inDegree.get(b.id) || 0)).slice(0, 2);

  // Sort starting nodes deterministically from left to right by x coordinate
  startNodes.sort((a, b) => (a.x ?? 0) - (b.x ?? 0) || (a.y ?? 0) - (b.y ?? 0));

  const allPaths: CausalPath[] = [];

  function dfs(
    currId: string,
    currentNodes: string[],
    currentEdges: string[],
    visited: Set<string>
  ) {
    const outgoing = adj.get(currId) || [];
    const validOutgoing = outgoing.filter((o) => !visited.has(o.to));

    // If terminal node reached (no outgoing edges or all visited), record complete path
    if (validOutgoing.length === 0) {
      if (currentNodes.length > 1) {
        allPaths.push({
          id: `path_${allPaths.length + 1}`,
          nodeIds: [...currentNodes],
          edgeIds: [...currentEdges],
        });
      }
      return;
    }

    for (const { to, edgeId } of validOutgoing) {
      visited.add(to);
      dfs(to, [...currentNodes, to], [...currentEdges, edgeId], visited);
      visited.delete(to);
    }
  }

  for (const startNode of startNodes) {
    dfs(startNode.id, [startNode.id], [], new Set([startNode.id]));
  }

  // Fallback: If no multi-node path could be constructed from edges, create fallback linear path
  if (allPaths.length === 0) {
    const sorted = [...nodes].sort((a, b) => (a.x ?? 0) - (b.x ?? 0) || (a.y ?? 0) - (b.y ?? 0));
    allPaths.push({
      id: 'fallback_linear_path',
      nodeIds: sorted.map((n) => n.id),
      edgeIds: [],
    });
  }

  return allPaths;
}
