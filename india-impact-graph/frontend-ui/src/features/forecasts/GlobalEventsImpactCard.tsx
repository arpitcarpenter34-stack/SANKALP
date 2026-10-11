import React, { useState } from 'react';
import { GlobalEventDriver } from './types';
import { formatRupees } from './forecastCalculation';
import styles from './GlobalEventsImpactCard.module.css';

export interface GlobalEventsImpactCardProps {
  currentSip: number;
  estimatedCapacity: number;
  drivers: GlobalEventDriver[];
  onNavigateToCategory?: (categoryKey: string, sectorId?: string) => void;
}

export const GlobalEventsImpactCard: React.FC<GlobalEventsImpactCardProps> = ({
  currentSip,
  estimatedCapacity,
  drivers,
  onNavigateToCategory,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const maxBarAmount = Math.max(currentSip, 5000);

  return (
    <article className={styles.cardContainer} aria-label="Impact of Global Events on SIP Capacity">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Impact of Global Events on SIP Capacity</h2>
          <span
            className={styles.tooltipBtn}
            title="Demonstrates how specific commodity & supply chain shocks transmit to household expenditure categories, compressing available monthly surplus."
            aria-label="Waterfall explanation"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        </div>
      </div>

      <div className={styles.waterfallList}>
        {/* 1. Baseline Current SIP Capacity */}
        <div className={styles.waterfallRow}>
          <span className={styles.rowLabel}>Current SIP Capacity</span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles.barFillBaseline}`}
              style={{ width: `${Math.min(100, (currentSip / maxBarAmount) * 100)}%` }}
            />
          </div>
          <span className={`${styles.rowValue} ${styles.valBaseline}`}>{formatRupees(currentSip)}</span>
        </div>

        {/* 2. Negative Drivers */}
        {drivers.map((driver) => {
          const isExpanded = expandedId === driver.id;
          const barWidth = Math.min(100, (Math.abs(driver.impactAmount) / maxBarAmount) * 100);

          return (
            <React.Fragment key={driver.id}>
              <div
                className={styles.waterfallRow}
                onClick={() => setExpandedId(isExpanded ? null : driver.id)}
                style={{ cursor: 'pointer' }}
                title="Click to view transmission pathway details"
              >
                <span className={styles.rowLabel}>{driver.name}</span>
                <div className={styles.barTrack}>
                  <div
                    className={`${styles.barFill} ${styles.barFillDriver}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className={`${styles.rowValue} ${styles.valDriver}`}>
                  {driver.impactAmount < 0 ? `-₹${Math.abs(driver.impactAmount).toLocaleString('en-IN')}` : `₹${driver.impactAmount.toLocaleString('en-IN')}`}
                </span>
              </div>

              {isExpanded && (
                <div className={styles.driverDetails}>
                  {driver.description}
                  {onNavigateToCategory && (
                    <span
                      className={styles.navHint}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToCategory(driver.categoryKey, driver.sectorId);
                      }}
                    >
                      Inspect Sector / Household Impact →
                    </span>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* 3. Estimated SIP Capacity Result (Arithmetic Waterfall Balance) */}
        <div className={styles.waterfallRow}>
          <span className={styles.rowLabel}>Estimated SIP Capacity</span>
          <div className={styles.barTrack}>
            <div
              className={`${styles.barFill} ${styles.barFillEstimated}`}
              style={{ width: `${Math.min(100, (estimatedCapacity / maxBarAmount) * 100)}%` }}
            />
          </div>
          <span className={`${styles.rowValue} ${styles.valEstimated}`}>
            {formatRupees(estimatedCapacity)}
          </span>
        </div>

        <div className={styles.rangeExplanation}>
          Prudent Buffer: <strong>{formatRupees(Math.round(estimatedCapacity * 0.88))} – {formatRupees(estimatedCapacity)}</strong>. Lower bound preserves a 20% liquid savings margin; upper bound reflects full modeled investment capacity.
        </div>
      </div>
    </article>
  );
};
