import React from 'react';
import { HouseholdInsightItem } from './types';
import styles from './HouseholdInsightsCard.module.css';

interface HouseholdInsightsCardProps {
  insights: HouseholdInsightItem[];
  onSelectInsightCategory?: (type: string) => void;
}

export const HouseholdInsightsCard: React.FC<HouseholdInsightsCardProps> = ({
  insights,
  onSelectInsightCategory,
}) => {
  return (
    <div className={styles.card} id="household-insights-panel">
      <div className={styles.header}>
        <h3 className={styles.title}>Key Insights</h3>
        <span className={styles.aiBadge} title="Deterministic causal explanations calculated from MoSPI HCES basket shares & scenario elasticity">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Model-Based Insights
        </span>
      </div>

      <div className={styles.insightsList}>
        {insights.map((item) => (
          <div
            key={item.id}
            className={styles.insightItem}
            onClick={() => onSelectInsightCategory?.(item.type)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectInsightCategory?.(item.type);
              }
            }}
            title="Click to highlight related category"
          >
            <div className={styles.iconCircle} aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className={styles.insightText}>{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
