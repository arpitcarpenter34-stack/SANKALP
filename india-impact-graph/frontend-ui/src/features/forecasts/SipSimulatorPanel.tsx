import React, { useState, useEffect } from 'react';
import { SipSimulatorInputs, SimulatorMode } from './types';
import { formatRupees } from './forecastCalculation';
import styles from './SipSimulatorPanel.module.css';

export interface SipSimulatorPanelProps {
  inputs: SipSimulatorInputs;
  onUpdateProjection: (updatedInputs: SipSimulatorInputs) => void;
  isRecalculating?: boolean;
  estimatedCapacity?: number;
}

export const SipSimulatorPanel: React.FC<SipSimulatorPanelProps> = ({
  inputs,
  onUpdateProjection,
  isRecalculating = false,
  estimatedCapacity,
}) => {
  const [draft, setDraft] = useState<SipSimulatorInputs>(inputs);

  // Sync draft if external inputs change
  useEffect(() => {
    setDraft(inputs);
  }, [inputs]);

  const handleModeChange = (mode: SimulatorMode) => {
    setDraft((prev) => ({ ...prev, mode }));
  };

  const handleMonthlySipChange = (val: number) => {
    const clamped = Math.max(0, Math.min(200000, isNaN(val) ? 0 : val));
    setDraft((prev) => ({ ...prev, monthlySip: clamped }));
  };

  const handleDurationChange = (val: number) => {
    const clamped = Math.max(1, Math.min(30, isNaN(val) ? 1 : val));
    setDraft((prev) => ({ ...prev, durationYears: clamped }));
  };

  const handleReturnChange = (val: number) => {
    const clamped = Math.max(1, Math.min(30, isNaN(val) ? 1 : val));
    setDraft((prev) => ({ ...prev, annualReturnPct: clamped }));
  };

  const handleExpenseImpactChange = (val: number) => {
    const clamped = Math.max(0, Math.min(50, isNaN(val) ? 0 : val));
    setDraft((prev) => ({ ...prev, expenseImpactPct: clamped }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProjection(draft);
  };

  return (
    <form className={styles.panelContainer} onSubmit={handleSubmit} aria-label="SIP Simulator Parameters">
      {/* 1. Header & Mode Toggle */}
      <div className={styles.headerRow}>
        <h2 className={styles.panelTitle}>SIP Simulator</h2>
        <div className={styles.modeToggle} role="group" aria-label="Simulator complexity mode">
          <button
            type="button"
            className={`${styles.modeBtn} ${draft.mode === 'basic' ? styles.active : ''}`}
            onClick={() => handleModeChange('basic')}
          >
            Basic
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${draft.mode === 'advanced' ? styles.active : ''}`}
            onClick={() => handleModeChange('advanced')}
          >
            Advanced
          </button>
        </div>
      </div>

      {/* 2. Monthly SIP Amount */}
      <div className={styles.controlGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="sip-monthly-input" className={styles.controlLabel}>
            Monthly SIP Amount (₹)
          </label>
          <div className={styles.numInputWrapper}>
            <input
              id="sip-monthly-input"
              type="number"
              className={styles.numInput}
              min="0"
              max="200000"
              step="500"
              value={draft.monthlySip}
              onChange={(e) => handleMonthlySipChange(Number(e.target.value))}
            />
          </div>
        </div>
        <input
          type="range"
          className={styles.slider}
          min="0"
          max="50000"
          step="500"
          value={draft.monthlySip}
          onChange={(e) => handleMonthlySipChange(Number(e.target.value))}
          aria-label="Monthly SIP Amount Slider"
        />
        <div className={styles.ticksRow} aria-hidden="true">
          <span className={styles.tick} onClick={() => handleMonthlySipChange(0)}>0</span>
          <span className={styles.tick} onClick={() => handleMonthlySipChange(5000)}>5K</span>
          <span className={styles.tick} onClick={() => handleMonthlySipChange(10000)}>10K</span>
          <span className={styles.tick} onClick={() => handleMonthlySipChange(25000)}>25K</span>
          <span className={styles.tick} onClick={() => handleMonthlySipChange(50000)}>50K</span>
        </div>

        {estimatedCapacity !== undefined && draft.monthlySip > estimatedCapacity && (
          <div className={styles.affordabilityWarning} role="alert" aria-live="polite">
            <span className={styles.warningIcon} aria-hidden="true">⚠️</span>
            <div className={styles.warningText}>
              <strong>Affordability Warning:</strong> Chosen SIP ({formatRupees(draft.monthlySip)}) exceeds estimated affordable capacity ({formatRupees(estimatedCapacity)}) by {formatRupees(draft.monthlySip - estimatedCapacity)}. Under current household inflation, maintaining this contribution may reduce your emergency liquidity buffer.
            </div>
          </div>
        )}
      </div>

      {/* 3. Investment Duration */}
      <div className={styles.controlGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="sip-duration-input" className={styles.controlLabel}>
            Investment Duration (Years)
          </label>
          <div className={styles.numInputWrapper}>
            <input
              id="sip-duration-input"
              type="number"
              className={styles.numInput}
              min="1"
              max="30"
              step="1"
              value={draft.durationYears}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
            />
          </div>
        </div>
        <input
          type="range"
          className={styles.slider}
          min="1"
          max="30"
          step="1"
          value={draft.durationYears}
          onChange={(e) => handleDurationChange(Number(e.target.value))}
          aria-label="Investment Duration Slider"
        />
        <div className={styles.ticksRow} aria-hidden="true">
          <span className={styles.tick} onClick={() => handleDurationChange(1)}>1</span>
          <span className={styles.tick} onClick={() => handleDurationChange(5)}>5</span>
          <span className={styles.tick} onClick={() => handleDurationChange(10)}>10</span>
          <span className={styles.tick} onClick={() => handleDurationChange(15)}>15</span>
          <span className={styles.tick} onClick={() => handleDurationChange(20)}>20</span>
          <span className={styles.tick} onClick={() => handleDurationChange(30)}>30</span>
        </div>
      </div>

      {/* 4. Expected Annual Return */}
      <div className={styles.controlGroup}>
        <div className={styles.labelRow}>
          <label htmlFor="sip-return-input" className={styles.controlLabel}>
            Expected Annual Return (%)
            <span
              className={styles.infoTooltip}
              title="Estimated long-term diversified equity portfolio CAGR (Historical Indian benchmark ~12-14% nominal)"
              aria-label="Information about expected returns"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
          </label>
          <div className={styles.numInputWrapper}>
            <input
              id="sip-return-input"
              type="number"
              className={styles.numInput}
              min="1"
              max="25"
              step="0.5"
              value={draft.annualReturnPct}
              onChange={(e) => handleReturnChange(Number(e.target.value))}
            />
          </div>
        </div>
        <input
          type="range"
          className={styles.slider}
          min="4"
          max="20"
          step="0.5"
          value={draft.annualReturnPct}
          onChange={(e) => handleReturnChange(Number(e.target.value))}
          aria-label="Expected Annual Return Slider"
        />
        <div className={styles.ticksRow} aria-hidden="true">
          <span className={styles.tick} onClick={() => handleReturnChange(4)}>4</span>
          <span className={styles.tick} onClick={() => handleReturnChange(8)}>8</span>
          <span className={styles.tick} onClick={() => handleReturnChange(12)}>12</span>
          <span className={styles.tick} onClick={() => handleReturnChange(16)}>16</span>
          <span className={styles.tick} onClick={() => handleReturnChange(20)}>20</span>
        </div>
      </div>

      {/* 5. Expense Impact Scenario */}
      <div className={styles.controlGroup}>
        <div className={styles.labelRow}>
          <div>
            <span className={styles.controlLabel}>
              Expense Impact Scenario
              <span
                className={styles.infoTooltip}
                title="Simulated percentage increase in non-discretionary household expenses under macroeconomic shocks"
                aria-label="Information about expense impact"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </span>
            </span>
            <span className={styles.subHelpText}>Assumed increase in monthly expenses</span>
          </div>
          <div className={styles.numInputWrapper}>
            <input
              type="number"
              className={styles.numInput}
              min="0"
              max="30"
              step="1"
              value={draft.expenseImpactPct}
              onChange={(e) => handleExpenseImpactChange(Number(e.target.value))}
              aria-label="Expense impact percentage"
            />
          </div>
        </div>
        <input
          type="range"
          className={`${styles.slider} ${styles.coralSlider}`}
          min="0"
          max="20"
          step="1"
          value={draft.expenseImpactPct}
          onChange={(e) => handleExpenseImpactChange(Number(e.target.value))}
          aria-label="Expense Impact Scenario Slider"
        />
        <div className={styles.ticksRow} aria-hidden="true">
          <span className={styles.tick} onClick={() => handleExpenseImpactChange(0)}>0</span>
          <span className={styles.tick} onClick={() => handleExpenseImpactChange(5)}>5%</span>
          <span className={styles.tick} onClick={() => handleExpenseImpactChange(10)}>10%</span>
          <span className={styles.tick} onClick={() => handleExpenseImpactChange(15)}>15%</span>
          <span className={styles.tick} onClick={() => handleExpenseImpactChange(20)}>20%</span>
        </div>
      </div>

      {/* 6. Advanced Controls (When mode === 'advanced') */}
      {draft.mode === 'advanced' && (
        <>
          {/* Annual Step-Up */}
          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <span className={styles.controlLabel}>Annual SIP Step-up (%)</span>
              <div className={styles.numInputWrapper}>
                <input
                  type="number"
                  className={styles.numInput}
                  min="0"
                  max="15"
                  step="1"
                  value={draft.annualStepUpPct}
                  onChange={(e) => setDraft((prev) => ({ ...prev, annualStepUpPct: Math.max(0, Math.min(15, Number(e.target.value))) }))}
                  aria-label="Annual SIP Step-up"
                />
              </div>
            </div>
            <input
              type="range"
              className={styles.slider}
              min="0"
              max="15"
              step="1"
              value={draft.annualStepUpPct}
              onChange={(e) => setDraft((prev) => ({ ...prev, annualStepUpPct: Number(e.target.value) }))}
              aria-label="Annual Step-up Slider"
            />
          </div>

          {/* Inflation Rate */}
          <div className={styles.controlGroup}>
            <div className={styles.labelRow}>
              <span className={styles.controlLabel}>Inflation Discount Rate (%)</span>
              <div className={styles.numInputWrapper}>
                <input
                  type="number"
                  className={styles.numInput}
                  min="0"
                  max="12"
                  step="0.5"
                  value={draft.inflationPct}
                  onChange={(e) => setDraft((prev) => ({ ...prev, inflationPct: Math.max(0, Math.min(12, Number(e.target.value))) }))}
                  aria-label="Inflation Discount Rate"
                />
              </div>
            </div>
            <input
              type="range"
              className={styles.slider}
              min="0"
              max="10"
              step="0.5"
              value={draft.inflationPct}
              onChange={(e) => setDraft((prev) => ({ ...prev, inflationPct: Number(e.target.value) }))}
              aria-label="Inflation Rate Slider"
            />
          </div>

          {/* Timing Convention */}
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Deposit Timing Convention</span>
            <div className={styles.timingToggleRow}>
              <button
                type="button"
                className={`${styles.timingBtn} ${draft.timing === 'end_of_period' ? styles.active : ''}`}
                onClick={() => setDraft((prev) => ({ ...prev, timing: 'end_of_period' }))}
              >
                End of Month (Ordinary)
              </button>
              <button
                type="button"
                className={`${styles.timingBtn} ${draft.timing === 'beginning_of_period' ? styles.active : ''}`}
                onClick={() => setDraft((prev) => ({ ...prev, timing: 'beginning_of_period' }))}
              >
                Beginning of Month
              </button>
            </div>
          </div>
        </>
      )}

      {/* 7. Action Button */}
      <button
        type="submit"
        className={styles.updateBtn}
        disabled={isRecalculating}
      >
        {isRecalculating ? (
          <>
            <span className={styles.spinner} aria-hidden="true" />
            Recalculating Projections...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Update Projection
          </>
        )}
      </button>
    </form>
  );
};
