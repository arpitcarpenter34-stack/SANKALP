import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScenarioSelector } from './ScenarioSelector';
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
  const [selectedId, setSelectedId] = useState<string>(analysisState.selectedScenario.id);
  const [customText, setCustomText] = useState<string>(
    analysisState.selectedScenario.fullArticleText || ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [testSimulateError, setTestSimulateError] = useState<boolean>(false);

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
      setCustomText('');
    }
  };

  const handleTriggerAnalysis = () => {
    if (selectedId === 'custom' && (!customText || customText.trim().length === 0)) {
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
  };

  return (
    <Card
      title="Scenario Dispatch Input"
      subtitle="Macroeconomic Shock Ingestion"
      headerAction={
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Badge
            variant={
              analysisState.status === 'analyzed'
                ? 'verified'
                : analysisState.status === 'error'
                ? 'risk'
                : 'neutral'
            }
            size="sm"
          >
            {analysisState.status === 'analyzed'
              ? 'Active Dispatch'
              : analysisState.status === 'error'
              ? 'Evaluation Error'
              : 'Ready'}
          </Badge>
        </div>
      }
    >
      <div className={styles.workspaceBody}>
        {/* Scenario Presets Selector */}
        <ScenarioSelector
          scenarios={scenarios}
          selectedId={selectedId}
          onSelect={handleScenarioChange}
          disabled={analysisState.status === 'loading'}
        />

        {/* Text Area for Bulletin / Article */}
        <div className={styles.inputGroup}>
          <div className={styles.inputHeader}>
            <label htmlFor="article-text" className={styles.inputLabel}>
              {selectedId === 'custom'
                ? 'Custom News Excerpt / Dispatch'
                : 'Scenario Reference Text'}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {selectedId !== 'custom' && (
                <button
                  type="button"
                  onClick={handleRestoreScenarioText}
                  className={styles.resetButton}
                  title="Reset to benchmark text"
                >
                  ↺ Reset Text
                </button>
              )}
              <span className={styles.charCount}>
                {customText.length} chars
              </span>
            </div>
          </div>

          <textarea
            id="article-text"
            className={`${styles.textarea} ${validationError ? styles.textareaError : ''}`}
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={
              selectedId === 'custom'
                ? 'Paste an excerpt from a financial news article (e.g. Brent crude surges to $92 on OPEC cuts)...'
                : 'Benchmark scenario text...'
            }
            rows={5}
            disabled={analysisState.status === 'loading'}
            aria-invalid={!!validationError}
            aria-describedby={validationError ? 'validation-msg' : undefined}
          />

          {validationError && (
            <div id="validation-msg" className={styles.errorMessage} role="alert">
              ⚠️ {validationError}
            </div>
          )}
        </div>

        {/* Transmission Parameters Panel */}
        <div className={styles.parametersBox}>
          <div className={styles.paramTitle}>Macro Transmission Calibrations</div>
          <div className={styles.paramGrid}>
            <div className={styles.paramItem}>
              <span className={styles.paramLabel}>
                {selectedId === 'edible-oil-tariff'
                  ? 'Import Tariff Pass-Through:'
                  : selectedId === 'wheat-procurement-spike'
                  ? 'Mandi MSP+ Spread:'
                  : 'OMC Diesel Pass-Through:'}
              </span>
              <span className={styles.paramValue}>
                {selectedId === 'edible-oil-tariff'
                  ? '10–15 Days (Port to Mandi)'
                  : selectedId === 'wheat-procurement-spike'
                  ? 'Localized Rabi Lag'
                  : '14–21 Days Wholesale Lag'}
              </span>
            </div>
            <div className={styles.paramItem}>
              <span className={styles.paramLabel}>Target Geography:</span>
              <span className={styles.paramValue}>Madhya Pradesh (Baseline)</span>
            </div>
            <div className={styles.paramItem}>
              <span className={styles.paramLabel}>Policy Cushion:</span>
              <span className={styles.paramValue}>
                {selectedId === 'wheat-procurement-spike'
                  ? 'PMGKAY Free Grain Buffer'
                  : selectedId === 'edible-oil-tariff'
                  ? 'PDS Cooking Oil Quota'
                  : 'State VAT Buffer'}
              </span>
            </div>
          </div>
        </div>

        {/* Error State Testing Option (for developer/tester validation) */}
        <div className={styles.errorToggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={testSimulateError}
              onChange={(e) => setTestSimulateError(e.target.checked)}
              className={styles.checkbox}
            />
            <span>Simulate transmission evaluation failure (Test error state)</span>
          </label>
        </div>

        {/* Action Button & Status */}
        <div className={styles.actionRow}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleTriggerAnalysis}
            isLoading={analysisState.status === 'loading'}
            className={styles.analyzeButton}
          >
            {analysisState.status === 'loading'
              ? 'Evaluating Transmission...'
              : '⚡ Analyze Event Transmission'}
          </Button>

          {analysisState.status === 'analyzed' && (
            <div className={styles.successStatus}>
              <span className={styles.statusDot} />
              <span>
                Evaluated: {analysisState.graphData?.nodes.length || 0} Nodes //{' '}
                {analysisState.graphData?.edges.length || 0} Causal Edges
              </span>
            </div>
          )}

          {analysisState.status === 'error' && (
            <div className={styles.errorBanner} role="alert">
              <div className={styles.errorText}>
                ⚠️ {analysisState.errorMessage || 'Transmission evaluation encountered an error.'}
              </div>
              {onResetToIdle && (
                <button
                  type="button"
                  onClick={onResetToIdle}
                  className={styles.retryButton}
                >
                  Dismiss / Return to Idle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Receipt / Provenance Summary */}
        {activeScenario && (
          <div className={styles.receiptCard}>
            <div className={styles.receiptHeader}>
              <span className={styles.receiptTitle}>Source Receipt:</span>
              <span className={styles.receiptSource}>
                {activeScenario.sourceReceipt.publisher} ({activeScenario.sourceReceipt.vintageYear})
              </span>
            </div>
            <p className={styles.receiptCaveat}>
              {activeScenario.sourceReceipt.caveats?.[0] || 'Official survey calibrated.'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
