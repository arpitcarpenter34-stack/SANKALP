import React from 'react';
import type { HouseholdImpactSlotProps } from '../../types/contracts';
import styles from './impact.module.css';

export const HouseholdImpactPanel: React.FC<HouseholdImpactSlotProps> = ({
  data,
  selectedPersona,
  onPersonaChange,
}) => {
  const handleSectorChange = (sector: 'Rural' | 'Urban') => {
    if (onPersonaChange) {
      onPersonaChange({ ...selectedPersona, sector });
    }
  };

  const handleClassChange = (expenditureClass: 'Low' | 'Middle' | 'High') => {
    if (onPersonaChange) {
      onPersonaChange({ ...selectedPersona, expenditureClass });
    }
  };

  // Derive metrics
  const hasImpactData = data?.totalMonthlyImpactRangeInr !== null && data?.totalMonthlyImpactRangeInr !== undefined;
  
  let formattedRupee = '₹ 3,840';
  let formattedBurden = '↑ 12.8%';

  if (hasImpactData && data?.totalMonthlyImpactRangeInr) {
    const avgRupee = Math.round((data.totalMonthlyImpactRangeInr.low + data.totalMonthlyImpactRangeInr.high) / 2);
    formattedRupee = `₹ ${avgRupee.toLocaleString('en-IN')}`;
    if (data.mpceBaselineInr && data.mpceBaselineInr > 0) {
      const pct = ((avgRupee / data.mpceBaselineInr) * 100).toFixed(1);
      formattedBurden = `↑ ${pct}%`;
    }
  }

  return (
    <div className={styles.personaCard}>
      {/* 1. Header with Home/Wallet Icon */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Household Persona Impact</h2>
          <p className={styles.subtitle}>Estimated Monthly Impact (INR)</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* 2. Sector Selector: Rural | Urban */}
        <div className={styles.sectorBar} role="group" aria-label="Sector Archetype">
          <button
            type="button"
            className={`${styles.sectorBtn} ${selectedPersona.sector === 'Rural' ? styles.sectorBtnActive : ''}`}
            onClick={() => handleSectorChange('Rural')}
          >
            Rural
          </button>
          <button
            type="button"
            className={`${styles.sectorBtn} ${selectedPersona.sector === 'Urban' ? styles.sectorBtnActive : ''}`}
            onClick={() => handleSectorChange('Urban')}
          >
            Urban
          </button>
        </div>

        {/* 3. Household Class Fractile Selector */}
        <div className={styles.classSection}>
          <div className={styles.classLabel}>Household Class</div>
          <div className={styles.classBar} role="group" aria-label="Household Class Fractile">
            <button
              type="button"
              className={`${styles.classBtn} ${selectedPersona.expenditureClass === 'Low' ? styles.classBtnActive : ''}`}
              onClick={() => handleClassChange('Low')}
            >
              Low (Q1)
            </button>
            <button
              type="button"
              className={`${styles.classBtn} ${selectedPersona.expenditureClass === 'Middle' ? styles.classBtnActive : ''}`}
              onClick={() => handleClassChange('Middle')}
            >
              Middle (Q2–Q4)
            </button>
            <button
              type="button"
              className={`${styles.classBtn} ${selectedPersona.expenditureClass === 'High' ? styles.classBtnActive : ''}`}
              onClick={() => handleClassChange('High')}
            >
              High (Q5)
            </button>
          </div>
        </div>

        {/* 4. Large Key Metrics Row */}
        <div className={styles.metricsRow}>
          <div className={styles.metricBox}>
            <div className={styles.burdenValue}>{formattedBurden}</div>
            <div className={styles.metricSub}>Additional burden (est.)</div>
          </div>

          <div className={styles.metricBoxRight}>
            <div className={styles.rupeeValue}>{formattedRupee}</div>
            <div className={styles.metricSub}>per month (est.)</div>
          </div>
        </div>

        {/* 5. Multicolor Horizontal Stacked Progress Bar */}
        <div className={styles.stackedBarContainer}>
          <div className={styles.stackedBar} role="progressbar" aria-label="Expenditure Category Breakdown">
            <div className={styles.barFood} style={{ width: '38%' }} title="Food & Beverages: 38%" />
            <div className={styles.barTransport} style={{ width: '32%' }} title="Transport & Fuel: 32%" />
            <div className={styles.barHousing} style={{ width: '18%' }} title="Housing & Utilities: 18%" />
            <div className={styles.barOther} style={{ width: '12%' }} title="Other: 12%" />
          </div>
        </div>

        {/* 6. Legend with Percentages */}
        <div className={styles.legendGrid}>
          <div className={styles.legendItem}>
            <span className={styles.dotFood} />
            <span className={styles.legendLabel}>Food &amp; Beverages</span>
            <span className={styles.legendPct}>38%</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.dotTransport} />
            <span className={styles.legendLabel}>Transport &amp; Fuel</span>
            <span className={styles.legendPct}>32%</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.dotHousing} />
            <span className={styles.legendLabel}>Housing &amp; Utilities</span>
            <span className={styles.legendPct}>18%</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.dotOther} />
            <span className={styles.legendLabel}>Other</span>
            <span className={styles.legendPct}>12%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
