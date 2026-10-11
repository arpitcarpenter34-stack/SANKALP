import React, { useState } from 'react';
import { DataSourceItem, SourceCategory } from './types';
import styles from './DataSourcesRegistry.module.css';

interface DataSourcesRegistryProps {
  sources: DataSourceItem[];
}

const CATEGORY_CARDS: {
  category: SourceCategory;
  title: string;
  subtext: string;
  iconBg: string;
  iconColor: string;
  iconType: string;
}[] = [
  {
    category: 'global_news',
    title: 'Global News & Events',
    subtext: 'Reuters, Bloomberg, BBC, Financial Times, etc.',
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    iconType: 'news',
  },
  {
    category: 'market_data',
    title: 'Market Data',
    subtext: 'Commodity prices, stock indices, currency exchange rates',
    iconBg: '#d1fae5',
    iconColor: '#059669',
    iconType: 'finance',
  },
  {
    category: 'trade_economic',
    title: 'Trade & Economic Data',
    subtext: 'World Bank, IMF, RBI, Ministry of Commerce',
    iconBg: '#e0f2fe',
    iconColor: '#0284c7',
    iconType: 'trade',
  },
  {
    category: 'sectoral_data',
    title: 'Sectoral Data',
    subtext: 'Industry reports, company filings, sector indices',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    iconType: 'factory',
  },
  {
    category: 'household_consumption',
    title: 'Household & Consumption',
    subtext: 'NSSO, CMIE, household expenditure surveys',
    iconBg: '#ffedd5',
    iconColor: '#ea580c',
    iconType: 'cart',
  },
  {
    category: 'government_policies',
    title: 'Government Policies',
    subtext: 'Policy announcements, budget documents, regulatory updates',
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    iconType: 'building',
  },
];

export const DataSourcesRegistry: React.FC<DataSourcesRegistryProps> = ({ sources }) => {
  const [selectedCategory, setSelectedCategory] = useState<SourceCategory | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const filteredSources = selectedCategory
    ? sources.filter((s) => s.category === selectedCategory)
    : sources;

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'news':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Z" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        );
      case 'finance':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'trade':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        );
      case 'factory':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 20h20" />
            <path d="M6 20V8l4 4V8l4 4V4l6 4v12" />
          </svg>
        );
      case 'cart':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        );
      case 'building':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="22" x2="20" y2="22" />
            <line x1="2" y1="11" x2="22" y2="11" />
            <line x1="12" y1="2" x2="12" y2="7" />
            <polygon points="12 2 2 7 22 7 12 2" />
            <line x1="6" y1="11" x2="6" y2="22" />
            <line x1="18" y1="11" x2="18" y2="22" />
          </svg>
        );
    }
  };

  const getStatusBadge = (status: DataSourceItem['integrationStatus']) => {
    switch (status) {
      case 'connected':
        return <span className={`${styles.statusPill} ${styles.statusConnected}`}>● Connected</span>;
      case 'historical_dataset':
        return <span className={`${styles.statusPill} ${styles.statusHistorical}`}>● Historical Dataset</span>;
      case 'cached_data':
        return <span className={`${styles.statusPill} ${styles.statusCached}`}>● Cached Data</span>;
      case 'static_fixture':
        return <span className={`${styles.statusPill} ${styles.statusStatic}`}>● Static Fixture</span>;
      case 'configured_unverified':
      default:
        return <span className={`${styles.statusPill} ${styles.statusUnverified}`}>○ Configured / Unverified</span>;
    }
  };

  return (
    <div className={styles.registryCard}>
      <div className={styles.header}>
        <div className={styles.titleWithInfo}>
          <h2 className={styles.title}>Data Sources</h2>
          <span className={styles.infoIcon} title="Verified primary and secondary data registries">
            ⓘ
          </span>
        </div>
        <div className={styles.countBadge}>
          <span className={styles.sourcesCountText}>8 Verified Primary Registers</span>
        </div>
      </div>

      {/* 6 Category Summary Cards Matching Screenshot */}
      <div className={styles.categoriesGrid}>
        {CATEGORY_CARDS.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <div
              key={cat.category}
              className={`
                ${styles.categoryCard}
                ${isSelected ? styles.categoryCardSelected : ''}
              `}
              onClick={() => setSelectedCategory(isSelected ? null : cat.category)}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedCategory(isSelected ? null : cat.category);
                }
              }}
            >
              <div
                className={styles.iconBox}
                style={{
                  backgroundColor: cat.iconBg,
                  color: cat.iconColor,
                }}
              >
                {renderIcon(cat.iconType)}
              </div>
              <div className={styles.categoryContent}>
                <h3 className={styles.categoryTitle}>{cat.title}</h3>
                <p className={styles.categorySubtext}>{cat.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered Primary Data Source Register Drawer */}
      <div className={styles.sourcesListSection}>
        <div className={styles.sourcesListHeader}>
          <span className={styles.listSectionTitle}>
            {selectedCategory
              ? `Filtered Register: ${selectedCategory.replace('_', ' ').toUpperCase()}`
              : 'Detailed Primary Data Registers & Statuses:'}
          </span>
          {selectedCategory && (
            <button
              type="button"
              className={styles.clearFilterBtn}
              onClick={() => setSelectedCategory(null)}
            >
              Show all ({sources.length})
            </button>
          )}
        </div>

        <div className={styles.sourceItemsList}>
          {filteredSources.map((src) => {
            const isExpanded = expandedSourceId === src.id;

            return (
              <div
                key={src.id}
                className={`${styles.sourceItem} ${isExpanded ? styles.sourceItemExpanded : ''}`}
                onClick={() => setExpandedSourceId(isExpanded ? null : src.id)}
              >
                <div className={styles.sourceItemRow}>
                  <div className={styles.sourceMainInfo}>
                    <span className={styles.sourceCode}>{src.id}</span>
                    <strong className={styles.sourceName}>{src.name}</strong>
                    <span className={styles.sourcePub}>({src.publisher})</span>
                  </div>
                  <div className={styles.sourceRowRight}>
                    {getStatusBadge(src.integrationStatus)}
                    <span className={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.sourceExpandedBox}>
                    <div className={styles.expandedGrid}>
                      <div>
                        <strong>Series / Table:</strong> {src.seriesOrTableId || 'N/A'}
                      </div>
                      <div>
                        <strong>Frequency:</strong> {src.frequency}
                      </div>
                      <div>
                        <strong>Coverage:</strong> {src.coverage}
                      </div>
                      <div>
                        <strong>Attribution:</strong> {src.attribution}
                      </div>
                    </div>
                    <div className={styles.caveatsBox}>
                      <strong>Provenance & Caveats:</strong> {src.caveats}
                    </div>
                    {src.sourceUrl && (
                      <div className={styles.urlRow}>
                        <a
                          href={src.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.sourceLink}
                          onClick={(e) => e.stopPropagation()}
                        >
                          Official Portal Link ↗
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
