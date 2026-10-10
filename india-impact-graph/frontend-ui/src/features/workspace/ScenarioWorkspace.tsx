import React, { useState } from 'react';
import { EventScenario, TransmissionAnalysisState } from '../../types';
import styles from './ScenarioWorkspace.module.css';

export interface ScenarioWorkspaceProps {
  scenarios: EventScenario[];
  analysisState: TransmissionAnalysisState;
  onAnalyze: (scenarioId: string, customText?: string, simulateError?: boolean) => void;
  onResetToIdle?: () => void;
}

export const ScenarioWorkspace: React.FC<ScenarioWorkspaceProps> = ({
  scenarios,
  analysisState,
  onAnalyze,
  onResetToIdle,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedId, setSelectedId] = useState<string>(analysisState.selectedScenario.id);
  const [customText, setCustomText] = useState<string>(
    analysisState.selectedScenario.fullArticleText || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [testSimulateError, setTestSimulateError] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeScenario =
    selectedId === 'custom'
      ? null
      : scenarios.find((s) => s.id === selectedId) || scenarios[0];

  const handleScenarioChange = (newId: string) => {
    setSelectedId(newId);
    setValidationError(null);
    if (newId !== 'custom') {
      const match = scenarios.find((s) => s.id === newId);
      if (match?.fullArticleText) {
        setCustomText(match.fullArticleText);
      }
    } else {
      setActiveTab('custom');
      setCustomText('');
    }
  };

  const handleTabSwitch = (tab: 'presets' | 'custom') => {
    setActiveTab(tab);
    setValidationError(null);
    if (tab === 'custom') {
      setSelectedId('custom');
      if (activeScenario && customText === activeScenario.fullArticleText) {
        setCustomText('');
      }
    } else {
      if (selectedId === 'custom') {
        setSelectedId(scenarios[0].id);
        if (scenarios[0].fullArticleText) {
          setCustomText(scenarios[0].fullArticleText);
        }
      }
    }
  };

  const handleTriggerAnalysis = () => {
    if (activeTab === 'custom' && (!customText || customText.trim().length === 0)) {
      setValidationError('Please paste or type a financial news excerpt before running custom analysis.');
      return;
    }
    setValidationError(null);
    onAnalyze(selectedId, customText, testSimulateError);
  };

  const handleRestoreScenarioText = () => {
    if (activeScenario?.fullArticleText) {
      setCustomText(activeScenario.fullArticleText);
      setValidationError(null);
    }
    if (onResetToIdle) {
      onResetToIdle();
    }
  };

  return (
    <div className={styles.scenarioCard}>
      {/* 1. Header with Icon */}
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div className={styles.headerText}>
          <h2 className={styles.title}>Scenario Input</h2>
          <p className={styles.subtitle}>Analyze global events and see their impact on India</p>
        </div>
      </div>

      <div className={styles.body}>
        {/* 2. Preset Scenarios vs Custom News Segmented Control */}
        <div className={styles.segmentBar} role="tablist" aria-label="Input Mode">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'presets'}
            className={`${styles.segmentBtn} ${activeTab === 'presets' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleTabSwitch('presets')}
          >
            Preset Scenarios
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'custom'}
            className={`${styles.segmentBtn} ${activeTab === 'custom' ? styles.segmentBtnActive : ''}`}
            onClick={() => handleTabSwitch('custom')}
          >
            Custom News
          </button>
        </div>

        {/* 3. Scenario Selector Dropdown */}
        {activeTab === 'presets' ? (
          <div className={styles.sectionGroup}>
            <label htmlFor="benchmark-select" className={styles.sectionLabel}>
              <span className={styles.sectionLabelBar} />
              Select Benchmark Scenario
            </label>

            <div className={styles.selectWrapper}>
              <span className={styles.selectIcon} aria-hidden="true">
                {selectedId === 'crude-oil-12pct' ? '🛢️' : selectedId === 'edible-oil-tariff' ? '🌻' : '🌾'}
              </span>
              <select
                id="benchmark-select"
                className={styles.styledSelect}
                value={selectedId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                disabled={analysisState.status === 'loading'}
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>▾</span>
            </div>

            {/* Badges Row */}
            <div className={styles.badgeRow}>
              <span className={styles.cyanBadge}>
                ★ Magnitude: {activeScenario?.magnitude || '+12.0%'}
              </span>
              <span className={styles.amberBadge}>
                ★ Hypothetical (Demo)
              </span>
            </div>
          </div>
        ) : null}

        {/* 4. Scenario Reference Box or Custom News Textarea */}
        <div className={styles.sectionGroup}>
          <div className={styles.sectionHeaderBetween}>
            <label htmlFor="article-text-box" className={styles.sectionLabel}>
              <span className={styles.sectionLabelBar} />
              {activeTab === 'custom' ? 'Custom Financial News Excerpt' : 'Scenario Reference'}
            </label>
            <button
              type="button"
              onClick={handleRestoreScenarioText}
              className={styles.resetLink}
              title="Reset to scenario defaults"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset
            </button>
          </div>

          {activeTab === 'custom' ? (
            <div className={styles.textareaWrapper}>
              <textarea
                id="article-text-box"
                className={`${styles.styledTextarea} ${validationError ? styles.textareaError : ''}`}
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Paste financial news dispatch (e.g. Brent crude escalates past $90/bbl as OPEC+ reduces output...)"
                rows={4}
                disabled={analysisState.status === 'loading'}
              />
              {validationError && (
                <div className={styles.errorMessage} role="alert">
                  ⚠️ {validationError}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.referenceCard}>
              <p className={styles.referenceText}>
                {isExpanded
                  ? customText
                  : customText.length > 180
                  ? `${customText.slice(0, 180)}...`
                  : customText}
                {customText.length > 180 && (
                  <button
                    type="button"
                    className={styles.readMoreBtn}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? ' Show Less' : ' Read More'}
                  </button>
                )}
              </p>
            </div>
          )}
        </div>

        {/* 5. Macro Transmission Calibrations */}
        <div className={styles.sectionGroup}>
          <div className={styles.sectionLabel}>
            <span className={styles.sectionLabelBar} />
            Macro Transmission Calibrations
          </div>

          <div className={styles.calibrationList}>
            <div className={styles.calibrationItem}>
              <div className={styles.calibrationLeft}>
                <span className={styles.calIcon}>⏱</span>
                <span>
                  {selectedId === 'edible-oil-tariff'
                    ? 'Import Tariff Pass-through'
                    : selectedId === 'wheat-procurement-spike'
                    ? 'Mandi MSP+ Spread'
                    : 'OMC: Diesel Pass-through'}
                </span>
              </div>
              <span className={styles.calValue}>
                {selectedId === 'edible-oil-tariff'
                  ? '10–15 Days'
                  : selectedId === 'wheat-procurement-spike'
                  ? 'Localized Lag'
                  : '14–21 Days'}
              </span>
            </div>

            <div className={styles.calibrationItem}>
              <div className={styles.calibrationLeft}>
                <span className={styles.calIcon}>📍</span>
                <span>Target Geography</span>
              </div>
              <span className={styles.calValue}>Madhya Pradesh (Baseline)</span>
            </div>

            <div className={styles.calibrationItem}>
              <div className={styles.calibrationLeft}>
                <span className={styles.calIcon}>🛡</span>
                <span>Policy Cushion</span>
              </div>
              <span className={styles.calValue}>
                {selectedId === 'wheat-procurement-spike'
                  ? 'PMGKAY Free Grain'
                  : selectedId === 'edible-oil-tariff'
                  ? 'PDS Cooking Oil'
                  : 'State VAT Buffer'}
              </span>
            </div>
          </div>
        </div>

        {/* 6. Error Simulation Checkbox */}
        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={testSimulateError}
              onChange={(e) => setTestSimulateError(e.target.checked)}
              className={styles.styledCheckbox}
            />
            <span>Simulate transmission evaluation failure <span className={styles.testNote}>(test error state)</span></span>
          </label>
        </div>

        {/* 7. Primary Action Button */}
        <button
          type="button"
          className={`${styles.primaryAnalyzeBtn} ${analysisState.status === 'loading' ? styles.btnLoading : ''}`}
          onClick={handleTriggerAnalysis}
          disabled={analysisState.status === 'loading'}
        >
          {analysisState.status === 'loading' ? (
            <span className={styles.btnContent}>
              <span className={styles.spinner} />
              Evaluating Transmission...
            </span>
          ) : (
            <span className={styles.btnContent}>
              <span className={styles.playIcon}>▶</span>
              Analyze Event Transmission
            </span>
          )}
        </button>

        {/* 8. Footer Notes */}
        <div className={styles.footerNotes}>
          <div className={styles.footerNoteItem}>
            <span>⏱</span>
            <span>Estimated analysis time: ~10 seconds</span>
          </div>
          <div className={styles.footerNoteItem}>
            <span>ℹ</span>
            <span>Evaluates 9 nodes and 7 causal edges</span>
          </div>
        </div>
      </div>
    </div>
  );
};
