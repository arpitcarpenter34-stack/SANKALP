import React, { useState } from 'react';
import { VALIDATION_METRICS } from './methodologyData';
import styles from './ModelAccuracyValidation.module.css';

export const ModelAccuracyValidation: React.FC = () => {
  const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);

  const selectedMetric = VALIDATION_METRICS.find((m) => m.id === selectedMetricId);

  return (
    <div className={styles.container} id="methodology-validation-accuracy">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Model Accuracy & Validation</h2>
          <span
            className={styles.infoIcon}
            title="Rigorous empirical backtesting and software test coverage validation"
          >
            ⓘ
          </span>
        </div>
      </div>

      <div className={styles.metricsRow}>
        {VALIDATION_METRICS.map((metric) => {
          const isSelected = metric.id === selectedMetricId;
          return (
            <div
              key={metric.id}
              className={`${styles.metricCard} ${isSelected ? styles.metricCardSelected : ''}`}
              onClick={() => setSelectedMetricId(isSelected ? null : metric.id)}
              title="Click to view evaluation dataset, method, and sample size"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedMetricId(isSelected ? null : metric.id);
                }
              }}
            >
              <div className={styles.metricValue}>{metric.scoreOrPct}</div>
              <div className={styles.metricLabel}>{metric.title}</div>
              <span className={styles.metricTag}>
                {metric.benchmarkStatus === 'software_test_suite'
                  ? 'Test Suite'
                  : metric.benchmarkStatus === 'empirical_backtest'
                    ? 'Empirical Backtest'
                    : 'Survey Reconciliation'}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.checklist}>
        <div className={styles.checkItem}>
          <span className={styles.checkIcon}>✔</span>
          <span>
            <strong>Backtested with historical events:</strong> Directional concordance evaluated against 2008 oil spike, 2020 COVID shock, and 2022 crude rally.
          </span>
        </div>
        <div className={styles.checkItem}>
          <span className={styles.checkIcon}>✔</span>
          <span>
            <strong>Cross-validated with government data:</strong> Reconciled with MoSPI CPI 2024=100 item weights and HCES 2023-24 Statement 7 per-capita expenditures.
          </span>
        </div>
        <div className={styles.checkItem}>
          <span className={styles.checkIcon}>✔</span>
          <span>
            <strong>100% Automated Test Coverage:</strong> Full Vitest and Pytest suites verifying mathematical determinism and API schema contracts.
          </span>
        </div>
      </div>

      {selectedMetric && (
        <div className={styles.drawer}>
          <h4 className={styles.drawerTitle}>
            Evaluation Details: {selectedMetric.title} ({selectedMetric.scoreOrPct})
          </h4>
          <p style={{ margin: '0 0 6px 0', fontSize: '0.74rem' }}>{selectedMetric.description}</p>
          <div className={styles.drawerMeta}>
            <div>
              <strong>Evaluation Method:</strong> {selectedMetric.evaluationMethod}
            </div>
            <div>
              <strong>Sample Size:</strong> {selectedMetric.sampleSize}
            </div>
            <div>
              <strong>Evaluation Period:</strong> {selectedMetric.evaluationPeriod}
            </div>
            <div>
              <strong>Metric Class:</strong> {selectedMetric.metricType}
            </div>
          </div>
          <div className={styles.drawerLimitations}>
            ⚠️ <strong>Methodological Caveat:</strong> {selectedMetric.limitations}
          </div>
        </div>
      )}
    </div>
  );
};
