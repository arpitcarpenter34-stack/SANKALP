import React from 'react';
import styles from './SipForecastsHeader.module.css';

export interface SipForecastsHeaderProps {
  scenarioTitle?: string;
  impactLevel?: 'High Impact' | 'Moderate Impact' | 'Low Impact';
  onChangeScenario?: () => void;
}

export const SipForecastsHeader: React.FC<SipForecastsHeaderProps> = ({
  scenarioTitle = 'Global chip supply tensions',
  impactLevel = 'High Impact',
  onChangeScenario,
}) => {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.titleArea}>
        <div className={styles.iconCircle} aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className={styles.titleTextCol}>
          <h1 className={styles.mainTitle}>SIP &amp; Forecasts</h1>
          <p className={styles.subtitle}>
            Understand how global events and sector changes can affect your investment capacity and future wealth.
          </p>
        </div>
      </div>

      <div className={styles.scenarioArea}>
        <div className={styles.globeCircle} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>

        <div className={styles.scenarioInfo}>
          <div className={styles.scenarioLabelRow}>
            <span className={styles.scenarioLabel}>Current Scenario</span>
            <span className={styles.impactBadge}>{impactLevel}</span>
          </div>
          <span className={styles.scenarioTitle} title={scenarioTitle}>
            {scenarioTitle}
          </span>
        </div>

        {onChangeScenario && (
          <button
            type="button"
            className={styles.changeScenarioBtn}
            onClick={onChangeScenario}
            title="Switch macroeconomic scenario or open scenario testbench"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
            Change Scenario
          </button>
        )}
      </div>
    </header>
  );
};
