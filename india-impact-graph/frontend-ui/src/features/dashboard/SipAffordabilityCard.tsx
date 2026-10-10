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
      <div className={styles.header}>
        <h3 className={styles.title}>SIP Affordability</h3>
        <button
          type="button"
          className={styles.calcBtn}
          onClick={onOpenCalculator}
          aria-label="SIP Calculator"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="16" y1="14" x2="16" y2="18" />
            <path d="M16 10h.01" />
            <path d="M12 10h.01" />
            <path d="M8 10h.01" />
            <path d="M12 14h.01" />
            <path d="M8 14h.01" />
            <path d="M12 18h.01" />
            <path d="M8 18h.01" />
          </svg>
          <span>Calculator</span>
        </button>
      </div>

      <div className={styles.statsRow}>
        {/* Current SIP */}
        <div className={styles.statBox}>
          <div className={styles.iconCircle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2">
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
          <div className={styles.iconCircle}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2">
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
    </div>
  );
};
