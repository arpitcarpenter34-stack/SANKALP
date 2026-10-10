import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere, Box, Octahedron, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import type { UIGraphNode } from './graph-types';
import { NODE_VISUAL_MAP } from './graph-types';

export interface GraphNodeProps {
  node: UIGraphNode;
  onSelect: (id: string) => void;
  position: [number, number, number];
}

export const GraphNode3D: React.FC<GraphNodeProps> = ({ node, onSelect, position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const visual = NODE_VISUAL_MAP[node.type] || NODE_VISUAL_MAP.commodity;

  // Idle animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
      
      // Subtle float if not hovered
      if (!hovered) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      } else {
        // Return to base position or slightly elevated
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1] + 0.2, 0.1);
      }
      
      // Scale animation for hover/selection
      const targetScale = node.isSelected ? 1.4 : hovered ? 1.2 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  // Material setup
  const baseColor = new THREE.Color(visual.strokeColor);
  const emissiveColor = node.isSelected || hovered ? baseColor : new THREE.Color(visual.fillColor);
  const emissiveIntensity = node.isSelected ? 0.8 : hovered ? 0.5 : 0.1;
  const opacity = node.isDimmed ? 0.2 : 1;

  // Decide geometry based on shape
  let GeometryComponent: any = Sphere;
  let geomArgs: any[] = [1, 32, 32];

  switch (visual.shape) {
    case 'hexagon':
      GeometryComponent = Cylinder;
      geomArgs = [1, 1, 0.5, 6];
      break;
    case 'diamond':
      GeometryComponent = Octahedron;
      geomArgs = [1, 0];
      break;
    case 'rect':
    case 'personaCard':
      GeometryComponent = Box;
      geomArgs = [1.5, 1, 0.5];
      break;
    case 'octagon':
      GeometryComponent = Cylinder;
      geomArgs = [1, 1, 0.5, 8];
      break;
    default:
      GeometryComponent = Sphere;
      geomArgs = [1, 32, 32];
  }

  // Base radius scaling mapped to 3D space
  const scaledRadius = node.radius / 30; // baseRadius is ~26-30

  return (
    <group position={position}>
      <GeometryComponent
        ref={meshRef}
        args={geomArgs.map(a => typeof a === 'number' ? a * scaledRadius : a) as any}
        onClick={(e: any) => {
          e.stopPropagation();
          onSelect(node.id);
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
      >
        <meshPhysicalMaterial 
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
          roughness={0.2}
          metalness={0.8}
          clearcoat={0.5}
        />
      </GeometryComponent>

      {/* Label */}
      <Text
        position={[0, -scaledRadius - 0.4, 0]}
        fontSize={0.25}
        color={node.isDimmed ? "#94a3b8" : "#f8fafc"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#0b0f19"
      >
        {node.label}
      </Text>
      
      {/* Type badge */}
      <Text
        position={[0, -scaledRadius - 0.75, 0]}
        fontSize={0.15}
        color={node.isDimmed ? "#475569" : "#00d2b4"}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#0b0f19"
      >
        {node.type.replace('_', ' ').toUpperCase()}
      </Text>
    </group>
  );
};
