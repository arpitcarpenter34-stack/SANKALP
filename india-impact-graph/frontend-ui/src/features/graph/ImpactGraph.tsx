import React, { useMemo, useEffect, useCallback, useState } from 'react';
import type {
  GraphCanvasSlotProps,
  KnowledgeGraphData,
  PropagationPathCategory,
} from '../../types/contracts';
import { computeDeterministicLayout } from './graph-layout';
import styles from './graph.module.css';

const PATH_OPTIONS: { id: PropagationPathCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Channels' },
  { id: 'food_cost', label: 'Path A: Food Cost Chain' },
  { id: 'transport_cost', label: 'Path B: Transport & Freight' },
  { id: 'financial_market', label: 'Path C: Financial Markets' },
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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
    return computeDeterministicLayout(data, { width: 1000, height: 500, paddingX: 110, paddingY: 55 });
  }, [data]);

  // Compute highlighted & dimmed states
  const { nodes, edges, activeIncompleteWarning } = useMemo(() => {
    const isPathFilterActive = selectedPath !== 'all';

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

    let warning: string | null = null;
    const typedData = data as (KnowledgeGraphData & { incompletePaths?: { path: string; reason?: string }[] }) | null;
    if (typedData?.incompletePaths && typedData.incompletePaths.length > 0) {
      if (isPathFilterActive) {
        const match = typedData.incompletePaths.find((p) => p.path === selectedPath);
        if (match) {
          warning = match.reason || `Propagation path ${selectedPath} is incomplete in official statistics.`;
        }
      } else {
        warning = typedData.incompletePaths[0].reason || 'One or more propagation chains are unverified in official statistics.';
      }
    }

    return {
      nodes: augmentedNodes,
      edges: augmentedEdges,
      activeIncompleteWarning: warning,
    };
  }, [rawNodes, rawEdges, selectedPath, selectedNodeId, selectedEdgeId, data]);

  const handleResetView = () => {
    if (onSelectPath) onSelectPath('all');
    if (onSelectNode) onSelectNode(null);
    if (onSelectEdge) onSelectEdge(null);
    setZoomLevel(1);
  };

  // Helper to render distinct SVG icons for nodes
  const renderNodeIcon = (nodeId: string, nodeType: string) => {
    if (nodeId.includes('crude') || nodeId.includes('shock')) {
      // Oil drum / barrel icon
      return (
        <g fill="#ff5268" transform="translate(-10, -10)">
          <path d="M4 4h12v12H4z" fill="none" stroke="#ff5268" strokeWidth="1.8" />
          <ellipse cx="10" cy="4" rx="6" ry="2" fill="#ff5268" opacity="0.3" stroke="#ff5268" strokeWidth="1.5" />
          <ellipse cx="10" cy="16" rx="6" ry="2" fill="#ff5268" opacity="0.3" stroke="#ff5268" strokeWidth="1.5" />
          <line x1="4" y1="10" x2="16" y2="10" stroke="#ff5268" strokeWidth="1.5" />
        </g>
      );
    }
    if (nodeId.includes('household') || nodeType === 'persona') {
      // House / Home icon
      return (
        <g stroke="#a855f7" strokeWidth="1.8" fill="none" transform="translate(-10, -10)">
          <path d="M3 9l7-6 7 6v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
          <polyline points="7 19 7 12 13 12 13 19" />
        </g>
      );
    }
    if (nodeId.includes('freight') || nodeId.includes('transport') || nodeId.includes('logistics')) {
      // Delivery truck icon
      return (
        <g stroke="#00d9ff" strokeWidth="1.6" fill="none" transform="translate(-10, -8)">
          <rect x="1" y="3" width="11" height="9" rx="1" />
          <path d="M12 6h4l3 3v3h-7V6z" />
          <circle cx="4.5" cy="14.5" r="1.8" />
          <circle cx="16.5" cy="14.5" r="1.8" />
        </g>
      );
    }
    if (nodeId.includes('diesel') || nodeId.includes('petrol') || nodeId.includes('fuel')) {
      // Fuel pump dispenser icon
      return (
        <g stroke="#00d9ff" strokeWidth="1.6" fill="none" transform="translate(-9, -9)">
          <rect x="2" y="2" width="10" height="14" rx="2" />
          <path d="M5 6h4" />
          <path d="M12 5l3 3v5a2 2 0 0 1-2 2" />
        </g>
      );
    }
    if (nodeId.includes('rate') || nodeId.includes('exchange') || nodeId.includes('rbi')) {
      // Rupee symbol ₹
      return (
        <text
          x="0"
          y="5"
          fill="#00d9ff"
          fontSize="16"
          fontWeight="700"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
        >
          ₹
        </text>
      );
    }
    if (nodeId.includes('food') || nodeId.includes('wheat') || nodeId.includes('mandi')) {
      // Grain / wheat icon
      return (
        <g stroke="#ffb323" strokeWidth="1.6" fill="none" transform="translate(-8, -10)">
          <path d="M8 2v16M8 6c2-2 4 0 4 2s-2 2-4 2M8 10c-2-2-4 0-4 2s2 2 4 2M8 14c2-2 4 0 4 2s-2 2-4 2" />
        </g>
      );
    }
    if (nodeId.includes('energy_prices') || nodeId.includes('cpi')) {
      // Stacked coins / economy icon
      return (
        <g stroke="#00d9ff" strokeWidth="1.6" fill="none" transform="translate(-9, -9)">
          <ellipse cx="9" cy="4" rx="7" ry="2.5" />
          <path d="M2 4v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V4" />
          <path d="M2 8v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V8" />
        </g>
      );
    }
    if (nodeId.includes('import') || nodeId.includes('refin')) {
      // Refinery / Factory landmark icon
      return (
        <g stroke="#00d9ff" strokeWidth="1.6" fill="none" transform="translate(-9, -9)">
          <path d="M2 16V6l5 4V6l5 4V3h4v13H2z" />
        </g>
      );
    }
    // Default supply / ship icon
    return (
      <g stroke="#00d9ff" strokeWidth="1.6" fill="none" transform="translate(-9, -8)">
        <path d="M2 13l2 3h10l2-3H2z" />
        <path d="M6 13V6h6v7" />
        <line x1="9" y1="3" x2="9" y2="6" />
      </g>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinnerIcon} />
          <p className={styles.stateText}>Synthesizing financial event market impact topology...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <p className={styles.stateText}>No financial event graph active. Select an event scenario to load dependency graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centerContainer}>
      {/* 1. Header with Title, Legend & Reset View */}
      <div className={styles.graphCardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <span className={styles.titleChevron}>›</span>
            <h2 className={styles.graphTitle}>Financial Impact Knowledge Graph</h2>
          </div>
          <p className={styles.graphSubtitle}>Multi-Step Transmission from Global Shock to Household Impact</p>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.headerLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendLineObserved} />
              <span>Observed</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendLineInferred} />
              <span>Inferred</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.resetViewBtn}
            onClick={handleResetView}
            title="Reset viewport and channel filters"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset View
          </button>
        </div>
      </div>

      {/* 2. Channel Filter Tabs */}
      <div className={styles.channelFilterBar} role="tablist" aria-label="Propagation Paths">
        {PATH_OPTIONS.map((opt) => {
          const isActive = selectedPath === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.channelTab} ${isActive ? styles.channelTabActive : ''}`}
              onClick={() => onSelectPath && onSelectPath(opt.id)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Incomplete Path Warning Banner */}
      {activeIncompleteWarning ? (
        <div className={styles.incompleteBanner} role="alert">
          <span className={styles.incompleteIcon}>⚠️</span>
          <span>{activeIncompleteWarning}</span>
        </div>
      ) : null}

      {/* 3. Deep Navy Neon SVG Canvas */}
      <div className={styles.svgViewportWrapper} role="region" aria-label="Interactive Knowledge Graph">
        <svg
          viewBox="0 0 1000 500"
          className={styles.svgGraph}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Subtle Blue Grid */}
            <pattern id="grok-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(18, 60, 99, 0.25)" strokeWidth="1" />
              <circle cx="40" cy="40" r="1" fill="rgba(0, 217, 255, 0.3)" />
            </pattern>

            {/* Glowing Halos */}
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-coral" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-violet" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Directed Arrowheads */}
            <marker id="arrow-observed" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#00d9ff" />
            </marker>
            <marker id="arrow-inferred" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#ffb323" />
            </marker>
            <marker id="arrow-selected" viewBox="0 0 10 10" refX="26" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffffff" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="500" fill="url(#grok-grid)" />

          {/* Edges Layer */}
          <g className={styles.edgesLayer}>
            {edges.map((edge) => {
              const isSelected = edge.isSelected;
              const isHighlighted = edge.isHighlighted;
              const isDimmed = edge.isDimmed;
              
              const isObserved = edge.kind === 'observed';
              const markerEnd = isSelected ? 'url(#arrow-selected)' : isObserved ? 'url(#arrow-observed)' : 'url(#arrow-inferred)';
              const edgeColor = isSelected ? '#ffffff' : isObserved ? '#00d9ff' : '#ffb323';

              return (
                <g 
                  key={edge.id} 
                  className={`${styles.edgeGroup} ${isDimmed ? styles.edgeDimmed : ''}`}
                  onClick={() => onSelectEdge && onSelectEdge(edge.id)}
                >
                  {/* Invisible Hit Area */}
                  <path d={edge.pathD} className={styles.edgeHitArea} />
                  
                  {/* Outer Glow Path for highlighted / selected edges */}
                  {(isSelected || isHighlighted) && (
                    <path
                      d={edge.pathD}
                      fill="none"
                      stroke={edgeColor}
                      strokeWidth={6}
                      opacity={0.3}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Visible Edge Line */}
                  <path 
                    d={edge.pathD} 
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={isSelected ? 3.5 : isHighlighted ? 2.8 : 2}
                    strokeDasharray={isObserved ? undefined : '6 4'}
                    markerEnd={markerEnd}
                    className={!isObserved ? styles.flowingDashed : undefined}
                  />

                  {/* Edge Relation Label on Hover/Select */}
                  {(isSelected || isHighlighted) && (
                    <g transform={`translate(${edge.midX}, ${edge.midY - 8})`}>
                      <rect
                        x="-48"
                        y="-10"
                        width="96"
                        height="18"
                        rx="4"
                        fill="#030b18"
                        stroke={edgeColor}
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      <text
                        x="0"
                        y="3"
                        fill="#f4f8ff"
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                      >
                        {edge.relationType.replace(/_/g, ' ')}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Nodes Layer */}
          <g className={styles.nodesLayer}>
            {nodes.map((node) => {
              const isSelected = node.isSelected;
              const isHighlighted = node.isHighlighted;
              const isDimmed = node.isDimmed;

              // Determine visual archetype
              const isShock = node.id.includes('crude') || node.id.includes('shock') || (node.type === 'commodity' && node.x < 150);
              const isHousehold = node.id.includes('household') || node.type === 'persona';
              const isCenterRefinery = node.id.includes('import') || node.id.includes('diesel') || node.x > 450 && node.x < 550;

              const nodeRadius = isShock || isHousehold ? 32 : isCenterRefinery ? 28 : 25;
              const mainStroke = isShock ? '#ff5268' : isHousehold ? '#a855f7' : '#00d9ff';
              const mainFill = isShock ? '#160914' : isHousehold ? '#180a29' : '#06172d';
              const filterGlow = isShock ? 'url(#glow-coral)' : isHousehold ? 'url(#glow-violet)' : 'url(#glow-cyan)';

              return (
                <g 
                  key={node.id} 
                  className={`${styles.nodeGroup} ${isDimmed ? styles.nodeDimmed : ''} ${isSelected ? styles.nodeSelected : ''}`}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => onSelectNode && onSelectNode(node.id)}
                >
                  {/* Outer Pulsing Halo Rings for Source Shock & Household Destination */}
                  {(isShock || isHousehold || isCenterRefinery) && (
                    <circle 
                      r={nodeRadius + 8} 
                      fill="none" 
                      stroke={mainStroke} 
                      strokeWidth="1.2"
                      opacity="0.45"
                      className={styles.pulseRing}
                    />
                  )}

                  {/* Selected / Highlighted Aura */}
                  {(isSelected || isHighlighted) && (
                    <circle 
                      r={nodeRadius + 6} 
                      fill="none" 
                      stroke="#ffffff" 
                      strokeWidth="2"
                      filter={filterGlow}
                    />
                  )}

                  {/* Core Node Circle */}
                  <circle 
                    r={nodeRadius} 
                    fill={mainFill}
                    stroke={isSelected ? '#ffffff' : mainStroke} 
                    strokeWidth={isSelected ? 3.5 : isCenterRefinery ? 2.5 : 2}
                    filter={isSelected ? filterGlow : undefined}
                    className={styles.nodeCircle}
                  />

                  {/* Icon inside Node */}
                  {renderNodeIcon(node.id, node.type)}

                  {/* Node Label below */}
                  <text 
                    y={nodeRadius + 18} 
                    className={styles.nodeLabelText}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 4. Key Transmission Channels (4 Cards in a row) */}
      <div className={styles.channelsSection}>
        <div className={styles.sectionHeading}>Key Transmission Channels</div>
        <div className={styles.channelsGrid}>
          {/* Channel 1: Food Cost Chain */}
          <button
            type="button"
            className={`${styles.channelCard} ${selectedPath === 'food_cost' ? styles.channelCardActive : ''}`}
            onClick={() => onSelectPath && onSelectPath(selectedPath === 'food_cost' ? 'all' : 'food_cost')}
          >
            <div className={`${styles.channelIconBox} ${styles.iconGold}`}>🌾</div>
            <div className={styles.channelMeta}>
              <div className={styles.channelTitle}>Food Cost Chain</div>
              <div className={styles.channelSub}>3 nodes • 2 paths</div>
              <span className={styles.badgeCoral}>+ High Impact</span>
            </div>
          </button>

          {/* Channel 2: Transport & Freight */}
          <button
            type="button"
            className={`${styles.channelCard} ${selectedPath === 'transport_cost' ? styles.channelCardActive : ''}`}
            onClick={() => onSelectPath && onSelectPath(selectedPath === 'transport_cost' ? 'all' : 'transport_cost')}
          >
            <div className={`${styles.channelIconBox} ${styles.iconCyan}`}>🚚</div>
            <div className={styles.channelMeta}>
              <div className={styles.channelTitle}>Transport &amp; Freight</div>
              <div className={styles.channelSub}>4 nodes • 3 paths</div>
              <span className={styles.badgeAmber}>★ Medium</span>
            </div>
          </button>

          {/* Channel 3: Financial Markets */}
          <button
            type="button"
            className={`${styles.channelCard} ${selectedPath === 'financial_market' ? styles.channelCardActive : ''}`}
            onClick={() => onSelectPath && onSelectPath(selectedPath === 'financial_market' ? 'all' : 'financial_market')}
          >
            <div className={`${styles.channelIconBox} ${styles.iconBlue}`}>📊</div>
            <div className={styles.channelMeta}>
              <div className={styles.channelTitle}>Financial Markets</div>
              <div className={styles.channelSub}>3 nodes • 2 paths</div>
              <span className={styles.badgeBlue}>★ Low</span>
            </div>
          </button>

          {/* Channel 4: Energy & Fuel */}
          <button
            type="button"
            className={`${styles.channelCard} ${styles.channelCardEnergy}`}
            onClick={() => onSelectPath && onSelectPath('transport_cost')}
          >
            <div className={`${styles.channelIconBox} ${styles.iconViolet}`}>⛽</div>
            <div className={styles.channelMeta}>
              <div className={styles.channelTitle}>Energy &amp; Fuel</div>
              <div className={styles.channelSub}>4 nodes • 3 paths</div>
              <span className={styles.badgeCoral}>+ High Impact</span>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Bottom Stepper Overview & Graph Controls */}
      <div className={styles.bottomOverviewRow}>
        <div className={styles.pathOverviewGroup}>
          <div className={styles.overviewTitle}>
            <span className={styles.titleChevron}>›</span> Transmission Path Overview
          </div>
          <div className={styles.pathStepper}>
            <span className={`${styles.pathPill} ${styles.pillShock}`}>Global Shock +12%</span>
            <span className={styles.stepperArrow}>➔</span>
            <span className={styles.pathPill}>Energy Prices</span>
            <span className={styles.stepperArrow}>➔</span>
            <span className={styles.pathPill}>Shipping &amp; Freight</span>
            <span className={styles.stepperArrow}>➔</span>
            <span className={styles.pathPill}>INR Exchange Rate</span>
            <span className={styles.stepperArrow}>➔</span>
            <span className={styles.pathPill}>Domestic Fuel Prices</span>
            <span className={styles.stepperArrow}>➔</span>
            <span className={styles.pathPill}>Transport &amp; Logistics</span>
            <span className={styles.stepperArrow}>➔</span>
            <span className={`${styles.pathPill} ${styles.pillHousehold}`}>Household Impact</span>
          </div>
        </div>

        <div className={styles.graphControlsGroup}>
          <div className={styles.controlHeader}>Graph Controls</div>
          <div className={styles.controlButtons}>
            <button
              type="button"
              className={styles.ctrlBtn}
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              title="Zoom In"
            >
              🔍+ Zoom In
            </button>
            <button
              type="button"
              className={styles.ctrlBtn}
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              title="Zoom Out"
            >
              🔍- Zoom Out
            </button>
            <button
              type="button"
              className={styles.ctrlBtn}
              onClick={() => setZoomLevel(1)}
              title="Fit View"
            >
              ⊡ Fit View
            </button>
            <button
              type="button"
              className={styles.ctrlBtn}
              title="Interactive Drag"
            >
              ✋ Drag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
