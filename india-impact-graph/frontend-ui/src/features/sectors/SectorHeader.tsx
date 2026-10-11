import React from 'react';
import styles from './SectorHeader.module.css';

export interface SectorHeaderProps {
  onOpenCompare?: () => void;
}

export const SectorHeader: React.FC<SectorHeaderProps> = ({ onOpenCompare }) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftCol}>
        <div className={styles.headerIconCircle} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className={styles.titleCol}>
          <h1 className={styles.title}>Sectors</h1>
          <p className={styles.subtitle}>
            Explore how global events impact different sectors of the Indian economy, their performance, key indicators and household connections.
          </p>
        </div>
      </div>

      <button
        type="button"
        className={styles.compareBtn}
        onClick={onOpenCompare}
        title="Compare multiple economic sectors side-by-side"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h18" />
        </svg>
        <span>Compare Sectors</span>
      </button>
    </div>
  );
};
