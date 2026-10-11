import React from 'react';
import { MethodologyTab } from './types';
import { downloadMethodologyReport } from './reportGenerator';
import styles from './MethodologyHeader.module.css';

interface MethodologyHeaderProps {
  activeTab: MethodologyTab;
  onTabChange: (tab: MethodologyTab) => void;
}

const TABS: { id: MethodologyTab; label: string; icon: string }[] = [
  { id: 'how_it_works', label: 'How It Works', icon: 'workflow' },
  { id: 'data_sources', label: 'Data Sources', icon: 'database' },
  { id: 'models_forecasting', label: 'Models & Forecasting', icon: 'model' },
  { id: 'impact_calculation', label: 'Impact Calculation', icon: 'calc' },
  { id: 'validation_accuracy', label: 'Validation & Accuracy', icon: 'check' },
  { id: 'limitations', label: 'Limitations', icon: 'shield' },
];

export const MethodologyHeader: React.FC<MethodologyHeaderProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.topRow}>
        <div className={styles.titleSection}>
          <div className={styles.iconBadge} aria-hidden="true">
            <svg
              className={styles.docIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1 className={styles.title}>Methodology</h1>
            <p className={styles.subtitle}>
              A transparent, data-driven approach to connect global events with real impact on
              Indian economy and households.
            </p>
          </div>
        </div>

        <button
          type="button"
          className={styles.downloadReportBtn}
          onClick={() => downloadMethodologyReport()}
          title="Download complete verified methodology architecture report"
        >
          <svg
            className={styles.downloadIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download Methodology Report</span>
        </button>
      </div>

      <nav className={styles.navTabs} aria-label="Methodology navigation tabs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-pressed={isActive}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                {tab.id === 'how_it_works' && '⚙️'}
                {tab.id === 'data_sources' && '🗄️'}
                {tab.id === 'models_forecasting' && '📐'}
                {tab.id === 'impact_calculation' && '🧮'}
                {tab.id === 'validation_accuracy' && '🎯'}
                {tab.id === 'limitations' && '⚠️'}
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
