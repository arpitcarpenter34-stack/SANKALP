import React, { useState } from 'react';
import { SectorDashboardData } from './types';
import styles from './SectorDetailsPanel.module.css';

export interface SectorDetailsPanelProps {
  sector: SectorDashboardData;
  onViewFullAnalysis: () => void;
  onNavigateToHousehold?: () => void;
}

export const SectorDetailsPanel: React.FC<SectorDetailsPanelProps> = ({
  sector,
  onViewFullAnalysis,
  onNavigateToHousehold,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'indicators' | 'related'>('overview');
  const details = sector.details;

  return (
    <div className={styles.panelCard}>
      <div className={styles.cardHeader}>
        <h3 className={styles.headerTitle}>Sector Details</h3>
      </div>

      <div className={styles.headerRow}>
        <div className={styles.sectorIconSmall} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
          </svg>
        </div>
        <span className={styles.sectorNameHeading}>{sector.name}</span>
        <span className={styles.activeBadge}>{sector.statusLabel}</span>
      </div>

      <p className={styles.summaryText}>{details.summary}</p>

      {/* Tabs */}
      <div className={styles.tabsBar} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'overview'}
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'indicators'}
          className={`${styles.tabBtn} ${activeTab === 'indicators' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('indicators')}
        >
          Key Indicators
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'related'}
          className={`${styles.tabBtn} ${activeTab === 'related' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('related')}
        >
          Related Sectors
        </button>
      </div>

      {/* Tab 1: Overview Facts */}
      {activeTab === 'overview' && (
        <div className={styles.factsList}>
          <div className={styles.factRow}>
            <div className={styles.factIcon} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
              </svg>
            </div>
            <div className={styles.factContent}>
              <span className={styles.factLabel}>Global share (manufacturing)</span>
              <span className={styles.factValue}>{details.globalShare}</span>
            </div>
          </div>

          <div className={styles.factRow}>
            <div className={styles.factIcon} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.factContent}>
              <span className={styles.factLabel}>India import dependence</span>
              <span className={styles.factValue}>{details.importDependence}</span>
            </div>
          </div>

          <div className={styles.factRow}>
            <div className={styles.factIcon} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className={styles.factContent}>
              <span className={styles.factLabel}>Major end-use sectors</span>
              <span className={styles.factValue}>{details.majorEndUseSectors}</span>
            </div>
          </div>

          <div
            className={`${styles.factRow} ${onNavigateToHousehold ? styles.clickableFactRow : ''}`}
            onClick={onNavigateToHousehold}
            title={onNavigateToHousehold ? "View Household Impact" : undefined}
            role={onNavigateToHousehold ? "button" : undefined}
            tabIndex={onNavigateToHousehold ? 0 : undefined}
            onKeyDown={(e) => {
              if (onNavigateToHousehold && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onNavigateToHousehold();
              }
            }}
          >
            <div className={styles.factIcon} aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <div className={styles.factContent}>
              <span className={styles.factLabel}>Household connection</span>
              <span className={styles.factValue}>{details.householdConnection}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Key Indicators */}
      {activeTab === 'indicators' && (
        <div className={styles.indicatorsList}>
          {details.keyIndicators.map((ind, i) => (
            <div key={i} className={styles.indicatorCard}>
              <span className={styles.indLabel}>{ind.label}</span>
              <span className={styles.indValue}>
                {ind.value} <small style={{ fontSize: 10, fontWeight: 500 }}>{ind.unit}</small>
              </span>
              <span className={styles.indTrend}>{ind.trend}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Related Sectors */}
      {activeTab === 'related' && (
        <div className={styles.relatedList}>
          {details.relatedSectors.map((rel, i) => (
            <div key={i} className={styles.relatedItem}>
              <div>
                <span className={styles.relatedName}>{rel.name}</span>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{rel.relation}</div>
              </div>
              <span className={styles.relatedImpact}>{rel.impact}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className={styles.analysisBtn}
        onClick={onViewFullAnalysis}
      >
        <span>View Full Sector Analysis</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};
