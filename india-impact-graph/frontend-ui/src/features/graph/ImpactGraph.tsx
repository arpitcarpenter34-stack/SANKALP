import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Play Impact Chain playback state
  const [isPlayingChain, setIsPlayingChain] = useState<boolean>(false);
  const [playbackStep, setPlaybackStep] = useState<number>(2); // Default step 3 of 7 (0-indexed 2)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const timerRef = useRef<number | null>(null);

  // Handle Escape key to clear selections or exit fullscreen
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          if (selectedNodeId && onSelectNode) onSelectNode(null);
          if (selectedEdgeId && onSelectEdge) onSelectEdge(null);
          setIsPlayingChain(false);
        }
      }
    },
    [selectedNodeId, selectedEdgeId, onSelectNode, onSelectEdge, isFullscreen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Compute deterministic layout
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    return computeDeterministicLayout(data, { width: 1040, height: 420, paddingX: 110, paddingY: 80 });
  }, [data]);

  // Derive topological causal path for playback (ordered from left to right by x position)
  const causalChainNodeIds = useMemo(() => {
    if (!rawNodes || rawNodes.length === 0) return [];
    const sorted = [...rawNodes].sort((a, b) => a.x - b.x || a.y - b.y);
    return sorted.map((n) => n.id);
  }, [rawNodes]);

  const totalSteps = Math.max(causalChainNodeIds.length, 7);

  // Playback timer effect
  useEffect(() => {
    if (isPlayingChain) {
      const intervalMs = Math.round(1600 / playbackSpeed);
      timerRef.current = window.setInterval(() => {
        setPlaybackStep((prev) => {
          const next = prev + 1;
          if (next >= causalChainNodeIds.length) {
            setIsPlayingChain(false);
            return prev;
          }
          const targetNodeId = causalChainNodeIds[next];
          if (targetNodeId && onSelectNode) {
            onSelectNode(targetNodeId);
          }
          return next;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlayingChain, playbackSpeed, causalChainNodeIds, onSelectNode]);

  // Play impact chain controls
  const handleTogglePlay = () => {
    if (isPlayingChain) {
      setIsPlayingChain(false);
    } else {
      if (playbackStep >= causalChainNodeIds.length - 1) {
        setPlaybackStep(0);
        if (causalChainNodeIds[0] && onSelectNode) {
          onSelectNode(causalChainNodeIds[0]);
        }
      }
      setIsPlayingChain(true);
    }
  };

  const handlePause = () => {
    setIsPlayingChain(false);
  };

  const handleRestart = () => {
    setPlaybackStep(0);
    if (causalChainNodeIds[0] && onSelectNode) {
      onSelectNode(causalChainNodeIds[0]);
    }
    setIsPlayingChain(true);
  };

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

    // Active playback node
    const activePlaybackNodeId = causalChainNodeIds[playbackStep] || selectedNodeId;

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

      if (activePlaybackNodeId) {
        if (e.from === activePlaybackNodeId || e.to === activePlaybackNodeId) {
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
      const isSelected = (activePlaybackNodeId === n.id) || (selectedNodeId === n.id);
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
  }, [rawNodes, rawEdges, selectedPath, selectedNodeId, selectedEdgeId, data, causalChainNodeIds, playbackStep]);

  const handleResetView = () => {
    if (onSelectPath) onSelectPath('all');
    if (onSelectNode) onSelectNode(null);
    if (onSelectEdge) onSelectEdge(null);
    setActiveDomain('all');
    setZoomLevel(1);
    setIsPlayingChain(false);
    setPlaybackStep(2);
  };

  // Node details helper for aesthetic cards matching screenshot
  const getNodeDetails = (nodeId: string, nodeLabel: string) => {
    const id = nodeId.toLowerCase();
    if (id.includes('taiwan') || id.includes('chip') && id.includes('disrupt')) {
      return {
        title: 'Taiwan Chip Disruption',
        delta: '+25% Chip supply',
        iconBg: '#FFE4E6',
        iconBorder: '#FECDD3',
        deltaColor: '#E11D48',
        icon: '🌐',
        glow: true,
      };
    }
    if (id.includes('semiconductor')) {
      return {
        title: 'Semiconductor Imports',
        delta: '+20% Higher cost',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        deltaColor: '#0284C7',
        icon: '💻',
        glow: false,
      };
    }
    if (id.includes('crude_oil')) {
      return {
        title: 'Crude Oil Brent',
        delta: '+12% Benchmark',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        deltaColor: '#D97706',
        icon: '🛢️',
        glow: false,
      };
    }
    if (id.includes('shipping') || id.includes('logistics') || id.includes('freight')) {
      return {
        title: 'Global Shipping & Logistics',
        delta: '+8% Freight cost',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        deltaColor: '#0284C7',
        icon: '🚢',
        glow: false,
      };
    }
    if (id.includes('manufacturing') || id.includes('industry')) {
      return {
        title: 'Indian Manufacturing',
        delta: '+10% Production cost',
        iconBg: '#D1FAE5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '🏭',
        glow: false,
      };
    }
    if (id.includes('auto') || id.includes('electronics')) {
      return {
        title: 'Electronics & Automotive',
        delta: '+6% Product prices',
        iconBg: '#EDE9FE',
        iconBorder: '#DDD6FE',
        deltaColor: '#7C3AED',
        icon: '🛍️',
        glow: false,
      };
    }
    if (id.includes('household') || id.includes('expense') || id.includes('budget')) {
      return {
        title: 'Household Costs',
        delta: '+3.5% Electronics',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        deltaColor: '#D97706',
        icon: '🏠',
        glow: false,
      };
    }
    if (id.includes('sip') || id.includes('saving') || id.includes('capacity')) {
      return {
        title: 'SIP Capacity',
        delta: '-4.2% Potential reduction',
        iconBg: '#D1FAE5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '🌱',
        glow: false,
      };
    }

    return {
      title: nodeLabel,
      delta: 'Active node',
      iconBg: '#F0FAF4',
      iconBorder: '#D8EADF',
      deltaColor: '#047857',
      icon: '🔹',
      glow: false,
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
    <div className={`${styles.centerContainer} ${isFullscreen ? styles.fullscreenContainer : ''}`}>
      {/* 1. Header with Title & Play Impact Chain & View/Zoom Controls */}
      <div className={styles.graphCardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIconBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M9 6h6M6 9v6M18 9v6" />
              </svg>
            </div>
            <div className={styles.headerTitles}>
              <h2 className={styles.graphTitle}>Economic Impact Graph</h2>
              <p className={styles.graphSubtitle}>From global events to your household and investments</p>
            </div>
          </div>
        </div>

        {/* Center: Play Impact Chain Controller */}
        <div className={styles.playbackControlsGroup}>
          <button
            type="button"
            className={`${styles.playChainBtn} ${isPlayingChain ? styles.playChainBtnActive : ''}`}
            onClick={handleTogglePlay}
            title={isPlayingChain ? 'Pause Impact Chain Playback' : 'Play Scenario Causal Path'}
          >
            {isPlayingChain ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Play Impact Chain</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={styles.playbackIconBtn}
            onClick={handlePause}
            title="Pause animation"
            aria-label="Pause animation"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>

          <button
            type="button"
            className={styles.playbackIconBtn}
            onClick={handleRestart}
            title="Restart from Step 1"
            aria-label="Restart from Step 1"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>

          <select
            className={styles.speedSelect}
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            aria-label="Playback speed"
          >
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>

          {/* Step indicator */}
          <div className={styles.stepIndicator}>
            <span className={styles.stepLabel}>Step {playbackStep + 1} of {totalSteps}</span>
            <div className={styles.stepProgressBar}>
              <div
                className={styles.stepProgressFill}
                style={{ width: `${((playbackStep + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: View & Zoom Controls */}
        <div className={styles.headerRight}>
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

          <div className={styles.zoomControls}>
            <button
              type="button"
              className={styles.ctrlIconBtn}
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
              <span>Fit View</span>
            </button>
            <button
              type="button"
              className={styles.ctrlIconBtn}
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label="Toggle Fullscreen"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Incomplete Path Warning Banner if any */}
      {activeIncompleteWarning && (
        <div className={styles.incompleteBanner} role="alert">
          <span className={styles.incompleteIcon}>⚠️</span>
          <span>{activeIncompleteWarning}</span>
        </div>
      )}

      {/* 2. Interactive SVG Graph Canvas with Stylized Fintech Cards */}
      <div className={styles.svgViewportWrapper} role="region" aria-label="Interactive Economic Impact Graph">
        <svg
          viewBox="0 0 1040 420"
          className={styles.svgGraph}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
        >
          <defs>
            {/* Arrowheads for relationship types */}
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
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0284C7" />
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

            {/* Subtle Drop Shadows */}
            <filter id="card-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#047857" floodOpacity="0.08" />
            </filter>
            <filter id="card-glow-red" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#EF4444" floodOpacity="0.35" />
            </filter>
            <filter id="card-glow-green" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10B981" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Ambient Map & Grid Canvas Tint */}
          <rect width="1040" height="420" fill="#F4FAF6" />

          {/* Subdued World/India Map Background Outline Graphic */}
          <g opacity="0.12" fill="#047857">
            <circle cx="520" cy="210" r="180" fill="none" stroke="#047857" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="520" cy="210" r="280" fill="none" stroke="#047857" strokeWidth="0.8" strokeDasharray="4 4" />
          </g>

          {/* 5 Column Stage Header Badges */}
          <g className={styles.stageHeadersLayer}>
            {STAGE_COLUMNS.map((col) => {
              const xPos = 110 + col.index * 205;
              const w = 150;
              return (
                <g key={col.index} transform={`translate(${xPos - w / 2}, 16)`}>
                  <rect
                    width={w}
                    height="22"
                    rx="6"
                    fill={col.bg}
                    stroke={col.border}
                    strokeWidth="1"
                  />
                  <text
                    x={w / 2}
                    y="15"
                    textAnchor="middle"
                    fill={col.text}
                    fontSize="10.5"
                    fontWeight="600"
                    fontFamily="var(--font-sans)"
                  >
                    {col.label}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Edges Layer (Curved Bezier connectors) */}
          <g className={styles.edgesLayer}>
            {edges.map((edge) => {
              const isSelected = edge.isSelected;
              const isHighlighted = edge.isHighlighted;
              const isDimmed = edge.isDimmed;
              const isObserved = edge.kind === 'observed';

              const edgeColor = isSelected ? '#047857' : isHighlighted ? '#10B981' : isObserved ? '#047857' : '#0284C7';
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
                  <path d={edge.pathD} className={styles.edgeHitArea} />

                  {(isSelected || isHighlighted) && (
                    <path
                      d={edge.pathD}
                      fill="none"
                      stroke={edgeColor}
                      strokeWidth={5}
                      opacity={0.3}
                      strokeLinecap="round"
                    />
                  )}

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

          {/* Nodes Layer: Rounded Fintech Cards */}
          <g className={styles.nodesLayer}>
            {nodes.map((node) => {
              const isSelected = node.isSelected;
              const isHighlighted = node.isHighlighted;
              const isDimmed = node.isDimmed;

              const cardW = 154;
              const cardH = 48;
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
                  {/* Outer subtle glow when selected or shock */}
                  {details.glow && (
                    <rect
                      x="-3"
                      y="-3"
                      width={cardW + 6}
                      height={cardH + 6}
                      rx="12"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      opacity="0.6"
                      filter="url(#card-glow-red)"
                    />
                  )}

                  {isSelected && !details.glow && (
                    <rect
                      x="-3"
                      y="-3"
                      width={cardW + 6}
                      height={cardH + 6}
                      rx="12"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      opacity="0.6"
                      filter="url(#card-glow-green)"
                    />
                  )}

                  {/* Card Background */}
                  <rect
                    width={cardW}
                    height={cardH}
                    rx="10"
                    fill="#FFFFFF"
                    stroke={isSelected ? '#047857' : isHighlighted ? '#10B981' : '#D8EADF'}
                    strokeWidth={isSelected ? 2.4 : isHighlighted ? 1.8 : 1}
                    filter="url(#card-shadow)"
                    className={styles.nodeCardRect}
                  />

                  {/* Left Icon Container */}
                  <rect
                    x="8"
                    y="8"
                    width="32"
                    height="32"
                    rx="8"
                    fill={details.iconBg}
                    stroke={details.iconBorder}
                    strokeWidth="1"
                  />
                  <text
                    x="24"
                    y="29"
                    fontSize="15"
                    textAnchor="middle"
                  >
                    {details.icon}
                  </text>

                  {/* Node Label Text */}
                  <text
                    x="48"
                    y="23"
                    fill="#172B3A"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                  >
                    {details.title.length > 16 ? `${details.title.slice(0, 15)}…` : details.title}
                  </text>

                  {/* Node Delta / Metric Subtitle */}
                  <text
                    x="48"
                    y="37"
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

          <div className={styles.legendItem}>
            <span className={styles.potentialArrow}>····→</span>
            <span className={styles.legendText}>Potential impact</span>
          </div>
        </div>

        <div className={styles.legendRightNote}>
          <span className={styles.noteIcon}>ⓘ</span>
          <span>Node size indicates relative impact and sector exposure</span>
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
