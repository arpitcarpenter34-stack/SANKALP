import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { ScenarioWorkspace } from '../features/workspace/ScenarioWorkspace';
import { scenarioService } from '../services/api/scenarioService';
import { apiClient } from '../services/api/apiClient';
import { MOCK_SCENARIOS, getScenarioGraph, calculatePersonaImpact } from '../services/api/mockData';
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

  // Household Archetype Configuration
  const [personaConfig, setPersonaConfig] = useState<HouseholdPersonaConfig>({
    state: 'Madhya Pradesh',
    sector: 'Rural',
    expenditureClass: 'Middle',
  });

  const [analysisState, setAnalysisState] = useState<TransmissionAnalysisState>({
    status: 'analyzed',
    selectedScenario: MOCK_SCENARIOS[0],
    graphData: getScenarioGraph(MOCK_SCENARIOS[0].id),
    personaData: calculatePersonaImpact(MOCK_SCENARIOS[0].id, {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Middle',
    }, false),
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
      status: 'analyzed',
      selectedScenario: MOCK_SCENARIOS[0],
      graphData: getScenarioGraph(MOCK_SCENARIOS[0].id),
      personaData: calculatePersonaImpact(MOCK_SCENARIOS[0].id, personaConfig, isAiOff),
      isAiOff,
    });
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSelectedPath('all');
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

  // Determine active receipt to display in Evidence Panel
  let activeEvidenceReceipt: SourceReceipt | null = null;
  let activeEvidenceTitle = 'Indian Energy Imports & Transport Share';
  let activeCaveat = 'Higher global crude oil prices increase India\'s import bill, affecting fiscal balance and domestic fuel prices.';

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
  }

  // Centerpiece Graph Panel for Center Column
  const centerPanel = (
    <>
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

      {CustomGraphCanvas && (
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
    </>
  );

  // Right Column: Household Persona & Evidence Slots
  const rightPanel = (
    <>
      {CustomHouseholdImpact && (
        <CustomHouseholdImpact
          data={analysisState.personaData || null}
          selectedPersona={personaConfig}
          onPersonaChange={handlePersonaConfigChange}
          isAiOff={isAiOff}
          isLoading={analysisState.status === 'loading'}
        />
      )}

      {CustomEvidencePanel && (
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
