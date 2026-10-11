import React from 'react';
import styles from './MethodologyDisclaimer.module.css';

export const MethodologyDisclaimer: React.FC = () => {
  return (
    <footer className={styles.disclaimerRow} role="contentinfo">
      <div className={styles.leftText}>
        <strong>Note:</strong> Projections are illustrative, based on assumed rates of return and simulated expense shocks.
        Actual mutual fund and equity investment returns are subject to market risks and are not guaranteed. This tool
        demonstrates macroeconomic transmission from global trade disruptions to household investment headroom.
      </div>
      <div className={styles.poweredBy}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        Powered by live economic data &amp; AI analysis
      </div>
    </footer>
  );
};
