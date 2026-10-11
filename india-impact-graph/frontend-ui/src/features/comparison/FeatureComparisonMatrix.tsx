import React, { useState } from 'react';
import { FeatureMatrixRow, PlatformId, FeatureSupportStatus } from './types';
import styles from './FeatureComparisonMatrix.module.css';

interface FeatureComparisonMatrixProps {
  features: FeatureMatrixRow[];
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
  searchFilter?: string;
}

const PLATFORM_COLUMNS: {
  id: PlatformId;
  name: string;
  badgeBg: string;
  accentColor: string;
  badgeBorder: string;
}[] = [
  {
    id: 'news_apps',
    name: 'News Apps',
    badgeBg: '#fee2e2',
    accentColor: '#dc2626',
    badgeBorder: '#fca5a5',
  },
  {
    id: 'financial_tools',
    name: 'Financial Tools',
    badgeBg: '#fef3c7',
    accentColor: '#d97706',
    badgeBorder: '#fde68a',
  },
  {
    id: 'research_platforms',
    name: 'Research Platforms',
    badgeBg: '#e0f2fe',
    accentColor: '#0284c7',
    badgeBorder: '#bae6fd',
  },
  {
    id: 'bharat_impact',
    name: 'BharatImpact',
    badgeBg: '#d1fae5',
    accentColor: '#059669',
    badgeBorder: '#a7f3d0',
  },
];

export const FeatureComparisonMatrix: React.FC<FeatureComparisonMatrixProps> = ({
  features,
  selectedPlatform,
  onSelectPlatform,
  searchFilter = '',
}) => {
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

  const filteredFeatures = features.filter((feat) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      feat.title.toLowerCase().includes(q) ||
      feat.description.toLowerCase().includes(q) ||
      feat.category.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id: string) => {
    setExpandedFeatureId((prev) => (prev === id ? null : id));
  };

  const renderStatusIcon = (status: FeatureSupportStatus) => {
    switch (status) {
      case 'supported':
        return (
          <span className={`${styles.statusBadge} ${styles.supported}`} title="Fully Supported">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'partially_supported':
        return (
          <span
            className={`${styles.statusBadge} ${styles.partiallySupported}`}
            title="Partially Supported"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'not_supported':
        return (
          <span
            className={`${styles.statusBadge} ${styles.notSupported}`}
            title="Not Supported by Documented Evidence"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
      case 'unknown':
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.unknown}`} title="Unknown or Unverified">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        );
    }
  };

  const renderFeatureIcon = (id: string) => {
    switch (id) {
      case 'realtime_global_news':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        );
      case 'economic_context':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'sector_impact':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
      case 'household_impact':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'sip_forecasting':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        );
      case 'interactive_graph':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        );
      case 'personalized_insights':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'future_scenarios':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        );
      case 'ai_recommendations':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M4.93 4.93l2.83 2.83" />
            <path d="M16.24 16.24l2.83 2.83" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M4.93 19.07l2.83-2.83" />
            <path d="M16.24 7.76l2.83-2.83" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeaderSection}>
        <div>
          <h2 className={styles.tableTitle}>Feature Comparison</h2>
          <p className={styles.tableSubtitle}>
            Interactive benchmarking across 9 core capabilities. Click any row for evidence and
            methodology notes.
          </p>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.featureColHeader}>Feature</th>
              {PLATFORM_COLUMNS.map((col) => {
                const isSelected = selectedPlatform === col.id;
                const isBharatImpact = col.id === 'bharat_impact';
                return (
                  <th
                    key={col.id}
                    className={`
                      ${styles.platformColHeader}
                      ${isSelected ? styles.selectedColumn : ''}
                      ${isBharatImpact ? styles.bharatColHeader : ''}
                    `}
                    onClick={() => onSelectPlatform(col.id)}
                    title={`Highlight ${col.name}`}
                  >
                    <div
                      className={styles.headerBadge}
                      style={{
                        backgroundColor: col.badgeBg,
                        color: col.accentColor,
                        borderColor: col.badgeBorder,
                      }}
                    >
                      {isBharatImpact ? '👑' : col.name.charAt(0)}
                    </div>
                    <span className={styles.headerPlatformName}>{col.name}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredFeatures.map((feat) => {
              const isExpanded = expandedFeatureId === feat.id;
              return (
                <React.Fragment key={feat.id}>
                  <tr
                    className={`${styles.row} ${isExpanded ? styles.expandedRow : ''}`}
                    onClick={() => toggleExpand(feat.id)}
                    tabIndex={0}
                    role="button"
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(feat.id);
                      }
                    }}
                  >
                    <td className={styles.featureCell}>
                      <div className={styles.featureInfo}>
                        <div className={styles.featureIcon}>{renderFeatureIcon(feat.id)}</div>
                        <div>
                          <span className={styles.featureTitleText}>{feat.title}</span>
                          <span className={styles.featureHint}>Click for evidence</span>
                        </div>
                      </div>
                    </td>

                    {PLATFORM_COLUMNS.map((col) => {
                      const status = feat.statuses[col.id];
                      const isSelected = selectedPlatform === col.id;
                      const isBharatImpact = col.id === 'bharat_impact';

                      return (
                        <td
                          key={col.id}
                          className={`
                            ${styles.statusCell}
                            ${isSelected ? styles.selectedColumnCell : ''}
                            ${isBharatImpact ? styles.bharatColumnCell : ''}
                          `}
                        >
                          {renderStatusIcon(status)}
                        </td>
                      );
                    })}
                  </tr>

                  {isExpanded && (
                    <tr className={styles.detailRow}>
                      <td colSpan={5} className={styles.detailCell}>
                        <div className={styles.detailCard}>
                          <div className={styles.detailHeader}>
                            <strong>{feat.title}</strong> — {feat.description}
                          </div>
                          <div className={styles.detailGrid}>
                            {PLATFORM_COLUMNS.map((col) => (
                              <div key={col.id} className={styles.platformDetailBox}>
                                <div className={styles.platformDetailName}>{col.name}:</div>
                                <div className={styles.platformDetailNote}>
                                  {feat.notes[col.id]}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className={styles.evidenceFooter}>
                            <span>
                              <strong>Evidence Basis:</strong> {feat.evidenceBasis}
                            </span>
                            <span>
                              <strong>Last Reviewed:</strong> {feat.lastReviewed}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
