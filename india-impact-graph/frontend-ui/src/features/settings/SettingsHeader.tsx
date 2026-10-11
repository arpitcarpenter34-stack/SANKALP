import React from 'react';
import { SettingsTabId } from './types';
import styles from './SettingsHeader.module.css';

interface SettingsHeaderProps {
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SETTINGS_TABS: { id: SettingsTabId; label: string; icon: string }[] = [
  { id: 'profile', label: 'Profile & Account', icon: '👤' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'privacy', label: 'Data & Privacy', icon: '🛡️' },
  { id: 'display', label: 'Display', icon: '🖥️' },
  { id: 'watchlist', label: 'Watchlist & Alerts', icon: '🎯' },
  { id: 'api', label: 'API & Integrations', icon: '🔌' },
];

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className={styles.headerContainer} role="banner">
      <div className={styles.topRow}>
        <div className={styles.titleArea}>
          <div className={styles.iconBadge} aria-hidden="true">
            ⚙️
          </div>
          <div>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>
              Customize your experience, manage preferences, and control how you receive insights.
            </p>
          </div>
        </div>

        <div className={styles.searchBox}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search settings, notifications, data sources, or preferences..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search settings"
          />
        </div>
      </div>

      <nav className={styles.navTabs} aria-label="Settings categories">
        {SETTINGS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-pressed={isActive}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
