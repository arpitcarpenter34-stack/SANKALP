import React from 'react';
import {
  DisplayPreferences,
  AppTheme,
  ChartStyleType,
  TableDensityType,
} from './types';
import styles from './DisplaySettingsCard.module.css';

interface DisplaySettingsCardProps {
  display: DisplayPreferences;
  onChangeDisplay: (display: DisplayPreferences) => void;
}

export const DisplaySettingsCard: React.FC<DisplaySettingsCardProps> = ({
  display,
  onChangeDisplay,
}) => {
  const handleThemeChange = (theme: AppTheme) => {
    onChangeDisplay({ ...display, theme });
  };

  const handleChartStyleChange = (chartStyle: ChartStyleType) => {
    onChangeDisplay({ ...display, chartStyle });
  };

  const handleTableDensityChange = (tableDensity: TableDensityType) => {
    onChangeDisplay({ ...display, tableDensity });
  };

  return (
    <div className={styles.card} id="settings-display-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Display Settings</h2>
        <p className={styles.subtitle}>
          Choose your preferred appearance and visualization style.
        </p>
      </div>

      <div className={styles.groupList}>
        {/* Theme Group */}
        <div className={styles.groupItem}>
          <span className={styles.groupLabel}>Theme</span>
          <div className={styles.segmentedRow} role="radiogroup" aria-label="Theme selection">
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.theme === 'light' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleThemeChange('light')}
              role="radio"
              aria-checked={display.theme === 'light'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                ☀️
              </span>
              <span>Light</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.theme === 'dark' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleThemeChange('dark')}
              role="radio"
              aria-checked={display.theme === 'dark'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                🌙
              </span>
              <span>Dark</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.theme === 'system' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleThemeChange('system')}
              role="radio"
              aria-checked={display.theme === 'system'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                🖥️
              </span>
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Chart Style Group */}
        <div className={styles.groupItem}>
          <span className={styles.groupLabel}>Chart Style</span>
          <div className={styles.segmentedRow} role="radiogroup" aria-label="Chart style selection">
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.chartStyle === 'line' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleChartStyleChange('line')}
              role="radio"
              aria-checked={display.chartStyle === 'line'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                📈
              </span>
              <span>Line</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.chartStyle === 'bar' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleChartStyleChange('bar')}
              role="radio"
              aria-checked={display.chartStyle === 'bar'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                📊
              </span>
              <span>Bar</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.chartStyle === 'area' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleChartStyleChange('area')}
              role="radio"
              aria-checked={display.chartStyle === 'area'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                📉
              </span>
              <span>Area</span>
            </button>
          </div>
        </div>

        {/* Table Density Group */}
        <div className={styles.groupItem}>
          <span className={styles.groupLabel}>Table Density</span>
          <div className={styles.segmentedRow} role="radiogroup" aria-label="Table density selection">
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.tableDensity === 'compact' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleTableDensityChange('compact')}
              role="radio"
              aria-checked={display.tableDensity === 'compact'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                📑
              </span>
              <span>Compact</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.tableDensity === 'comfortable' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleTableDensityChange('comfortable')}
              role="radio"
              aria-checked={display.tableDensity === 'comfortable'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                📋
              </span>
              <span>Comfortable</span>
            </button>
            <button
              type="button"
              className={`${styles.segmentBtn} ${display.tableDensity === 'spacious' ? styles.segmentBtnActive : ''}`}
              onClick={() => handleTableDensityChange('spacious')}
              role="radio"
              aria-checked={display.tableDensity === 'spacious'}
            >
              <span className={styles.segmentIcon} aria-hidden="true">
                📰
              </span>
              <span>Spacious</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
