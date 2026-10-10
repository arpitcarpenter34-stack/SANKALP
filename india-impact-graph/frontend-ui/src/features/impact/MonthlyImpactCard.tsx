import React from 'react';
import type { PersonaImpactSummary } from '../../types/contracts';
import styles from './impact.module.css';

export interface MonthlyImpactCardProps {
  data: PersonaImpactSummary | null;
  isAiOff?: boolean;
  isLoading?: boolean;
  isHouseholdMode?: boolean;
}

export const MonthlyImpactCard: React.FC<MonthlyImpactCardProps> = ({
  data,
  isAiOff = false,
  isLoading = false,
  isHouseholdMode = false,
}) => {
  if (isLoading) {
    return (
      <div className={styles.metricDisplayBox}>
        <div style={{ color: 'var(--muted-text)', fontSize: '14px' }}>
          Calculating deterministic rupee impact range...
        </div>
      </div>
    );
  }

  // Unavailable data state: NEVER substitute ₹0.00
  if (
    !data ||
    !data.totalMonthlyImpactRangeInr ||
    typeof data.totalMonthlyImpactRangeInr.low !== 'number'
  ) {
    return (
      <div className={styles.unavailableState} role="status">
        <div className={styles.unavailableText}>Data not available</div>
        <p className={styles.unavailableDesc}>
          A monthly rupee impact range cannot be computed because verified empirical pass-through factors or baseline expenditure weights are missing for this scenario.
        </p>
      </div>
    );
  }

  // Calculate scaled range if household mode is active and size is verified
  const scale = isHouseholdMode && data.averageHouseholdSize ? data.averageHouseholdSize : 1.0;
  const displayLow = (data.totalMonthlyImpactRangeInr.low * scale).toFixed(2);
  const displayHigh = (data.totalMonthlyImpactRangeInr.high * scale).toFixed(2);
  const unitLabel = isHouseholdMode
    ? `₹ / household / month (Family of ~${data.averageHouseholdSize})`
    : '₹ / person / month (Per Capita)';

  return (
    <div className={styles.metricDisplayBox} role="region" aria-label="Estimated Monthly Rupee Impact Range">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--muted-text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Estimated Monthly Spending Impact Range
        </span>

        {isAiOff ? (
          <div className={styles.aiOffBadge} title="LLM bypassed: Verified deterministic mathematical code only">
            ✓ Deterministic Formulas (AI-Off Verified)
          </div>
        ) : null}
      </div>

      <div className={styles.impactValueRow}>
        <span className={styles.impactRangeText}>
          +₹{displayLow} to +₹{displayHigh}
        </span>
        <span className={styles.impactUnitText}>{unitLabel}</span>
      </div>

      {/* Coverage Transparency Block */}
      {data.itemCoverage ? (
        <div className={styles.coverageBlock}>
          <strong>Coverage: </strong>
          Impact calculated for {data.itemCoverage.calculatedItemsCount} of{' '}
          {data.itemCoverage.totalCandidateItems} candidate consumption items
          {data.itemCoverage.calculatedExpenditureSharePct ? ` (covering ~${data.itemCoverage.calculatedExpenditureSharePct.toFixed(0)}% of monthly basket)` : ''}.
          {data.itemCoverage.uncalculatedItemsCount > 0 ? (
            <div style={{ marginTop: '4px', color: '#fde68a' }}>
              Uncalculated items due to unverified pass-through data:{' '}
              {data.itemCoverage.uncalculatedItemsCount} item(s).
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
