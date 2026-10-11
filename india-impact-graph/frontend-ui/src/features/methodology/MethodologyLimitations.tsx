import React from 'react';
import { METHODOLOGY_LIMITATIONS } from './methodologyData';
import styles from './MethodologyLimitations.module.css';

export const MethodologyLimitations: React.FC = () => {
  return (
    <div className={styles.container} id="methodology-limitations">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconBadge}>⚠️</div>
          <div>
            <h2 className={styles.title}>System Limitations & Analytical Assumptions</h2>
            <p className={styles.subtitle}>
              Transparent disclosure of data boundaries, survey latencies, and modeling assumptions.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {METHODOLOGY_LIMITATIONS.map((lim) => (
          <div key={lim.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{lim.title}</h3>
              <span className={styles.featureTag}>{lim.affectedFeature}</span>
            </div>

            <div className={styles.sectionBlock}>
              <div className={styles.sectionLabel}>What Is Unavailable</div>
              <p className={`${styles.sectionText} ${styles.unavailableText}`}>
                {lim.whatIsUnavailable}
              </p>
            </div>

            <div className={styles.workaroundBox}>
              <div className={styles.workaroundLabel}>Current Engineering Workaround</div>
              <p className={styles.workaroundText}>{lim.workaroundInPlace}</p>
            </div>

            <div className={styles.futureBox}>
              <strong>Future Upgrade Requirement:</strong> {lim.futureCapabilityNeeded}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
