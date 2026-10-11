import React, { useState, useEffect } from 'react';
import styles from './ForecastHorizonModal.module.css';

export interface ForecastHorizonModalProps {
  isOpen: boolean;
  currentHorizon: number; // in months: 3 | 6 | 12
  onClose: () => void;
  onApplyHorizon: (horizon: number) => void;
}

interface HorizonOption {
  value: number;
  label: string;
  badge: string;
  description: string;
  transmissionCycle: string;
}

const HORIZON_OPTIONS: HorizonOption[] = [
  {
    value: 3,
    label: '3 Months',
    badge: 'Short-Term Shock',
    description: 'Captures immediate commodity price spikes and direct wholesale pass-through before consumer behavioral adjustments or policy subsidies settle.',
    transmissionCycle: 'Fast-moving energy & food staples (14–30 day lag)',
  },
  {
    value: 6,
    label: '6 Months (Baseline)',
    badge: 'Standard Macro Horizon',
    description: 'Recommended horizon for household budget reallocation, seasonal crop market arrivals, and quarterly monetary policy review transmission.',
    transmissionCycle: 'Full wholesale-to-retail pass-through with State VAT buffers',
  },
  {
    value: 12,
    label: '12 Months',
    badge: 'Annualized Economic Cycle',
    description: 'Extended horizon incorporating secondary wage-price spiral pressures, corporate margin revisions, and compounding variance in long-term SIP returns.',
    transmissionCycle: 'Full annual fiscal & macroeconomic absorption cycle',
  },
];

export const ForecastHorizonModal: React.FC<ForecastHorizonModalProps> = ({
  isOpen,
  currentHorizon,
  onClose,
  onApplyHorizon,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<number>(currentHorizon);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setSelectedHorizon(currentHorizon);
    setSuccessMsg(null);
  }, [currentHorizon, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsSaving(true);
    // Short realistic saving delay
    await new Promise((r) => setTimeout(r, 200));
    onApplyHorizon(selectedHorizon);
    setIsSaving(false);
    setSuccessMsg(`Forecast horizon updated to ${selectedHorizon} months.`);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forecast-horizon-title"
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className={styles.headerText}>
            <h2 id="forecast-horizon-title" className={styles.title}>
              Edit Forecast Horizon
            </h2>
            <p className={styles.subtitle}>
              Configure the econometric pass-through duration for household impact models
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <div className={styles.optionsList} role="radiogroup" aria-label="Select Forecast Horizon">
            {HORIZON_OPTIONS.map((opt) => {
              const isSelected = selectedHorizon === opt.value;
              return (
                <div
                  key={opt.value}
                  className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ''}`}
                  onClick={() => setSelectedHorizon(opt.value)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedHorizon(opt.value);
                    }
                  }}
                >
                  <div className={styles.optionTopRow}>
                    <div className={styles.radioIndicator}>
                      <span className={`${styles.radioCircle} ${isSelected ? styles.radioCircleActive : ''}`} />
                    </div>
                    <span className={styles.optionLabel}>{opt.label}</span>
                    <span className={styles.optionBadge}>{opt.badge}</span>
                  </div>

                  <p className={styles.optionDesc}>{opt.description}</p>

                  <div className={styles.transmissionRow}>
                    <span className={styles.transmissionIcon}>⚡</span>
                    <span className={styles.transmissionText}>{opt.transmissionCycle}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Statistical Disclosure */}
          <div className={styles.disclosureCard}>
            <span className={styles.disclosureIcon}>ℹ️</span>
            <p className={styles.disclosureText}>
              <strong>Model Calibration Disclosure:</strong> Forecast estimates are anchored to MoSPI HCES 2023–24 consumer expenditure weights and calibrated econometric pass-through elasticities. Changing the horizon recalculates the projected expense curve while preserving baseline archetype consumption.
            </p>
          </div>

          {successMsg && (
            <div className={styles.successBanner} role="status">
              ✓ {successMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.applyBtn}
            onClick={handleApply}
            disabled={isSaving}
          >
            {isSaving ? 'Updating Model...' : 'Apply Horizon'}
          </button>
        </div>
      </div>
    </div>
  );
};
