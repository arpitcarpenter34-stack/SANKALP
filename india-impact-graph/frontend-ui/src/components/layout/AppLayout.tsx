import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BackendConnectionStatus } from '../../types';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  isAiOff: boolean;
  onToggleAi: () => void;
  activeScenarioTitle?: string;
  backendStatus?: BackendConnectionStatus;
  onToggleForceOffline?: () => void;
  onOpenAiAssistant?: () => void;
  activeSidebarTab?: string;
  onSelectSidebarTab?: (tab: string) => void;
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
  // Flexible children or slotted panels
  children?: React.ReactNode;
  leftPanel?: React.ReactNode;
  centerPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isAiOff,
  onToggleAi,
  activeScenarioTitle,
  backendStatus,
  onToggleForceOffline,
  onOpenAiAssistant,
  activeSidebarTab = 'overview',
  onSelectSidebarTab,
  activeNavTab = 'dashboard',
  onSelectNavTab,
  children,
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  return (
    <div className={styles.appContainer}>
      {/* 1. Top Header */}
      <Header
        isAiOff={isAiOff}
        onToggleAi={onToggleAi}
        activeScenarioTitle={activeScenarioTitle}
        backendStatus={backendStatus}
        onToggleForceOffline={onToggleForceOffline}
        onOpenAiAssistant={onOpenAiAssistant}
        activeNavTab={activeNavTab}
        onSelectNavTab={onSelectNavTab}
        activeSidebarTab={activeSidebarTab}
      />

      {/* 2. Main Body with Sidebar + Content */}
      <div className={styles.bodyWrapper}>
        <Sidebar
          activeTab={activeSidebarTab}
          onSelectTab={onSelectSidebarTab}
          backendStatus={backendStatus}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className={styles.mainContent} role="main" aria-label="BharatImpact Dashboard">
          {children ? (
            children
          ) : (
            <div className={styles.legacyGrid}>
              {leftPanel && <aside className={styles.legacyLeft}>{leftPanel}</aside>}
              {centerPanel && <section className={styles.legacyCenter}>{centerPanel}</section>}
              {rightPanel && <aside className={styles.legacyRight}>{rightPanel}</aside>}
            </div>
          )}
        </main>
      </div>

      {/* 3. Sleek Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerBrand}>BharatImpact</span>
            <span className={styles.footerSep}>•</span>
            <span className={styles.footerRule}>
              MoSPI HCES 2023–24 FactSheet &amp; Final Report Calibrated Engine
            </span>
          </div>

          <div className={styles.footerCenter}>
            <span className={styles.footerNote}>
              Autonomous Financial Event Market Impact Graph // Team SANKALP
            </span>
          </div>

          <div className={styles.footerRight}>
            <span className={styles.footerVersion}>
              {backendStatus?.isLive ? 'Live API Connected' : 'Deterministic Mode'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
