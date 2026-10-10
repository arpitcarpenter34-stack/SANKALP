import React, { useState, useEffect, useCallback } from 'react';
import { MarketInstrumentData } from './types';
import { MARKET_INSTRUMENTS_DATA } from './eventsData';
import styles from './MarketPulseCard.module.css';

export interface MarketPulseCardProps {
  initialInstrumentId?: string;
  onSelectInstrument?: (instrumentId: string) => void;
  refreshTrigger?: number;
}

const INSTRUMENT_TABS = [
  { id: 'crude-oil', label: 'Crude Oil' },
  { id: 'brent', label: 'Brent' },
  { id: 'natural-gas', label: 'Natural Gas' },
  { id: 'gold', label: 'Gold' },
  { id: 'dxy', label: 'DXY' },
];

interface PPACApiResponse {
  series_name: string;
  metadata: {
    unit?: string;
    source?: string;
    frequency?: string;
    limitations?: string;
  };
  observations: {
    period: string;
    price_usd_per_bbl: number;
    status?: string;
  }[];
}

export const MarketPulseCard: React.FC<MarketPulseCardProps> = ({
  initialInstrumentId = 'crude-oil',
  onSelectInstrument,
  refreshTrigger,
}) => {
  const [selectedTab, setSelectedTab] = useState<string>(initialInstrumentId);
  const [instrumentData, setInstrumentData] = useState<MarketInstrumentData>(
    MARKET_INSTRUMENTS_DATA[initialInstrumentId] || MARKET_INSTRUMENTS_DATA['crude-oil']
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch real PPAC Indian basket crude oil series from backend
  const fetchCrudeOilFromBackend = useCallback(async () => {
    setIsLoading(true);
    const backendHost = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      'http://127.0.0.1:8000'
    ).replace(/\/api\/?$/, '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const response = await fetch(`${backendHost}/time-series/crude-oil`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const json: PPACApiResponse = await response.json();
        if (json.observations && json.observations.length > 0) {
          const obs = json.observations;
          // Take the latest 8 observations for clean visual readability
          const recentObs = obs.slice(-8);
          const latest = recentObs[recentObs.length - 1];
          const previous = recentObs.length > 1 ? recentObs[recentObs.length - 2] : latest;
          const absDiff = +(latest.price_usd_per_bbl - previous.price_usd_per_bbl).toFixed(2);
          const pct = +( (absDiff / previous.price_usd_per_bbl) * 100 ).toFixed(1);

          setInstrumentData({
            id: 'crude-oil',
            name: 'Crude Oil',
            symbol: 'PPAC Indian Basket',
            unit: json.metadata.unit || 'barrel',
            currencyPrefix: '$',
            currentValue: latest.price_usd_per_bbl,
            absoluteChange: absDiff,
            pctChange: pct,
            trend: pct >= 0 ? 'up' : 'down',
            timeSeries: recentObs.map((o) => ({
              date: o.period,
              label: o.period.slice(5),
              value: o.price_usd_per_bbl,
            })),
            source: `${json.metadata.source || 'PPAC Public Archives'} (Verified API)`,
            lastUpdated: `Observation Date: ${latest.period}`,
            isAvailable: true,
            dataSourceKind: 'api_backed',
            provenanceNote: 'Real PPAC Indian Basket crude oil observations retrieved from FastAPI backend archive. Sparse snapshots.',
          });
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Graceful fallback to offline curated benchmark
    }

    // Fallback if backend fetch fails or times out
    const fallback = MARKET_INSTRUMENTS_DATA['crude_oil'] || MARKET_INSTRUMENTS_DATA['crude-oil'];
    setInstrumentData({
      ...fallback,
      source: 'PPAC Public Archives (Local Curated Benchmark)',
      provenanceNote: 'FastAPI backend unavailable; displaying verified local benchmark archive.',
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTab === 'crude-oil' || selectedTab === 'crude_oil') {
      fetchCrudeOilFromBackend();
    } else {
      const data = MARKET_INSTRUMENTS_DATA[selectedTab];
      if (data) {
        setInstrumentData(data);
      }
    }
  }, [selectedTab, fetchCrudeOilFromBackend, refreshTrigger]);

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    setHoveredIndex(null);
    if (onSelectInstrument) {
      onSelectInstrument(tabId);
    }
  };

  // SVG Chart Geometry Calculations (only computed if timeSeries has points)
  const timeSeries = instrumentData.timeSeries || [];
  const hasChartData = instrumentData.isAvailable && timeSeries.length > 0;
  const values = timeSeries.map((d) => d.value);
  const minVal = values.length ? Math.floor(Math.min(...values) * 0.95) : 0;
  const maxVal = values.length ? Math.ceil(Math.max(...values) * 1.05) : 100;

  // SVG dimensions
  const svgWidth = 360;
  const svgHeight = 170;
  const paddingLeft = 32;
  const paddingRight = 36;
  const paddingTop = 24;
  const paddingBottom = 28;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    if (timeSeries.length <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (timeSeries.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return paddingTop + chartH - ((val - minVal) / range) * chartH;
  };

  const points = timeSeries.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const linePath = points.length ? `M ${points.join(' L ')}` : '';
  const areaPath = points.length
    ? `${linePath} L ${getX(timeSeries.length - 1)},${paddingTop + chartH} L ${getX(0)},${paddingTop + chartH} Z`
    : '';

  const yTicks = [
    maxVal,
    Math.round(minVal + (maxVal - minVal) * 0.66),
    Math.round(minVal + (maxVal - minVal) * 0.33),
    minVal,
  ];

  const activeIdx = hoveredIndex !== null ? hoveredIndex : timeSeries.length - 1;
  const activePoint = timeSeries[activeIdx] || timeSeries[timeSeries.length - 1];
  const activeX = getX(activeIdx);
  const activeY = activePoint ? getY(activePoint.value) : 0;

  return (
    <div className={styles.card} aria-label="Market Pulse (Last 7 Days)">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Market Pulse (Last 7 Days)</h2>
      </div>

      {/* Instrument Switcher Tabs */}
      <div className={styles.tabsContainer} role="tablist" aria-label="Commodity and Market Instruments">
        {INSTRUMENT_TABS.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className={styles.loadingBox}>
          <span>Fetching market time series...</span>
        </div>
      ) : !instrumentData.isAvailable ? (
        /* Explicit Unavailable State for Instruments Without Supported Backend API */
        <div className={styles.unavailableBox} role="alert">
          <span className={styles.unavailableBadge}>Market Feed Offline</span>
          <h3 className={styles.unavailableTitle}>{instrumentData.name} Data Unavailable</h3>
          <p className={styles.unavailableText}>
            {instrumentData.unavailableReason ||
              `External streaming feed for ${instrumentData.name} is not provided by this backend instance. Only verified PPAC Indian Basket crude oil data is supported.`}
          </p>
          <button
            type="button"
            className={styles.switchFeedBtn}
            onClick={() => handleTabChange('crude-oil')}
          >
            ← View Supported Crude Oil Feed
          </button>
        </div>
      ) : (
        <>
          {/* Main Metric Row */}
          <div className={styles.metricRow}>
            <span className={styles.currentPrice}>
              {instrumentData.currencyPrefix}
              {instrumentData.currentValue}
              <span className={styles.unitLabel}>/ {instrumentData.unit}</span>
            </span>

            <span
              className={`${styles.changeBadge} ${
                instrumentData.pctChange >= 0 ? styles.changeUp : styles.changeDown
              }`}
            >
              {instrumentData.pctChange >= 0
                ? `+${instrumentData.pctChange}%`
                : `${instrumentData.pctChange}%`}
              <span aria-hidden="true">{instrumentData.trend === 'up' ? '↑' : '↓'}</span>
            </span>
          </div>

          {/* SVG Time-Series Chart */}
          {hasChartData && (
            <div className={styles.chartContainer}>
              <svg
                className={styles.chartSvg}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid lines and Y labels */}
                {yTicks.map((tickVal, idx) => {
                  const yPos = getY(tickVal);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={yPos}
                        x2={svgWidth - paddingRight + 10}
                        y2={yPos}
                        className={styles.gridLine}
                      />
                      <text x={paddingLeft - 6} y={yPos + 3} className={styles.yLabel}>
                        {tickVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Fill */}
                <path d={areaPath} fill="url(#areaGradient)" />

                {/* Line Path */}
                <path d={linePath} className={styles.chartLine} />

                {/* Data Points */}
                {timeSeries.map((pt, i) => {
                  const cx = getX(i);
                  const cy = getY(pt.value);
                  const isHovered = hoveredIndex === i;

                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 5.5 : 3.5}
                      className={`${styles.chartDot} ${isHovered ? styles.chartDotActive : ''}`}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      tabIndex={0}
                      aria-label={`${pt.label}: ${instrumentData.currencyPrefix}${pt.value}`}
                    />
                  );
                })}

                {/* X-axis date labels */}
                {timeSeries.map((pt, i) => {
                  if (i % 2 === 0 || i === timeSeries.length - 1) {
                    const xPos = getX(i);
                    return (
                      <text
                        key={i}
                        x={xPos}
                        y={svgHeight - 8}
                        className={styles.xLabel}
                      >
                        {pt.label}
                      </text>
                    );
                  }
                  return null;
                })}

                {/* Active / Latest Point Callout Bubble */}
                {activePoint && (
                  <g className={styles.chartCallout}>
                    <rect
                      x={activeX - 32}
                      y={activeY - 26}
                      width="64"
                      height="20"
                      className={styles.calloutRect}
                    />
                    <text
                      x={activeX}
                      y={activeY - 13}
                      className={styles.calloutText}
                    >
                      {instrumentData.currencyPrefix}{activePoint.value}
                    </text>
                    <polygon
                      points={`${activeX - 4},${activeY - 6} ${activeX + 4},${activeY - 6} ${activeX},${activeY - 1}`}
                      fill="#172b3a"
                    />
                  </g>
                )}
              </svg>
            </div>
          )}

          {/* Provenance Banner */}
          {instrumentData.provenanceNote && (
            <div className={styles.provenanceBanner}>
              ℹ️ {instrumentData.provenanceNote}
            </div>
          )}
        </>
      )}

      {/* Footer Info */}
      <div className={styles.chartFooter}>
        <span className={styles.sourceTag}>Source: {instrumentData.source}</span>
        <span>{instrumentData.lastUpdated}</span>
      </div>
    </div>
  );
};
