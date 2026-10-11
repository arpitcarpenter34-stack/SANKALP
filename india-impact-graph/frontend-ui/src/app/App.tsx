import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SummaryMetrics } from '../features/dashboard/SummaryMetrics';
import { HouseholdImpactCard } from '../features/dashboard/HouseholdImpactCard';
import { SipAffordabilityCard } from '../features/dashboard/SipAffordabilityCard';
import { NewsSignalsCard } from '../features/dashboard/NewsSignalsCard';
import { ExpenseForecastChart } from '../features/dashboard/ExpenseForecastChart';
import { AiAssistantDrawer } from '../features/dashboard/AiAssistantDrawer';
import { ScenarioWorkspace } from '../features/workspace/ScenarioWorkspace';
import { GlobalEventsView } from '../features/events/GlobalEventsView';
import { ImpactGraphView } from '../features/graph/ImpactGraphView';
import { SectorsView } from '../features/sectors/SectorsView';
import { HouseholdView } from '../features/household/HouseholdView';
import { SipForecastsView } from '../features/forecasts/SipForecastsView';
import { NewsInsightsView } from '../features/news/NewsInsightsView';
import { ConsumptionView } from '../features/consumption';
import { ComparisonView } from '../features/comparison';
import { MethodologyView } from '../features/methodology';
import { HouseholdAssumptions } from '../features/household/types';
import { PROFILE_PRESETS } from '../features/household/householdData';
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

  // Modals & Drawers state
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState<boolean>(false);
  const [isScenarioWorkspaceOpen, setIsScenarioWorkspaceOpen] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) return tab;
    } catch {
      // ignore
    }
    return 'impact-graph';
  });
  const [selectedSectorDomain, setSelectedSectorDomain] = useState<string>('semiconductors');
  const [activeNavTab, setActiveNavTab] = useState<string>('dashboard');

  // Backend connection state
  const [backendStatus, setBackendStatus] = useState<BackendConnectionStatus>(apiClient.getStatus());

  // Household Archetype Configuration (Anchored to MoSPI HCES 2023-24)
  const [householdAssumptions, setHouseholdAssumptions] = useState<HouseholdAssumptions>(
    PROFILE_PRESETS.urban_middle
  );

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

  // AI Assistant domain filter handler
  const handleDomainFilterFromAi = (domain: string) => {
    if (domain === 'petrol') {
      setSelectedPath('transport_cost');
    } else if (domain === 'food') {
      setSelectedPath('food_cost');
    } else if (domain === 'semiconductors' || domain === 'currency') {
      setSelectedPath('financial_market');
    } else {
      setSelectedPath('all');
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

  return (
    <AppLayout
      isAiOff={isAiOff}
      onToggleAi={handleToggleAi}
      activeScenarioTitle={analysisState.selectedScenario.title}
      backendStatus={backendStatus}
      onToggleForceOffline={handleToggleForceOffline}
      onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
      activeSidebarTab={activeSidebarTab}
      onSelectSidebarTab={setActiveSidebarTab}
      activeNavTab={activeNavTab}
      onSelectNavTab={setActiveNavTab}
    >
      {activeSidebarTab === 'global-events' ? (
        <GlobalEventsView
          onNavigateToGraph={(scenarioId) => {
            setActiveSidebarTab('impact-graph');
            if (scenarioId) {
              handleAnalyze(scenarioId);
            }
          }}
        />
      ) : activeSidebarTab === 'impact-graph' ? (
        <ImpactGraphView
          initialDomainId={selectedSectorDomain}
          onNavigateToScenario={() => {
            setIsScenarioWorkspaceOpen(true);
          }}
        />
      ) : activeSidebarTab === 'sectors' ? (
        <SectorsView
          onNavigateToGraph={(domainId) => {
            setSelectedSectorDomain(domainId);
            setActiveSidebarTab('impact-graph');
          }}
          onNavigateToHousehold={() => {
            setActiveSidebarTab('household-impact');
          }}
          onNavigateToNews={() => {
            setActiveSidebarTab('global-events');
          }}
        />
      ) : activeSidebarTab === 'household-impact' ? (
        <HouseholdView
          assumptions={householdAssumptions}
          onAssumptionsChange={setHouseholdAssumptions}
          onNavigateToSectors={(sectorId) => {
            if (sectorId) setSelectedSectorDomain(sectorId);
            setActiveSidebarTab('sectors');
          }}
          onNavigateToGraph={() => {
            setActiveSidebarTab('impact-graph');
          }}
          onNavigateToSipForecasts={() => {
            setActiveSidebarTab('sip-forecasts');
          }}
          onNavigateToConsumption={() => {
            setActiveSidebarTab('consumption');
          }}
          selectedEventId={analysisState.selectedScenario.id}
        />
      ) : activeSidebarTab === 'sip-forecasts' ? (
        <SipForecastsView
          selectedScenarioTitle={analysisState.selectedScenario.title}
          householdIncome={householdAssumptions.monthlyIncome}
          initialMonthlySip={householdAssumptions.currentSip}
          onSipAmountChange={(amount) => {
            setHouseholdAssumptions((prev) => ({ ...prev, currentSip: amount }));
          }}
          onChangeScenario={() => setIsScenarioWorkspaceOpen(true)}
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          onNavigateToHousehold={() => setActiveSidebarTab('household-impact')}
          onNavigateToSectors={(sectorId) => {
            if (sectorId) setSelectedSectorDomain(sectorId);
            setActiveSidebarTab('sectors');
          }}
          onNavigateToGraph={() => setActiveSidebarTab('impact-graph')}
        />
      ) : activeSidebarTab === 'news-insights' ? (
        <NewsInsightsView
          onNavigateToSector={(sectorId) => {
            if (sectorId) setSelectedSectorDomain(sectorId);
            setActiveSidebarTab('sectors');
          }}
          onNavigateToEvent={(eventId) => {
            setActiveSidebarTab('impact-graph');
            if (eventId) {
              handleAnalyze(eventId);
            }
          }}
          onNavigateToGraph={() => setActiveSidebarTab('impact-graph')}
        />
      ) : activeSidebarTab === 'consumption' ? (
        <ConsumptionView
          initialAssumptions={{
            monthlyIncome: householdAssumptions.monthlyIncome,
            familySize: householdAssumptions.familySize,
            location: householdAssumptions.location,
            lifestyle:
              householdAssumptions.consumptionPattern === 'frugal'
                ? 'frugal'
                : householdAssumptions.consumptionPattern === 'discretionary'
                ? 'discretionary'
                : 'moderate',
          }}
          onNavigateToHousehold={() => setActiveSidebarTab('household-impact')}
          onNavigateToSectors={(sectorId) => {
            if (sectorId) setSelectedSectorDomain(sectorId);
            setActiveSidebarTab('sectors');
          }}
          onNavigateToGraph={() => setActiveSidebarTab('impact-graph')}
          onNavigateToGlobalEvents={(eventId) => {
            setActiveSidebarTab('global-events');
            if (eventId) {
              handleAnalyze(eventId);
            }
          }}
          onNavigateToSipForecasts={() => setActiveSidebarTab('sip-forecasts')}
        />
      ) : activeSidebarTab === 'comparison' ? (
        <ComparisonView
          onNavigateToGlobalEvents={(eventId) => {
            setActiveSidebarTab('global-events');
            if (eventId) {
              handleAnalyze(eventId);
            }
          }}
          onNavigateToGraph={() => setActiveSidebarTab('impact-graph')}
          onNavigateToSectors={(sectorId) => {
            if (sectorId) setSelectedSectorDomain(sectorId);
            setActiveSidebarTab('sectors');
          }}
          onNavigateToHousehold={() => setActiveSidebarTab('household-impact')}
          onNavigateToSipForecasts={() => setActiveSidebarTab('sip-forecasts')}
          onNavigateToConsumption={() => setActiveSidebarTab('consumption')}
          onNavigateToMethodology={() => setActiveSidebarTab('methodology')}
        />
      ) : activeSidebarTab === 'methodology' ? (
        <MethodologyView
          onNavigateSection={(sectionId) => {
            if (sectionId === 'global-events') setActiveSidebarTab('global-events');
            else if (sectionId === 'impact-graph') setActiveSidebarTab('impact-graph');
            else if (sectionId === 'sectors') setActiveSidebarTab('sectors');
            else if (sectionId === 'household-impact') setActiveSidebarTab('household-impact');
            else if (sectionId === 'sip-forecasts') setActiveSidebarTab('sip-forecasts');
            else if (sectionId === 'consumption') setActiveSidebarTab('consumption');
            else if (sectionId === 'comparison') setActiveSidebarTab('comparison');
            else setActiveSidebarTab(sectionId);
          }}
        />
      ) : (
        <div className={styles.dashboardContainer}>
          {/* 1. Quick Scenario Switcher Header Bar */}
          <div className={styles.scenarioBar}>
            <div className={styles.scenarioBarLeft}>
              <span className={styles.scenarioIcon} aria-hidden="true">🌐</span>
              <span className={styles.scenarioLabel}>Active Scenario:</span>
              <select
                className={styles.scenarioSelect}
                value={analysisState.selectedScenario.id}
                onChange={(e) => handleAnalyze(e.target.value)}
                aria-label="Select Macroeconomic Event Scenario"
              >
                {scenarios.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.scenarioBarRight}>
              <button
                type="button"
                className={styles.customNewsBtn}
                onClick={() => setIsScenarioWorkspaceOpen(true)}
                title="Open full scenario testbench & custom news input"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Scenario Testbench</span>
              </button>

              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetToIdle}
                title="Reset dashboard to default scenario"
              >
                Reset
              </button>
            </div>
          </div>

          {/* 2. Top Summary Metric Cards */}
          <SummaryMetrics
            personaData={analysisState.personaData}
            graphData={analysisState.graphData}
            onEditForecast={() => setIsScenarioWorkspaceOpen(true)}
          />

          {/* 3. Center Dashboard Grid: Left Graph & Right Stack */}
          <div className={styles.dashboardCenterGrid}>
            {/* Left Column: Economic Impact Graph */}
            <div className={styles.graphColumn}>
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
            </div>

            {/* Right Column: Household Impact + SIP Affordability + News Signals */}
            <div className={styles.cardsColumn}>
              <HouseholdImpactCard
                data={analysisState.personaData}
                onEdit={() => setIsPersonaModalOpen(true)}
                onViewDetails={() => setIsPersonaModalOpen(true)}
              />

              <SipAffordabilityCard
                onOpenCalculator={() => setActiveSidebarTab('sip-forecasts')}
              />

              <NewsSignalsCard />
            </div>
          </div>

          {/* 4. Bottom Row: 6-Month Expense Forecast Chart */}
          <ExpenseForecastChart
            scenarioTitle={analysisState.selectedScenario.title}
          />
        </div>
      )}

      {/* 5. Interactive AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onApplyDomainFilter={handleDomainFilterFromAi}
        activeScenarioTitle={analysisState.selectedScenario.title}
        sipContext={{
          monthlySip: householdAssumptions.currentSip,
          householdIncome: householdAssumptions.monthlyIncome,
          selectedScenarioName: analysisState.selectedScenario.title,
        }}
      />

      {/* 6. Contextual Evidence Receipt Drawer (when node or edge selected) */}
      {CustomEvidencePanel && (selectedNodeId || selectedEdgeId) && (
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

      {/* 7. Household Archetype Modal (when Edit clicked) */}
      {isPersonaModalOpen && CustomHouseholdImpact && (
        <div className={styles.modalBackdrop} onClick={() => setIsPersonaModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setIsPersonaModalOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <CustomHouseholdImpact
              data={analysisState.personaData || null}
              selectedPersona={personaConfig}
              onPersonaChange={handlePersonaConfigChange}
              isAiOff={isAiOff}
              isLoading={analysisState.status === 'loading'}
            />
          </div>
        </div>
      )}

      {/* 8. Full Scenario Workspace Modal (when Testbench clicked) */}
      {isScenarioWorkspaceOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsScenarioWorkspaceOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setIsScenarioWorkspaceOpen(false)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <ScenarioWorkspace
              scenarios={scenarios}
              analysisState={analysisState}
              onAnalyze={handleAnalyze}
              onResetToIdle={handleResetToIdle}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
};
