import React from 'react';
import { SectorDashboardData, SectorKPICardData } from './types';
import styles from './SectorSummaryCard.module.css';

export interface SectorSummaryCardProps {
  sector: SectorDashboardData;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  onViewDetailedGraph: (domainId: string) => void;
}

export const SectorSummaryCard: React.FC<SectorSummaryCardProps> = ({
  sector,
  timeRange,
  onTimeRangeChange,
  onViewDetailedGraph,
}) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cpu':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="15" x2="23" y2="15" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="15" x2="4" y2="15" />
          </svg>
        );
      case 'fuel':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="22" x2="15" y2="22" />
            <line x1="4" y1="9" x2="14" y2="9" />
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
          </svg>
        );
      case 'flame':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
          </svg>
        );
      case 'wheat':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 22 16 8" />
            <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
          </svg>
        );
      case 'ship':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
            <path d="M19 13V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6" />
            <path d="M12 10V2" />
            <path d="M12 2l5 3" />
          </svg>
        );
      case 'coins':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.7 13.3.6.7" />
          </svg>
        );
      case 'zap':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
    }
  };

  const renderSparkline = (kpi: SectorKPICardData) => {
    if (kpi.sparklineType === 'bar') {
      const data = kpi.sparklineData;
      const maxVal = Math.max(...data, 1);
      return (
        <svg width="48" height="22" viewBox="0 0 48 22" fill="none">
          {data.map((val, idx) => {
            const h = Math.max(4, Math.round((val / maxVal) * 18));
            const y = 20 - h;
            const x = idx * 8;
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width="5"
                height={h}
                rx="1"
                fill={idx === data.length - 1 ? '#047857' : '#A7F3D0'}
              />
            );
          })}
        </svg>
      );
    }

    if (kpi.sparklineType === 'line') {
      const data = kpi.sparklineData;
      const minVal = Math.min(...data);
      const maxVal = Math.max(...data);
      const range = maxVal - minVal || 1;
      const points = data
        .map((val, idx) => {
          const x = Math.round((idx / (data.length - 1)) * 44) + 2;
          const y = 18 - Math.round(((val - minVal) / range) * 14);
          return `${x},${y}`;
        })
        .join(' ');

      return (
        <svg width="48" height="22" viewBox="0 0 48 22" fill="none">
          <polyline
            points={points}
            stroke="#047857"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (kpi.sparklineType === 'donut') {
      const pct = kpi.sparklineDonutPct || 76;
      const r = 9;
      const circ = 2 * Math.PI * r;
      const offset = circ - (pct / 100) * circ;

      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r={r} stroke="#E2ECE5" strokeWidth="3" />
          <circle
            cx="12"
            cy="12"
            r={r}
            stroke="#EF4444"
            strokeWidth="3"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
          />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className={styles.summaryCard}>
      {/* Top Banner Row */}
      <div className={styles.topBar}>
        <div className={styles.leftInfo}>
          <div className={styles.iconBox} aria-hidden="true">
            {renderIcon(sector.icon)}
          </div>
          <div className={styles.titleArea}>
            <div className={styles.titleRow}>
              <h2 className={styles.sectorTitle}>{sector.name}</h2>
              <span className={styles.infoIcon} title={sector.description}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </span>
            </div>
            <p className={styles.sectorDesc}>{sector.description}</p>
          </div>
        </div>

        <div className={styles.rightControls}>
          <select
            className={styles.timeRangeSelect}
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            aria-label="Select Time Range"
          >
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="3Y">3 Years</option>
            <option value="5Y">5 Years</option>
          </select>

          <button
            type="button"
            className={styles.viewGraphBtn}
            onClick={() => onViewDetailedGraph(sector.domainId)}
            title="Explore comprehensive multi-stage causal graph for this sector"
          >
            <span>View Detailed Graph</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      {/* 4 Compact KPI Cards */}
      <div className={styles.kpiGrid}>
        {sector.kpis.map((kpi) => {
          const isAdverse = kpi.isAdverse;
          const badgeClass =
            kpi.direction === 'neutral'
              ? styles.badgeNeutral
              : isAdverse
              ? styles.badgeAdverse
              : styles.badgePositive;

          return (
            <div key={kpi.id} className={styles.kpiCard}>
              <div className={styles.kpiHeader}>
                <span className={styles.kpiTitle}>{kpi.title}</span>
              </div>

              <div className={styles.kpiBody}>
                <span className={styles.kpiValue}>{kpi.value}</span>
                <div className={styles.badgeAndSparkline}>
                  <span className={`${styles.badge} ${badgeClass}`}>
                    {kpi.change}
                  </span>
                  <div className={styles.sparklineWrap}>
                    {renderSparkline(kpi)}
                  </div>
                </div>
              </div>

              <div className={styles.kpiFooter}>
                <span>{kpi.comparisonPeriod}</span>
                <span>{kpi.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
