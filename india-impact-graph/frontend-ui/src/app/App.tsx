import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';

import { ScenarioWorkspace } from '../features/workspace/ScenarioWorkspace';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { scenarioService } from '../services/api/scenarioService';
import { apiClient } from '../services/api/apiClient';
import { MOCK_SCENARIOS } from '../services/api/mockData';
import {
  TransmissionAnalysisState,
  EventScenario,
  PropagationPathCategory,
  HouseholdPersonaConfig,
  BackendConnectionStatus,
  SourceReceipt,
  GraphCanvasSlotProps,
  HouseholdImpactSlotProps,
  EvidencePanelSlotProps,
} from '../types';
import styles from './App.module.css';

export interface AppProps {
  customGraphCanvas?: React.ComponentType<GraphCanvasSlotProps>;
  customHouseholdImpact?: React.ComponentType<HouseholdImpactSlotProps>;
  customEvidencePanel?: React.ComponentType<EvidencePanelSlotProps>;
}

export const App: React.FC<AppProps> = ({
  customGraphCanvas: CustomGraphCanvas,
  customHouseholdImpact: CustomHouseholdImpact,
  customEvidencePanel: CustomEvidencePanel,
}) => {
  const [scenarios] = useState<EventScenario[]>(MOCK_SCENARIOS);
  const [isAiOff, setIsAiOff] = useState<boolean>(false);
  const [selectedPath, setSelectedPath] = useState<PropagationPathCategory | 'all'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>(apiClient.getStatus());

  // Household Archetype Configuration (Laptop A Shell Control)
  const [personaConfig, setPersonaConfig] = useState<HouseholdPersonaConfig>({
    state: 'Madhya Pradesh',
    sector: 'Rural',
    expenditureClass: 'Middle',
  });

  const [analysisState, setAnalysisState] = useState<TransmissionAnalysisState>({
    status: 'idle',
    selectedScenario: MOCK_SCENARIOS[0],
    graphData: null,
    personaData: null,
    isAiOff: false,
  });

  // Check backend health on initial mount
  useEffect(() => {
    scenarioService.checkBackend().then(setBackendStatus);
  }, []);

  const handleToggleForceOffline = async () => {
    apiClient.setForceOffline(!apiClient.isForcedOffline());
    const newStatus = await scenarioService.checkBackend();
    setBackendStatus(newStatus);
  };

  // Handle Scenario Analysis Submission
  const handleAnalyze = async (
    scenarioId: string,
    customText?: string,
    simulateError?: boolean
  ) => {
    setAnalysisState((prev) => ({ ...prev, status: 'loading', errorMessage: undefined }));
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    try {
      const response = await scenarioService.analyzeScenario(
        scenarioId,
        customText,
        isAiOff,
        personaConfig,
        simulateError
      );

      setAnalysisState({
        status: 'analyzed',
        selectedScenario: response.scenario,
        graphData: response.graph,
        personaData: response.persona,
        isAiOff,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze scenario transmission.';
      setAnalysisState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: msg,
      }));
    }
  };

  const handleResetToIdle = () => {
    setAnalysisState({
      status: 'idle',
      selectedScenario: MOCK_SCENARIOS[0],
      graphData: null,
      personaData: null,
      isAiOff,
    });
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  };

  const handleToggleAi = () => {
    setIsAiOff((prev) => {
      const next = !prev;
      setAnalysisState((current) => ({
        ...current,
        isAiOff: next,
        personaData: current.personaData
          ? { ...current.personaData, isAiOff: next }
          : null,
      }));
      return next;
    });
  };

  // Archetype change handler
  const handlePersonaConfigChange = (newConfig: HouseholdPersonaConfig) => {
    setPersonaConfig(newConfig);
    if (analysisState.status === 'analyzed') {
      const updatedPersona = scenarioService.recalculatePersona(
        analysisState.selectedScenario.id,
        newConfig,
        isAiOff
      );
      setAnalysisState((prev) => ({ ...prev, personaData: updatedPersona }));
    }
  };

  // Determine active receipt to display in Evidence Drawer
  let activeEvidenceReceipt: SourceReceipt | null = null;
  let activeEvidenceTitle = 'Official Benchmark Provenance';
  let activeCaveat = 'Official survey calibrated.';

  if (analysisState.graphData) {
    if (selectedEdgeId) {
      const edge = analysisState.graphData.edges.find((e) => e.id === selectedEdgeId);
      if (edge) {
        activeEvidenceReceipt = edge.receipt;
        activeEvidenceTitle = `Causal Edge: ${edge.from} ➔ ${edge.to} (${edge.relationType})`;
        activeCaveat = edge.whatCouldBeWrong || edge.evidenceQuote;
      }
    } else if (selectedNodeId) {
      const node = analysisState.graphData.nodes.find((n) => n.id === selectedNodeId);
      if (node && node.receipt) {
        activeEvidenceReceipt = node.receipt;
        activeEvidenceTitle = `Graph Node: ${node.label}`;
        activeCaveat = node.description || 'Observed / inferred node metadata.';
      }
    }

    if (!activeEvidenceReceipt && analysisState.selectedScenario) {
      activeEvidenceReceipt = analysisState.selectedScenario.sourceReceipt;
      activeEvidenceTitle = `Scenario Shock: ${analysisState.selectedScenario.title}`;
      activeCaveat =
        analysisState.selectedScenario.sourceReceipt.caveats?.[0] ||
        'Calibrated macro vector.';
    }
  }

  // Centerpiece Graph Panel for Center Column
  const centerPanel = (
    <Card
      title="Financial Impact Knowledge Graph"
      subtitle="Multi-Step Macro-to-Micro Transmission Map"
      headerAction={
        <div className={styles.graphLegend}>
          <span className={styles.legendSolid}>━━ Observed</span>
          <span className={styles.legendDashed}>╍╍ Inferred</span>
          <Badge
            variant={analysisState.status === 'analyzed' ? 'cyan' : 'neutral'}
            size="sm"
          >
            {analysisState.status === 'analyzed'
              ? `${analysisState.graphData?.nodes.length || 0} Nodes Connected`
              : 'Standby'}
          </Badge>
        </div>
      }
      className={styles.graphCard}
    >
      {/* Path Filter Tabs */}
      <div className={styles.pathFilterBar} role="tablist" aria-label="Propagation Paths">
        <button
          type="button"
          role="tab"
          aria-selected={selectedPath === 'all'}
          className={`${styles.pathTab} ${selectedPath === 'all' ? styles.pathTabActive : ''}`}
          onClick={() => setSelectedPath('all')}
        >
          All Channels
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedPath === 'food_cost'}
          className={`${styles.pathTab} ${selectedPath === 'food_cost' ? styles.pathTabActive : ''}`}
          onClick={() => setSelectedPath('food_cost')}
        >
          Path A: Food Cost Chain
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedPath === 'transport_cost'}
          className={`${styles.pathTab} ${selectedPath === 'transport_cost' ? styles.pathTabActive : ''}`}
          onClick={() => setSelectedPath('transport_cost')}
        >
          Path B: Transport &amp; Freight
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={selectedPath === 'financial_market'}
          className={`${styles.pathTab} ${selectedPath === 'financial_market' ? styles.pathTabActive : ''}`}
          onClick={() => setSelectedPath('financial_market')}
        >
          Path C: Financial Markets
        </button>
      </div>

      {analysisState.status === 'error' && (
        <div className={styles.slotErrorContainer} role="alert">
          <span className={styles.slotErrorText}>
            ⚠️ {analysisState.errorMessage}
          </span>
          <button
            type="button"
            className={styles.slotRetryBtn}
            onClick={() => handleAnalyze(analysisState.selectedScenario.id)}
          >
            ↻ Retry Transmission Evaluation
          </button>
        </div>
      )}

      {/* Graph Canvas */}
      {CustomGraphCanvas && analysisState.status !== 'error' && (
        <CustomGraphCanvas
          data={analysisState.graphData || null}
          selectedPath={selectedPath}
          onSelectPath={setSelectedPath}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={setSelectedEdgeId}
          isLoading={analysisState.status === 'loading'}
        />
      )}

    </Card>
  );

  // Right Column: Household Persona & Evidence Slots for Laptop B
  const rightPanel = (
    <>
      {/* Household Persona Card Slot */}
      <Card
        title="Household Persona Impact"
        subtitle="MoSPI HCES 2023–24 Calibration"
        headerAction={
          <Badge variant="verified" size="sm">
            {personaConfig.state} ({personaConfig.sector})
          </Badge>
        }
      >
        {/* Archetype Controls (Sector & Expenditure Class) */}
        <div className={styles.archetypeControls}>
          <div className={styles.archetypeControlRow}>
            <span className={styles.archetypeLabel}>Sector:</span>
            <div className={styles.btnGroup}>
              <button
                type="button"
                className={`${styles.archetypeBtn} ${
                  personaConfig.sector === 'Rural' ? styles.archetypeBtnActive : ''
                }`}
                onClick={() =>
                  handlePersonaConfigChange({ ...personaConfig, sector: 'Rural' })
                }
              >
                Rural
              </button>
              <button
                type="button"
                className={`${styles.archetypeBtn} ${
                  personaConfig.sector === 'Urban' ? styles.archetypeBtnActive : ''
                }`}
                onClick={() =>
                  handlePersonaConfigChange({ ...personaConfig, sector: 'Urban' })
                }
              >
                Urban
              </button>
            </div>
          </div>

          <div className={styles.archetypeControlRow}>
            <span className={styles.archetypeLabel}>Class:</span>
            <div className={styles.btnGroup}>
              <button
                type="button"
                className={`${styles.archetypeBtn} ${
                  personaConfig.expenditureClass === 'Low' ? styles.archetypeBtnActive : ''
                }`}
                onClick={() =>
                  handlePersonaConfigChange({ ...personaConfig, expenditureClass: 'Low' })
                }
              >
                Low (Q1)
              </button>
              <button
                type="button"
                className={`${styles.archetypeBtn} ${
                  personaConfig.expenditureClass === 'Middle'
                    ? styles.archetypeBtnActive
                    : ''
                }`}
                onClick={() =>
                  handlePersonaConfigChange({ ...personaConfig, expenditureClass: 'Middle' })
                }
              >
                Middle (Q2–Q4)
              </button>
              <button
                type="button"
                className={`${styles.archetypeBtn} ${
                  personaConfig.expenditureClass === 'High' ? styles.archetypeBtnActive : ''
                }`}
                onClick={() =>
                  handlePersonaConfigChange({ ...personaConfig, expenditureClass: 'High' })
                }
              >
                High (Q5)
              </button>
            </div>
          </div>
        </div>

        {analysisState.status === 'error' && (
          <div className={styles.slotErrorContainer} role="alert">
            <span className={styles.slotErrorText}>
              ⚠️ Household impact calculation stalled due to evaluation error.
            </span>
          </div>
        )}

        {CustomHouseholdImpact && analysisState.status !== 'error' && (
          <CustomHouseholdImpact
            data={analysisState.personaData || null}
                selectedPersona={personaConfig}
                onPersonaChange={handlePersonaConfigChange}
                isAiOff={isAiOff}
                isLoading={false}
              />
        )}
      </Card>

      {/* Evidence Receipts Drawer Slot */}
      <Card
        title="Evidence Receipts &amp; Audit"
        subtitle="Number-Level Source Verification"
        headerAction={
          <Badge variant="cyan" size="sm">
            {selectedEdgeId ? 'Selected Edge' : selectedNodeId ? 'Selected Node' : 'Primary Source'}
          </Badge>
        }
      >
        {analysisState.status === 'error' && (
          <div className={styles.slotErrorContainer} role="alert">
            <span className={styles.slotErrorText}>
              ⚠️ Evidence audit unavailable.
            </span>
          </div>
        )}

        {CustomEvidencePanel && analysisState.status !== 'error' && (
          <CustomEvidencePanel
            receipt={activeEvidenceReceipt || null}
            contextTitle={activeEvidenceTitle}
            whatCouldBeWrong={activeCaveat}
            onClose={() => {
              setSelectedNodeId(null);
              setSelectedEdgeId(null);
            }}
          />
        )}
      </Card>
    </>
  );

  return (
    <AppLayout
      isAiOff={isAiOff}
      onToggleAi={handleToggleAi}
      activeScenarioTitle={analysisState.selectedScenario.title}
      backendStatus={backendStatus}
      onToggleForceOffline={handleToggleForceOffline}
      leftPanel={
        <ScenarioWorkspace
          scenarios={scenarios}
          analysisState={analysisState}
          onAnalyze={handleAnalyze}
          onResetToIdle={handleResetToIdle}
        />
      }
      centerPanel={centerPanel}
      rightPanel={rightPanel}
    />
  );
};
