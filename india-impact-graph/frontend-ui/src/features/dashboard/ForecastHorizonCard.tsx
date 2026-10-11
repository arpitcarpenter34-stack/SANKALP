import React from 'react';
import styles from './ForecastHorizonCard.module.css';

export interface ForecastHorizonCardProps {
  forecastHorizon?: number;
  onEdit?: () => void;
}

export const ForecastHorizonCard: React.FC<ForecastHorizonCardProps> = ({
  forecastHorizon = 6,
  onEdit,
}) => {
  return (
    <div className={styles.card}>
      {/* 1. Header with Edit Button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className={styles.titleCol}>
            <h3 className={styles.title}>Forecast Horizon</h3>
            <span className={styles.subtitle}>Selected horizon</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.editBtn}
          onClick={onEdit}
          aria-label="Edit forecast horizon"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Edit</span>
        </button>
      </div>

      {/* 2. Main Stat with Mini Bar Chart */}
      <div className={styles.statRow}>
        <div className={styles.horizonValCol}>
          <div className={styles.horizonVal}>{forecastHorizon} months</div>
          <span className={styles.horizonMeta}>Based on current scenario</span>
        </div>

        <div className={styles.miniChart}>
          <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
            <rect x="6" y="18" width="7" height="10" rx="1.5" fill="#A7F3D0" />
            <rect x="19" y="13" width="7" height="15" rx="1.5" fill="#6EE7B7" />
            <rect x="32" y="8" width="7" height="20" rx="1.5" fill="#34D399" />
            <rect x="45" y="2" width="7" height="26" rx="1.5" fill="#047857" />
          </svg>
        </div>
      </div>

      {/* 3. Key Considerations List */}
      <div className={styles.considerationsSection}>
        <span className={styles.considerationsHeading}>Key considerations</span>
        <ul className={styles.considerationsList}>
          <li className={styles.considerationItem}>
            <span className={styles.bulletDot}>•</span>
            <span>Fuel price pass-through (1–3 months)</span>
          </li>
          <li className={styles.considerationItem}>
            <span className={styles.bulletDot}>•</span>
            <span>Retail inflation impact (2–4 months)</span>
          </li>
          <li className={styles.considerationItem}>
            <span className={styles.bulletDot}>•</span>
            <span>Household expense adjustment (3–6 months)</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
