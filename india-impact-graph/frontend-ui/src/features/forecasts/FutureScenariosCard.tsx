import React from 'react';
import { ForecastScenarioId, ForecastScenarioItem } from './types';
import { formatIndianCurrency, formatRupees } from './forecastCalculation';
import styles from './FutureScenariosCard.module.css';

export interface FutureScenariosCardProps {
  scenarios: Record<ForecastScenarioId, ForecastScenarioItem>;
  selectedScenarioId: ForecastScenarioId;
  durationYears: number;
  onSelectScenario: (id: ForecastScenarioId) => void;
}

export const FutureScenariosCard: React.FC<FutureScenariosCardProps> = ({
  scenarios,
  selectedScenarioId,
  durationYears,
  onSelectScenario,
}) => {
  const scenarioOrder: ForecastScenarioId[] = ['optimistic', 'base', 'pessimistic'];

  const getBadgeClass = (badgeType: 'positive' | 'current' | 'negative') => {
    switch (badgeType) {
      case 'positive':
        return styles.badgePositive;
      case 'current':
        return styles.badgeCurrent;
      case 'negative':
        return styles.badgeNegative;
    }
  };

  const getIcon = (id: ForecastScenarioId) => {
    switch (id) {
      case 'optimistic':
        return (
          <div className={`${styles.iconCircle} ${styles.iconOptimistic}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.5-4.5 10-10 10S2 17.5 2 12A10 10 0 0 1 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        );
      case 'base':
        return (
          <div className={`${styles.iconCircle} ${styles.iconBase}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
        );
      case 'pessimistic':
        return (
          <div className={`${styles.iconCircle} ${styles.iconPessimistic}`} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          </div>
        );
    }
  };

  return (
    <article className={styles.cardContainer} aria-label={`Future Scenarios (${durationYears} Years)`}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Future Scenarios ({durationYears} Years)</h2>
      </div>

      <div className={styles.scenarioList} role="radiogroup" aria-label="Selectable economic future scenarios">
        {scenarioOrder.map((key) => {
          const item = scenarios[key];
          if (!item) return null;
          const isSelected = selectedScenarioId === key;

          return (
            <div
              key={item.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              className={`${styles.scenarioItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => onSelectScenario(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectScenario(item.id);
                }
              }}
            >
              <div className={styles.itemTop}>
                <div className={styles.leftCol}>
                  {getIcon(item.id)}
                  <div className={styles.nameBlock}>
                    <div className={styles.nameRow}>
                      <span className={styles.scenarioName}>{item.name}</span>
                      <span className={`${styles.deltaBadge} ${getBadgeClass(item.badgeType)}`}>
                        {item.deltaLabel}
                      </span>
                    </div>
                    <span className={styles.scenarioSubtitle}>{item.subtitle}</span>
                  </div>
                </div>

                <div className={styles.valueBlock}>
                  <div className={styles.corpusValue}>{formatIndianCurrency(item.projectedCorpus)}</div>
                </div>
              </div>

              <div className={styles.itemBottom}>
                <div>
                  <span className={styles.paramText}>Monthly SIP: </span>
                  <span className={styles.paramVal}>{formatRupees(item.monthlySip)}</span>
                </div>
                <div>
                  <span className={styles.paramText}>Expected Return: </span>
                  <span className={styles.paramVal}>{item.annualReturnPct}% p.a.</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
};
