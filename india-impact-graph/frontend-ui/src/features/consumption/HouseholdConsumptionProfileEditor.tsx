import React, { useState, useEffect } from 'react';
import {
  ConsumptionAssumptions,
  ConsumptionProfileType,
  LifestyleType,
} from './types';
import { CONSUMPTION_LOCATIONS, PROFILE_PRESETS } from './consumptionData';
import styles from './HouseholdConsumptionProfileEditor.module.css';

export interface HouseholdConsumptionProfileEditorProps {
  currentAssumptions: ConsumptionAssumptions;
  onApplyAssumptions: (newAssumptions: ConsumptionAssumptions) => void;
}

export const HouseholdConsumptionProfileEditor: React.FC<HouseholdConsumptionProfileEditorProps> = ({
  currentAssumptions,
  onApplyAssumptions,
}) => {
  const [draft, setDraft] = useState<ConsumptionAssumptions>(currentAssumptions);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Sync draft if external assumptions change
  useEffect(() => {
    setDraft(currentAssumptions);
  }, [currentAssumptions]);

  const handleSelectPreset = (preset: ConsumptionProfileType) => {
    const presetValues = PROFILE_PRESETS[preset];
    setDraft({ ...presetValues });
  };

  const handleIncomeNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
    setDraft((prev) => ({
      ...prev,
      monthlyIncome: Math.min(1000000, Math.max(0, val)),
      profileType: 'custom',
    }));
  };

  const handleIncomeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setDraft((prev) => ({
      ...prev,
      monthlyIncome: val,
      profileType: 'custom',
    }));
  };

  const handleUpdate = () => {
    setIsUpdating(true);
    // Brief realistic feedback
    setTimeout(() => {
      onApplyAssumptions(draft);
      setIsUpdating(false);
    }, 200);
  };

  return (
    <article className={styles.editorCard} aria-label="Household Consumption Profile">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Household Consumption Profile</h2>
        <p className={styles.cardSubtitle}>
          Adjust details to see personalized consumption estimates
        </p>
      </div>

      {/* Preset Buttons */}
      <div className={styles.presetTabs} role="group" aria-label="Profile Presets">
        <button
          type="button"
          className={`${styles.presetBtn} ${
            draft.profileType === 'urban_middle' ? styles.presetActive : ''
          }`}
          onClick={() => handleSelectPreset('urban_middle')}
        >
          Urban Middle Class
        </button>
        <button
          type="button"
          className={`${styles.presetBtn} ${
            draft.profileType === 'rural' ? styles.presetActive : ''
          }`}
          onClick={() => handleSelectPreset('rural')}
        >
          Rural Household
        </button>
        <button
          type="button"
          className={`${styles.presetBtn} ${
            draft.profileType === 'high_income' ? styles.presetActive : ''
          }`}
          onClick={() => handleSelectPreset('high_income')}
        >
          High Income
        </button>
        <button
          type="button"
          className={`${styles.presetBtn} ${
            draft.profileType === 'custom' ? styles.presetActive : ''
          }`}
          onClick={() => handleSelectPreset('custom')}
        >
          Custom
        </button>
      </div>

      <div className={styles.formGrid}>
        {/* Monthly Household Income */}
        <div className={styles.fieldGroup}>
          <label htmlFor="income-input" className={styles.fieldLabel}>
            Monthly Household Income (₹)
          </label>
          <div className={styles.incomeInputWrapper}>
            <input
              id="income-input"
              type="text"
              className={styles.numberInput}
              value={draft.monthlyIncome.toLocaleString('en-IN')}
              onChange={handleIncomeNumberChange}
            />
            <div className={styles.sliderRow}>
              <span className={styles.sliderMinMax}>20K</span>
              <input
                id="income-slider"
                type="range"
                min="20000"
                max="200000"
                step="5000"
                value={draft.monthlyIncome}
                onChange={handleIncomeSliderChange}
                className={styles.sliderTrack}
                aria-label="Household Income Slider"
              />
              <span className={styles.sliderMinMax}>2L</span>
            </div>
          </div>
        </div>

        {/* Family Size */}
        <div className={styles.fieldGroup}>
          <label htmlFor="family-size-select" className={styles.fieldLabel}>
            Family Size
          </label>
          <div className={styles.selectWithIcon}>
            <span className={styles.selectIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <select
              id="family-size-select"
              className={styles.styledSelect}
              value={draft.familySize}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  familySize: parseInt(e.target.value, 10),
                  profileType: 'custom',
                }))
              }
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'member' : 'members'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Locatyle / Location */}
        <div className={styles.fieldGroup}>
          <label htmlFor="location-profile-select" className={styles.fieldLabel}>
            Locatyle{' '}
            <span
              className={styles.infoIcon}
              title="Regional basket calibration from state expenditure survey data"
              aria-hidden="true"
            >
              ⓘ
            </span>
          </label>
          <div className={styles.selectWithIcon}>
            <span className={styles.selectIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <select
              id="location-profile-select"
              className={styles.styledSelect}
              value={draft.location}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  location: e.target.value,
                  profileType: 'custom',
                }))
              }
            >
              {CONSUMPTION_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lifestyle / Pattern */}
        <div className={styles.fieldGroup}>
          <label htmlFor="lifestyle-select" className={styles.fieldLabel}>
            Lifestyle
          </label>
          <div className={styles.selectWithIcon}>
            <span className={styles.selectIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </span>
            <select
              id="lifestyle-select"
              className={styles.styledSelect}
              value={draft.lifestyle}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  lifestyle: e.target.value as LifestyleType,
                  profileType: 'custom',
                }))
              }
            >
              <option value="frugal">Frugal (Needs-first)</option>
              <option value="moderate">Moderate</option>
              <option value="discretionary">Discretionary (Comfort)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        type="button"
        className={styles.updateButton}
        onClick={handleUpdate}
        disabled={isUpdating}
      >
        <span aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={isUpdating ? styles.btnSpinIcon : ''}
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </span>
        {isUpdating ? 'Recalculating...' : 'Update Consumption Estimate'}
      </button>
    </article>
  );
};
