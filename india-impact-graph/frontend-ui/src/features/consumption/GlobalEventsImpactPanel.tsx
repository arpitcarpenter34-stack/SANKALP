import React from 'react';
import { GlobalEventImpactItem } from './types';
import { formatRupees } from './consumptionCalculation';
import styles from './GlobalEventsImpactPanel.module.css';

export interface GlobalEventsImpactPanelProps {
  events: GlobalEventImpactItem[];
  onSelectEvent?: (event: GlobalEventImpactItem) => void;
}

export const GlobalEventsImpactPanel: React.FC<GlobalEventsImpactPanelProps> = ({
  events,
  onSelectEvent,
}) => {
  const renderIcon = (type: string) => {
    switch (type) {
      case 'oil':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'chip':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <path d="M9 1v3" />
            <path d="M15 1v3" />
            <path d="M9 20v3" />
            <path d="M15 20v3" />
            <path d="M20 9h3" />
            <path d="M20 14h3" />
            <path d="M1 9h3" />
            <path d="M1 14h3" />
          </svg>
        );
      case 'food':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        );
      case 'shipping':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.94 5.34 2.81 7.2" />
            <path d="M12 10V4" />
            <path d="M12 4l5 3-5 3" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getIconClass = (type: string) => {
    switch (type) {
      case 'oil':
        return styles.iconOil;
      case 'chip':
        return styles.iconChip;
      case 'food':
        return styles.iconFood;
      case 'shipping':
        return styles.iconShipping;
      default:
        return '';
    }
  };

  return (
    <article className={styles.eventsCard} aria-label="Impact of Global Events on Consumption">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Impact of Global Events on Consumption</h2>
      </div>

      <div className={styles.eventsList} role="list">
        {events.map((evt) => (
          <div
            key={evt.id}
            role="listitem"
            className={styles.eventRow}
            onClick={() => onSelectEvent && onSelectEvent(evt)}
            title={`Click to analyze transmission path for ${evt.title}`}
          >
            <div className={styles.eventLeft}>
              <div className={`${styles.eventIconCircle} ${getIconClass(evt.iconType)}`} aria-hidden="true">
                {renderIcon(evt.iconType)}
              </div>
              <div className={styles.eventTextGroup}>
                <span className={styles.eventTitle}>{evt.title}</span>
                <span className={styles.eventMechanism}>{evt.impactMechanism}</span>
              </div>
            </div>

            <div className={styles.eventRight}>
              <span className={styles.impactBadge}>
                +{formatRupees(evt.monthlyImpactRupees)} /mo
              </span>
              <span className={styles.chevronIcon} aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};
