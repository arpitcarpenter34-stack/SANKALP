import { Header } from './Header';
import { Badge } from '../ui/Badge';
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


      {/* Sub-Header Notice / System State Strip */}
      <div className={styles.noticeStrip}>
        <div className={styles.noticeContent}>
          <div className={styles.noticeLeft}>
            <span className={styles.pulseIndicator} />
            <span className={styles.noticeText}>
              <strong>DEMO INTEGRITY STATE:</strong> Number calculations use deterministic HCES 2023–24 formulas.
            </span>
          </div>
          <div className={styles.noticeRight}>
            {isAiOff ? (
              <Badge variant="verified" size="sm">
                AI OFF: Deterministic Formula Baseline
              </Badge>
            ) : (
              <Badge variant="cyan" size="sm">
                AI Mode: Demo Explainer Slot (Numbers Deterministic)
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 3-Column 12-Grid Master Dashboard */}
      <main className={styles.mainGrid}>
        {/* Left Column (3 cols) — Laptop A Owned */}
        <aside className={styles.leftColumn} aria-label="Scenario & Input Workspace">
          {leftPanel}
        </aside>

        {/* Center Column (6 cols) — Centerpiece Graph Slot for Laptop B */}
        <section className={styles.centerColumn} aria-label="Financial Impact Graph Centerpiece">
          {centerPanel}
        </section>

        {/* Right Column (3 cols) — Persona Impact & Evidence Receipts for Laptop B */}
        <aside className={styles.rightColumn} aria-label="Household Impact & Evidence Receipts">
          {rightPanel}
        </aside>
      </main>

      {/* Institutional Terminal Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerBrand}>India Impact Graph</span>
            <span className={styles.footerSep}>|</span>
            <span className={styles.footerRule}>Evidence First. Data Before Numbers.</span>
          </div>

          <div className={styles.footerCenter}>
            <span className={styles.footerNote}>
              PS 5: Autonomous Financial Event Market Impact Graph // Team SANKALP // Hackwave 3.0
            </span>
          </div>

          <div className={styles.footerRight}>
            <Badge variant="neutral" size="sm">v1.0.0-phase2-shell</Badge>
          </div>
        </div>
      </footer>
    </div>
  );
};
