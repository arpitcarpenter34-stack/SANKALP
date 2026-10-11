import React, { useState } from 'react';
import styles from './NewsSentimentCard.module.css';
import { SentimentBreakdown } from './types';

interface NewsSentimentCardProps {
  sentiment: SentimentBreakdown;
}

export const NewsSentimentCard: React.FC<NewsSentimentCardProps> = ({ sentiment }) => {
  const [showMethodology, setShowMethodology] = useState(false);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const posLength = (sentiment.positive_pct / 100) * circumference;
  const neuLength = (sentiment.neutral_pct / 100) * circumference;
  const negLength = (sentiment.negative_pct / 100) * circumference;

  const posOffset = 0;
  const neuOffset = -posLength;
  const negOffset = -(posLength + neuLength);

  return (
    <div className={styles.cardContainer} data-testid="news-sentiment-card">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h3 className={styles.cardTitle}>News Sentiment</h3>
          <p className={styles.cardSubtitle}>
            Analysis of {sentiment.total_analyzed} articles
          </p>
        </div>
        <button
          type="button"
          className={styles.infoButton}
          onClick={() => setShowMethodology(!showMethodology)}
          title="Methodology information"
          aria-expanded={showMethodology}
          aria-label="Toggle sentiment methodology information"
        >
          ℹ
        </button>
      </div>

      <div className={styles.chartContainer}>
        <div className={styles.svgWrapper}>
          <svg className={styles.donutSvg} viewBox="0 0 160 160" aria-hidden="true">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="18"
            />
            {/* Positive ring segment */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="18"
              strokeDasharray={`${posLength} ${circumference}`}
              strokeDashoffset={posOffset}
              strokeLinecap="round"
            />
            {/* Neutral ring segment */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="18"
              strokeDasharray={`${neuLength} ${circumference}`}
              strokeDashoffset={neuOffset}
            />
            {/* Negative ring segment */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="18"
              strokeDasharray={`${negLength} ${circumference}`}
              strokeDashoffset={negOffset}
            />
          </svg>

          <div className={styles.centerLabel}>
            <div className={styles.totalNumber}>{sentiment.total_analyzed}</div>
            <div className={styles.totalText}>Total News</div>
          </div>
        </div>
      </div>

      <div className={styles.legendGrid}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotPositive}`} aria-hidden="true" />
          <span className={styles.legendLabel}>Positive</span>
          <span className={styles.legendValue}>{sentiment.positive_pct.toFixed(1)}%</span>
        </div>

        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotNeutral}`} aria-hidden="true" />
          <span className={styles.legendLabel}>Neutral</span>
          <span className={styles.legendValue}>{sentiment.neutral_pct.toFixed(1)}%</span>
        </div>

        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotNegative}`} aria-hidden="true" />
          <span className={styles.legendLabel}>Negative</span>
          <span className={styles.legendValue}>{sentiment.negative_pct.toFixed(1)}%</span>
        </div>
      </div>

      {showMethodology && (
        <div className={styles.methodologyNote} role="note">
          <strong>Methodology:</strong> {sentiment.methodology_note}
        </div>
      )}
    </div>
  );
};
