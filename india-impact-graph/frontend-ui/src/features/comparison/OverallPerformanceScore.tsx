import React, { useState } from 'react';
import { OverallPerformanceMetric, PlatformId } from './types';
import { SCORING_WEIGHTS } from './comparisonCalculation';
import styles from './OverallPerformanceScore.module.css';

interface OverallPerformanceScoreProps {
  metrics: OverallPerformanceMetric[];
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
}

export const OverallPerformanceScore: React.FC<OverallPerformanceScoreProps> = ({
  metrics,
  selectedPlatform,
  onSelectPlatform,
}) => {
  const [showMethodology, setShowMethodology] = useState(false);

  // Maximum value for the chart Y-axis scale (5.0)
  const maxScore = 5.0;

  return (
    <div className={styles.scoreCard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Overall Performance Score</h2>
          <p className={styles.subtitle}>Based on 8 key parameters (0 to 5.0 scale)</p>
        </div>
        <button
          type="button"
          className={styles.infoBtn}
          onClick={() => setShowMethodology(!showMethodology)}
          title="View score methodology and weighting details"
          aria-expanded={showMethodology}
        >
          {showMethodology ? 'Hide weights' : 'Scoring weights ⓘ'}
        </button>
      </div>

      {/* Methodology Drawer / Details */}
      {showMethodology && (
        <div className={styles.methodologyBox}>
          <div className={styles.methodologyTitle}>
            Transparent Weighted Scoring Model (Scale 1–5):
          </div>
          <p className={styles.methodologyText}>
            Scores represent reproducible weighted composite ratings across 8 capability dimensions:
            Household Personal Impact (1.5x), Economic Analysis (1.2x), SIP Planning (1.2x),
            Sector Insights (1.1x), Event Coverage (1.0x), Future Scenarios (1.0x), Personalization
            (1.0x), and Actionable Guidance (1.0x).
          </p>
          <div className={styles.weightsGrid}>
            {Object.entries(SCORING_WEIGHTS).map(([key, weight]) => (
              <span key={key} className={styles.weightTag}>
                {key.replace('_', ' ')}: <strong>{weight}x</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bar Chart Container */}
      <div className={styles.chartWrapper}>
        <div className={styles.yAxisGuide}>
          {[5, 4, 3, 2, 1, 0].map((val) => (
            <div key={val} className={styles.yTick}>
              <span className={styles.yTickLabel}>{val}</span>
              <div className={styles.yGridLine} />
            </div>
          ))}
        </div>

        <div className={styles.barsContainer}>
          {metrics.map((metric) => {
            const heightPercent = (metric.score / maxScore) * 100;
            const isSelected = selectedPlatform === metric.platformId;
            const isBharatImpact = metric.platformId === 'bharat_impact';

            return (
              <div
                key={metric.platformId}
                className={`
                  ${styles.barColumn}
                  ${isSelected ? styles.selectedColumn : ''}
                  ${isBharatImpact ? styles.bharatColumn : ''}
                `}
                onClick={() => onSelectPlatform(metric.platformId)}
                role="button"
                tabIndex={0}
                aria-label={`${metric.name}: ${metric.score.toFixed(1)} out of 5`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPlatform(metric.platformId);
                  }
                }}
              >
                {/* Score value tag floating above the bar */}
                <div className={styles.scoreLabelRow}>
                  {isBharatImpact && (
                    <span className={styles.crownIcon} title="Highest Composite Score">
                      👑
                    </span>
                  )}
                  <span className={styles.scoreNumber}>{metric.score.toFixed(1)}</span>
                </div>

                {/* Vertical Bar Track & Fill */}
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      height: `${heightPercent}%`,
                      backgroundColor: metric.color,
                    }}
                  />
                </div>

                {/* X-axis Platform Label */}
                <div className={styles.xLabel}>
                  {metric.name.replace('Traditional ', '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leader Callout Box */}
      <div className={styles.calloutCard}>
        <div className={styles.calloutIcon}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>
        <div className={styles.calloutText}>
          <strong>BharatImpact</strong> provides the most comprehensive and actionable insights
          across all parameters.
        </div>
      </div>
    </div>
  );
};
