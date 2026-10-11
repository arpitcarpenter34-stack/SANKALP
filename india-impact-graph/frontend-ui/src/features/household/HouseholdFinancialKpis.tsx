import React from 'react';
import { HouseholdFinancialSummary } from './types';
import styles from './HouseholdFinancialKpis.module.css';

export interface HouseholdFinancialKpisProps {
  financials: HouseholdFinancialSummary;
}

export const HouseholdFinancialKpis: React.FC<HouseholdFinancialKpisProps> = ({
  financials,
}) => {
  return (
    <div className={styles.kpiRow} role="region" aria-label="Household Financial Summary">
      {/* 1. Monthly Income */}
      <div className={styles.kpiCard}>
        <div className={styles.cardTop}>
          <div className={styles.iconCircleMint}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M7 15h0M2 10h20" />
            </svg>
          </div>
          <span className={styles.kpiTitle}>Monthly Income</span>
        </div>
        <div className={styles.kpiValueRow}>
          <span className={styles.kpiValue}>
            ₹{financials.monthlyIncome.toLocaleString('en-IN')}
          </span>
        </div>
        <div className={styles.kpiFooter}>
          <span className={styles.subtextNeutral}>Base income</span>
        </div>
      </div>

      {/* 2. Total Monthly Expenses */}
      <div className={styles.kpiCard}>
        <div className={styles.cardTop}>
          <div className={styles.iconCircleCart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <div className={styles.titleWithInfo}>
            <span className={styles.kpiTitle}>Total Monthly Expenses</span>
            <span className={styles.infoIcon} title="Includes baseline consumption plus scenario price impacts">ⓘ</span>
          </div>
        </div>
        <div className={styles.kpiValueRow}>
          <span className={styles.kpiValue}>
            ₹{financials.totalMonthlyExpenses.toLocaleString('en-IN')}
          </span>
          <span className={styles.badgeNegative}>
            +{financials.expensesChangePct}% vs. baseline ↑
          </span>
        </div>
        <div className={styles.kpiFooter}>
          <span className={styles.subtext}>
            Baseline: ₹{financials.baselineExpenses.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* 3. Monthly Savings */}
      <div
        className={styles.kpiCard}
        title={`Gross Savings before SIP: ₹${financials.grossSavings.toLocaleString('en-IN')}. Net disposable liquid surplus after current SIP: ₹${financials.remainingSurplus.toLocaleString('en-IN')}.`}
      >
        <div className={styles.cardTop}>
          <div className={styles.iconCircleMint}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              <path d="M12 9v6M9 12h6" />
            </svg>
          </div>
          <span className={styles.kpiTitle}>Monthly Savings</span>
        </div>
        <div className={styles.kpiValueRow}>
          <span className={styles.kpiValue}>
            ₹{financials.remainingSurplus.toLocaleString('en-IN')}
          </span>
          <span className={styles.badgeNegative}>
            {financials.savingsChangePct}% vs. baseline ↓
          </span>
        </div>
        <div className={styles.kpiFooter}>
          <span className={styles.subtext}>
            Net unallocated surplus (Gross: ₹{financials.grossSavings.toLocaleString('en-IN')})
          </span>
        </div>
      </div>

      {/* 4. SIP Capacity */}
      <div className={styles.kpiCard}>
        <div className={styles.cardTop}>
          <div className={styles.iconCircleMint}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <span className={styles.kpiTitle}>SIP Capacity</span>
        </div>
        <div className={styles.kpiValueRow}>
          <span className={styles.kpiValue}>
            ₹{financials.sipCapacity.toLocaleString('en-IN')} <small className={styles.perMo}>/mo</small>
          </span>
          <span className={styles.badgeNegative}>
            {financials.sipChangePct}% vs. baseline ↓
          </span>
        </div>
        <div className={styles.kpiFooter}>
          <span className={styles.subtext}>
            Recommended investment target
          </span>
        </div>
      </div>

      {/* 5. Expense Impact (Current Event) */}
      <div className={styles.kpiCard}>
        <div className={styles.cardTop}>
          <div className={styles.iconCircleGreen}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <span className={styles.kpiTitle}>Expense Impact (Current Event)</span>
        </div>
        <div className={styles.kpiValueRow}>
          <span className={`${styles.kpiValue} ${styles.impactHighlight}`}>
            +₹{financials.expenseImpact.toLocaleString('en-IN')} <small className={styles.perMo}>/mo</small>
          </span>
          <span className={styles.badgeNegative}>
            +{financials.expenseImpactPct}% overall ↑
          </span>
        </div>
        <div className={styles.kpiFooter}>
          <span className={styles.subtext}>
            Pass-through inflation shock
          </span>
        </div>
      </div>
    </div>
  );
};
