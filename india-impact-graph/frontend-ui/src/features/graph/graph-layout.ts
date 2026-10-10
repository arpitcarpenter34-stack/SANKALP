import type {
  KnowledgeGraphData,
  NodeType,
  GraphNodeData,
  GraphEdgeData,
} from '../../types/contracts';
import {
  UIGraphNode,
  UIGraphEdge,
  NODE_VISUAL_MAP,
} from './graph-types';

/**
 * Assigns a deterministic topological column (0 to 4) to each node.
 * Shocks (Left) -> Intermediates -> Sectors -> Retail -> Household Budget (Right)
 */
function getDeterministicColumn(node: GraphNodeData, incomingCount: number, outgoingCount: number): number {
  // Explicit entity overrides based on domain ontology
  if (node.type === 'persona') return 4;
  if (node.type === 'household_item') return 3;
  if (node.type === 'instrument_asset') return 3;
  if (node.type === 'sector') return 2;
  if (node.type === 'economic_indicator') {
    return outgoingCount > 0 ? 1 : 2;
  }
  if (node.type === 'commodity') {
    if (incomingCount === 0) return 0; // Root raw commodity (e.g. Crude Oil)
    return 1; // Refined derivative commodity (e.g. Diesel, Petrol)
  }

  // Fallback by in-degree vs out-degree
  if (incomingCount === 0) return 0;
  if (outgoingCount === 0) return 4;
  return 2;
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  paddingX?: number;
  paddingY?: number;
}

/**
 * Deterministic DAG Layout Calculator
 * Produces identical coordinates for identical inputs without physics engines.
 */
export function computeDeterministicLayout(
  data: KnowledgeGraphData | null,
  options: LayoutOptions = {}
): { nodes: UIGraphNode[]; edges: UIGraphEdge[] } {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const width = options.width ?? 1000;
  const height = options.height ?? 600;
  const paddingX = options.paddingX ?? 90;
  const paddingY = options.paddingY ?? 60;

  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // Calculate degree for each node
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();
  for (const n of data.nodes) {
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  }
  for (const e of data.edges || []) {
    inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    outDegree.set(e.from, (outDegree.get(e.from) || 0) + 1);
  }

  // Group nodes into 5 columns
  const columns: GraphNodeData[][] = [[], [], [], [], []];
  for (const node of data.nodes) {
    const colIdx = getDeterministicColumn(
      node,
      inDegree.get(node.id) || 0,
      outDegree.get(node.id) || 0
    );
    const clampedCol = Math.max(0, Math.min(4, colIdx));
    columns[clampedCol].push(node);
  }

  // Sort nodes in each column deterministically by ID for strict stability
  for (const col of columns) {
    col.sort((a, b) => a.id.localeCompare(b.id));
  }

  // Calculate (x, y) for each node
  const numCols = 5;
  const colSpacing = usableWidth / (numCols - 1);
  const nodeMap = new Map<string, UIGraphNode>();

  for (let c = 0; c < numCols; c++) {
    const colNodes = columns[c];
    const x = paddingX + c * colSpacing;
    const count = colNodes.length;

    for (let i = 0; i < count; i++) {
      const node = colNodes[i];
      // Distribute evenly along vertical axis
      const y = paddingY + ((i + 1) * usableHeight) / (count + 1);

      const visual = NODE_VISUAL_MAP[node.type] || NODE_VISUAL_MAP.commodity;
      // Budget share scales node radius slightly if confirmed (e.g. 5% to 15% share -> 26 to 34px)
      let radius = visual.baseRadius;
      if (typeof node.budget_share === 'number' && node.budget_share > 0) {
        radius = Math.min(38, Math.max(24, visual.baseRadius + node.budget_share * 0.4));
      }

      const uiNode: UIGraphNode = {
        ...node,
        x,
        y,
        radius,
        isSelected: false,
        isHighlighted: false,
        isDimmed: false,
      };

      nodeMap.set(node.id, uiNode);
    }
  }

  // Calculate Edge paths with cubic Bezier curves
  const uiEdges: UIGraphEdge[] = [];
  for (const edge of data.edges || []) {
    const source = nodeMap.get(edge.from);
    const target = nodeMap.get(edge.to);

    if (!source || !target) {
      continue;
    }

    const sourceX = source.x;
    const sourceY = source.y;
    const targetX = target.x;
    const targetY = target.y;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const curvature = Math.max(40, Math.abs(dx) * 0.4);

    const cx1 = sourceX + curvature;
    const cy1 = sourceY;
    const cx2 = targetX - curvature;
    const cy2 = targetY;

    const pathD = `M ${sourceX} ${sourceY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${targetX} ${targetY}`;
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    uiEdges.push({
      ...edge,
      sourceX,
      sourceY,
      targetX,
      targetY,
      pathD,
      midX,
      midY,
      isSelected: false,
      isHighlighted: false,
      isDimmed: false,
    });
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: uiEdges,
  };
}
