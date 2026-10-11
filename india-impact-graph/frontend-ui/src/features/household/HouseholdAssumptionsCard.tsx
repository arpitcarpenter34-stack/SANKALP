import React, { useState, useEffect } from 'react';
import {
  HouseholdAssumptions,
  HouseholdProfileType,
} from './types';
import { PROFILE_PRESETS, LOCATION_OPTIONS } from './householdData';
import styles from './HouseholdAssumptionsCard.module.css';

interface HouseholdAssumptionsCardProps {
  assumptions: HouseholdAssumptions;
  onApplyAssumptions: (newAssumptions: HouseholdAssumptions) => void;
  isRecalculating?: boolean;
}

export const HouseholdAssumptionsCard: React.FC<HouseholdAssumptionsCardProps> = ({
  assumptions,
  onApplyAssumptions,
  isRecalculating = false,
}) => {
  // Local state for editing draft assumptions
  const [draft, setDraft] = useState<HouseholdAssumptions>(assumptions);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  useEffect(() => {
    setDraft(assumptions);
    setHasChanges(false);
  }, [assumptions]);

  const handleSelectPreset = (profile: HouseholdProfileType) => {
    const preset = PROFILE_PRESETS[profile];
    setDraft({ ...preset });
    setHasChanges(true);
  };

  const handleIncomeChange = (val: number) => {
    const clamped = Math.max(10000, Math.min(500000, val));
    setDraft((prev) => ({
      ...prev,
      monthlyIncome: clamped,
      profileType: 'custom',
    }));
    setHasChanges(true);
  };

  const handleFamilySizeChange = (size: number) => {
    setDraft((prev) => ({
      ...prev,
      familySize: size,
      profileType: 'custom',
    }));
    setHasChanges(true);
  };

  const handleLocationChange = (loc: string) => {
    setDraft((prev) => ({
      ...prev,
      location: loc,
    }));
    setHasChanges(true);
  };

  const handlePatternChange = (pat: 'frugal' | 'average' | 'discretionary') => {
    setDraft((prev) => ({
      ...prev,
      consumptionPattern: pat,
      profileType: 'custom',
    }));
    setHasChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyAssumptions(draft);
    setHasChanges(false);
  };

  return (
    <div className={styles.card} id="household-assumptions-panel">
      <div className={styles.header}>
        <h3 className={styles.title}>Household Profile & Assumptions</h3>
        <p className={styles.subtitle}>Adjust your details to see personalized impact</p>
      </div>

      {/* Profile Preset Pills */}
      <div className={styles.presetGroup} role="radiogroup" aria-label="Household Profile Presets">
        <button
          type="button"
          className={`${styles.presetBtn} ${draft.profileType === 'urban_middle' ? styles.activePreset : ''}`}
          onClick={() => handleSelectPreset('urban_middle')}
        >
          Urban Middle Class
        </button>
        <button
          type="button"
          className={`${styles.presetBtn} ${draft.profileType === 'rural' ? styles.activePreset : ''}`}
          onClick={() => handleSelectPreset('rural')}
        >
          Rural Household
        </button>
        <button
          type="button"
          className={`${styles.presetBtn} ${draft.profileType === 'high_income' ? styles.activePreset : ''}`}
          onClick={() => handleSelectPreset('high_income')}
        >
          High Income
        </button>
        <button
          type="button"
          className={`${styles.presetBtn} ${draft.profileType === 'custom' ? styles.activePreset : ''}`}
          onClick={() => handleSelectPreset('custom')}
        >
          Custom
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.fieldsGrid}>
          {/* Monthly Household Income */}
          <div className={styles.fieldBlock}>
            <div className={styles.labelRow}>
              <label htmlFor="monthly-income-input" className={styles.fieldLabel}>
                Monthly Household Income (₹)
              </label>
            </div>
            <div className={styles.inputWrapper}>
              <input
                id="monthly-income-input"
                type="number"
                step="1000"
                min="10000"
                max="500000"
                value={draft.monthlyIncome}
                onChange={(e) => handleIncomeChange(Number(e.target.value) || 10000)}
                className={styles.textInput}
              />
            </div>
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="20000"
                max="200000"
                step="1000"
                value={Math.min(200000, Math.max(20000, draft.monthlyIncome))}
                onChange={(e) => handleIncomeChange(Number(e.target.value))}
                className={styles.rangeSlider}
                aria-label="Monthly Household Income Slider"
              />
              <div className={styles.sliderMarkers}>
                <span>20K</span>
                <span>2L</span>
              </div>
            </div>
          </div>

          {/* Family Size */}
          <div className={styles.fieldBlock}>
            <label htmlFor="family-size-select" className={styles.fieldLabel}>
              Family Size
            </label>
            <div className={styles.selectWrapper}>
              <span className={styles.selectIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <select
                id="family-size-select"
                value={draft.familySize}
                onChange={(e) => handleFamilySizeChange(Number(e.target.value))}
                className={styles.selectInput}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'member' : 'members'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className={styles.fieldBlock}>
            <label
              htmlFor="assumptions-location-select"
              className={styles.fieldLabel}
              title="Applies MoSPI state survey consumption basket weights. Does not claim live local retail or tax APIs."
            >
              Location ⓘ
            </label>
            <div className={styles.selectWrapper}>
              <span className={styles.selectIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </span>
              <select
                id="assumptions-location-select"
                value={draft.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className={styles.selectInput}
                title="Regional consumption basket weighting based on MoSPI state expenditure survey"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consumption Pattern */}
          <div className={styles.fieldBlock}>
            <label htmlFor="consumption-pattern-select" className={styles.fieldLabel}>
              Consumption Pattern
            </label>
            <div className={styles.selectWrapper}>
              <span className={styles.selectIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </span>
              <select
                id="consumption-pattern-select"
                value={draft.consumptionPattern}
                onChange={(e) => handlePatternChange(e.target.value as any)}
                className={styles.selectInput}
              >
                <option value="frugal">Frugal (Essential focus)</option>
                <option value="average">Average</option>
                <option value="discretionary">Discretionary (Higher lifestyle)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Update & Recalculate Button */}
        <div className={styles.actionRow}>
          <button
            type="submit"
            className={styles.recalculateBtn}
            disabled={isRecalculating}
            id="update-recalculate-btn"
          >
            {isRecalculating ? (
              <span className={styles.spinner}>Recalculating...</span>
            ) : (
              <>
                <span>Update & Recalculate</span>
                {hasChanges && <span className={styles.changeDot} title="Unsaved changes" />}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
