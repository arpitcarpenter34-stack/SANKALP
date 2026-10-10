import React from 'react';
import type { UIGraphEdge } from './graph-types';
import styles from './graph.module.css';

export interface GraphEdgeProps {
  edge: UIGraphEdge;
  onSelect: (id: string) => void;
}

export const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, onSelect }) => {
  const isObserved = edge.kind === 'observed';

  const groupClasses = [
    styles.edgeGroup,
    edge.isSelected ? styles.edgeSelected : '',
    edge.isHighlighted ? styles.edgeHighlighted : '',
    edge.isDimmed ? styles.edgeDimmed : '',
  ]
    .filter(Boolean)
    .join(' ');

  const lineClasses = [
    styles.edgeLine,
    isObserved ? styles.edgeObserved : styles.edgeInferred,
  ].join(' ');

  const markerId = isObserved ? 'url(#arrow-observed)' : 'url(#arrow-inferred)';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(edge.id);
    }
  };

  return (
    <g
      className={groupClasses}
      onClick={() => onSelect(edge.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Connection: ${edge.from} to ${edge.to} (${edge.relation_type}, ${edge.kind})`}
      aria-pressed={edge.isSelected}
      id={`edge-${edge.id}`}
    >
      <title>{`${edge.relation_type} [${edge.kind}]`}</title>

      {/* Invisible broad stroke for effortless mouse/touch interaction */}
      <path d={edge.pathD} className={styles.edgeHitArea} />

      {/* Visual connection line */}
      <path
        d={edge.pathD}
        className={lineClasses}
        markerEnd={markerId}
      />

      {/* Relation Type Badge on Edge Midpoint */}
      <text
        x={edge.midX}
        y={edge.midY - 7}
        className={styles.edgeLabelText}
      >
        {edge.relation_type.replace(/_/g, ' ')}
      </text>
    </g>
  );
};
