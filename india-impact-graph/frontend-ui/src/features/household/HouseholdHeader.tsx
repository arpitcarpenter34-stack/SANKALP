import React from 'react';
import { HouseholdProfileType } from './types';
import { LOCATION_OPTIONS } from './householdData';
import styles from './HouseholdHeader.module.css';

export interface HouseholdHeaderProps {
  selectedProfile: HouseholdProfileType;
  selectedLocation: string;
  onProfileChange: (profile: HouseholdProfileType) => void;
  onLocationChange: (loc: string) => void;
  onNavigateToConsumption?: () => void;
  onNavigateToGraph?: () => void;
}

export const HouseholdHeader: React.FC<HouseholdHeaderProps> = ({
  selectedProfile,
  selectedLocation,
  onProfileChange,
  onLocationChange,
  onNavigateToConsumption,
  onNavigateToGraph,
}) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.leftCol}>
        <div className={styles.headerIconCircle} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div className={styles.titleCol}>
          <h1 className={styles.title}>Household Impact</h1>
          <p className={styles.subtitle}>
            See how global events and sector changes affect your monthly expenses, savings and investment capacity.
          </p>
        </div>
      </div>

      <div className={styles.rightControls}>
        {/* Profile Selector */}
        <div className={styles.controlBox}>
          <label htmlFor="household-profile-select" className={styles.controlLabel}>
            Household Profile
          </label>
          <div className={styles.selectWrapper}>
            <div className={styles.inputIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <select
              id="household-profile-select"
              className={styles.headerSelect}
              value={selectedProfile}
              onChange={(e) => onProfileChange(e.target.value as HouseholdProfileType)}
            >
              <option value="urban_middle">Urban Middle Class</option>
              <option value="rural">Rural Household</option>
              <option value="high_income">High Income</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        {/* Location Selector */}
        <div className={styles.controlBox}>
          <label htmlFor="household-location-select" className={styles.controlLabel}>
            Location
          </label>
          <div className={styles.selectWrapper}>
            <div className={styles.inputIcon} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <select
              id="household-location-select"
              className={styles.headerSelect}
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>
        {onNavigateToConsumption && (
          <button
            type="button"
            className={styles.jumpBtn}
            onClick={onNavigateToConsumption}
            title="Inspect detailed consumption basket itemization"
          >
            Consumption Basket →
          </button>
        )}
        {onNavigateToGraph && (
          <button
            type="button"
            className={styles.jumpBtn}
            onClick={onNavigateToGraph}
            title="Trace causal shock pathway on Impact Graph"
          >
            Impact Graph →
          </button>
        )}
      </div>
    </div>
  );
};
