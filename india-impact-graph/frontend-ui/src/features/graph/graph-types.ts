import type {
  GraphNodeData,
  GraphEdgeData,
  NodeType,
  EdgeKind,
  PropagationPathCategory,
} from '../../types/contracts';

/**
 * UI Adapter: Augmented Node with viewport coordinates & interaction state
 */
export interface UIGraphNode extends GraphNodeData {
  x: number;
  y: number;
  radius: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
}

/**
 * UI Adapter: Augmented Edge with SVG path data & interaction state
 */
export interface UIGraphEdge extends GraphEdgeData {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  pathD: string;
  midX: number;
  midY: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
}

/**
 * Node Visual Configuration (geometry, styling, icons)
 */
export interface NodeVisualConfig {
  shape: 'hexagon' | 'circle' | 'diamond' | 'rect' | 'octagon' | 'personaCard';
  baseRadius: number;
  strokeColor: string;
  fillColor: string;
  accentColor: string;
}

export const NODE_VISUAL_MAP: Record<NodeType, NodeVisualConfig> = {
  commodity: {
    shape: 'hexagon',
    baseRadius: 28,
    strokeColor: '#f59e0b',
    fillColor: '#1e2029',
    accentColor: '#f59e0b',
  },
  household_item: {
    shape: 'circle',
    baseRadius: 26,
    strokeColor: '#10b981',
    fillColor: '#122521',
    accentColor: '#10b981',
  },
  economic_indicator: {
    shape: 'diamond',
    baseRadius: 26,
    strokeColor: '#06b6d4',
    fillColor: '#10252b',
    accentColor: '#06b6d4',
  },
  sector: {
    shape: 'rect',
    baseRadius: 28,
    strokeColor: '#a855f7',
    fillColor: '#20182c',
    accentColor: '#a855f7',
  },
  instrument_asset: {
    shape: 'octagon',
    baseRadius: 26,
    strokeColor: '#00d2b4',
    fillColor: '#0b2623',
    accentColor: '#00d2b4',
  },
  persona: {
    shape: 'personaCard',
    baseRadius: 30,
    strokeColor: '#94a3b8',
    fillColor: '#18202d',
    accentColor: '#94a3b8',
  },
};
