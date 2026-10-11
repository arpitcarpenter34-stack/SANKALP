import React from 'react';
import styles from './SipAffordabilityCard.module.css';

export interface SipAffordabilityCardProps {
  onOpenCalculator?: () => void;
}

export const SipAffordabilityCard: React.FC<SipAffordabilityCardProps> = ({
  onOpenCalculator,
}) => {
  const currentSip = 5000;
  const scenarioCapacity = Math.round(currentSip * 0.9); // -10% scenario impact

  return (
    <div className={styles.card}>
      {/* 1. Header with Calculator action */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.titleCol}>
            <h3 className={styles.title}>SIP Affordability</h3>
            <span className={styles.subtitle}>Savings &amp; investment capacity</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.calcBtn}
          onClick={onOpenCalculator}
          aria-label="Open SIP Calculator"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01" />
          </svg>
          <span>Calculator</span>
        </button>
      </div>

      {/* 2. Current SIP vs Scenario capacity */}
      <div className={styles.statsRow}>
        {/* Current SIP */}
        <div className={styles.statBox}>
          <div className={styles.iconCircleMint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div className={styles.statCol}>
            <span className={styles.statLabel}>Current SIP</span>
            <div className={styles.valGroup}>
              <span className={styles.statVal}>₹{currentSip.toLocaleString('en-IN')}</span>
              <span className={styles.unit}>/mo</span>
            </div>
          </div>
        </div>

        {/* Scenario capacity */}
        <div className={styles.statBox}>
          <div className={styles.iconCircleRose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className={styles.statCol}>
            <span className={styles.statLabel}>Scenario capacity</span>
            <div className={styles.valGroup}>
              <span className={styles.statValScenario}>₹{scenarioCapacity.toLocaleString('en-IN')}</span>
              <span className={styles.unitRed}>/mo</span>
            </div>
            <span className={styles.pctChange}>-10.0%</span>
          </div>
        </div>
      </div>

      {/* 3. Warning Callout Banner */}
      <div className={styles.warningCallout}>
        <div className={styles.warningDot}>
          <span>i</span>
        </div>
        <p className={styles.warningText}>
          You may need to reduce SIP by <strong>₹500/month</strong> to maintain household balance under this scenario
        </p>
      </div>
    </div>
  );
};
