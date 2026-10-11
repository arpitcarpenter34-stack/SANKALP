import React, { useState, useEffect } from 'react';
import { EventScenario, TransmissionAnalysisState } from '../../types';
import styles from './ScenarioWorkspace.module.css';

export interface MacroCalibrations {
  dieselPassThrough: string;
  targetGeography: string;
  policyCushion: string;
}

export interface ScenarioWorkspaceProps {
  scenarios: EventScenario[];
  analysisState: TransmissionAnalysisState;
  onAnalyze: (scenarioId: string, customText?: string, simulateError?: boolean) => void;
  onResetToIdle?: () => void;
  onClose?: () => void;
}

export const ScenarioWorkspace: React.FC<ScenarioWorkspaceProps> = ({
  scenarios,
  analysisState,
  onAnalyze,
  onResetToIdle,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedId, setSelectedId] = useState<string>(analysisState.selectedScenario.id);
  const [customText, setCustomText] = useState<string>(
    analysisState.selectedScenario.fullArticleText || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [testSimulateError, setTestSimulateError] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [analysisSuccessMsg, setAnalysisSuccessMsg] = useState<string | null>(null);

  // Calibrations State
  const [dieselPassThrough, setDieselPassThrough] = useState<string>('14–21 Days (Baseline)');
  const [targetGeography, setTargetGeography] = useState<string>('Madhya Pradesh (Baseline)');
  const [policyCushion, setPolicyCushion] = useState<string>('State VAT Buffer (Baseline)');

  const activeScenario =
    selectedId === 'custom'
      ? null
      : scenarios.find((s) => s.id === selectedId) || scenarios[0];

  // Sync selectedId with incoming analysisState when not analyzing custom
  useEffect(() => {
    if (analysisState.selectedScenario?.id && analysisState.selectedScenario.id !== 'custom') {
      setSelectedId(analysisState.selectedScenario.id);
      if (analysisState.selectedScenario.fullArticleText) {
        setCustomText(analysisState.selectedScenario.fullArticleText);
      }
    }
  }, [analysisState.selectedScenario]);

  // Handle successful analysis completion
  useEffect(() => {
    if (analysisState.status === 'analyzed') {
      setAnalysisSuccessMsg('✓ Transmission evaluated successfully. Graph and household models updated.');
      const timer = setTimeout(() => {
        setAnalysisSuccessMsg(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [analysisState.status]);

  const handleScenarioChange = (newId: string) => {
    setSelectedId(newId);
    setValidationError(null);
    setAnalysisSuccessMsg(null);
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
    setAnalysisSuccessMsg(null);
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
    if (activeTab === 'custom') {
      const trimmed = customText.trim();
      if (!trimmed) {
        setValidationError('Please paste or type a financial news excerpt before running custom analysis.');
        return;
      }
      if (trimmed.length < 15) {
        setValidationError('Excerpt is too short (minimum 15 characters required for causal extraction).');
        return;
      }
      if (trimmed.length > 3000) {
        setValidationError(`Excerpt exceeds 3,000 characters limit (${trimmed.length} characters entered).`);
        return;
      }
    }
    setValidationError(null);
    setAnalysisSuccessMsg(null);
    onAnalyze(selectedId, customText, testSimulateError);
  };

  const handleRetryAfterError = () => {
    setTestSimulateError(false);
    setValidationError(null);
    onAnalyze(selectedId, customText, false);
  };

  const handleResetToDefaults = () => {
    const defaultSc = scenarios[0];
    setSelectedId(defaultSc.id);
    setActiveTab('presets');
    if (defaultSc.fullArticleText) {
      setCustomText(defaultSc.fullArticleText);
    }
    setDieselPassThrough('14–21 Days (Baseline)');
    setTargetGeography('Madhya Pradesh (Baseline)');
    setPolicyCushion('State VAT Buffer (Baseline)');
    setTestSimulateError(false);
    setValidationError(null);
    setAnalysisSuccessMsg('Restored benchmark scenario defaults.');
    setTimeout(() => setAnalysisSuccessMsg(null), 2000);
    if (onResetToIdle) {
      onResetToIdle();
    }
  };

  // Node & Edge estimation based on scenario
  const getNodeEdgeCounts = () => {
    if (selectedId === 'crude-oil-12pct') return { nodes: 9, edges: 7 };
    if (selectedId === 'edible-oil-tariff') return { nodes: 6, edges: 5 };
    if (selectedId === 'wheat-procurement-spike') return { nodes: 6, edges: 5 };
    return { nodes: 5, edges: 4 };
  };
  const { nodes: estNodes, edges: estEdges } = getNodeEdgeCounts();

  return (
    <div
      className={styles.scenarioCard}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-workspace-title"
    >
      {/* 1. Header with Icon and Close Button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
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
            <h2 id="scenario-workspace-title" className={styles.title}>
              Scenario Input &amp; Testbench
            </h2>
            <p className={styles.subtitle}>
              Analyze global events and evaluate macroeconomic transmission onto India
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close Scenario Testbench"
          >
            ✕
          </button>
        )}
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

        {/* 3. Preset Scenario Selector Dropdown */}
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

            {/* Badges Row with truthful provenance distinctions */}
            <div className={styles.badgeRow}>
              <span className={styles.cyanBadge}>
                ★ Magnitude: {activeScenario?.magnitude || '+12.0%'}
              </span>
              {activeScenario?.isHypotheticalScenario ? (
                <span className={styles.amberBadge}>
                  ★ Synthetic Benchmark (Demo Fixture)
                </span>
              ) : (
                <span className={styles.greenBadge}>
                  ✓ Verified Historical Event
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* 4. Scenario Reference Box or Custom News Textarea */}
        <div className={styles.sectionGroup}>
          <div className={styles.sectionHeaderBetween}>
            <label htmlFor="article-text-box" className={styles.sectionLabel}>
              <span className={styles.sectionLabelBar} />
              {activeTab === 'custom' ? 'Custom Financial News Excerpt' : 'Scenario Reference & Provenance'}
            </label>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className={styles.resetLink}
              title="Reset to benchmark scenario defaults"
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
                placeholder="Paste financial news dispatch (e.g., Brent crude escalates past $90/bbl as OPEC+ reduces output by 1.2M barrels/day...)"
                rows={4}
                maxLength={3200}
                disabled={analysisState.status === 'loading'}
              />
              <div className={styles.textareaMetaRow}>
                <p className={styles.customDisclaimer}>
                  ℹ️ Custom user text evaluated via Reader NLP pipeline (FastAPI) or deterministic keyword parser. Unverified dispatches carry [UNVERIFIED] receipt.
                </p>
                <span className={styles.charCount}>
                  {customText.length} / 3000 chars
                </span>
              </div>
            </div>
          ) : (
            <div className={styles.referenceCard}>
              {activeScenario?.headline && (
                <p className={styles.referenceHeadline}>
                  {activeScenario.headline}
                </p>
              )}

              <p className={styles.referenceText}>
                {isExpanded
                  ? customText
                  : customText.length > 200
                  ? `${customText.slice(0, 200)}...`
                  : customText}
                {customText.length > 200 && (
                  <button
                    type="button"
                    className={styles.readMoreBtn}
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? ' Show Less' : ' Read More'}
                  </button>
                )}
              </p>

              {/* Verified Source Provenance Metadata */}
              {activeScenario?.sourceReceipt && (
                <div className={styles.provenanceBox}>
                  <div className={styles.provenanceRow}>
                    <span>
                      <strong>Provenance:</strong> {activeScenario.sourceReceipt.publisher} ({activeScenario.sourceReceipt.vintageYear})
                    </span>
                    <span style={{ color: '#047857', fontWeight: 600 }}>
                      {activeScenario.sourceReceipt.verificationStatus}
                    </span>
                  </div>

                  {activeScenario.sourceReceipt.sourceUrl && (
                    <div className={styles.provenanceRow}>
                      <a
                        href={activeScenario.sourceReceipt.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.provenanceLink}
                      >
                        Official Benchmark Documentation ↗
                      </a>
                    </div>
                  )}

                  {activeScenario.sourceReceipt.caveats && activeScenario.sourceReceipt.caveats.length > 0 && (
                    <ul className={styles.caveatsList}>
                      {activeScenario.sourceReceipt.caveats.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {validationError && (
            <div className={styles.errorMessage} role="alert">
              <span>⚠️ {validationError}</span>
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
                    : 'OMC Diesel Pass-through'}
                  <span className={styles.paramBadge}>Lag</span>
                </span>
              </div>
              <select
                className={styles.calSelect}
                value={dieselPassThrough}
                onChange={(e) => setDieselPassThrough(e.target.value)}
                aria-label="OMC Diesel Pass-through Lag"
              >
                <option value="14–21 Days (Baseline)">14–21 Days (Baseline)</option>
                <option value="7–10 Days (Accelerated)">7–10 Days (Accelerated)</option>
                <option value="Immediate (Direct Wholesale)">Immediate (Direct Wholesale)</option>
              </select>
            </div>

            <div className={styles.calibrationItem}>
              <div className={styles.calibrationLeft}>
                <span className={styles.calIcon}>📍</span>
                <span>
                  Target Geography
                  <span className={styles.paramBadge}>Archetype</span>
                </span>
              </div>
              <select
                className={styles.calSelect}
                value={targetGeography}
                onChange={(e) => setTargetGeography(e.target.value)}
                aria-label="Target Geography Archetype"
              >
                <option value="Madhya Pradesh (Baseline)">Madhya Pradesh (Baseline)</option>
                <option value="All-India Urban">All-India Urban</option>
                <option value="All-India Rural">All-India Rural</option>
              </select>
            </div>

            <div className={styles.calibrationItem}>
              <div className={styles.calibrationLeft}>
                <span className={styles.calIcon}>🛡</span>
                <span>
                  Policy Cushion
                  <span className={styles.paramBadge}>Fiscal</span>
                </span>
              </div>
              <select
                className={styles.calSelect}
                value={policyCushion}
                onChange={(e) => setPolicyCushion(e.target.value)}
                aria-label="Fiscal Policy Cushion Buffer"
              >
                <option value="State VAT Buffer (Baseline)">State VAT Buffer (Baseline)</option>
                <option value="Excise Cut Absorption">Excise Cut Absorption</option>
                <option value="No Cushion (Direct Shock)">No Cushion (Direct Shock)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. Test-Only Failure Simulation Checkbox */}
        <div className={styles.checkboxRow}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={testSimulateError}
              onChange={(e) => setTestSimulateError(e.target.checked)}
              className={styles.styledCheckbox}
            />
            <span>
              [Testbench Only] Simulate transmission evaluation failure{' '}
              <span className={styles.testNote}>(verifies error boundaries &amp; retry)</span>
            </span>
          </label>
        </div>

        {/* Dynamic Error State with Retry Button */}
        {analysisState.status === 'error' && (
          <div className={styles.errorMessage} role="alert">
            <span>⚠️ {analysisState.errorMessage}</span>
            <button
              type="button"
              className={styles.retryBtn}
              onClick={handleRetryAfterError}
            >
              ↻ Retry
            </button>
          </div>
        )}

        {/* Success Banner */}
        {analysisSuccessMsg && (
          <div className={styles.successBanner} role="status">
            {analysisSuccessMsg}
          </div>
        )}

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
            <span>
              Estimated analysis time: ~350ms (Deterministic Engine) • Live API: ~1.2s
            </span>
          </div>
          <div className={styles.footerNoteItem}>
            <span>ℹ</span>
            <span>
              Evaluates {estNodes} nodes and {estEdges} causal edges for &quot;{activeScenario?.title || 'Selected Scenario'}&quot;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
