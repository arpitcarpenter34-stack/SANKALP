import React from 'react';
import styles from './AiInsightsPanel.module.css';

export interface AiInsightItem {
  id: string;
  icon: 'bulb' | 'target' | 'shield' | 'trending';
  title: string;
  text: string;
}

export interface AiInsightsPanelProps {
  insights: AiInsightItem[];
  onAskAi?: () => void;
}

export const AiInsightsPanel: React.FC<AiInsightsPanelProps> = ({
  insights,
  onAskAi,
}) => {
  const renderIcon = (iconType: 'bulb' | 'target' | 'shield' | 'trending') => {
    switch (iconType) {
      case 'bulb':
        return (
          <div className={`${styles.iconCircle} ${styles.iconBulb}`} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
              <path d="M9 18h6" />
              <path d="M10 22h4" />
            </svg>
          </div>
        );
      case 'target':
        return (
          <div className={`${styles.iconCircle} ${styles.iconTarget}`} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
        );
      case 'shield':
        return (
          <div className={`${styles.iconCircle} ${styles.iconShield}`} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        );
      case 'trending':
        return (
          <div className={`${styles.iconCircle} ${styles.iconTrending}`} aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
        );
    }
  };

  return (
    <aside className={styles.panelContainer} aria-label="AI Insights and Recommendations">
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <svg className={styles.aiRobotIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <circle cx="12" cy="5" r="2" />
            <path d="M12 7v4" />
            <line x1="8" y1="16" x2="8" y2="16" />
            <line x1="16" y1="16" x2="16" y2="16" />
          </svg>
          <h2 className={styles.panelTitle}>AI Insights &amp; Recommendations</h2>
        </div>
        <span className={styles.aiBadge} title="Analytical Intelligence grounded in macroeconomic transmission">
          AI
        </span>
      </div>

      <div className={styles.insightsList}>
        {insights.map((item) => (
          <div key={item.id} className={styles.insightItem}>
            {renderIcon(item.icon)}
            <div className={styles.insightText}>
              {item.text}
            </div>
          </div>
        ))}
      </div>

      {onAskAi && (
        <button
          type="button"
          className={styles.askAiBtn}
          onClick={onAskAi}
          title="Open interactive AI assistant with pre-populated scenario and SIP context"
        >
          Ask AI for Personalized Advice →
        </button>
      )}
    </aside>
  );
};
