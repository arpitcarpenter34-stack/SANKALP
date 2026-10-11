import React from 'react';
import { ConsumptionTimePeriod, ConsumptionProfileType } from './types';
import { CONSUMPTION_LOCATIONS } from './consumptionData';
import styles from './ConsumptionHeader.module.css';

export interface ConsumptionHeaderProps {
  timePeriod: ConsumptionTimePeriod;
  onTimePeriodChange: (period: ConsumptionTimePeriod) => void;
  location: string;
  onLocationChange: (location: string) => void;
  profileType: ConsumptionProfileType;
  onProfileTypeChange: (profile: ConsumptionProfileType) => void;
}

export const ConsumptionHeader: React.FC<ConsumptionHeaderProps> = ({
  timePeriod,
  onTimePeriodChange,
  location,
  onLocationChange,
  profileType,
  onProfileTypeChange,
}) => {
  return (
    <header className={styles.headerContainer} aria-label="Consumption Dashboard Header">
      <div className={styles.titleArea}>
        <div className={styles.headerIconBadge} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </div>
        <div className={styles.textGroup}>
          <h1 className={styles.mainTitle}>Consumption</h1>
          <p className={styles.subtitle}>
            Track and analyze the consumption of key commodities and services in India.
          </p>
        </div>
      </div>

      <div className={styles.controlsArea}>
        {/* Time Period Filter */}
        <div className={styles.selectorWrapper}>
          <span className={styles.controlLabel}>Time Period</span>
          <div className={styles.customSelectGroup}>
            <select
              id="consumption-time-period-select"
              aria-label="Select Time Period"
              className={styles.styledSelect}
              value={timePeriod}
              onChange={(e) => onTimePeriodChange(e.target.value as ConsumptionTimePeriod)}
            >
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last 1 Year</option>
            </select>
          </div>
        </div>

        {/* Location Filter */}
        <div className={styles.selectorWrapper}>
          <span className={styles.controlLabel}>Location</span>
          <div className={styles.customSelectGroup}>
            <span className={styles.selectIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <select
              id="consumption-location-select"
              aria-label="Select Geographic Location"
              className={styles.styledSelect}
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              {CONSUMPTION_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Household Profile Filter */}
        <div className={styles.selectorWrapper}>
          <span className={styles.controlLabel}>Household Profile</span>
          <div className={styles.customSelectGroup}>
            <span className={styles.selectIcon} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <select
              id="consumption-profile-select"
              aria-label="Select Household Demographic Profile"
              className={styles.styledSelect}
              value={profileType}
              onChange={(e) => onProfileTypeChange(e.target.value as ConsumptionProfileType)}
            >
              <option value="urban_middle">Urban Middle Class</option>
              <option value="rural">Rural Household</option>
              <option value="high_income">High Income</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
