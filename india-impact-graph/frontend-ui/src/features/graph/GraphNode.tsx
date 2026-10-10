import React from 'react';
import type { UIGraphNode } from './graph-types';
import { NODE_VISUAL_MAP } from './graph-types';
import styles from './graph.module.css';

export interface GraphNodeProps {
  node: UIGraphNode;
  onSelect: (id: string) => void;
}

/**
 * Computes polygon points for a regular polygon
 */
function getPolygonPoints(cx: number, cy: number, r: number, sides: number, rotationOffset = 0): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides + rotationOffset;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return points.join(' ');
}

export const GraphNode: React.FC<GraphNodeProps> = ({ node, onSelect }) => {
  const visual = NODE_VISUAL_MAP[node.type] || NODE_VISUAL_MAP.commodity;
  const { x, y, radius } = node;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(node.id);
    }
  };

  const renderShape = () => {
    switch (visual.shape) {
      case 'circle':
        return (
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={node.isSelected ? 3.5 : 2}
            className={styles.nodeShape}
          />
        );

      case 'hexagon':
        return (
          <polygon
            points={getPolygonPoints(x, y, radius, 6, Math.PI / 6)}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={node.isSelected ? 3.5 : 2}
            className={styles.nodeShape}
          />
        );

      case 'diamond':
        return (
          <polygon
            points={`${x},${y - radius} ${x + radius},${y} ${x},${y + radius} ${x - radius},${y}`}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={node.isSelected ? 3.5 : 2}
            className={styles.nodeShape}
          />
        );

      case 'rect':
        return (
          <rect
            x={x - radius * 1.1}
            y={y - radius * 0.75}
            width={radius * 2.2}
            height={radius * 1.5}
            rx={6}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={node.isSelected ? 3.5 : 2}
            className={styles.nodeShape}
          />
        );

      case 'octagon':
        return (
          <polygon
            points={getPolygonPoints(x, y, radius, 8, Math.PI / 8)}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={node.isSelected ? 3.5 : 2}
            className={styles.nodeShape}
          />
        );

      case 'personaCard':
        return (
          <rect
            x={x - radius * 1.25}
            y={y - radius * 0.85}
            width={radius * 2.5}
            height={radius * 1.7}
            rx={8}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={node.isSelected ? 3.5 : 2}
            className={styles.nodeShape}
          />
        );

      default:
        return (
          <circle
            cx={x}
            cy={y}
            r={radius}
            fill={visual.fillColor}
            stroke={visual.strokeColor}
            strokeWidth={2}
            className={styles.nodeShape}
          />
        );
    }
  };

  const groupClasses = [
    styles.nodeGroup,
    node.isSelected ? styles.nodeSelected : '',
    node.isDimmed ? styles.nodeDimmed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <g
      className={groupClasses}
      onClick={() => onSelect(node.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${node.label} (${node.type})`}
      aria-pressed={node.isSelected}
      id={`node-${node.id}`}
    >
      {renderShape()}

      {/* Primary Label */}
      <text x={x} y={y + radius + 15} className={styles.nodeLabel}>
        {node.label}
      </text>

      {/* Type Subtitle */}
      <text x={x} y={y + radius + 27} className={styles.nodeTypeBadge}>
        {node.type.replace('_', ' ')}
      </text>
    </g>
  );
};
