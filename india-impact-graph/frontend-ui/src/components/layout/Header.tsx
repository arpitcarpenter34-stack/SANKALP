import React from 'react';
import { BackendConnectionStatus } from '../../types';
import styles from './Header.module.css';

export interface HeaderProps {
  isAiOff: boolean;
  onToggleAi: () => void;
  activeScenarioTitle?: string;
  backendStatus?: BackendConnectionStatus;
  onToggleForceOffline?: () => void;
  onOpenAiAssistant?: () => void;
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
  activeSidebarTab?: string;
}

const TOP_NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'impact-graph', label: 'Impact Graph', icon: 'network' },
  { id: 'news', label: 'News', icon: 'news' },
  { id: 'household', label: 'Household', icon: 'household' },
  { id: 'sip-forecasts', label: 'SIP & Forecasts', icon: 'chart' },
];

export const Header: React.FC<HeaderProps> = ({
  isAiOff,
  onToggleAi,
  activeScenarioTitle,
  backendStatus,
  onToggleForceOffline,
  onOpenAiAssistant,
  activeNavTab = 'dashboard',
  onSelectNavTab,
  activeSidebarTab = 'overview',
}) => {
  const [globalSearch, setGlobalSearch] = React.useState<string>('');
  const renderNavIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'network':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="6" height="6" rx="1" />
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <path d="M5 8v8" />
            <path d="M5 12h11" />
            <path d="M16 12v4" />
          </svg>
        );
      case 'news':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        );
      case 'household':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'chart':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <header className={styles.header}>
      {/* 1. Left Brand & Tagline */}
      <div className={styles.leftSection}>
        <div className={styles.logoBadge} aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
            <circle cx="6" cy="14" r="3.5" fill="#047857" />
            <circle cx="18" cy="7" r="4.5" fill="#10B981" />
            <circle cx="21" cy="20" r="3.5" fill="#059669" />
            <line x1="9" y1="12" x2="14" y2="9" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="9" y1="16" x2="18" y2="19" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="11" x2="20" y2="17" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>BharatImpact</h1>
          <p className={styles.tagline}>
            Global events → Indian economy → your household
            {activeScenarioTitle ? ` (${activeScenarioTitle})` : ''}
          </p>
        </div>
      </div>

      {/* 2. Center: Global Search Bar when on global-events, or Nav Tabs */}
      {activeSidebarTab === 'global-events' ? (
        <div className={styles.globalSearchBox}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            type="text"
            className={styles.globalSearchInput}
            placeholder="Search global events, sectors, countries..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            aria-label="Search global events, sectors, countries"
          />
        </div>
      ) : (
        <nav className={styles.centerNav} aria-label="Primary View Switcher">
          {TOP_NAV_TABS.map((tab) => {
            const isActive = activeNavTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.navTab} ${isActive ? styles.navTabActive : ''}`}
                onClick={() => onSelectNavTab && onSelectNavTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.tabIcon} aria-hidden="true">
                  {renderNavIcon(tab.icon)}
                </span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* 3. Right Actions */}
      <div className={styles.rightSection}>
        {activeSidebarTab === 'global-events' ? (
          <>
            {/* Reporting Date & Last checked timestamp */}
            <div className={styles.reportingDateCol}>
              <div className={styles.dateRow}>
                <span aria-hidden="true">🕒</span>
                <span>Oct 12, 2024</span>
              </div>
              <span className={styles.lastUpdatedText}>
                {backendStatus?.checkedAt ? `Checked: ${backendStatus.checkedAt}` : 'Baseline Archive'}
              </span>
            </div>

            {/* Truthful Connection Status Indicator */}
            <div className={styles.liveDataCapsule} title={backendStatus?.label || 'Application mode status'}>
              <span className={styles.wifiIcon} aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
                </svg>
              </span>
              <span>
                {backendStatus?.isLive
                  ? 'Live Engine'
                  : backendStatus?.latencyMs !== null && backendStatus?.latencyMs !== undefined
                  ? 'API Connected'
                  : 'Deterministic Mode'}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* AI Assistant Button */}
            <button
              type="button"
              className={styles.aiAssistantBtn}
              onClick={onOpenAiAssistant || onToggleAi}
              title={`Open BharatImpact AI Economic Assistant (AI ${isAiOff ? 'Bypassed' : 'Active'})`}
            >
              <span className={styles.aiSparkleIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </span>
              <span className={styles.aiBtnLabel}>AI Assistant</span>
            </button>

            {/* Live/Demo Toggle Pill */}
            <button
              type="button"
              className={styles.statusPill}
              onClick={onToggleForceOffline}
              title={
                backendStatus?.isLive
                  ? 'FastAPI Connected. Click to toggle offline demo mode.'
                  : 'Deterministic Demo Mode. Click to recheck live backend.'
              }
            >
              <span className={backendStatus?.isLive ? styles.greenDot : styles.amberDot} />
              <span className={styles.statusPillLabel}>
                {backendStatus?.isLive ? 'Live' : 'Demo'}
              </span>
            </button>
          </>
        )}

        {/* Notification Bell with Badge 3 (matching screenshot) */}
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Notifications (3 unread)"
          title="Economic Alert Notifications"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          <span className={styles.notifCountBadge}>3</span>
        </button>

        {/* User Profile Avatar (Letter A in mint circle) */}
        <div className={styles.userAvatar} title="User Profile (Arpit)">
          <span>A</span>
        </div>
      </div>
    </header>
  );
};
