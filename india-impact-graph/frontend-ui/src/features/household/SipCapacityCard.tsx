import React, { useState } from 'react';
import { SipProjectionData } from './types';
import styles from './SipCapacityCard.module.css';

interface SipCapacityCardProps {
  sipProjection: SipProjectionData;
  onUpdateSipAmount: (sipAmount: number) => void;
  onNavigateToSipForecasts?: () => void;
}

export const SipCapacityCard: React.FC<SipCapacityCardProps> = ({
  sipProjection,
  onUpdateSipAmount,
  onNavigateToSipForecasts,
}) => {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customVal, setCustomVal] = useState(sipProjection.currentSip.toString());

  const handleSelectPreset = (amount: number) => {
    setIsCustomOpen(false);
    onUpdateSipAmount(amount);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(customVal, 10);
    if (!isNaN(num) && num > 0) {
      onUpdateSipAmount(num);
      setIsCustomOpen(false);
    }
  };

  const currentSip = sipProjection.currentSip;

  return (
    <div className={styles.card} id="sip-capacity-panel">
      <div className={styles.header}>
        <div className={styles.titleCol}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>Impact on SIP & Investment Capacity</h3>
            {onNavigateToSipForecasts && (
              <button
                type="button"
                className={styles.sipForecastsLink}
                onClick={onNavigateToSipForecasts}
                title="Open detailed SIP & Forecasts projections"
              >
                Deep Forecasts →
              </button>
            )}
          </div>
          <p className={styles.subtitle}>How changes in expenses affect your ability to invest</p>
        </div>

        {/* SIP Amount Controls */}
        <div className={styles.controlsCol}>
          <span className={styles.controlLabel}>SIP Amount</span>
          <div className={styles.btnGroup} role="group" aria-label="SIP Contribution Presets">
            <button
              type="button"
              className={`${styles.sipBtn} ${!isCustomOpen && currentSip === 2000 ? styles.activeSipBtn : ''}`}
              onClick={() => handleSelectPreset(2000)}
            >
              ₹2K
            </button>
            <button
              type="button"
              className={`${styles.sipBtn} ${!isCustomOpen && currentSip === 5000 ? styles.activeSipBtn : ''}`}
              onClick={() => handleSelectPreset(5000)}
            >
              ₹5K
            </button>
            <button
              type="button"
              className={`${styles.sipBtn} ${!isCustomOpen && currentSip === 10000 ? styles.activeSipBtn : ''}`}
              onClick={() => handleSelectPreset(10000)}
            >
              ₹10K
            </button>
            <button
              type="button"
              className={`${styles.sipBtn} ${isCustomOpen || (currentSip !== 2000 && currentSip !== 5000 && currentSip !== 10000) ? styles.activeSipBtn : ''}`}
              onClick={() => setIsCustomOpen((v) => !v)}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Custom input drawer if active */}
      {isCustomOpen && (
        <form onSubmit={handleCustomSubmit} className={styles.customForm}>
          <label htmlFor="custom-sip-input" className={styles.customLabel}>
            Enter Custom Monthly SIP (₹):
          </label>
          <input
            id="custom-sip-input"
            type="number"
            step="500"
            min="500"
            max="200000"
            value={customVal}
            onChange={(e) => setCustomVal(e.target.value)}
            className={styles.customInput}
            autoFocus
          />
          <button type="submit" className={styles.applyBtn}>
            Set
          </button>
        </form>
      )}

      {/* 4 Metric Subcards */}
      <div className={styles.metricsGrid}>
        {/* 1. Current SIP */}
        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ background: '#ecfdf5', color: '#059669' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>Current SIP</span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>₹{currentSip.toLocaleString('en-IN')}</span>
              <span className={styles.metricUnit}>/mo</span>
            </div>
          </div>
        </div>

        {/* 2. After Impact */}
        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ background: '#fef2f2', color: '#ef4444' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <polyline points="18 15 18 6 9 6" transform="rotate(90 12 12)" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel}>After Impact Capacity</span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>₹{sipProjection.afterImpactSip.toLocaleString('en-IN')}</span>
              <span className={styles.metricUnit}>/mo</span>
              <span className={styles.changeBadge}>{sipProjection.sipChangePct}%</span>
            </div>
          </div>
        </div>

        {/* 3. Projected Corpus */}
        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ background: '#eff6ff', color: '#2563eb' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span
              className={styles.metricLabel}
              title={`Compounded monthly @ 12% p.a. Total invested: ₹${(sipProjection.totalInvestedBaseline / 100000).toFixed(1)}L, Estimated Gains: ₹${((sipProjection.projectedCorpusBaseline - sipProjection.totalInvestedBaseline) / 100000).toFixed(1)}L`}
            >
              Projected Corpus ({sipProjection.horizonYears} yrs)
            </span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>{sipProjection.formattedBaselineCorpus}</span>
            </div>
            <span className={styles.lossLabel}>
              -₹{sipProjection.corpusChangeLakhs} L vs. baseline
            </span>
          </div>
        </div>

        {/* 4. Recommended Range */}
        <div className={styles.metricCard}>
          <div className={styles.metricIconCircle} style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className={styles.metricInfo}>
            <span className={styles.metricLabel} title="Guidance based on revised disposable savings">
              Recommended Range ⓘ
            </span>
            <div className={styles.valueRow}>
              <span className={styles.metricValue}>
                ₹{sipProjection.recommendedRangeMin.toLocaleString('en-IN')} – ₹{sipProjection.recommendedRangeMax.toLocaleString('en-IN')}
              </span>
            </div>
            <span className={styles.subtext}>Based on current scenario</span>
          </div>
        </div>
      </div>
    </div>
  );
};
