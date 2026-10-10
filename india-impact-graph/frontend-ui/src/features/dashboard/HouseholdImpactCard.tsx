import React from 'react';
import { PersonaImpactSummary } from '../../types';
import styles from './HouseholdImpactCard.module.css';

export interface HouseholdImpactCardProps {
  data: PersonaImpactSummary | null;
  onEdit?: () => void;
  onViewDetails?: () => void;
}

const SPENDING_CATEGORIES = [
  { id: 'food', label: 'Food & Groceries', pct: 45, color: '#10B981' },
  { id: 'transport', label: 'Transport (Fuel)', pct: 15, color: '#0D9488' },
  { id: 'housing', label: 'Housing & Utilities', pct: 20, color: '#0284C7' },
  { id: 'healthcare', label: 'Healthcare', pct: 8, color: '#2DD4BF' },
  { id: 'education', label: 'Education', pct: 7, color: '#60A5FA' },
  { id: 'others', label: 'Others', pct: 5, color: '#94A3B8' },
];

export const HouseholdImpactCard: React.FC<HouseholdImpactCardProps> = ({
  data,
  onEdit,
  onViewDetails,
}) => {
  const low = data?.totalMonthlyImpactRangeInr?.low;
  const high = data?.totalMonthlyImpactRangeInr?.high;
  const hasImpact = typeof low === 'number' && typeof high === 'number';
  const midVal = hasImpact ? Math.round((low + high) / 2) : 2450;

  const additionalExpenses = `+₹${midVal.toLocaleString('en-IN')}`;

  const percentage = hasImpact && data?.mpceBaselineInr
    ? `(+${((midVal / data.mpceBaselineInr) * 100).toFixed(1)}%)`
    : '(+4.3%)';

  return (
    <div className={styles.card}>
      {/* 1. Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Household Impact</h3>
        <button
          type="button"
          className={styles.editBtn}
          onClick={onEdit}
          aria-label="Edit household baseline"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span>Edit</span>
        </button>
      </div>

      {/* 2. Top Stats: Monthly income & Additional expenses */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.iconCircleMint}>
            <span className={styles.rupeeIcon}>₹</span>
          </div>
          <div className={styles.statCol}>
            <span className={styles.statLabel}>Monthly income</span>
            <span className={styles.statVal}>₹60,000</span>
          </div>
        </div>

        <div className={styles.statBox}>
          <div className={styles.iconCircleRose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </div>
          <div className={styles.statCol}>
            <span className={styles.statLabel}>Additional expenses (scenario)</span>
            <div className={styles.expenseValGroup}>
              <span className={styles.expenseVal}>{additionalExpenses}</span>
              <span className={styles.expensePct}>{percentage}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly spending breakdown */}
      <div className={styles.breakdownSection}>
        <div className={styles.breakdownHeader}>
          <span className={styles.breakdownTitle}>Monthly spending breakdown</span>
          <button
            type="button"
            className={styles.viewDetailsBtn}
            onClick={onViewDetails}
          >
            View details
          </button>
        </div>

        {/* Multi-segment progress bar */}
        <div className={styles.segmentedBar}>
          {SPENDING_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={styles.segment}
              style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
              title={`${cat.label}: ${cat.pct}%`}
            />
          ))}
        </div>

        {/* Legend */}
        <div className={styles.legendGrid}>
          {SPENDING_CATEGORIES.map((cat) => (
            <div key={cat.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: cat.color }} />
              <span className={styles.legendLabel}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
