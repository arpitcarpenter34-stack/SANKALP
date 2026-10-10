import React, { useState } from 'react';
import { QuadraticBezierLine } from '@react-three/drei';
import type { UIGraphEdge } from './graph-types';

export interface GraphEdgeProps {
  edge: UIGraphEdge;
  sourcePos: [number, number, number];
  targetPos: [number, number, number];
  onSelect: (id: string) => void;
}

export const GraphEdge3D: React.FC<GraphEdgeProps> = ({ edge, sourcePos, targetPos, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  // Colors
  const isObserved = edge.kind === 'observed';
  const baseColor = isObserved ? '#00d2b4' : '#f59e0b';
  const activeColor = edge.isSelected ? '#ffffff' : hovered ? '#4ade80' : baseColor;
  
  const opacity = edge.isDimmed ? 0.1 : edge.isSelected ? 1 : hovered ? 0.8 : 0.4;
  const lineWidth = edge.isSelected ? 4 : hovered ? 3 : edge.isHighlighted ? 2.5 : 1.5;

  // Midpoint for curve and label
  const midX = (sourcePos[0] + targetPos[0]) / 2;
  const midY = (sourcePos[1] + targetPos[1]) / 2;
  const midZ = (sourcePos[2] + targetPos[2]) / 2;
  
  // Create a control point that arcs "out" (towards +Z or +Y) to give it 3D volume
  // For horizontal flow, maybe arc in Y or Z
  const dx = targetPos[0] - sourcePos[0];
  const arcHeight = Math.max(1, Math.abs(dx) * 0.2);
  const controlPos: [number, number, number] = [midX, midY + arcHeight, midZ + (edge.isSelected ? 0.5 : 0)];

  return (
    <group>
      <QuadraticBezierLine
        start={sourcePos}
        end={targetPos}
        mid={controlPos}
        color={activeColor}
        lineWidth={lineWidth}
        dashed={!isObserved}
        dashScale={50}
        dashSize={1}
        gapSize={0.5}
        transparent
        opacity={opacity}
        onClick={(e: any) => {
          e.stopPropagation();
          onSelect(edge.id);
        }}
        onPointerOver={(e: any) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      />
      
    </group>
  );
};
