import React from 'react';
import { ComparisonTab } from './types';
import styles from './ComparisonHeader.module.css';

interface ComparisonHeaderProps {
  activeTab: ComparisonTab;
  onTabChange: (tab: ComparisonTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const TABS: { id: ComparisonTab; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'features', label: 'Features', icon: 'checklist' },
  { id: 'performance', label: 'Performance', icon: 'analytics' },
  { id: 'use_cases', label: 'Use Cases', icon: 'insights' },
  { id: 'value_for_you', label: 'Value for You', icon: 'stars' },
];

export const ComparisonHeader: React.FC<ComparisonHeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <div className={styles.iconBadge} aria-hidden="true">
          <svg
            className={styles.balanceIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v18" />
            <path d="m4 6 8-3 8 3" />
            <path d="m6 10-3 6h6l-3-6" />
            <path d="m18 10-3 6h6l-3-6" />
            <path d="M4 21h16" />
          </svg>
        </div>
        <div>
          <h1 className={styles.title}>Comparison</h1>
          <p className={styles.subtitle}>
            See how BharatImpact is different from traditional tools and existing solutions.
          </p>
        </div>
      </div>

      <div className={styles.actionsSection}>
        <div className={styles.searchBox}>
          <svg
            className={styles.searchIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search features, platforms, or use cases..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search features, platforms, or use cases"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <nav className={styles.navTabs} aria-label="Comparison navigation tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                onClick={() => onTabChange(tab.id)}
                aria-pressed={isActive}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
