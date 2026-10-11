import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  DOMAIN_DATASETS,
  DOMAIN_OPTIONS,
  SCENARIO_OPTIONS,
  TIME_HORIZON_OPTIONS,
  DomainGraphDataset,
  DomainNode,
} from './domainGraphData';
import { computeConnectedChain } from './graph-traversal';
import styles from './ImpactGraphView.module.css';

interface ImpactGraphViewProps {
  initialDomainId?: string;
  onNavigateToScenario?: (scenarioId: string) => void;
}

export const ImpactGraphView: React.FC<ImpactGraphViewProps> = ({
  initialDomainId = 'semiconductors',
  onNavigateToScenario,
}) => {
  // 1. Controls State
  const [selectedDomainId, setSelectedDomainId] = useState<string>(initialDomainId);
  const [selectedScenario, setSelectedScenario] = useState<string>('current');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState<string>('6m');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'transmission' | 'sector'>('transmission');

  // Active dataset
  const currentDataset: DomainGraphDataset = useMemo(() => {
    return DOMAIN_DATASETS[selectedDomainId] || DOMAIN_DATASETS.semiconductors;
  }, [selectedDomainId]);

  // 2. Selection & Filter State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    currentDataset.defaultSelectedNodeId
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'connections' | 'evidence' | 'news'>('overview');
  const [insightsTab, setInsightsTab] = useState<'takeaways' | 'risks'>('takeaways');
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeChartSeries, setActiveChartSeries] = useState<{ a: boolean; b: boolean }>({ a: true, b: true });

  // Layer filters
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>({
    'global-event': true,
    commodity: true,
    'supply-chain': true,
    'indian-economy': true,
    sector: true,
    household: true,
    investment: true,
  });
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);

  // 3. Pan & Zoom Canvas State
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // When domain changes, reset selection to domain default
  useEffect(() => {
    setSelectedNodeId(currentDataset.defaultSelectedNodeId);
    setSelectedEdgeId(null);
    setSearchQuery('');
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  }, [selectedDomainId, currentDataset]);

  // Keyboard navigation & ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
          setSearchQuery('');
          setIsLayersOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(`.${styles.nodeCardSvg}`) || (e.target as HTMLElement).closest(`.${styles.floatingLegend}`)) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoomLevel((prev) => Math.min(1.8, Math.max(0.55, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Zoom controls
  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.8, Number((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.55, Number((z - 0.1).toFixed(2))));
  const handleFitView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Run analysis action
  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 600);
  };

  // Focus a specific node
  const focusNode = useCallback((nodeId: string) => {
    const node = currentDataset.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setIsDetailsOpen(true);
    // Center calculation: canvas virtual center is (600, 360)
    const targetPanX = 600 - node.x;
    const targetPanY = 360 - node.y;
    setPanOffset({ x: Math.max(-400, Math.min(400, targetPanX * 0.4)), y: Math.max(-300, Math.min(300, targetPanY * 0.4)) });
  }, [currentDataset]);

  // Selected Node Data
  const selectedNode: DomainNode | undefined = useMemo(() => {
    return currentDataset.nodes.find((n) => n.id === selectedNodeId);
  }, [currentDataset, selectedNodeId]);

  // Connected nodes & edges calculation (complete multi-hop impact chain traversal)
  const { connectedNodeIds, connectedEdgeIds } = useMemo(() => {
    if (selectedNodeId) {
      const chain = computeConnectedChain(selectedNodeId, currentDataset.edges);
      return { connectedNodeIds: chain.connectedNodeIds, connectedEdgeIds: chain.connectedEdgeIds };
    }

    if (selectedEdgeId) {
      const edge = currentDataset.edges.find((e) => e.id === selectedEdgeId);
      const edgeNodeIds = new Set<string>();
      if (edge) {
        edgeNodeIds.add(edge.from);
        edgeNodeIds.add(edge.to);
      }
      return { connectedNodeIds: edgeNodeIds, connectedEdgeIds: new Set([selectedEdgeId]) };
    }

    return { connectedNodeIds: new Set<string>(), connectedEdgeIds: new Set<string>() };
  }, [selectedNodeId, selectedEdgeId, currentDataset]);

  // Filtered nodes based on layer visibility and search
  const filteredNodes = useMemo(() => {
    return currentDataset.nodes.filter((node) => {
      if (!visibleLayers[node.category]) return false;
      return true;
    });
  }, [currentDataset, visibleLayers]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return currentDataset.nodes.filter(
      (n) => n.label.toLowerCase().includes(q) || n.detailedCategory.toLowerCase().includes(q)
    );
  }, [currentDataset, searchQuery]);

  // Node category visual map
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'global-event':
        return { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B', iconBg: '#FEE2E2', stroke: '#EF4444' };
      case 'commodity':
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', iconBg: '#FEF3C7', stroke: '#F59E0B' };
      case 'supply-chain':
        return { bg: '#E0F2FE', border: '#BAE6FD', text: '#075985', iconBg: '#E0F2FE', stroke: '#3B82F6' };
      case 'indian-economy':
        return { bg: '#EDE9FE', border: '#DDD6FE', text: '#5B21B6', iconBg: '#EDE9FE', stroke: '#6366F1' };
      case 'sector':
        return { bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46', iconBg: '#D1FAE5', stroke: '#10B981' };
      case 'household':
        return { bg: '#CCFBF1', border: '#99F6E4', text: '#115E59', iconBg: '#CCFBF1', stroke: '#0D9488' };
      case 'investment':
        return { bg: '#FEF9C3', border: '#FEF08A', text: '#854D0E', iconBg: '#FEF9C3', stroke: '#EAB308' };
      default:
        return { bg: '#F1F5F9', border: '#E2E8F0', text: '#334155', iconBg: '#F1F5F9', stroke: '#64748B' };
    }
  };

  // Helper icons
  const renderNodeIcon = (iconName: string) => {
    switch (iconName) {
      case 'cpu':
      case 'microchip':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
            <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
          </svg>
        );
      case 'box':
      case 'package':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case 'ship':
      case 'anchor':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="22" x2="12" y2="8" />
            <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
          </svg>
        );
      case 'smartphone':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        );
      case 'car':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9C2.1 11.2 2 11.6 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        );
      case 'radio':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
          </svg>
        );
      case 'settings':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      case 'home':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'credit-card':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case 'trending-up':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case 'fuel':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="22" x2="15" y2="22" />
            <line x1="4" y1="9" x2="14" y2="9" />
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
          </svg>
        );
      case 'flame':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        );
      case 'droplet':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'truck':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        );
      case 'shopping-cart':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      case 'zap':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };

  // Connected lists for selected node
  const upstreamNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const sourceIds = currentDataset.edges.filter((e) => e.to === selectedNodeId).map((e) => e.from);
    return currentDataset.nodes.filter((n) => sourceIds.includes(n.id));
  }, [currentDataset, selectedNodeId]);

  const downstreamNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const targetIds = currentDataset.edges.filter((e) => e.from === selectedNodeId).map((e) => e.to);
    return currentDataset.nodes.filter((n) => targetIds.includes(n.id));
  }, [currentDataset, selectedNodeId]);

  return (
    <div className={styles.container}>
      {/* 1. Header Card with Title & Analysis Controls */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBadge}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="6" height="6" rx="1" />
              <rect x="16" y="16" width="6" height="6" rx="1" />
              <rect x="2" y="16" width="6" height="6" rx="1" />
              <circle cx="18" cy="6" r="3" />
              <path d="M5 8v8" />
              <path d="M5 12h11" />
              <path d="M16 9v7" />
            </svg>
          </div>
          <div className={styles.headerTitles}>
            <h1 className={styles.pageTitle}>Impact Graph</h1>
            <p className={styles.pageSubtitle}>
              Explore how global events affect the Indian economy, sectors, household expenses and investments.
            </p>
          </div>
        </div>

        <div className={styles.headerControls}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Select Domain</span>
            <select
              className={styles.selectInput}
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value)}
              aria-label="Select Impact Graph Domain"
            >
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Scenario</span>
            <select
              className={styles.selectInput}
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              aria-label="Select Economic Scenario"
            >
              {SCENARIO_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Time Horizon</span>
            <select
              className={styles.selectInput}
              value={selectedTimeHorizon}
              onChange={(e) => setSelectedTimeHorizon(e.target.value)}
              aria-label="Select Forecast Time Horizon"
            >
              {TIME_HORIZON_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className={`${styles.runAnalysisBtn} ${isAnalyzing ? styles.runAnalysisBtnSpinning : ''}`}
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            title="Re-compute and simulate macroeconomic transmission"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            <span>{isAnalyzing ? 'Simulating...' : 'Run Analysis'}</span>
          </button>
        </div>
      </div>

      {/* 2. Horizontal Domain Filter Pills Bar */}
      <div className={styles.domainPillsRow} role="tablist" aria-label="Domain Selector">
        {DOMAIN_OPTIONS.map((d) => {
          const isActive = selectedDomainId === d.id;
          return (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.domainPill} ${isActive ? styles.domainPillActive : ''}`}
              onClick={() => setSelectedDomainId(d.id)}
            >
              <span className={styles.domainPillIcon}>{renderNodeIcon(d.icon)}</span>
              <span>{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Compact Graph Toolbar */}
      <div className={styles.graphToolbar}>
        {/* Left: View Switcher */}
        <div className={styles.viewToggleGroup}>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${activeView === 'transmission' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setActiveView('transmission')}
          >
            Graph View
          </button>
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${activeView === 'sector' ? styles.viewToggleBtnActive : ''}`}
            onClick={() => setActiveView('sector')}
          >
            Sector View
          </button>
        </div>

        {/* Center: Search nodes */}
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search nodes on graph"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClearBtn}
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className={styles.searchResultsDropdown}>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className={styles.searchResultItem}
                  onClick={() => {
                    focusNode(item.id);
                    setSearchQuery('');
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.label}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{item.categoryLabel}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Functional Zoom, Fit, Fullscreen, Layers */}
        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleFitView}
            title="Fit graph to screen"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span>Fit View</span>
          </button>

          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <span className={styles.scaleBadge}>{Math.round(zoomLevel * 100)}%</span>

          <button
            type="button"
            className={styles.toolBtn}
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </button>

          <button
            type="button"
            className={styles.toolBtn}
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Graph'}
            aria-label="Toggle Fullscreen"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isFullscreen ? (
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              ) : (
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              )}
            </svg>
          </button>

          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.toolBtn}
              onClick={() => setIsLayersOpen(!isLayersOpen)}
              title="Filter graph layers"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Layers</span>
            </button>

            {isLayersOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '0.65rem 0.85rem',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  zIndex: 60,
                  width: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Filter Layers
                </span>
                {Object.keys(visibleLayers).map((layerKey) => (
                  <label
                    key={layerKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.76rem',
                      color: '#334155',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleLayers[layerKey]}
                      onChange={(e) =>
                        setVisibleLayers((prev) => ({ ...prev, [layerKey]: e.target.checked }))
                      }
                    />
                    <span style={{ textTransform: 'capitalize' }}>{layerKey.replace('-', ' ')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Primary Interactive Impact Graph Canvas & Side Panel */}
      <div className={styles.graphWorkspace}>
        {/* SVG Canvas Area */}
        <div
          ref={canvasRef}
          className={`${styles.canvasContainer} ${isFullscreen ? styles.canvasContainerFullscreen : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Left Floating Legends Card */}
          <div className={styles.floatingLegend}>
            <div className={styles.legendSection}>
              <span className={styles.legendTitle}>
                Relationship Type
                <span style={{ color: '#94a3b8', fontSize: '0.68rem', cursor: 'help' }}>ⓘ</span>
              </span>
              <div className={styles.legendItem}>
                <span className={styles.legendLineObserved} />
                <span>Observed relationship</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendLineInferred} />
                <span>Inferred relationship</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendLinePotential} />
                <span>Potential impact</span>
              </div>
            </div>

            <div className={styles.legendSection}>
              <span className={styles.legendTitle}>Node Type</span>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#EF4444' }} />
                <span>Global Event</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#F59E0B' }} />
                <span>Commodity</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#3B82F6' }} />
                <span>Supply Chain</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#6366F1' }} />
                <span>Indian Economy</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#10B981' }} />
                <span>Sector</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#0D9488' }} />
                <span>Household</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: '#EAB308' }} />
                <span>Investment</span>
              </div>
            </div>
          </div>

          {/* SVG Elements Layer */}
          <svg
            className={`${styles.canvasSvg} ${isDragging ? styles.canvasSvgDragging : ''}`}
            viewBox="0 0 1200 750"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Arrowheads for different relationship types */}
              <marker
                id="arrow-observed"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10B981" />
              </marker>

              <marker
                id="arrow-inferred"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#3B82F6" />
              </marker>

              <marker
                id="arrow-potential"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#94A3B8" />
              </marker>

              <marker
                id="arrow-selected"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#047857" />
              </marker>

              {/* Card Drop Shadow */}
              <filter id="node-shadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.06" />
              </filter>
              <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10B981" floodOpacity="0.45" />
              </filter>
            </defs>

            {/* Transform Container with Pan & Zoom */}
            <g
              transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
              style={{ transformOrigin: 'center center', transition: isDragging ? 'none' : 'transform 0.2s ease-out' }}
            >
              {/* Edges Layer (Bezier Curves) */}
              <g className="edges-layer">
                {currentDataset.edges.map((edge) => {
                  const sourceNode = currentDataset.nodes.find((n) => n.id === edge.from);
                  const targetNode = currentDataset.nodes.find((n) => n.id === edge.to);
                  if (!sourceNode || !targetNode) return null;

                  const isSelected = selectedEdgeId === edge.id;
                  const isHighlighted = connectedEdgeIds.has(edge.id);
                  const isDimmed = (selectedNodeId || selectedEdgeId) && !isHighlighted;

                  // Card width is 154, height is 64
                  const cardHalfW = 77;
                  const srcX = sourceNode.x + cardHalfW;
                  const srcY = sourceNode.y;
                  const tgtX = targetNode.x - cardHalfW;
                  const tgtY = targetNode.y;

                  const dx = Math.max(30, (tgtX - srcX) * 0.45);
                  const pathD = `M ${srcX} ${srcY} C ${srcX + dx} ${srcY}, ${tgtX - dx} ${tgtY}, ${tgtX} ${tgtY}`;

                  let strokeColor = '#94A3B8';
                  let markerEnd = 'url(#arrow-potential)';
                  let strokeDash = '5,4';

                  if (edge.kind === 'observed') {
                    strokeColor = '#10B981';
                    markerEnd = 'url(#arrow-observed)';
                    strokeDash = 'none';
                  } else if (edge.kind === 'inferred') {
                    strokeColor = '#3B82F6';
                    markerEnd = 'url(#arrow-inferred)';
                    strokeDash = '6,4';
                  }

                  if (isSelected || isHighlighted) {
                    strokeColor = '#047857';
                    markerEnd = 'url(#arrow-selected)';
                  }

                  return (
                    <g
                      key={edge.id}
                      style={{ cursor: 'pointer', opacity: isDimmed ? 0.22 : 1, transition: 'opacity 0.2s ease' }}
                      onClick={() => {
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                    >
                      {/* Invisible wider hit area */}
                      <path d={pathD} fill="none" stroke="transparent" strokeWidth="18" />

                      {/* Selected Glow */}
                      {(isSelected || isHighlighted) && (
                        <path d={pathD} fill="none" stroke="#10B981" strokeWidth="4.5" opacity="0.3" />
                      )}

                      {/* Visible Edge Line */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isSelected || isHighlighted ? 2.5 : 1.75}
                        strokeDasharray={strokeDash}
                        markerEnd={markerEnd}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Nodes Layer */}
              <g className="nodes-layer">
                {filteredNodes.map((node) => {
                  const isSelected = selectedNodeId === node.id;
                  const isHighlighted = connectedNodeIds.has(node.id);
                  const isDimmed = (selectedNodeId || selectedEdgeId) && !isHighlighted;
                  const visual = getCategoryStyles(node.category);

                  const w = 154;
                  const h = 64;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x - w / 2}, ${node.y - h / 2})`}
                      className={styles.nodeCardSvg}
                      style={{
                        cursor: 'pointer',
                        opacity: isDimmed ? 0.35 : 1,
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                      }}
                      onClick={() => {
                        if (selectedNodeId === node.id) {
                          setSelectedNodeId(null);
                        } else {
                          setSelectedNodeId(node.id);
                          setSelectedEdgeId(null);
                          setIsDetailsOpen(true);
                        }
                      }}
                      onDoubleClick={() => focusNode(node.id)}
                    >
                      {/* Selection Glow */}
                      {isSelected && (
                        <rect
                          width={w + 8}
                          height={h + 8}
                          x="-4"
                          y="-4"
                          rx="14"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          filter="url(#node-glow)"
                        />
                      )}

                      {/* Node Card Body */}
                      <rect
                        width={w}
                        height={h}
                        rx="11"
                        fill="#FFFFFF"
                        stroke={isSelected ? '#10B981' : visual.border}
                        strokeWidth={isSelected ? '2' : '1.25'}
                        filter="url(#node-shadow)"
                      />

                      {/* Icon Squircle Box */}
                      <rect
                        x="9"
                        y="12"
                        width="38"
                        height="38"
                        rx="9"
                        fill={visual.bg}
                        stroke={visual.border}
                        strokeWidth="1"
                      />

                      {/* Icon Placeholder */}
                      <g transform="translate(19, 21)" stroke={visual.stroke} fill="none">
                        {renderNodeIcon(node.icon)}
                      </g>

                      {/* Node Label Text */}
                      <text
                        x="54"
                        y="23"
                        fill="#0F172A"
                        fontSize="10"
                        fontWeight="700"
                        fontFamily="var(--font-sans, sans-serif)"
                      >
                        {node.label.length > 17 ? node.label.slice(0, 16) + '…' : node.label}
                      </text>

                      {/* Category Label */}
                      <text
                        x="54"
                        y="35"
                        fill="#64748B"
                        fontSize="8.5"
                        fontWeight="500"
                        fontFamily="var(--font-sans, sans-serif)"
                      >
                        {node.categoryLabel}
                      </text>

                      {/* Impact Badge Pill */}
                      <g transform="translate(54, 40)">
                        <rect
                          width={node.impactDescription ? 92 : 46}
                          height="16"
                          rx="4"
                          fill={node.impactType === 'positive' ? '#ECFDF5' : '#FEF2F2'}
                          stroke={node.impactType === 'positive' ? '#A7F3D0' : '#FECACA'}
                          strokeWidth="0.75"
                        />
                        <text
                          x="5"
                          y="11.5"
                          fill={node.impactType === 'positive' ? '#065F46' : '#991B1B'}
                          fontSize="8.5"
                          fontWeight="700"
                          fontFamily="var(--font-sans, sans-serif)"
                        >
                          {node.impactBadge} {node.impactDescription ? node.impactDescription.slice(0, 10) : ''}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>
        </div>

        {/* Right: Collapsible Node Details Panel */}
        {isDetailsOpen && (
          <div className={styles.detailsPanel}>
            <div className={styles.detailsHeader}>
              <h3 className={styles.detailsTitle}>Node Details</h3>
              <button
                type="button"
                className={styles.detailsCloseBtn}
                onClick={() => setIsDetailsOpen(false)}
                title="Close panel"
              >
                ✕
              </button>
            </div>

            <div className={styles.detailsContent}>
              {selectedNode ? (
                <>
                  {/* Hero Node Card */}
                  <div className={styles.nodeCardHero}>
                    <div
                      className={styles.nodeHeroIcon}
                      style={{
                        background: getCategoryStyles(selectedNode.category).bg,
                        color: getCategoryStyles(selectedNode.category).stroke,
                      }}
                    >
                      {renderNodeIcon(selectedNode.icon)}
                    </div>
                    <div className={styles.nodeHeroText}>
                      <h4 className={styles.nodeHeroTitle}>{selectedNode.label}</h4>
                      <span className={styles.nodeCategoryBadge}>{selectedNode.categoryLabel}</span>
                    </div>
                  </div>

                  {/* Impact Stat Row */}
                  <div className={styles.impactStatRow}>
                    <span className={styles.impactStatLabel}>Impact:</span>
                    <span className={styles.impactStatValue}>
                      {selectedNode.impactBadge} ({selectedNode.severity})
                    </span>
                  </div>
                  <span className={styles.updatedTimestamp}>Last updated: Oct 12, 2024</span>

                  {/* 4 Tabs: Overview | Connections | Evidence | News */}
                  <div className={styles.detailsTabs}>
                    <button
                      type="button"
                      className={`${styles.detailsTabBtn} ${activeTab === 'overview' ? styles.detailsTabBtnActive : ''}`}
                      onClick={() => setActiveTab('overview')}
                    >
                      Overview
                    </button>
                    <button
                      type="button"
                      className={`${styles.detailsTabBtn} ${activeTab === 'connections' ? styles.detailsTabBtnActive : ''}`}
                      onClick={() => setActiveTab('connections')}
                    >
                      Connections
                    </button>
                    <button
                      type="button"
                      className={`${styles.detailsTabBtn} ${activeTab === 'evidence' ? styles.detailsTabBtnActive : ''}`}
                      onClick={() => setActiveTab('evidence')}
                    >
                      Evidence
                    </button>
                    <button
                      type="button"
                      className={`${styles.detailsTabBtn} ${activeTab === 'news' ? styles.detailsTabBtnActive : ''}`}
                      onClick={() => setActiveTab('news')}
                    >
                      News
                    </button>
                  </div>

                  {/* Tab 1: Overview */}
                  {activeTab === 'overview' && (
                    <div className={styles.tabBody}>
                      <p className={styles.summaryText}>{selectedNode.description}</p>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Category</span>
                        <span className={styles.metaVal}>{selectedNode.detailedCategory}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Time Horizon</span>
                        <span className={styles.metaVal}>{selectedNode.timeHorizon}</span>
                      </div>
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>Related Sectors</span>
                      </div>
                      <div className={styles.sectorPillsList}>
                        {selectedNode.relatedSectors.map((sec, idx) => (
                          <span key={idx} className={styles.sectorPill}>
                            {sec}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        className={styles.detailedAnalysisActionBtn}
                        onClick={() => {
                          if (onNavigateToScenario) {
                            onNavigateToScenario(selectedDomainId);
                          }
                        }}
                      >
                        <span>View Detailed Analysis</span>
                        <span>→</span>
                      </button>
                    </div>
                  )}

                  {/* Tab 2: Connections */}
                  {activeTab === 'connections' && (
                    <div className={styles.tabBody}>
                      {upstreamNodes.length > 0 && (
                        <div className={styles.connectionGroup}>
                          <span className={styles.connectionGroupTitle}>Upstream Causes (Incoming)</span>
                          {upstreamNodes.map((uNode) => (
                            <div
                              key={uNode.id}
                              className={styles.connectionChip}
                              onClick={() => focusNode(uNode.id)}
                            >
                              <span>{uNode.label}</span>
                              <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                                {uNode.impactBadge}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {downstreamNodes.length > 0 && (
                        <div className={styles.connectionGroup}>
                          <span className={styles.connectionGroupTitle}>Downstream Effects (Outgoing)</span>
                          {downstreamNodes.map((dNode) => (
                            <div
                              key={dNode.id}
                              className={styles.connectionChip}
                              onClick={() => focusNode(dNode.id)}
                            >
                              <span>{dNode.label}</span>
                              <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>
                                {dNode.impactBadge}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Evidence */}
                  {activeTab === 'evidence' && (
                    <div className={styles.tabBody}>
                      <div className={styles.evidenceBox}>
                        <span className={styles.evidenceBadge}>
                          {selectedNode.evidence.verificationStatus}
                        </span>
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                          {selectedNode.evidence.source}
                        </span>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                          Series: {selectedNode.evidence.tableOrSeries} ({selectedNode.evidence.vintageYear})
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                          Unit: {selectedNode.evidence.unit}
                        </div>
                        <p style={{ margin: '0.25rem 0 0', fontStyle: 'italic', color: '#334155' }}>
                          "{selectedNode.evidence.methodologyNote}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tab 4: News */}
                  {activeTab === 'news' && (
                    <div className={styles.tabBody}>
                      {selectedNode.news.map((item, idx) => (
                        <div key={idx} className={styles.newsItem}>
                          <h5 className={styles.newsHeadline}>{item.headline}</h5>
                          <span className={styles.newsMeta}>
                            {item.source} • {item.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>
                  <p>Click any node or edge on the canvas to inspect its transmission channel and evidence.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Below-Graph Analytics (4 Cards in a synchronized grid) */}
      <div className={styles.analyticsGrid}>
        {/* Card 1: Key Impact Metrics */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Key Impact Metrics</h3>
            <select className={styles.cardFilterSelect} aria-label="Metrics time range">
              <option>Last 30 days ⌄</option>
              <option>Last 60 days</option>
              <option>Year to date</option>
            </select>
          </div>

          <div className={styles.metricsList}>
            {currentDataset.keyMetrics.map((metric) => (
              <div key={metric.id} className={styles.metricRow}>
                <div className={styles.metricLeft}>
                  <span className={styles.metricIcon}>⬡</span>
                  <div className={styles.metricTextGroup}>
                    <span className={styles.metricTitle}>{metric.label}</span>
                    <span className={styles.metricSubtitle}>{metric.subtitle}</span>
                  </div>
                </div>
                <span
                  className={`${styles.metricValue} ${
                    metric.value.includes('-')
                      ? styles.metricValueDown
                      : metric.value.includes('↓')
                      ? styles.metricValueDown
                      : styles.metricValueUp
                  }`}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Price Comparison Chart */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{currentDataset.priceChart.title}</h3>
          </div>

          <div className={styles.chartToggleBar}>
            <button
              type="button"
              className={`${styles.chartToggleBtn} ${activeChartSeries.a ? styles.chartToggleBtnActiveA : ''}`}
              onClick={() => setActiveChartSeries((s) => ({ ...s, a: !s.a }))}
            >
              {currentDataset.priceChart.seriesA.name}
            </button>
            <button
              type="button"
              className={`${styles.chartToggleBtn} ${activeChartSeries.b ? styles.chartToggleBtnActiveB : ''}`}
              onClick={() => setActiveChartSeries((s) => ({ ...s, b: !s.b }))}
            >
              {currentDataset.priceChart.seriesB.name}
            </button>
          </div>

          <div className={styles.chartWrapper}>
            <svg className={styles.chartSvg} viewBox="0 0 300 130">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="290" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="50" x2="290" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="80" x2="290" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="20" y1="110" x2="290" y2="110" stroke="#e2e8f0" strokeWidth="1" />

              {/* Series A (Green Line) */}
              {activeChartSeries.a && (
                <>
                  <polyline
                    fill="none"
                    stroke={currentDataset.priceChart.seriesA.color}
                    strokeWidth="2.5"
                    points={currentDataset.priceChart.seriesA.values
                      .map((val, idx) => {
                        const x = 30 + idx * 28;
                        const min = Math.min(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                        const max = Math.max(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                        const y = 110 - ((val - min) / (max - min || 1)) * 90;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                  {currentDataset.priceChart.seriesA.values.map((val, idx) => {
                    const x = 30 + idx * 28;
                    const min = Math.min(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                    const max = Math.max(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                    const y = 110 - ((val - min) / (max - min || 1)) * 90;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#ffffff"
                        stroke={currentDataset.priceChart.seriesA.color}
                        strokeWidth="2"
                      />
                    );
                  })}
                </>
              )}

              {/* Series B (Blue Line) */}
              {activeChartSeries.b && (
                <>
                  <polyline
                    fill="none"
                    stroke={currentDataset.priceChart.seriesB.color}
                    strokeWidth="2.5"
                    points={currentDataset.priceChart.seriesB.values
                      .map((val, idx) => {
                        const x = 30 + idx * 28;
                        const min = Math.min(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                        const max = Math.max(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                        const y = 110 - ((val - min) / (max - min || 1)) * 90;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                  {currentDataset.priceChart.seriesB.values.map((val, idx) => {
                    const x = 30 + idx * 28;
                    const min = Math.min(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                    const max = Math.max(...currentDataset.priceChart.seriesA.values, ...currentDataset.priceChart.seriesB.values);
                    const y = 110 - ((val - min) / (max - min || 1)) * 90;
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="#ffffff"
                        stroke={currentDataset.priceChart.seriesB.color}
                        strokeWidth="2"
                      />
                    );
                  })}
                </>
              )}

              {/* Month Labels on X Axis */}
              {currentDataset.priceChart.months.map((m, idx) => (
                <text key={idx} x={30 + idx * 28} y="125" fontSize="7.5" fill="#94a3b8" textAnchor="middle">
                  {m}
                </text>
              ))}
            </svg>

            {/* Interactive Tooltip Popover over Oct */}
            <div className={styles.chartTooltip}>
              <span style={{ fontWeight: 700, color: '#a7f3d0' }}>
                {currentDataset.priceChart.tooltipData.month}
              </span>
              <span>{currentDataset.priceChart.tooltipData.labelA}</span>
              <span>{currentDataset.priceChart.tooltipData.labelB}</span>
            </div>
          </div>

          <div className={styles.chartLegend}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className={styles.legendDotGreen} />
              {currentDataset.priceChart.seriesA.name}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className={styles.legendDotBlue} />
              {currentDataset.priceChart.seriesB.name}
            </span>
          </div>
        </div>

        {/* Card 3: Affected Sectors */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Affected Sectors (Impact Severity)</h3>
          </div>

          <div className={styles.sectorsList}>
            {currentDataset.affectedSectors.map((sector) => (
              <div
                key={sector.id}
                className={styles.sectorRow}
                onClick={() => {
                  if (sector.targetNodeId) {
                    focusNode(sector.targetNodeId);
                  }
                }}
                title={`Click to focus ${sector.name} on graph`}
              >
                <div className={styles.sectorLeft}>
                  <span>{renderNodeIcon(sector.icon)}</span>
                  <span>{sector.name}</span>
                </div>
                <div className={styles.sectorRight}>
                  <div className={styles.severityTrack}>
                    <div
                      className={styles.severityFill}
                      style={{
                        width: `${sector.percentage}%`,
                        backgroundColor: sector.color,
                      }}
                    />
                  </div>
                  <span className={styles.sectorPercentage}>{sector.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Pathway Insights */}
        <div className={styles.analyticsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Pathway Insights</h3>
          </div>

          <div className={styles.insightsTabs}>
            <button
              type="button"
              className={`${styles.insightsTabBtn} ${insightsTab === 'takeaways' ? styles.insightsTabBtnActive : ''}`}
              onClick={() => setInsightsTab('takeaways')}
            >
              Key Takeaways
            </button>
            <button
              type="button"
              className={`${styles.insightsTabBtn} ${insightsTab === 'risks' ? styles.insightsTabBtnActive : ''}`}
              onClick={() => setInsightsTab('risks')}
            >
              Risk Outlook
            </button>
          </div>

          <div className={styles.insightsList}>
            {(insightsTab === 'takeaways'
              ? currentDataset.pathwayInsights.keyTakeaways
              : currentDataset.pathwayInsights.riskOutlook
            ).map((item, idx) => (
              <div
                key={idx}
                className={styles.insightItem}
                onClick={() => {
                  // Highlight corresponding causal pathways if available
                  const primaryNode = currentDataset.nodes[Math.min(idx + 1, currentDataset.nodes.length - 1)];
                  if (primaryNode) {
                    focusNode(primaryNode.id);
                  }
                }}
                title="Click to locate causal pathway"
              >
                <span className={styles.insightNumber}>{idx + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Bottom BharatImpact Branding Motif */}
      <div className={styles.footerBranding}>
        <div className={styles.footerLogoText}>
          <span className={styles.footerBrandName}>BharatImpact</span>
          <span className={styles.footerBrandTagline}>
            Building a more resilient and informed India
          </span>
        </div>
      </div>
    </div>
  );
};
