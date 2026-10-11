import React from 'react';
import { BackendConnectionStatus } from '../../types';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  backendStatus?: BackendConnectionStatus;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'home', isAvailable: true },
  { id: 'global-events', label: 'Global Events', icon: 'globe', isAvailable: true },
  { id: 'impact-graph', label: 'Impact Graph', icon: 'network', isAvailable: true },
  { id: 'sectors', label: 'Sectors', icon: 'layers', isAvailable: true },
  { id: 'household-impact', label: 'Household Impact', icon: 'household', isAvailable: true },
  { id: 'sip-forecasts', label: 'SIP & Forecasts', icon: 'trending', isAvailable: true },
  { id: 'news-insights', label: 'News & Insights', icon: 'news', isAvailable: true },
  { id: 'comparison', label: 'Comparison', icon: 'balance', isAvailable: true },
  { id: 'consumption', label: 'Consumption', icon: 'cart', isAvailable: true },
  { id: 'methodology', label: 'Methodology', icon: 'book', isAvailable: true },
  { id: 'settings', label: 'Settings', icon: 'gear', isAvailable: true },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'overview',
  onSelectTab,
  backendStatus,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'globe':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case 'network':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="6" height="6" rx="1" />
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <path d="M5 8v8" />
            <path d="M5 12h11" />
            <path d="M16 12v4" />
          </svg>
        );
      case 'layers':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
      case 'household':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
          </svg>
        );
      case 'trending':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case 'news':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        );
      case 'balance':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
            <path d="M7 21h10" />
            <path d="M12 3v18" />
            <path d="M3 7h18" />
          </svg>
        );
      case 'cart':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        );
      case 'book':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
        );
      case 'gear':
        return (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`} aria-label="Sidebar Navigation">
      {/* 1. Subtle top row with collapse toggle (brand is anchored in Header) */}
      {onToggleCollapse && (
        <div className={styles.topControlRow}>
          <button
            type="button"
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
            </svg>
          </button>
        </div>
      )}

      {/* 2. Main Navigation Menu */}
      <nav className={styles.navMenu} aria-label="Main Navigation">
        <ul className={styles.navList}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id} className={styles.navItem}>
                <button
                  type="button"
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.navIcon} aria-hidden="true">
                    {renderIcon(item.icon)}
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 3. Bottom Status Section: Deterministic Mode Capsule */}
      <div className={styles.statusSection}>
        <div className={styles.statusCard}>
          <div className={styles.statusHeader}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <span className={styles.statusTitle}>
              {backendStatus?.isLive ? 'Live Engine Active' : 'Deterministic Mode'}
            </span>
            <span className={styles.infoHint} title="Engine mode information">ⓘ</span>
          </div>
          <span className={styles.statusSubtitle}>
            {backendStatus?.isLive ? 'Connected to local FastAPI' : 'Using curated data & models'}
          </span>
        </div>
      </div>

      {/* 4. India Map Graphic & Tagline Footer */}
      <div className={styles.sidebarFooter}>
        <div className={styles.mapGraphic} aria-hidden="true">
          <svg width="84" height="84" viewBox="0 0 100 100" fill="none" className={styles.indiaSvg}>
            {/* Stylized geometric silhouette of India */}
            <path
              d="M48 10 L54 14 L60 20 L58 26 L66 28 L72 32 L78 30 L85 36 L80 44 L72 42 L66 48 L68 54 L62 60 L54 75 L50 85 L46 75 L42 66 L34 60 L28 50 L32 40 L38 34 L40 24 L44 14 Z"
              fill="#D4ECD8"
              opacity="0.85"
            />
            {/* Chart illustration on map */}
            <rect x="68" y="68" width="4" height="16" rx="2" fill="#A7D7B5" />
            <rect x="74" y="62" width="4" height="22" rx="2" fill="#6EE7B7" />
            <rect x="80" y="56" width="4" height="28" rx="2" fill="#047857" />
          </svg>
        </div>
        <div className={styles.footerBrandCol}>
          <span className={styles.footerBrandName}>BharatImpact</span>
          <span className={styles.footerTagline}>
            Building a more resilient and informed India
          </span>
          <span className={styles.footerVersion}>v0.1 (Hackathon)</span>
        </div>
      </div>
    </aside>
  );
};
