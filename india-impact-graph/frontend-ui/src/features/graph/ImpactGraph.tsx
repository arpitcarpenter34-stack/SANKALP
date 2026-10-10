import React, { useMemo, useEffect, useCallback, useState } from 'react';
import type {
  GraphCanvasSlotProps,
  KnowledgeGraphData,
} from '../../types/contracts';
import { computeDeterministicLayout } from './graph-layout';
import styles from './graph.module.css';

const STAGE_COLUMNS = [
  { index: 0, label: 'Global Events', bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' },
  { index: 1, label: 'Global Commodities', bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1' },
  { index: 2, label: 'Indian Economy', bg: '#E0E7FF', border: '#C7D2FE', text: '#3730A3' },
  { index: 3, label: 'Sectors', bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46' },
  { index: 4, label: 'Household & Investment', bg: '#DCFCE7', border: '#BBF7D0', text: '#166534' },
];

const DOMAIN_FILTERS = [
  { id: 'all', label: 'All domains' },
  { id: 'petrol', label: 'Petrol & Diesel', icon: '⛽' },
  { id: 'lpg', label: 'LPG / CNG', icon: '🔥' },
  { id: 'semiconductors', label: 'Semiconductors', icon: '💻' },
  { id: 'food', label: 'Food & Agriculture', icon: '🌾' },
  { id: 'currency', label: 'Currency & Markets', icon: '📈' },
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
  const [activeView, setActiveView] = useState<'transmission' | 'sector'>('transmission');
  const [activeDomain, setActiveDomain] = useState<string>('all');

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

  // Compute deterministic layout
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    return computeDeterministicLayout(data, { width: 1000, height: 420, paddingX: 110, paddingY: 80 });
  }, [data]);

  // Handle domain filter selection
  const handleDomainSelect = (domainId: string) => {
    setActiveDomain(domainId);
    if (domainId === 'all') {
      if (onSelectPath) onSelectPath('all');
    } else if (domainId === 'petrol' || domainId === 'lpg') {
      if (onSelectPath) onSelectPath('transport_cost');
    } else if (domainId === 'food') {
      if (onSelectPath) onSelectPath('food_cost');
    } else if (domainId === 'currency' || domainId === 'semiconductors') {
      if (onSelectPath) onSelectPath('financial_market');
    }
  };

  // Compute augmented nodes & edges
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

      // Bezier curve connecting card edges
      const cardHalfW = 75;
      const srcX = e.sourceX + cardHalfW;
      const srcY = e.sourceY;
      const tgtX = e.targetX - cardHalfW;
      const tgtY = e.targetY;
      const dx = Math.max(25, (tgtX - srcX) * 0.45);
      const curvedPathD = `M ${srcX} ${srcY} C ${srcX + dx} ${srcY}, ${tgtX - dx} ${tgtY}, ${tgtX} ${tgtY}`;

      return {
        ...e,
        pathD: curvedPathD,
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
    setActiveDomain('all');
    setZoomLevel(1);
  };

  // Node details helper
  const getNodeDetails = (nodeId: string, nodeLabel: string) => {
    const id = nodeId.toLowerCase();
    if (id.includes('crude_oil')) {
      return {
        title: 'Crude Oil',
        delta: '+22% Brent price',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        deltaColor: '#0369A1',
        icon: '🛢️',
      };
    }
    if (id.includes('diesel')) {
      return {
        title: 'Petrol & Diesel',
        delta: '+12% Retail prices',
        iconBg: '#D1FAE5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '⛽',
      };
    }
    if (id.includes('petrol')) {
      return {
        title: 'Petrol & Diesel',
        delta: '+12% Retail prices',
        iconBg: '#D1FAE5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '⛽',
      };
    }
    if (id.includes('freight') || id.includes('transport')) {
      return {
        title: 'Transport & Freight',
        delta: '+10% Logistics costs',
        iconBg: '#D1FAE5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '🚚',
      };
    }
    if (id.includes('food') || id.includes('mandi')) {
      return {
        title: 'Food Prices',
        delta: '+6% Food inflation',
        iconBg: '#DCFCE7',
        iconBorder: '#BBF7D0',
        deltaColor: '#047857',
        icon: '🛒',
      };
    }
    if (id.includes('household')) {
      return {
        title: 'Household Budget',
        delta: '+4.3% Monthly expenses',
        iconBg: '#DCFCE7',
        iconBorder: '#BBF7D0',
        deltaColor: '#047857',
        icon: '🏠',
      };
    }
    if (id.includes('rate') || id.includes('rbi') || id.includes('market') || id.includes('cpi')) {
      return {
        title: 'Indian Markets',
        delta: '-3% Auto & IT stocks',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        deltaColor: '#E11D48',
        icon: '📊',
      };
    }
    if (id.includes('commute')) {
      return {
        title: 'Conveyance & Transport',
        delta: '+8% Fuel expense',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        deltaColor: '#0284C7',
        icon: '🛵',
      };
    }

    return {
      title: nodeLabel,
      delta: 'Active node',
      iconBg: '#F3FAF5',
      iconBorder: '#D1E3D7',
      deltaColor: '#5A7184',
      icon: '🔹',
    };
  };

  if (isLoading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.loadingState}>
          <div className={styles.spinnerIcon} />
          <p className={styles.stateText}>Synthesizing economic impact transmission topology...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>◇</div>
          <p className={styles.stateText}>No economic impact graph active. Select an event scenario to load dependency graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.centerContainer}>
      {/* 1. Header with Title & View/Zoom Controls */}
      <div className={styles.graphCardHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.graphTitle}>Economic Impact Graph</h2>
          <p className={styles.graphSubtitle}>From global events to your household and investments</p>
        </div>

        <div className={styles.headerRight}>
          {/* View Switcher: Transmission Flow vs Sector View */}
          <div className={styles.viewSwitcher}>
            <span className={styles.viewLabel}>View:</span>
            <button
              type="button"
              className={`${styles.viewBtn} ${activeView === 'transmission' ? styles.viewBtnActive : ''}`}
              onClick={() => setActiveView('transmission')}
            >
              Transmission Flow
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${activeView === 'sector' ? styles.viewBtnActive : ''}`}
              onClick={() => setActiveView('sector')}
            >
              Sector View
            </button>
          </div>

          {/* Zoom and Fit Controls */}
          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.ctrlIconBtn}
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.ctrlIconBtn}
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.fitViewBtn}
              onClick={handleResetView}
              title="Fit View"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              <span>Fit View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Incomplete Path Warning Banner if any */}
      {activeIncompleteWarning ? (
        <div className={styles.incompleteBanner} role="alert">
          <span className={styles.incompleteIcon}>⚠️</span>
          <span>{activeIncompleteWarning}</span>
        </div>
      ) : null}

      {/* 2. Interactive SVG Graph Canvas */}
      <div className={styles.svgViewportWrapper} role="region" aria-label="Interactive Economic Impact Graph">
        <svg
          viewBox="0 0 1000 420"
          className={styles.svgGraph}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Directed Arrowheads */}
            <marker
              id="arrow-observed"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#047857" />
            </marker>

            <marker
              id="arrow-inferred"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0D9488" />
            </marker>

            <marker
              id="arrow-selected"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#047857" />
            </marker>

            {/* Subtle Drop Shadow for Cards */}
            <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" floodColor="#101828" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Background Canvas Tint */}
          <rect width="1000" height="420" fill="#FAFCFA" />

          {/* 5 Column Stage Header Badges */}
          <g className={styles.stageHeadersLayer}>
            {STAGE_COLUMNS.map((col) => {
              const xPos = 110 + col.index * 195;
              const w = 150;
              return (
                <g key={col.index} transform={`translate(${xPos - w / 2}, 16)`}>
                  <rect
                    width={w}
                    height="24"
                    rx="6"
                    fill={col.bg}
                    stroke={col.border}
                    strokeWidth="1"
                  />
                  <text
                    x={w / 2}
                    y="16"
                    textAnchor="middle"
                    fill={col.text}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="var(--font-sans)"
                  >
                    {col.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Edges Layer (Bezier curves) */}
          <g className={styles.edgesLayer}>
            {edges.map((edge) => {
              const isSelected = edge.isSelected;
              const isHighlighted = edge.isHighlighted;
              const isDimmed = edge.isDimmed;
              const isObserved = edge.kind === 'observed';

              const edgeColor = isSelected ? '#047857' : isObserved ? '#047857' : '#0D9488';
              const markerEnd = isSelected
                ? 'url(#arrow-selected)'
                : isObserved
                ? 'url(#arrow-observed)'
                : 'url(#arrow-inferred)';

              return (
                <g
                  key={edge.id}
                  className={`${styles.edgeGroup} ${isDimmed ? styles.edgeDimmed : ''}`}
                  onClick={() => onSelectEdge && onSelectEdge(edge.id)}
                >
                  {/* Invisible Hit Area */}
                  <path d={edge.pathD} className={styles.edgeHitArea} />

                  {/* Highlight Aura */}
                  {(isSelected || isHighlighted) && (
                    <path
                      d={edge.pathD}
                      fill="none"
                      stroke={edgeColor}
                      strokeWidth={5}
                      opacity={0.25}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Main Edge Line */}
                  <path
                    d={edge.pathD}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={isSelected ? 2.8 : isHighlighted ? 2.4 : 1.8}
                    strokeDasharray={isObserved ? undefined : '5 4'}
                    markerEnd={markerEnd}
                  />
                </g>
              );
            })}
          </g>

          {/* Nodes Layer (Rendered as Cards) */}
          <g className={styles.nodesLayer}>
            {nodes.map((node) => {
              const isSelected = node.isSelected;
              const isHighlighted = node.isHighlighted;
              const isDimmed = node.isDimmed;

              const cardW = 150;
              const cardH = 46;
              const cardX = node.x - cardW / 2;
              const cardY = node.y - cardH / 2;

              const details = getNodeDetails(node.id, node.label);

              return (
                <g
                  key={node.id}
                  className={`${styles.nodeGroup} ${isDimmed ? styles.nodeDimmed : ''} ${isSelected ? styles.nodeSelected : ''}`}
                  transform={`translate(${cardX}, ${cardY})`}
                  onClick={() => onSelectNode && onSelectNode(node.id)}
                >
                  {/* Card Background */}
                  <rect
                    width={cardW}
                    height={cardH}
                    rx="8"
                    fill="#FFFFFF"
                    stroke={isSelected ? '#047857' : isHighlighted ? '#10B981' : '#D1E3D7'}
                    strokeWidth={isSelected ? 2.5 : isHighlighted ? 2 : 1}
                    filter="url(#card-shadow)"
                    className={styles.nodeCardRect}
                  />

                  {/* Left Icon Container */}
                  <rect
                    x="8"
                    y="8"
                    width="30"
                    height="30"
                    rx="6"
                    fill={details.iconBg}
                    stroke={details.iconBorder}
                    strokeWidth="1"
                  />
                  <text
                    x="23"
                    y="28"
                    fontSize="14"
                    textAnchor="middle"
                  >
                    {details.icon}
                  </text>

                  {/* Node Label Text */}
                  <text
                    x="45"
                    y="22"
                    fill="#172B3A"
                    fontSize="11.5"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                  >
                    {details.title.length > 15 ? `${details.title.slice(0, 14)}…` : details.title}
                  </text>

                  {/* Node Delta / Subtitle */}
                  <text
                    x="45"
                    y="36"
                    fill={details.deltaColor}
                    fontSize="9.5"
                    fontWeight="600"
                    fontFamily="var(--font-sans)"
                  >
                    {details.delta}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 3. Legend Bar below Canvas */}
      <div className={styles.legendRow}>
        <div className={styles.legendLeft}>
          <div className={styles.legendItem}>
            <span className={styles.observedArrow}>→</span>
            <span className={styles.legendText}>Observed relationship</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.inferredArrow}>- - →</span>
            <span className={styles.legendText}>Inferred relationship</span>
          </div>
        </div>

        <div className={styles.legendBadges}>
          <span className={styles.badgeEvent}>Global event</span>
          <span className={styles.badgeCommodity}>Commodity</span>
          <span className={styles.badgeSector}>Sector</span>
          <span className={styles.badgeHousehold}>Household</span>
          <span className={styles.badgeInvestment}>Investment</span>
        </div>
      </div>

      {/* 4. Domain Filter Pills Bar */}
      <div className={styles.domainBar}>
        <span className={styles.domainLabel}>Explore domains:</span>
        <div className={styles.domainPills}>
          {DOMAIN_FILTERS.map((df) => {
            const isActive = activeDomain === df.id;
            return (
              <button
                key={df.id}
                type="button"
                className={`${styles.domainPill} ${isActive ? styles.domainPillActive : ''}`}
                onClick={() => handleDomainSelect(df.id)}
              >
                {df.icon && <span className={styles.pillIcon}>{df.icon}</span>}
                <span>{df.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className={styles.domainArrowBtn}
          aria-label="Next domains"
        >
          ›
        </button>
      </div>
    </div>
  );
};
