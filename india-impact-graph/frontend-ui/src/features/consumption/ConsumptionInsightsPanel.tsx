import React from 'react';
import { ConsumptionInsightItem } from './types';
import styles from './ConsumptionInsightsPanel.module.css';

export interface ConsumptionInsightsPanelProps {
  insights: ConsumptionInsightItem[];
  onSelectCategory?: (category: string) => void;
}

export const ConsumptionInsightsPanel: React.FC<ConsumptionInsightsPanelProps> = ({
  insights,
  onSelectCategory,
}) => {
  const renderIcon = (name: string) => {
    switch (name) {
      case 'fuel':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="22" x2="15" y2="22" />
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
          </svg>
        );
      case 'leaf':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        );
      case 'bolt':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case 'cart':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        );
      case 'shield':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        );
      default:
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getIconClass = (name: string) => {
    switch (name) {
      case 'fuel':
        return styles.iconFuel;
      case 'leaf':
        return styles.iconLeaf;
      case 'bolt':
        return styles.iconBolt;
      case 'cart':
        return styles.iconCart;
      case 'shield':
        return styles.iconShield;
      default:
        return '';
    }
  };

  return (
    <article className={styles.insightsCard} aria-label="Consumption Key Insights">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Key Insights</h2>
        <span className={styles.aiBadge}>
          ✦ Model-Based Insights
        </span>
      </div>

      <div className={styles.insightsList} role="list">
        {insights.map((item) => (
          <div
            key={item.id}
            role="listitem"
            className={styles.insightRow}
            onClick={() => item.categoryLink && onSelectCategory && onSelectCategory(item.categoryLink)}
            title={item.categoryLink ? `Filter by ${item.categoryLink}` : undefined}
          >
            <div className={`${styles.iconCircle} ${getIconClass(item.iconName)}`} aria-hidden="true">
              {renderIcon(item.iconName)}
            </div>
            <div className={styles.insightText}>{item.text}</div>
          </div>
        ))}
      </div>
    </article>
  );
};
