import React from 'react';
import { ConsumptionKpiItem } from './types';
import { formatRupees, formatPercent } from './consumptionCalculation';
import styles from './ConsumptionKpis.module.css';

export interface ConsumptionKpisProps {
  kpis: {
    totalMonthly: ConsumptionKpiItem;
    fuel: ConsumptionKpiItem;
    food: ConsumptionKpiItem;
    utilities: ConsumptionKpiItem;
    otherServices: ConsumptionKpiItem;
  };
}

export const ConsumptionKpis: React.FC<ConsumptionKpisProps> = ({ kpis }) => {
  const cardsList = [
    kpis.totalMonthly,
    kpis.fuel,
    kpis.food,
    kpis.utilities,
    kpis.otherServices,
  ];

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cart':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        );
      case 'fuel':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="22" x2="15" y2="22" />
            <line x1="4" y1="9" x2="14" y2="9" />
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
          </svg>
        );
      case 'basket':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 11 4-7" />
            <path d="m19 11-4-7" />
            <path d="M2 11h20" />
            <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4" />
            <path d="m9 11 1 9" />
            <path d="m15 11-1 9" />
          </svg>
        );
      case 'bolt':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        );
    }
  };

  return (
    <section className={styles.kpiGrid} aria-label="Key Consumption Metrics">
      {cardsList.map((card) => (
        <article key={card.id} className={styles.kpiCard}>
          <div className={styles.cardTopRow}>
            <div className={styles.iconCircle} aria-hidden="true">
              {renderIcon(card.iconName)}
            </div>
            <h2 className={styles.cardTitle}>{card.title}</h2>
          </div>

          <div>
            <div className={styles.cardValueRow}>
              <span className={styles.mainValue}>{formatRupees(card.amount)}</span>
              <span
                className={`${styles.changePill} ${card.direction === 'down' ? styles.positive : ''}`}
                title={`Change of ${formatPercent(card.changePct)} relative to baseline period`}
              >
                {formatPercent(card.changePct)} ↑
              </span>
            </div>
            <div className={styles.cardFooter} title={card.subcategoriesText}>
              {card.id === 'total' ? card.comparisonText : card.subcategoriesText}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
};
