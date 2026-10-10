import React, { useState } from 'react';
import { GlobalEventRecord } from './types';
import styles from './SelectedEventDetailCard.module.css';

export interface SelectedEventDetailCardProps {
  event?: GlobalEventRecord;
  onNavigateToGraph?: (scenarioId?: string) => void;
}

type DetailTabKey = 'sectors' | 'historical' | 'experts' | 'takeaways';

export const SelectedEventDetailCard: React.FC<SelectedEventDetailCardProps> = ({
  event,
  onNavigateToGraph,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTabKey>('sectors');

  if (!event) {
    return (
      <div className={styles.card}>
        <p style={{ color: '#64748b', fontSize: '13px' }}>
          Select an event from the map, rankings, or news list to view comprehensive analytical impact.
        </p>
      </div>
    );
  }

  const renderSectorIcon = (icon: string) => {
    switch (icon) {
      case 'phone':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        );
      case 'car':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
          </svg>
        );
      case 'monitor':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        );
      case 'factory':
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H2v18Z" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.card} aria-label="Selected Event Analytical Details">
      {/* 1. Top Severity & Date Row */}
      <div className={styles.topMetaRow}>
        <span
          className={`${styles.severityBadge} ${
            event.severity === 'high'
              ? styles.badgeHigh
              : event.severity === 'medium'
              ? styles.badgeMedium
              : event.severity === 'low'
              ? styles.badgeLow
              : styles.badgeMonitoring
          }`}
        >
          {event.severity === 'high'
            ? 'High Impact Event'
            : event.severity === 'medium'
            ? 'Medium Impact Event'
            : event.severity === 'low'
            ? 'Low Impact Event'
            : 'Monitoring Signal'}
        </span>

        <span className={styles.eventDate}>{event.eventDate}</span>
      </div>

      {/* 2. Hero Editorial Banner */}
      <div className={styles.heroBanner}>
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className={styles.heroImg}
            onError={(e) => {
              // Gracefully handle image fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.heroFallbackIcon}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        )}
      </div>

      {/* 3. Headline */}
      <h3 className={styles.headline}>{event.title}</h3>

      {/* 4. Publisher, Time, and Source Link */}
      <div className={styles.sourceRow}>
        <div className={styles.sourceLeft}>
          <span className={styles.publisher}>{event.publisher}</span>
          <span>•</span>
          <span>{event.publishedRelative}</span>
        </div>

        <a
          href={event.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.originalLink}
          title="Open original verified news source"
        >
          View Original Article ↗
        </a>
      </div>

      {/* 5. Full Summary */}
      <p className={styles.summaryText}>{event.fullSummary}</p>

      {/* 6. Potential Impact on India */}
      <div className={styles.impactSection}>
        <div className={styles.impactHeaderRow}>
          <h4 className={styles.impactTitle}>Potential Impact on India</h4>

          <button
            type="button"
            className={styles.viewGraphBtn}
            onClick={() => onNavigateToGraph && onNavigateToGraph(event.linkedScenarioId)}
            title="Navigate to transmission graph in Overview"
          >
            View on Graph →
          </button>
        </div>

        {/* Sector impact metrics or explicit unmodeled notice */}
        {event.sectorImpacts && event.sectorImpacts.length > 0 ? (
          <>
            <div className={styles.sectorGrid}>
              {event.sectorImpacts.map((sec, idx) => (
                <div key={idx} className={styles.sectorCard}>
                  <div className={styles.sectorCardTop}>
                    <span className={styles.sectorIcon}>{renderSectorIcon(sec.icon)}</span>
                    <span className={styles.sectorName}>{sec.sector}</span>
                  </div>
                  <span className={styles.impactValue}>{sec.impactRange}</span>
                  <span className={styles.metricSubtitle}>{sec.metricLabel}</span>
                </div>
              ))}
            </div>
            <span className={styles.methodologyTag}>
              Model Estimate: IESA &amp; GTAP Input-Output Elasticity Benchmark (Baseline: FY24-25 • 95% CI corridor)
            </span>
          </>
        ) : (
          <div className={styles.unmodeledImpactBox}>
            <span>Quantified sector impact range is not modeled for this event. Direct transmission channel under review.</span>
          </div>
        )}
      </div>

      {/* 7. Analytical Detail Tabs */}
      <div className={styles.tabsBar} role="tablist" aria-label="Event Analytical Deep Dive">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'sectors'}
          className={`${styles.detailTabBtn} ${activeTab === 'sectors' ? styles.detailTabBtnActive : ''}`}
          onClick={() => setActiveTab('sectors')}
        >
          Related Sectors
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'historical'}
          className={`${styles.detailTabBtn} ${activeTab === 'historical' ? styles.detailTabBtnActive : ''}`}
          onClick={() => setActiveTab('historical')}
        >
          Historical Trend
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'experts'}
          className={`${styles.detailTabBtn} ${activeTab === 'experts' ? styles.detailTabBtnActive : ''}`}
          onClick={() => setActiveTab('experts')}
        >
          Expert Views
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'takeaways'}
          className={`${styles.detailTabBtn} ${activeTab === 'takeaways' ? styles.detailTabBtnActive : ''}`}
          onClick={() => setActiveTab('takeaways')}
        >
          Key Takeaways
        </button>
      </div>

      {/* Tab Panel Content Box */}
      <div className={styles.tabContentBox} role="tabpanel">
        {activeTab === 'sectors' && (
          <div>
            <strong>Transmission Channels: </strong>
            Direct input cost shocks in raw bill-of-materials (BOM), prolonged supplier lead-times, and working capital inventory buildup across Indian tier-1 assemblers.
          </div>
        )}

        {activeTab === 'historical' && (
          <div>
            {event.historicalContext ||
              'No previous empirical shock records documented for this specific event boundary.'}
          </div>
        )}

        {activeTab === 'experts' && (
          <div>
            {event.expertViews && event.expertViews.length > 0 ? (
              event.expertViews.map((exp, idx) => (
                <div key={idx} style={{ marginBottom: idx < event.expertViews.length - 1 ? 6 : 0 }}>
                  <p className={styles.expertQuote}>"{exp.quote}"</p>
                  <span className={styles.expertAuthor}>
                    — {exp.expertName}, {exp.organization}
                  </span>
                </div>
              ))
            ) : (
              <span>Institutional commentary pending official policy release.</span>
            )}
          </div>
        )}

        {activeTab === 'takeaways' && (
          <div>
            {event.keyTakeaways && event.keyTakeaways.length > 0 ? (
              <ul className={styles.takeawayList}>
                {event.keyTakeaways.map((point, idx) => (
                  <li key={idx} className={styles.takeawayItem}>
                    {point}
                  </li>
                ))}
              </ul>
            ) : (
              <span>Strategic takeaways under review by the macro research desk.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
