import React, { useMemo, useEffect, useCallback } from 'react';
import type {
  GraphCanvasSlotProps,
  KnowledgeGraphData,
  PropagationPathCategory,
} from '../../types/contracts';
import { computeDeterministicLayout } from './graph-layout';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { GraphNode3D } from './GraphNode3D';
import { GraphEdge3D } from './GraphEdge3D';
import styles from './graph.module.css';

const PATH_OPTIONS: { id: PropagationPathCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Paths' },
  { id: 'food_cost', label: 'Path A: Food-Cost Chain' },
  { id: 'transport_cost', label: 'Path B: Transport Chain' },
  { id: 'financial_market', label: 'Path C: Financial-Market Chain' },
];

export const ImpactGraph: React.FC<GraphCanvasSlotProps> = ({
  data,
  selectedPath,
  onSelectPath,
  selectedNodeId,
  onSelectNode,
  selectedEdgeId,
  onSelectEdge,
  isLoading = false,
}) => {
  // Handle Escape key to clear selections
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedNodeId && onSelectNode) onSelectNode(null);
        if (selectedEdgeId && onSelectEdge) onSelectEdge(null);
      }
    },
    [selectedNodeId, selectedEdgeId, onSelectNode, onSelectEdge]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Compute deterministic coordinates
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    return computeDeterministicLayout(data, { width: 1000, height: 560 });
  }, [data]);

  // Compute highlighted & dimmed states based on selectedPath & selections
  const { nodes, edges, activeIncompleteWarning } = useMemo(() => {
    const isPathFilterActive = selectedPath !== 'all';

    // 1. Edges that belong to selected path
    const pathEdges = new Set<string>();
    const pathNodes = new Set<string>();

    if (isPathFilterActive) {
      for (const e of rawEdges) {
        if (e.pathCategory === selectedPath) {
          pathEdges.add(e.id);
          pathNodes.add(e.from);
          pathNodes.add(e.to);
        }
      }
    }

    // 2. Compute augmented edges
    const augmentedEdges = rawEdges.map((e) => {
      const isSelected = selectedEdgeId === e.id;
      let isHighlighted = false;
      let isDimmed = false;

      if (isPathFilterActive) {
        if (pathEdges.has(e.id)) {
          isHighlighted = true;
        } else {
          isDimmed = true;
        }
      }

      if (selectedNodeId) {
        if (e.from === selectedNodeId || e.to === selectedNodeId) {
          isHighlighted = true;
          isDimmed = false;
        } else if (!isPathFilterActive) {
          isDimmed = true;
        }
      }

      return {
        ...e,
        isSelected,
        isHighlighted,
        isDimmed,
      };
    });

    // 3. Compute augmented nodes
    const augmentedNodes = rawNodes.map((n) => {
      const isSelected = selectedNodeId === n.id;
      let isHighlighted = false;
      let isDimmed = false;

      if (isPathFilterActive) {
        if (pathNodes.has(n.id)) {
          isHighlighted = true;
        } else {
          isDimmed = true;
        }
      }

      if (selectedEdgeId) {
        const edge = rawEdges.find((e) => e.id === selectedEdgeId);
        if (edge && (edge.from === n.id || edge.to === n.id)) {
          isHighlighted = true;
          isDimmed = false;
        } else if (!isPathFilterActive) {
          isDimmed = true;
        }
      }

      return {
        ...n,
        isSelected,
        isHighlighted,
        isDimmed,
      };
    });

    // 4. Incomplete path warning detection
    let warning: string | null = null;
    if ((data as KnowledgeGraphData & { incompletePaths?: { path: string; reason?: string }[] })?.incompletePaths && (data as KnowledgeGraphData & { incompletePaths?: { path: string; reason?: string }[] }).incompletePaths!.length > 0) {
      if (isPathFilterActive) {
        const match = (data as KnowledgeGraphData & { incompletePaths?: { path: string; reason?: string }[] }).incompletePaths!.find((p) => p.path === selectedPath);
        if (match) {
          warning = match.reason || `Propagation path ${selectedPath} is incomplete in the supplied data.`;
        }
      } else {
        // If 'all' is selected, report any unverified or broken chain
        warning = (data as KnowledgeGraphData & { incompletePaths?: { path: string; reason?: string }[] }).incompletePaths![0].reason || 'One or more propagation chains are incomplete in the supplied data.';
      }
    }

    return {
      nodes: augmentedNodes,
      edges: augmentedEdges,
      activeIncompleteWarning: warning,
    };
  }, [rawNodes, rawEdges, selectedPath, selectedNodeId, selectedEdgeId, data]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.canvasContainer}>
        <div className={styles.loadingState}>
          <div className={styles.stateIcon}>⟳</div>
          <p>Synthesizing financial event market impact topology...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className={styles.canvasContainer}>
        <div className={styles.emptyState}>
          <div className={styles.stateIcon}>◇</div>
          <p>No financial event graph active. Select an event scenario to load dependency graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.canvasContainer}>
      {/* Top Bar with Path Filter Controls */}
      <div className={styles.topBar}>
        <div className={styles.pathButtons} role="toolbar" aria-label="Propagation Path Filters">
          {PATH_OPTIONS.map((opt) => {
            const isActive = selectedPath === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`${styles.pathButton} ${isActive ? styles.pathButtonActive : ''}`}
                onClick={() => onSelectPath && onSelectPath(opt.id)}
                aria-pressed={isActive}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {selectedNodeId || selectedEdgeId ? (
          <button
            type="button"
            className={styles.pathButton}
            onClick={() => {
              if (onSelectNode) onSelectNode(null);
              if (onSelectEdge) onSelectEdge(null);
            }}
          >
            Clear Selection (Esc)
          </button>
        ) : null}
      </div>

      {/* Incomplete Path Warning Banner */}
      {activeIncompleteWarning ? (
        <div className={styles.incompleteBanner} role="alert">
          <span className={styles.incompleteIcon}>⚠️</span>
          <span>{activeIncompleteWarning}</span>
        </div>
      ) : null}

      {/* 3D Canvas Viewport */}
      <div className={styles.svgViewport} role="region" aria-label="Interactive Financial Impact Knowledge Graph">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 15]} fov={50} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
          />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <Environment preset="city" />
          
          <group position={[-16, -9, 0]}>
            {/* Render Edges first so nodes sit on top */}
            {edges.map((edge) => {
              const sourceNode = nodes.find(n => n.id === edge.from);
              const targetNode = nodes.find(n => n.id === edge.to);
              
              if (!sourceNode || !targetNode) return null;
              
              // Scale coordinates to fit nicely in 3D space. 
              // Original 1000x560 canvas, center it roughly
              const sourcePos: [number, number, number] = [sourceNode.x / 30, (560 - sourceNode.y) / 30, 0];
              const targetPos: [number, number, number] = [targetNode.x / 30, (560 - targetNode.y) / 30, 0];

              return (
                <GraphEdge3D
                  key={edge.id}
                  edge={edge}
                  sourcePos={sourcePos}
                  targetPos={targetPos}
                  onSelect={(id) => onSelectEdge && onSelectEdge(id)}
                />
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const position: [number, number, number] = [node.x / 30, (560 - node.y) / 30, Math.random() * 2 - 1]; // Slight Z variance for depth
              return (
                <GraphNode3D
                  key={node.id}
                  node={node}
                  position={position}
                  onSelect={(id) => onSelectNode && onSelectNode(id)}
                />
              );
            })}
          </group>
          
          <ContactShadows position={[0, -5, 0]} opacity={0.4} scale={50} blur={2} far={10} />
        </Canvas>
      </div>

      {/* Footer Bar with Visual Legend */}
      <div className={styles.footerBar}>
        <div className={styles.legendList}>
          <div className={styles.legendItem}>
            <div className={styles.legendLineObserved} />
            <span>Observed (Measured Empirical / Direct Statement)</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendLineInferred} />
            <span>Inferred (Econometric Theory / Supply Transmission)</span>
          </div>
        </div>

        <div>
          <span>Tip: Click node or edge to inspect verified source receipt</span>
        </div>
      </div>
    </div>
  );
};
