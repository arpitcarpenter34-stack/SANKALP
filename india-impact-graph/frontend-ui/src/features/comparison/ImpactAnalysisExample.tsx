import React from 'react';
import { ImpactAnalysisScenario, PlatformId } from './types';
import { formatRupees } from './comparisonCalculation';
import styles from './ImpactAnalysisExample.module.css';

interface ImpactAnalysisExampleProps {
  scenarios: ImpactAnalysisScenario[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
  onNavigateToGraph?: () => void;
  onNavigateToSectors?: () => void;
  onNavigateToHousehold?: () => void;
  onNavigateToSipForecasts?: () => void;
}

export const ImpactAnalysisExample: React.FC<ImpactAnalysisExampleProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  selectedPlatform,
  onSelectPlatform,
  onNavigateToGraph,
  onNavigateToSectors,
  onNavigateToHousehold,
  onNavigateToSipForecasts,
}) => {
  const activeScenario =
    scenarios.find((s) => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className={styles.exampleCard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Impact Analysis Example</h2>
          <p className={styles.subtitle}>
            How different platforms cover and analyze the exact same global event
          </p>
        </div>

        {/* Global Event Dropdown Selector */}
        <div className={styles.selectorWrapper}>
          <label htmlFor="comparison-event-select" className={styles.selectLabel}>
            Global Event:
          </label>
          <select
            id="comparison-event-select"
            className={styles.eventSelect}
            value={activeScenario.id}
            onChange={(e) => onSelectScenario(e.target.value)}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Platform Comparison Cards */}
      <div className={styles.cardsGrid}>
        {/* 1. News Apps */}
        <div
          className={`
            ${styles.platformCard}
            ${selectedPlatform === 'news_apps' ? styles.cardSelected : ''}
          `}
          onClick={() => onSelectPlatform('news_apps')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectPlatform('news_apps');
          }}
          aria-label="View News Apps coverage"
        >
          <div className={styles.cardHeader}>
            <span className={`${styles.badge} ${styles.newsBadge}`}>📰 News Apps</span>
          </div>

          <div className={styles.newsVisual}>
            <div className={styles.newsIconGraphic}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>

          <div className={styles.newsContent}>
            <h4 className={styles.newsHeadline}>{activeScenario.newsApps.headline}</h4>
            <p className={styles.newsSubtext}>{activeScenario.newsApps.subtext}</p>
            <ul className={styles.bulletList}>
              {activeScenario.newsApps.bulletPoints.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Financial Tools */}
        <div
          className={`
            ${styles.platformCard}
            ${selectedPlatform === 'financial_tools' ? styles.cardSelected : ''}
          `}
          onClick={() => onSelectPlatform('financial_tools')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectPlatform('financial_tools');
          }}
          aria-label="View Financial Tools coverage"
        >
          <div className={styles.cardHeader}>
            <span className={`${styles.badge} ${styles.financeBadge}`}>📈 Financial Tools</span>
          </div>

          <div className={styles.financeWidget}>
            <div className={styles.tickerHeader}>
              <span className={styles.tickerName}>{activeScenario.financialTools.ticker}</span>
              <span className={styles.tickerUnit}>({activeScenario.financialTools.unit})</span>
            </div>
            <div className={styles.priceRow}>
              <span className={styles.priceValue}>
                {activeScenario.financialTools.currentValue}
              </span>
              <span className={styles.priceChange}>
                {activeScenario.financialTools.changePct}
              </span>
            </div>
            {/* SVG Sparkline */}
            <div className={styles.sparklineContainer}>
              <svg viewBox="0 0 160 36" className={styles.sparkline}>
                <path
                  d="M 5 28 Q 40 25, 75 18 T 120 12 T 155 4"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className={styles.financeContent}>
            <ul className={styles.bulletList}>
              {activeScenario.financialTools.bulletPoints.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Research Platforms */}
        <div
          className={`
            ${styles.platformCard}
            ${selectedPlatform === 'research_platforms' ? styles.cardSelected : ''}
          `}
          onClick={() => onSelectPlatform('research_platforms')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectPlatform('research_platforms');
          }}
          aria-label="View Research Platforms coverage"
        >
          <div className={styles.cardHeader}>
            <span className={`${styles.badge} ${styles.researchBadge}`}>
              📑 Research Platforms
            </span>
          </div>

          <div className={styles.researchWidget}>
            <div className={styles.reportIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className={styles.reportTitle}>
              {activeScenario.researchPlatforms.reportTitle}
            </div>
          </div>

          <div className={styles.researchContent}>
            <p className={styles.researchSummary}>{activeScenario.researchPlatforms.summary}</p>
            <ul className={styles.bulletList}>
              {activeScenario.researchPlatforms.bulletPoints.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4. BharatImpact (Full Chain) */}
        <div
          className={`
            ${styles.platformCard}
            ${styles.bharatCard}
            ${selectedPlatform === 'bharat_impact' ? styles.cardSelected : ''}
          `}
          onClick={() => onSelectPlatform('bharat_impact')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectPlatform('bharat_impact');
          }}
          aria-label="View BharatImpact end-to-end impact breakdown"
        >
          <div className={styles.cardHeader}>
            <span className={`${styles.badge} ${styles.bharatBadge}`}>👑 BharatImpact</span>
          </div>

          <div className={styles.bharatHighlights}>
            <div className={styles.statChip}>
              <span className={styles.statLabel}>Household Impact:</span>
              <span className={styles.statVal}>
                +{formatRupees(activeScenario.bharatImpact.monthlyImpactInr)}/mo
              </span>
            </div>
            <div className={styles.statChip}>
              <span className={styles.statLabel}>SIP Capacity:</span>
              <span className={styles.statValNegative}>
                {activeScenario.bharatImpact.sipImpactPct}%
              </span>
            </div>
          </div>

          <div className={styles.bharatContent}>
            <ul className={styles.bharatList}>
              {activeScenario.bharatImpact.keyPoints.map((kp, i) => (
                <li key={i} className={styles.bharatItem}>
                  <span className={styles.greenCheck}>✓</span>
                  <span>{kp}</span>
                </li>
              ))}
            </ul>

            {/* Quick cross-feature navigation links */}
            <div className={styles.linksRow}>
              {onNavigateToGraph && (
                <button
                  type="button"
                  className={styles.quickLinkBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToGraph();
                  }}
                  title="Explore this in interactive Impact Graph"
                >
                  Graph →
                </button>
              )}
              {onNavigateToSectors && (
                <button
                  type="button"
                  className={styles.quickLinkBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToSectors();
                  }}
                  title="Explore Sector Level Impact"
                >
                  Sectors →
                </button>
              )}
              {onNavigateToHousehold && (
                <button
                  type="button"
                  className={styles.quickLinkBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToHousehold();
                  }}
                  title="Explore Household Budget Impact"
                >
                  Household →
                </button>
              )}
              {onNavigateToSipForecasts && (
                <button
                  type="button"
                  className={styles.quickLinkBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToSipForecasts();
                  }}
                  title="Explore SIP Forecasts"
                >
                  SIP →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
