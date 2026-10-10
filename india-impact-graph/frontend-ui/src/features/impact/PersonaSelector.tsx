import React from 'react';
import type {
  HouseholdPersonaConfig,
  ExpenditureClass,
  SectorArea,
} from '../../types/contracts';
import styles from './impact.module.css';

export interface PersonaSelectorProps {
  config: HouseholdPersonaConfig;
  onChange?: (newConfig: HouseholdPersonaConfig) => void;
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({ config, onChange }) => {
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange({
        ...config,
        state: e.target.value,
      });
    }
  };

  const handleSectorChange = (sector: SectorArea) => {
    if (onChange) {
      onChange({
        ...config,
        sector,
      });
    }
  };

  const handleClassChange = (expenditureClass: ExpenditureClass) => {
    if (onChange) {
      onChange({
        ...config,
        expenditureClass,
      });
    }
  };

  const handleHouseholdModeToggle = (isHouseholdMode: boolean) => {
    if (onChange) {
      onChange({
        ...config,
        isHouseholdMode,
        displayMode: isHouseholdMode ? 'household' : 'per_capita',
      });
    }
  };

  return (
    <div className={styles.selectorGrid} role="region" aria-label="Household Demographic Archetype Selectors">
      {/* 1. State Selector */}
      <div className={styles.fieldGroup}>
        <label htmlFor="persona-state" className={styles.fieldLabel}>
          State
        </label>
        <select
          id="persona-state"
          className={styles.selectInput}
          value={config.state}
          onChange={handleStateChange}
        >
          <option value="Madhya Pradesh">Madhya Pradesh (Verified Baseline)</option>
          <option value="Uttar Pradesh" disabled>Uttar Pradesh (Verification Pending)</option>
          <option value="Maharashtra" disabled>Maharashtra (Verification Pending)</option>
        </select>
        <span className={styles.helperNote}>MoSPI HCES 2023-24 primary state baseline</span>
      </div>

      {/* 2. Sector Selector (Rural / Urban) */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Sector / Area</span>
        <div className={styles.segmentedControl} role="radiogroup" aria-label="Sector Area">
          {(['Rural', 'Urban'] as const).map((sec) => (
            <button
              key={sec}
              type="button"
              className={`${styles.segmentButton} ${config.sector === sec ? styles.segmentButtonActive : ''}`}
              onClick={() => handleSectorChange(sec)}
              role="radio"
              aria-checked={config.sector === sec}
            >
              {sec}
            </button>
          ))}
        </div>
        <span className={styles.helperNote}>Distinct consumption baskets</span>
      </div>

      {/* 3. Expenditure Class Selector (Low / Middle / High) */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>
          Expenditure Class (HCES Fractile)
        </span>
        <div className={styles.segmentedControl} role="radiogroup" aria-label="Expenditure Class">
          {(['Low', 'Middle', 'High'] as const).map((cls) => (
            <button
              key={cls}
              type="button"
              className={`${styles.segmentButton} ${config.expenditureClass === cls ? styles.segmentButtonActive : ''}`}
              onClick={() => handleClassChange(cls)}
              role="radio"
              aria-checked={config.expenditureClass === cls}
            >
              {cls}
            </button>
          ))}
        </div>
        <span className={styles.helperNote}>Official term: Expenditure Class (never Income Class)</span>
      </div>

      {/* 4. Display Mode (Per Capita vs Household Size) */}
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Reporting Metric</span>
        <div className={styles.segmentedControl} role="radiogroup" aria-label="Reporting Mode">
          <button
            type="button"
            className={`${styles.segmentButton} ${!config.isHouseholdMode ? styles.segmentButtonActive : ''}`}
            onClick={() => handleHouseholdModeToggle(false)}
            role="radio"
            aria-checked={!config.isHouseholdMode}
          >
            Per Capita (Default)
          </button>
          <button
            type="button"
            className={`${styles.segmentButton} ${config.isHouseholdMode ? styles.segmentButtonActive : ''}`}
            onClick={() => handleHouseholdModeToggle(true)}
            role="radio"
            aria-checked={Boolean(config.isHouseholdMode)}
            disabled={!config.officialHouseholdSize}
            title={!config.officialHouseholdSize ? 'Official verified average household size required' : undefined}
          >
            Total Household
          </button>
        </div>
        <span className={styles.helperNote}>
          {config.isHouseholdMode
            ? `Scaled by verified avg size (${config.officialHouseholdSize ?? 'N/A'} persons)`
            : '₹/person/month per NSSO/HCES convention'}
        </span>
      </div>
    </div>
  );
};
