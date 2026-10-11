import React from 'react';
import styles from './NewsInsightsHeader.module.css';

export const NewsInsightsHeader: React.FC = () => {
  return (
    <header className={styles.headerContainer} aria-label="News and Insights Section Header">
      <div className={styles.iconBadge} aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
          <path d="M18 14h-8" />
          <path d="M15 18h-5" />
          <path d="M10 6h8v4h-8V6Z" />
        </svg>
      </div>
      <div className={styles.textGroup}>
        <h1 className={styles.title}>News & Insights</h1>
        <p className={styles.subtitle}>
          Stay updated with top global and Indian news, and see how they impact the economy, sectors, and your household.
        </p>
      </div>
    </header>
  );
};
