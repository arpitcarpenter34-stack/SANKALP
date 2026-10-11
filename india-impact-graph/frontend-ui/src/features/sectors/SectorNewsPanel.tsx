import React from 'react';
import { SectorNewsCardItem } from './types';
import styles from './SectorNewsPanel.module.css';

export interface SectorNewsPanelProps {
  sectorName: string;
  news: SectorNewsCardItem[];
  onViewAllNews?: () => void;
}

export const SectorNewsPanel: React.FC<SectorNewsPanelProps> = ({
  sectorName,
  news,
  onViewAllNews,
}) => {
  const renderThumbnail = (type: string) => {
    switch (type) {
      case 'chip':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
          </svg>
        );
      case 'oil':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        );
      case 'ship':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.76" />
          </svg>
        );
      case 'wheat':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
            <path d="M2 22 16 8" />
            <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
          </svg>
        );
      case 'coins':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
          </svg>
        );
      case 'energy':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.newsCard}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Latest News ({sectorName.split(' ')[0]})</h3>
        {onViewAllNews && (
          <button
            type="button"
            className={styles.viewAllBtn}
            onClick={onViewAllNews}
          >
            <span>View all</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.newsList}>
        {news.map((item) => {
          const badgeClass =
            item.impactBadge === 'High Impact'
              ? styles.badgeHigh
              : item.impactBadge === 'Medium'
              ? styles.badgeMedium
              : styles.badgeLow;

          return (
            <a
              key={item.id}
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.newsItem}
              title={`Read source coverage on ${item.publisher}`}
            >
              <div className={styles.thumbBox} aria-hidden="true">
                {renderThumbnail(item.thumbnailType)}
              </div>

              <div className={styles.newsMiddle}>
                <span className={styles.headline}>{item.headline}</span>
                <span className={styles.metaRow}>
                  {item.publisher} • {item.date}
                </span>
              </div>

              <span className={badgeClass}>{item.impactBadge}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
};
