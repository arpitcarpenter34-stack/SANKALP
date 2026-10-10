import React from 'react';
import { Badge } from '../ui/Badge';
import { BackendConnectionStatus } from '../../types';
import styles from './Header.module.css';

export interface HeaderProps {
  isAiOff: boolean;
  onToggleAi: () => void;
  activeScenarioTitle?: string;
  backendStatus?: BackendConnectionStatus;
  onToggleForceOffline?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAiOff,
  onToggleAi,
  activeScenarioTitle = 'Crude Oil +12% Shock',
  backendStatus,
  onToggleForceOffline,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.brandGroup}>
          <div className={styles.brandIcon} aria-hidden="true">
            <span className={styles.iconPulse} />
            <span className={styles.iconCore}>🇮🇳</span>
          </div>
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.brandTitle}>India Impact Graph</h1>
              <Badge variant="cyan" size="sm">Hackwave 3.0 // PS 5</Badge>
            </div>
            <p className={styles.tagline}>From Global News to Your Household Budget</p>
          </div>
        </div>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.telemetryStrip}>
          <div className={styles.telemetryItem}>
            <span className={styles.telemetryLabel}>Scenario:</span>
            <span className={styles.telemetryValue}>{activeScenarioTitle}</span>
          </div>
          <span className={styles.separator} aria-hidden="true">|</span>
          <div className={styles.telemetryItem}>
            <span className={styles.telemetryLabel}>Baseline:</span>
            <span className={styles.telemetryValue}>MoSPI HCES 2023–24</span>
          </div>
        </div>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.controlsGroup}>
          {/* Backend Connection Status Badge */}
          {backendStatus && (
            <button
              type="button"
              className={styles.backendStatusBtn}
              onClick={onToggleForceOffline}
              title={`API Mode: ${backendStatus.label}. Click to toggle forced offline demo mode.`}
            >
              <span
                className={`${styles.backendDot} ${
                  backendStatus.isLive ? styles.backendDotLive : styles.backendDotDemo
                }`}
              />
              <span className={styles.backendText}>
                {backendStatus.isLive
                  ? `FastAPI: Live Analysis (${backendStatus.latencyMs ?? 0}ms)`
                  : 'Data Source: Demo Engine (Offline)'}
              </span>
            </button>
          )}

          {/* AI Extraction Mode Toggle */}
          <button
            type="button"
            className={`${styles.aiToggle} ${isAiOff ? styles.aiOff : styles.aiOn}`}
            onClick={onToggleAi}
            role="switch"
            aria-checked={!isAiOff}
            aria-label="Toggle AI Extraction Mode"
            title={
              isAiOff
                ? 'AI Explainer Slot is OFF: Pure deterministic formula baseline'
                : 'AI Explainer Slot is Enabled (Demo narrative active; numbers deterministic)'
            }
          >
            <span className={styles.toggleIndicator} />
            <span className={styles.toggleText}>
              {isAiOff ? 'AI Mode: OFF (Deterministic)' : 'AI Mode: Enabled (Demo Slot)'}
            </span>
          </button>

          <Badge variant="verified" size="sm">Evidence First</Badge>
        </div>
      </div>
    </header>
  );
};
