import React from 'react';
import { BackendConnectionStatus } from '../../types';
import styles from './Header.module.css';

export interface HeaderProps {
  isAiOff: boolean;
  onToggleAi: () => void;
  activeScenarioTitle?: string;
  backendStatus?: BackendConnectionStatus;
  onToggleForceOffline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAiOff,
  onToggleAi,
  backendStatus,
  onToggleForceOffline,
}) => {
  return (
    <header className={styles.header}>
      {/* 1. Left Brand & Tagline */}
      <div className={styles.leftSection}>
        <div className={styles.logoBadge} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={styles.logoSvg}>
            <circle cx="12" cy="5" r="3" stroke="#00d9ff" strokeWidth="2" fill="#030b18" />
            <circle cx="5" cy="18" r="3" stroke="#00d9ff" strokeWidth="2" fill="#030b18" />
            <circle cx="19" cy="18" r="3" stroke="#00d9ff" strokeWidth="2" fill="#030b18" />
            <line x1="10.2" y1="7.5" x2="6.8" y2="15.5" stroke="#00d9ff" strokeWidth="1.8" />
            <line x1="13.8" y1="7.5" x2="17.2" y2="15.5" stroke="#00d9ff" strokeWidth="1.8" />
            <line x1="8" y1="18" x2="16" y2="18" stroke="#00d9ff" strokeWidth="1.8" />
            <circle cx="12" cy="13" r="1.5" fill="#00d9ff" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>India Impact Graph</h1>
          <p className={styles.tagline}>From Global News to Your Household Budget</p>
        </div>
      </div>

      {/* 2. Center 4-Step Macro Transmission Stepper */}
      <nav className={styles.stepperContainer} aria-label="Transmission Flow Steps">
        <div className={`${styles.stepItem} ${styles.stepActive}`}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepLabel}>Global Shock</span>
        </div>
        <span className={styles.stepArrow} aria-hidden="true">➔</span>

        <div className={`${styles.stepItem} ${styles.stepActive}`}>
          <span className={styles.stepNumber}>2</span>
          <span className={styles.stepLabel}>Transmission</span>
        </div>
        <span className={styles.stepArrow} aria-hidden="true">➔</span>

        <div className={`${styles.stepItem} ${styles.stepOutlined}`}>
          <span className={styles.stepNumber}>3</span>
          <span className={styles.stepLabel}>India Impact</span>
        </div>
        <span className={styles.stepArrow} aria-hidden="true">➔</span>

        <div className={`${styles.stepItem} ${styles.stepMuted}`}>
          <span className={styles.stepNumber}>4</span>
          <span className={styles.stepLabel}>Household Effect</span>
        </div>
      </nav>

      {/* 3. Right Status Capsules */}
      <div className={styles.rightSection}>
        {/* Demo Mode Capsule */}
        <button
          type="button"
          className={styles.pillCapsule}
          onClick={onToggleForceOffline}
          title={
            backendStatus?.isLive
              ? 'Connected to Live FastAPI Engine. Click to toggle offline demo mode.'
              : 'Running in Deterministic Demo Mode. Click to toggle live connection check.'
          }
        >
          <span className={styles.greenPulseDot} />
          <div className={styles.pillTextCol}>
            <span className={styles.pillTopLabel}>
              {backendStatus?.isLive ? 'LIVE MODE' : 'DEMO MODE'}
            </span>
            <span className={styles.pillSubLabel}>
              {backendStatus?.isLive ? 'FastAPI Connected' : 'Using Synthetic Data'}
            </span>
          </div>
        </button>

        {/* AI Explainer Mode Capsule */}
        <button
          type="button"
          className={`${styles.pillCapsule} ${isAiOff ? styles.pillMuted : styles.pillActive}`}
          onClick={onToggleAi}
          role="switch"
          aria-checked={!isAiOff}
          title={
            isAiOff
              ? 'AI Explainer Slot is OFF. Pure deterministic calculation formulas only.'
              : 'AI Explainer Slot is Enabled. Providing scenario narratives alongside deterministic numbers.'
          }
        >
          <span className={styles.capsuleIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a8 8 0 0 0-8 8c0 3 2 5.5 4 7v3h8v-3c2-1.5 4-4 4-7a8 8 0 0 0-8-8z" />
              <path d="M10 22h4" />
            </svg>
          </span>
          <div className={styles.pillTextCol}>
            <span className={styles.pillTopLabel}>AI Explainer</span>
            <span className={styles.pillSubLabel}>
              {isAiOff ? 'Disabled' : 'Enabled'}
            </span>
          </div>
        </button>

        {/* Data Source Baseline Capsule */}
        <div className={styles.pillCapsule} title="Anchored to MoSPI Household Consumption Expenditure Survey 2023-24">
          <span className={styles.capsuleIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </span>
          <div className={styles.pillTextCol}>
            <span className={styles.pillTopLabel}>Data Source</span>
            <span className={styles.pillSubLabel}>MoSPI, HCES 2023-24</span>
          </div>
        </div>

        {/* Hamburger Menu Icon */}
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Navigation Menu"
          title="Platform Controls & Benchmark Registry"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
};
