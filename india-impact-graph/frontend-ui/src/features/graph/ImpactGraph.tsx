import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import type {
  GraphCanvasSlotProps,
  KnowledgeGraphData,
  PropagationPathCategory,
} from '../../types/contracts';
import { computeDeterministicLayout } from './graph-layout';
import { computeConnectedChain, computeCausalPaths } from './graph-traversal';
import {
  deriveDomainFilteredGraph,
  DOMAIN_FILTER_DEFINITIONS,
  DomainFilterId,
} from './domain-filter';
import styles from './graph.module.css';

const STAGE_COLUMNS = [
  { index: 0, label: 'Global Events', bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' },
  { index: 1, label: 'Global Commodities', bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1' },
  { index: 2, label: 'Indian Economy', bg: '#E0E7FF', border: '#C7D2FE', text: '#3730A3' },
  { index: 3, label: 'Sectors', bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46' },
  { index: 4, label: 'Household & Investment', bg: '#DCFCE7', border: '#BBF7D0', text: '#166534' },
];

const DOMAIN_FILTERS = DOMAIN_FILTER_DEFINITIONS;

export interface ImpactGraphProps extends Omit<GraphCanvasSlotProps, 'selectedPath'> {
  selectedPath?: PropagationPathCategory | 'all';
  initialDomain?: DomainFilterId;
  initialView?: 'transmission' | 'sector';
  onDomainChange?: (domain: DomainFilterId) => void;
}

export const ImpactGraph: React.FC<ImpactGraphProps> = ({
  data,
  selectedPath = 'all',
  onSelectPath,
  selectedNodeId,
  onSelectNode,
  selectedEdgeId,
  onSelectEdge,
  isLoading = false,
  initialDomain = 'all',
  initialView = 'transmission',
  onDomainChange,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeView, setActiveView] = useState<'transmission' | 'sector'>(initialView);
  const [activeDomain, setActiveDomain] = useState<DomainFilterId>(initialDomain);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Automatic continuous animation state
  const [animStep, setAnimStep] = useState<number>(0);
  const [animPathIndex, setAnimPathIndex] = useState<number>(0);
  const animTimerRef = useRef<number | null>(null);

  // Detect reduced-motion preference to avoid unwanted movement
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // 1. Derive single domain-filtered graph model (guarantees referential edge integrity and isolated domain sets)
  const filteredData = useMemo(() => {
    return deriveDomainFilteredGraph(data, activeDomain, activeView);
  }, [data, activeDomain, activeView]);

  // 2. Compute deterministic layout from the domain-filtered data
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    return computeDeterministicLayout(filteredData, { width: 1040, height: 420, paddingX: 110, paddingY: 80 });
  }, [filteredData]);

  // Reconcile manual selections if node or edge is no longer present in the active domain
  useEffect(() => {
    if (selectedNodeId) {
      const nodeExists = rawNodes.some((n) => n.id === selectedNodeId);
      if (!nodeExists && onSelectNode) {
        onSelectNode(null);
      }
    }
    if (selectedEdgeId) {
      const edgeExists = rawEdges.some((e) => e.id === selectedEdgeId);
      if (!edgeExists && onSelectEdge) {
        onSelectEdge(null);
      }
    }
  }, [rawNodes, rawEdges, selectedNodeId, selectedEdgeId, onSelectNode, onSelectEdge]);


  // Derive valid causal transmission paths from root nodes to terminal impact nodes
  const causalPaths = useMemo(() => {
    return computeCausalPaths(rawNodes, rawEdges, selectedPath);
  }, [rawNodes, rawEdges, selectedPath]);

  // Current active animation path
  const currentAnimPath = useMemo(() => {
    if (!causalPaths || causalPaths.length === 0) return null;
    return causalPaths[animPathIndex % causalPaths.length] || causalPaths[0];
  }, [causalPaths, animPathIndex]);

  // Handle Escape key to clear selections or exit fullscreen
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          if (selectedNodeId && onSelectNode) onSelectNode(null);
          if (selectedEdgeId && onSelectEdge) onSelectEdge(null);
          setAnimStep(0);
        }
      }
    },
    [selectedNodeId, selectedEdgeId, onSelectNode, onSelectEdge, isFullscreen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Automatic & continuous impact-chain animation loop
  useEffect(() => {
    // While a node or edge is manually selected, or if user prefers reduced motion, pause/suppress the loop
    if (selectedNodeId || selectedEdgeId || prefersReducedMotion) {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
      return;
    }

    if (!currentAnimPath || currentAnimPath.nodeIds.length === 0) {
      return;
    }

    // Step sequence: each node in path + 1 final hold tick before looping
    const totalStepsForPath = currentAnimPath.nodeIds.length + 1;

    animTimerRef.current = window.setInterval(() => {
      setAnimStep((prev) => {
        const next = prev + 1;
        if (next >= totalStepsForPath) {
          // Advance to next valid causal transmission path and smoothly restart at step 0
          setAnimPathIndex((prevIdx) => (prevIdx + 1) % Math.max(1, causalPaths.length));
          return 0;
        }
        return next;
      });
    }, 1400);

    return () => {
      if (animTimerRef.current) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, [selectedNodeId, selectedEdgeId, prefersReducedMotion, currentAnimPath, causalPaths.length]);

  // Calculate complete multi-hop connected chain when a node is manually selected
  const manualChain = useMemo(() => {
    if (!selectedNodeId) return null;
    return computeConnectedChain(selectedNodeId, rawEdges);
  }, [selectedNodeId, rawEdges]);

  // Compute augmented nodes & edges with coordinated manual & auto-animation highlighting
  const { nodes, edges, activeIncompleteWarning } = useMemo(() => {
    const isManualSelectionActive = Boolean(selectedNodeId);
    const isEdgeSelectionActive = Boolean(selectedEdgeId);
    const isPathFilterActive = selectedPath !== 'all';

    // 1. MANUAL NODE SELECTION MODE
    if (isManualSelectionActive && manualChain) {
      const augmentedEdges = rawEdges.map((e) => {
        const isSelected = selectedEdgeId === e.id;
        const isHighlighted = manualChain.connectedEdgeIds.has(e.id);
        const isDimmed = !isHighlighted && !isSelected;

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
          isTraversing: false,
        };
      });

      const augmentedNodes = rawNodes.map((n) => {
        const isSelected = n.id === selectedNodeId;
        const isHighlighted = manualChain.connectedNodeIds.has(n.id);
        const isDimmed = !isHighlighted;

        return {
          ...n,
          isSelected,
          isHighlighted,
          isDimmed,
        };
      });

      return {
        nodes: augmentedNodes,
        edges: augmentedEdges,
        activeIncompleteWarning: null,
      };
    }

    // 2. MANUAL EDGE SELECTION MODE
    if (isEdgeSelectionActive) {
      const selectedEdge = rawEdges.find((e) => e.id === selectedEdgeId);
      const edgeEndpoints = new Set<string>();
      if (selectedEdge) {
        edgeEndpoints.add(selectedEdge.from);
        edgeEndpoints.add(selectedEdge.to);
      }

      const augmentedEdges = rawEdges.map((e) => {
        const isSelected = e.id === selectedEdgeId;
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
          isHighlighted: isSelected,
          isDimmed: !isSelected,
          isTraversing: false,
        };
      });

      const augmentedNodes = rawNodes.map((n) => {
        const isHighlighted = edgeEndpoints.has(n.id);
        return {
          ...n,
          isSelected: false,
          isHighlighted,
          isDimmed: !isHighlighted,
        };
      });

      return {
        nodes: augmentedNodes,
        edges: augmentedEdges,
        activeIncompleteWarning: null,
      };
    }

    // 3. AUTOMATIC CONTINUOUS ANIMATION MODE (or static readable state for reduced motion)
    if (prefersReducedMotion || !currentAnimPath || currentAnimPath.nodeIds.length === 0) {
      // In reduced motion mode, maintain a readable baseline without continuous pulse
      const augmentedEdges = rawEdges.map((e) => {
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
          isSelected: false,
          isHighlighted: false,
          isDimmed: false,
          isTraversing: false,
        };
      });

      const augmentedNodes = rawNodes.map((n) => ({
        ...n,
        isSelected: false,
        isHighlighted: false,
        isDimmed: false,
      }));

      return {
        nodes: augmentedNodes,
        edges: augmentedEdges,
        activeIncompleteWarning: null,
      };
    }

    // Determine current moving traversal step along connected edges
    const clampedStep = Math.min(animStep, currentAnimPath.nodeIds.length - 1);
    const activeNodeId = currentAnimPath.nodeIds[clampedStep];
    const activeTraversingEdgeId = clampedStep > 0 ? currentAnimPath.edgeIds[clampedStep - 1] : null;

    // Set of nodes & edges traversed so far in the current chain
    const traversedNodeIds = new Set(currentAnimPath.nodeIds.slice(0, clampedStep + 1));
    const traversedEdgeIds = new Set(
      clampedStep > 0 ? currentAnimPath.edgeIds.slice(0, clampedStep) : []
    );

    const augmentedEdges = rawEdges.map((e) => {
      const isTraversing = e.id === activeTraversingEdgeId;
      const isHighlighted = traversedEdgeIds.has(e.id);
      const isDimmed = !isTraversing && !isHighlighted;

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
        isSelected: false,
        isHighlighted,
        isDimmed,
        isTraversing,
      };
    });

    const augmentedNodes = rawNodes.map((n) => {
      const isSelected = n.id === activeNodeId;
      const isHighlighted = traversedNodeIds.has(n.id);
      const isDimmed = !isSelected && !isHighlighted;

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
  }, [
    rawNodes,
    rawEdges,
    selectedNodeId,
    selectedEdgeId,
    selectedPath,
    manualChain,
    currentAnimPath,
    animStep,
    prefersReducedMotion,
    data,
  ]);

  // Node click handler: Toggles selection and coordinates with auto-animation
  const handleNodeClick = (nodeId: string) => {
    if (selectedNodeId === nodeId) {
      // Clicking the currently selected node again clears selection and resumes automatic animation
      if (onSelectNode) onSelectNode(null);
      if (onSelectEdge) onSelectEdge(null);
      setAnimStep(0);
    } else {
      // Selecting a node pauses auto-animation and highlights its full connected impact chain
      if (onSelectNode) onSelectNode(nodeId);
      if (onSelectEdge) onSelectEdge(null);
    }
  };

  // Edge click handler
  const handleEdgeClick = (edgeId: string) => {
    if (selectedEdgeId === edgeId) {
      if (onSelectEdge) onSelectEdge(null);
      setAnimStep(0);
    } else {
      if (onSelectEdge) onSelectEdge(edgeId);
      if (onSelectNode) onSelectNode(null);
    }
  };

  // Background click handler to clear selection
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (selectedNodeId && onSelectNode) onSelectNode(null);
      if (selectedEdgeId && onSelectEdge) onSelectEdge(null);
      setAnimStep(0);
    }
  };

  // Reset view to default state
  const handleResetView = () => {
    if (onSelectPath) onSelectPath('all');
    if (onSelectNode) onSelectNode(null);
    if (onSelectEdge) onSelectEdge(null);
    setActiveDomain('all');
    setZoomLevel(1);
    setAnimStep(0);
    setAnimPathIndex(0);
  };

  // Handle domain filter selection
  const handleDomainSelect = (domainId: string) => {
    const targetDomain = domainId as DomainFilterId;
    setActiveDomain(targetDomain);
    if (onDomainChange) onDomainChange(targetDomain);
    // Clear manual selections so animation traverses the newly selected domain
    if (selectedNodeId && onSelectNode) onSelectNode(null);
    if (selectedEdgeId && onSelectEdge) onSelectEdge(null);
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    setAnimStep(0);
    setAnimPathIndex(0);

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

  // Handle view change (Transmission Flow vs Sector View)
  const handleViewChange = (newView: 'transmission' | 'sector') => {
    setActiveView(newView);
    if (selectedNodeId && onSelectNode) onSelectNode(null);
    if (selectedEdgeId && onSelectEdge) onSelectEdge(null);
    if (animTimerRef.current) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }
    setAnimStep(0);
    setAnimPathIndex(0);
  };

  // Find human-readable label for active domain
  const activeDomainDef = DOMAIN_FILTERS.find((d) => d.id === activeDomain);
  const activeDomainLabel = activeDomainDef?.label || 'this domain';

  // Node details helper for aesthetic cards matching reference fintech design
  const getNodeDetails = (nodeId: string, nodeLabel: string) => {
    const id = nodeId.toLowerCase();
    const lbl = nodeLabel.toLowerCase();

    if (id.includes('taiwan') || (id.includes('chip') && id.includes('disrupt'))) {
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
    if (id.includes('crude_oil') || id === 'crude' || id.includes('brent')) {
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
    if (id.includes('petrol') || id.includes('motor_spirit')) {
      return {
        title: 'Motor Spirit (Petrol)',
        delta: '+9.8% Retail pump',
        iconBg: '#ECFDF5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '⛽',
        glow: false,
      };
    }
    if (id.includes('diesel') || id.includes('hsd')) {
      return {
        title: 'Commercial Diesel (HSD)',
        delta: '+10.5% Pump price',
        iconBg: '#ECFDF5',
        iconBorder: '#A7F3D0',
        deltaColor: '#047857',
        icon: '⛽',
        glow: false,
      };
    }
    if (id.includes('vegetable') || id.includes('mandi') || lbl.includes('mandi') || lbl.includes('food')) {
      return {
        title: nodeLabel.length > 22 ? 'Mandi Food & Produce' : nodeLabel,
        delta: '44.52% Rural basket',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        deltaColor: '#B45309',
        icon: '🌾',
        glow: false,
      };
    }
    if (id.includes('commute') || id.includes('conveyance') || lbl.includes('conveyance')) {
      return {
        title: 'Conveyance & Transport',
        delta: '7.59% Rural MPCE',
        iconBg: '#E0F2FE',
        iconBorder: '#BAE6FD',
        deltaColor: '#0284C7',
        icon: '🚗',
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
    if (id.includes('rbi') || id.includes('repo')) {
      return {
        title: 'RBI Repo Rate Policy',
        delta: 'Monetary stance',
        iconBg: '#EDE9FE',
        iconBorder: '#DDD6FE',
        deltaColor: '#6366F1',
        icon: '🏛️',
        glow: false,
      };
    }
    if (id.includes('cpi') || id.includes('inflation')) {
      return {
        title: 'CPI Headline Inflation',
        delta: '+35 bps passthrough',
        iconBg: '#EDE9FE',
        iconBorder: '#DDD6FE',
        deltaColor: '#6366F1',
        icon: '📈',
        glow: false,
      };
    }
    if (id.includes('nifty') || id.includes('equity') || id.includes('stock')) {
      return {
        title: 'Nifty 50 Index',
        delta: 'Capital markets',
        iconBg: '#F1F5F9',
        iconBorder: '#CBD5E1',
        deltaColor: '#475569',
        icon: '📊',
        glow: false,
      };
    }
    if (id.includes('lpg') || id.includes('cng') || id.includes('gas')) {
      return {
        title: 'LPG / CNG Energy',
        delta: 'Domestic & transit gas',
        iconBg: '#FEF3C7',
        iconBorder: '#FDE68A',
        deltaColor: '#D97706',
        icon: '🔥',
        glow: false,
      };
    }
    if (id.includes('currency') || id.includes('forex') || id.includes('inr') || id.includes('usd')) {
      return {
        title: 'INR/USD Exchange Rate',
        delta: 'Import parity',
        iconBg: '#EDE9FE',
        iconBorder: '#DDD6FE',
        deltaColor: '#6366F1',
        icon: '💱',
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
    if (id.includes('household') || id.includes('expense') || id.includes('budget') || id.includes('persona')) {
      return {
        title: 'Household Budget',
        delta: 'MoSPI HCES 2023-24',
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
      {/* 1. Header with Title & View/Zoom Controls (Playback control bar removed) */}
      <div className={styles.graphCardHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.titleWithIcon}>
            <div className={styles.titleIconBadge}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

        {/* Right: View & Zoom Controls */}
        <div className={styles.headerRight}>
          <div className={styles.viewSwitcher} role="group" aria-label="Graph View Selector">
            <span className={styles.viewLabel}>View:</span>
            <button
              type="button"
              className={`${styles.viewBtn} ${activeView === 'transmission' ? styles.viewBtnActive : ''}`}
              onClick={() => handleViewChange('transmission')}
            >
              Transmission Flow
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${activeView === 'sector' ? styles.viewBtnActive : ''}`}
              onClick={() => handleViewChange('sector')}
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
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
      {rawNodes.length === 0 ? (
        <div
          className={styles.domainEmptyContainer}
          role="status"
          aria-label="No impact pathways available for this domain"
        >
          <div className={styles.emptyIcon}>◇</div>
          <h3 className={styles.emptyDomainTitle}>
            No impact pathways available for this domain yet.
          </h3>
          <p className={styles.emptyDomainText}>
            The active macroeconomic event does not contain verified transmission pathways for{' '}
            <strong>{activeDomainLabel}</strong>
            {activeView === 'sector' ? ' in Sector View' : ''}.
          </p>
          <button
            type="button"
            className={styles.resetDomainPillBtn}
            onClick={() => handleDomainSelect('all')}
          >
            View All Domains
          </button>
        </div>
      ) : (
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

            <marker
              id="arrow-highlighted"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6.5"
              markerHeight="6.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9.5 5 L 0 8.5 z" fill="#10B981" />
            </marker>

            {/* Drop Shadows & Glow Filters */}
            <filter id="card-shadow" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#047857" floodOpacity="0.08" />
            </filter>
            <filter id="card-glow-red" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#EF4444" floodOpacity="0.35" />
            </filter>
            <filter id="card-glow-green" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#10B981" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Ambient Map & Grid Canvas Background */}
          <rect
            width="1040"
            height="420"
            fill="#F4FAF6"
            className={styles.canvasBackground}
            onClick={handleBackgroundClick}
          />

          {/* Subdued Background Concentric Guide Outlines */}
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
              const isTraversing = edge.isTraversing;
              const isObserved = edge.kind === 'observed';

              const edgeColor =
                isSelected || isTraversing
                  ? '#047857'
                  : isHighlighted
                  ? '#10B981'
                  : isObserved
                  ? '#047857'
                  : '#0284C7';

              const markerEnd =
                isSelected || isTraversing
                  ? 'url(#arrow-selected)'
                  : isHighlighted
                  ? 'url(#arrow-highlighted)'
                  : isObserved
                  ? 'url(#arrow-observed)'
                  : 'url(#arrow-inferred)';

              return (
                <g
                  key={edge.id}
                  className={`${styles.edgeGroup} ${isDimmed ? styles.edgeDimmed : ''} ${
                    isHighlighted ? styles.edgeHighlighted : ''
                  }`}
                  onClick={() => handleEdgeClick(edge.id)}
                >
                  {/* Invisible wide hit area for easy clicking */}
                  <path d={edge.pathD} className={styles.edgeHitArea} />

                  {/* Active Traversal Edge Glow Backdrop */}
                  {isTraversing && (
                    <path
                      d={edge.pathD}
                      fill="none"
                      className={styles.activeTraversalGlow}
                    />
                  )}

                  {/* Highlight Glow Backdrop */}
                  {(isSelected || isHighlighted) && !isTraversing && (
                    <path
                      d={edge.pathD}
                      fill="none"
                      stroke={edgeColor}
                      strokeWidth={5}
                      opacity={0.3}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Main Visible Edge Path */}
                  <path
                    d={edge.pathD}
                    fill="none"
                    stroke={edgeColor}
                    strokeWidth={isSelected || isTraversing ? 3 : isHighlighted ? 2.5 : 1.8}
                    strokeDasharray={isTraversing ? '8 5' : isObserved ? undefined : '5 4'}
                    markerEnd={markerEnd}
                    className={isTraversing ? styles.activeTraversalEdge : ''}
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
                  className={`${styles.nodeGroup} ${isDimmed ? styles.nodeDimmed : ''} ${
                    isSelected ? styles.nodeSelected : ''
                  } ${isHighlighted ? styles.nodeHighlighted : ''}`}
                  transform={`translate(${cardX}, ${cardY})`}
                  onClick={() => handleNodeClick(node.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${details.title}, ${details.delta}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleNodeClick(node.id);
                    }
                  }}
                >
                  {/* Shock event outer red glow if applicable */}
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

                  {/* Selected / actively traversing emerald glow */}
                  {isSelected && !details.glow && (
                    <rect
                      x="-3"
                      y="-3"
                      width={cardW + 6}
                      height={cardH + 6}
                      rx="12"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.8"
                      opacity="0.6"
                      filter="url(#card-glow-green)"
                    />
                  )}

                  {/* Card Background Container */}
                  <rect
                    width={cardW}
                    height={cardH}
                    rx="10"
                    fill="#FFFFFF"
                    stroke={isSelected ? '#047857' : isHighlighted ? '#10B981' : '#D8EADF'}
                    strokeWidth={isSelected ? 2.5 : isHighlighted ? 2 : 1}
                    filter="url(#card-shadow)"
                    className={styles.nodeCardRect}
                  />

                  {/* Left Icon Badge */}
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
                    aria-hidden="true"
                  >
                    {details.icon}
                  </text>

                  {/* Node Title Label Text */}
                  <text
                    x="48"
                    y="23"
                    fill="#10233F"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="var(--font-sans)"
                  >
                    {details.title.length > 20 ? `${details.title.slice(0, 19)}…` : details.title}
                  </text>

                  {/* Metric / Subtitle Delta Badge */}
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
      )}

      {/* 3. Legend Bar below Canvas */}
      {rawNodes.length > 0 && (
        <div className={styles.legendRow}>
          <div className={styles.legendLeft}>
            <div className={styles.legendItem}>
              <span className={styles.observedArrow}>→</span>
              <span className={styles.legendText}>Observed relationship</span>
            </div>

            <div className={styles.inferredArrow}>- - →</div>
            <span className={styles.legendText}>Inferred relationship</span>

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
      )}

      {/* 4. Domain Filter Pills Bar */}
      <div className={styles.domainBar}>
        <span className={styles.domainLabel}>Explore domains:</span>
        <div className={styles.domainPills} role="tablist" aria-label="Explore Domains">
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
