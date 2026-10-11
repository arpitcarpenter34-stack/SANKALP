import React from 'react';
import { formatIndianCurrency, formatRupees } from './forecastCalculation';
import styles from './SipFinancialKpis.module.css';

export interface SipFinancialKpisProps {
  currentSip: number;
  estimatedCapacity: number;
  capacityChangePct: number;
  projectedCorpus: number;
  totalInvested: number;
  estimatedReturns: number;
  durationYears: number;
  annualReturnPct: number;
  corpusDeltaLakhs: number;
  scenarioName?: string;
  onEditSip?: () => void;
}

export const SipFinancialKpis: React.FC<SipFinancialKpisProps> = ({
  currentSip,
  estimatedCapacity,
  capacityChangePct,
  projectedCorpus,
  totalInvested,
  estimatedReturns,
  durationYears,
  annualReturnPct,
  corpusDeltaLakhs,
  scenarioName,
  onEditSip,
}) => {
  return (
    <section className={styles.kpiGrid} aria-label="SIP Financial Key Performance Indicators">
      {/* 1. Monthly SIP (Current) */}
      <div className={styles.kpiCard}>
        <div className={styles.iconContainer} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <div className={styles.contentCol}>
          <div className={styles.titleRow}>
            <span className={styles.cardTitle}>Monthly SIP (Current)</span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.mainValue}>{formatRupees(currentSip)}</span>
            {onEditSip && (
              <button
                type="button"
                className={styles.editIconBtn}
                onClick={onEditSip}
                title="Edit active monthly SIP contribution"
                aria-label="Edit SIP contribution"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
          </div>
          <span className={styles.subtitle}>Your chosen baseline investment</span>
        </div>
      </div>

      {/* 2. Estimated SIP Capacity */}
      <div className={styles.kpiCard}>
        <div className={styles.iconContainer} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        </div>
        <div className={styles.contentCol}>
          <div className={styles.titleRow}>
            <span className={styles.cardTitle}>{scenarioName ? `${scenarioName.split(' ')[0]} Capacity` : 'Estimated SIP Capacity'}</span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.mainValue}>{formatRupees(estimatedCapacity)}</span>
            {capacityChangePct < 0 ? (
              <span className={styles.downArrow} aria-hidden="true">↓</span>
            ) : capacityChangePct > 0 ? (
              <span className={styles.positiveDelta} aria-hidden="true">↑</span>
            ) : null}
          </div>
          <span className={styles.subtitle}>
            <span className={capacityChangePct < 0 ? styles.negativeText : styles.positiveDelta}>
              {capacityChangePct >= 0 ? `+${capacityChangePct}%` : `${capacityChangePct}%`} vs current
            </span>
          </span>
        </div>
      </div>

      {/* 3. Projected Corpus */}
      <div className={styles.kpiCard}>
        <div className={styles.iconContainer} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div className={styles.contentCol}>
          <div className={styles.titleRow}>
            <span className={styles.cardTitle}>Projected Corpus ({durationYears} yrs)</span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.mainValue}>{formatIndianCurrency(projectedCorpus)}</span>
          </div>
          <span className={styles.subtitle}>
            {corpusDeltaLakhs > 0 ? (
              <span className={styles.baselineDelta}>-₹{corpusDeltaLakhs} L vs baseline</span>
            ) : corpusDeltaLakhs < 0 ? (
              <span className={styles.positiveDelta}>+₹{Math.abs(corpusDeltaLakhs)} L vs baseline</span>
            ) : (
              `Compounded @ ${annualReturnPct}%`
            )}
          </span>
        </div>
      </div>

      {/* 4. Total Investment */}
      <div className={styles.kpiCard}>
        <div className={styles.iconContainer} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div className={styles.contentCol}>
          <div className={styles.titleRow}>
            <span className={styles.cardTitle}>Total Investment</span>
            <span className={styles.tooltipBtn} title="Cumulative principal invested over the chosen investment horizon" aria-label="Investment details">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.mainValue}>{formatIndianCurrency(totalInvested)}</span>
          </div>
          <span className={styles.subtitle}>Over {durationYears} years</span>
        </div>
      </div>

      {/* 5. Estimated Returns */}
      <div className={styles.kpiCard}>
        <div className={styles.iconContainer} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div className={styles.contentCol}>
          <div className={styles.titleRow}>
            <span className={styles.cardTitle}>Estimated Returns</span>
          </div>
          <div className={styles.valueRow}>
            <span className={styles.mainValue}>{formatIndianCurrency(estimatedReturns)}</span>
            <span className={styles.returnBadge}>{annualReturnPct}% p.a.</span>
          </div>
          <span className={styles.subtitle}>Wealth gain from compounding</span>
        </div>
      </div>
    </section>
  );
};
