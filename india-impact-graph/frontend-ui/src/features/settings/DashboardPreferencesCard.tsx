import React from 'react';
import {
  DashboardPreferences,
  DefaultViewType,
  DefaultTimePeriod,
  PreferredCurrency,
  InterfaceLanguage,
} from './types';
import { TIME_PERIOD_OPTIONS, REGION_SCOPE_OPTIONS } from './settingsData';
import styles from './DashboardPreferencesCard.module.css';

interface DashboardPreferencesCardProps {
  preferences: DashboardPreferences;
  onChangePreferences: (prefs: DashboardPreferences) => void;
  onNavigateSection?: (sectionId: string) => void;
}

const VIEW_TILES: { id: DefaultViewType; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'sectors', label: 'Sectors', icon: '🥧' },
  { id: 'household-impact', label: 'Household Impact', icon: '🏠' },
  { id: 'sip-forecasts', label: 'SIP & Forecasts', icon: '📈' },
];

export const DashboardPreferencesCard: React.FC<DashboardPreferencesCardProps> = ({
  preferences,
  onChangePreferences,
  onNavigateSection,
}) => {
  const handleViewChange = (viewId: DefaultViewType) => {
    onChangePreferences({ ...preferences, defaultView: viewId });
    onNavigateSection?.(viewId);
  };

  return (
    <div className={styles.card} id="settings-preferences-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard Preferences</h2>
        <p className={styles.subtitle}>Customize what you see on your dashboard.</p>
      </div>

      <span className={styles.sectionLabel}>Default View</span>
      <div className={styles.defaultViewGrid}>
        {VIEW_TILES.map((tile) => {
          const isSelected = preferences.defaultView === tile.id;
          return (
            <button
              key={tile.id}
              type="button"
              className={`${styles.viewTile} ${isSelected ? styles.viewTileSelected : ''}`}
              onClick={() => handleViewChange(tile.id)}
              aria-pressed={isSelected}
            >
              {isSelected && <span className={styles.checkBadge}>✓</span>}
              <span className={styles.tileIcon} aria-hidden="true">
                {tile.icon}
              </span>
              <span className={styles.tileLabel}>{tile.label}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.selectGrid}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="pref-time-period">
            Default Time Period
          </label>
          <select
            id="pref-time-period"
            className={styles.select}
            value={preferences.defaultTimePeriod}
            onChange={(e) =>
              onChangePreferences({
                ...preferences,
                defaultTimePeriod: e.target.value as DefaultTimePeriod,
              })
            }
          >
            {TIME_PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="pref-location">
            Default Location
          </label>
          <select
            id="pref-location"
            className={styles.select}
            value={preferences.defaultLocation}
            onChange={(e) =>
              onChangePreferences({ ...preferences, defaultLocation: e.target.value })
            }
          >
            {REGION_SCOPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="pref-currency">
            Preferred Currency
          </label>
          <select
            id="pref-currency"
            className={styles.select}
            value={preferences.preferredCurrency}
            onChange={(e) =>
              onChangePreferences({
                ...preferences,
                preferredCurrency: e.target.value as PreferredCurrency,
              })
            }
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="pref-language">
            Language
          </label>
          <select
            id="pref-language"
            className={styles.select}
            value={preferences.language}
            onChange={(e) =>
              onChangePreferences({
                ...preferences,
                language: e.target.value as InterfaceLanguage,
              })
            }
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी - Preview)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
