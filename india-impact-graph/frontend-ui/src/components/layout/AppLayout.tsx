import React from 'react';
import { Header } from './Header';
import { BackendConnectionStatus } from '../../types';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  isAiOff: boolean;
  onToggleAi: () => void;
  activeScenarioTitle?: string;
  backendStatus?: BackendConnectionStatus;
  onToggleForceOffline?: () => void;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  isAiOff,
  onToggleAi,
  activeScenarioTitle,
  backendStatus,
  onToggleForceOffline,
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  return (
    <div className={styles.appContainer}>
      <Header
        isAiOff={isAiOff}
        onToggleAi={onToggleAi}
        activeScenarioTitle={activeScenarioTitle}
        backendStatus={backendStatus}
        onToggleForceOffline={onToggleForceOffline}
      />

      {/* 3-Column Grok-Themed Master Analytics Dashboard */}
      <main className={styles.mainGrid}>
        {/* Left Column: Scenario Input */}
        <aside className={styles.leftColumn} aria-label="Scenario & Input Workspace">
          {leftPanel}
        </aside>

        {/* Center Column: Dominant Financial Impact Graph Centerpiece */}
        <section className={styles.centerColumn} aria-label="Financial Impact Graph Centerpiece">
          {centerPanel}
        </section>

        {/* Right Column: Household Persona Impact & Evidence Receipts */}
        <aside className={styles.rightColumn} aria-label="Household Impact & Evidence Receipts">
          {rightPanel}
        </aside>
      </main>

      {/* Sleek Minimal Status Bar */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerBrand}>India Impact Graph</span>
            <span className={styles.footerSep}>|</span>
            <span className={styles.footerRule}>Evidence First • MoSPI HCES 2023–24 Deterministic Calibration</span>
          </div>

          <div className={styles.footerCenter}>
            <span className={styles.footerNote}>
              PS 5: Autonomous Financial Event Market Impact Graph // Team SANKALP // Hackwave 3.0
            </span>
          </div>

          <div className={styles.footerRight}>
            <span className={styles.footerVersion}>v2.0-grok-dark</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
