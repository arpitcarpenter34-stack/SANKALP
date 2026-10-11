import React from 'react';
import { SectorTakeawayItem } from './types';
import styles from './SectorTakeawaysCard.module.css';

export interface SectorTakeawaysCardProps {
  takeaways: SectorTakeawayItem[];
}

export const SectorTakeawaysCard: React.FC<SectorTakeawaysCardProps> = ({ takeaways }) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'trend':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case 'shield':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      case 'cart':
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      case 'policy':
      default:
        return (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.takeawaysCard}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Key Takeaways</h3>
        <span className={styles.aiBadge}>
          <span>✨</span>
          <span>AI Generated Insights</span>
        </span>
      </div>

      <div className={styles.list}>
        {takeaways.map((item) => (
          <div key={item.id} className={styles.item}>
            <div className={styles.icon} aria-hidden="true">
              {renderIcon(item.icon)}
            </div>
            <span className={styles.text}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
