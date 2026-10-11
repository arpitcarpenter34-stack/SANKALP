import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { SummaryMetrics } from '../features/dashboard/SummaryMetrics';
import { HouseholdImpactCard } from '../features/dashboard/HouseholdImpactCard';
import { SipAffordabilityCard } from '../features/dashboard/SipAffordabilityCard';
import { ForecastHorizonCard } from '../features/dashboard/ForecastHorizonCard';
import { NewsSignalsCard } from '../features/dashboard/NewsSignalsCard';
import { ExpenseForecastChart } from '../features/dashboard/ExpenseForecastChart';
import { AiAssistantDrawer } from '../features/dashboard/AiAssistantDrawer';
import { ScenarioWorkspace } from '../features/workspace/ScenarioWorkspace';
import { GlobalEventsView } from '../features/events/GlobalEventsView';
import { ImpactGraphView } from '../features/graph/ImpactGraphView';
import { SectorsView } from '../features/sectors/SectorsView';
import { HouseholdView } from '../features/household/HouseholdView';
import { SipForecastsView } from '../features/forecasts/SipForecastsView';
import { ForecastHorizonModal } from '../features/forecasts/ForecastHorizonModal';
import { NewsInsightsView } from '../features/news/NewsInsightsView';
import { ConsumptionView } from '../features/consumption';
import { ComparisonView } from '../features/comparison';
import { MethodologyView } from '../features/methodology';
import { SettingsView, loadSettingsFromStorage, applyTheme } from '../features/settings';
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
import { useAuth } from '@clerk/react';
import { AuthScreen } from '../features/auth/AuthScreen';
import styles from './App.module.css';

interface ClerkAuthSyncProps {
  onAuthStateChange: (state: { isSignedIn: boolean; isLoaded: boolean }) => void;
}

const ClerkAuthSync: React.FC<ClerkAuthSyncProps> = ({ onAuthStateChange }) => {
  const { getToken, isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    onAuthStateChange({ isSignedIn: Boolean(isSignedIn), isLoaded: Boolean(isLoaded) });
  }, [isSignedIn, isLoaded, onAuthStateChange]);

  useEffect(() => {
    if (isSignedIn && getToken) {
      apiClient.setTokenGetter(getToken);
    } else {
      apiClient.setTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  return null;
};

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
  const isClerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [clerkState, setClerkState] = useState<{ isSignedIn: boolean; isLoaded: boolean }>({
    isSignedIn: false,
    isLoaded: !isClerkConfigured,
  });

  const handleAuthStateChange = React.useCallback((state: { isSignedIn: boolean; isLoaded: boolean }) => {
    setClerkState(state);
  }, []);

  const [scenarios] = useState<EventScenario[]>(MOCK_SCENARIOS);
  const [isAiOff, setIsAiOff] = useState<boolean>(false);
  const [selectedPath, setSelectedPath] = useState<PropagationPathCategory | 'all'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Modals & Drawers state
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState<boolean>(false);
  const [isScenarioWorkspaceOpen, setIsScenarioWorkspaceOpen] = useState<boolean>(false);
  const [forecastHorizon, setForecastHorizon] = useState<number>(6);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) return tab;
      const initialSettings = loadSettingsFromStorage();
      if (initialSettings?.preferences?.defaultView) {
        return initialSettings.preferences.defaultView;
      }
    } catch {
      // ignore
    }
    return 'overview';
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

  // Check backend health and apply theme on initial mount
  useEffect(() => {
    scenarioService.checkBackend().then(setBackendStatus);
    const initialSettings = loadSettingsFromStorage();
    applyTheme(initialSettings.display.theme);
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

  if (isClerkConfigured && !clerkState.isLoaded) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-canvas, #F7FAF8)',
        color: 'var(--text-primary, #172B3A)',
        fontFamily: 'var(--font-sans, system-ui, sans-serif)',
        gap: '16px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #D8EADF',
          borderTopColor: '#047857',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#047857' }}>
          Initializing BharatImpact Secure Workspace...
        </span>
        <ClerkAuthSync onAuthStateChange={handleAuthStateChange} />
      </div>
    );
  }

  if (isClerkConfigured && !clerkState.isSignedIn && !isGuestMode) {
    return (
      <>
        <ClerkAuthSync onAuthStateChange={handleAuthStateChange} />
        <AuthScreen onContinueAsGuest={() => setIsGuestMode(true)} />
      </>
    );
  }

  return (
    <>
      {isClerkConfigured && <ClerkAuthSync onAuthStateChange={handleAuthStateChange} />}
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
      ) : activeSidebarTab === 'settings' ? (
        <SettingsView
          onNavigateSection={(sectionId) => {
            if (sectionId === 'global-events') setActiveSidebarTab('global-events');
            else if (sectionId === 'impact-graph') setActiveSidebarTab('impact-graph');
            else if (sectionId === 'sectors') setActiveSidebarTab('sectors');
            else if (sectionId === 'household-impact') setActiveSidebarTab('household-impact');
            else if (sectionId === 'sip-forecasts') setActiveSidebarTab('sip-forecasts');
            else if (sectionId === 'consumption') setActiveSidebarTab('consumption');
            else if (sectionId === 'comparison') setActiveSidebarTab('comparison');
            else if (sectionId === 'methodology') setActiveSidebarTab('methodology');
            else setActiveSidebarTab(sectionId);
          }}
        />
      ) : (
        /* Overview Page: Closest Visual Match to Supplied Reference Screenshot */
        <div className={styles.dashboardContainer}>
          {/* 1. Page Title & Description */}
          <div className={styles.overviewPageHeader}>
            <div className={styles.overviewHeaderLeft}>
              <div className={styles.overviewIconBadge} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <div className={styles.overviewTitleCol}>
                <h1 className={styles.overviewTitle}>Overview</h1>
                <p className={styles.overviewSubtitle}>
                  Track global events and understand their impact on the Indian economy, sectors, household expenses and investments.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Active Scenario Switcher Bar */}
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
                  <path d="M10 2v7.31M14 2v7.31M8.5 2h7M14 9.3l5.5 8.7a2 2 0 0 1-1.7 3H6.2a2 2 0 0 1-1.7-3L10 9.3" />
                </svg>
                <span>Scenario Testbench</span>
              </button>

              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetToIdle}
                title="Reset dashboard to default scenario"
              >
                ↻ Reset
              </button>
            </div>
          </div>

          {/* 3. Top Summary Metric Cards (4 cards across full width) */}
          <SummaryMetrics
            personaData={analysisState.personaData}
            graphData={analysisState.graphData}
            forecastHorizon={forecastHorizon}
            onEditForecast={() => setIsForecastModalOpen(true)}
          />

          {/* 4. Full-width Economic Impact Graph */}
          <div className={styles.fullWidthGraphSection}>
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

          {/* 5. Three-Column Cards Row below Graph (Household Impact, SIP Affordability, Forecast Horizon) */}
          <div className={styles.threeCardsRow}>
            <HouseholdImpactCard
              data={analysisState.personaData}
              onEdit={() => setIsPersonaModalOpen(true)}
              onViewDetails={() => setIsPersonaModalOpen(true)}
            />

            <SipAffordabilityCard
              onOpenCalculator={() => setActiveSidebarTab('sip-forecasts')}
            />

            <ForecastHorizonCard
              forecastHorizon={forecastHorizon}
              onEdit={() => setIsForecastModalOpen(true)}
            />
          </div>

          {/* 6. Full-Width Bottom Row: News & Signals */}
          <NewsSignalsCard />

          {/* 7. Collapsible / Secondary Expense Forecast Projections */}
          <div className={styles.forecastChartWrapper}>
            <ExpenseForecastChart
              scenarioTitle={analysisState.selectedScenario.title}
              forecastHorizon={forecastHorizon}
            />
          </div>
        </div>
      )}

      {/* Interactive AI Assistant Drawer */}
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

      {/* Contextual Evidence Receipt Drawer (when node or edge selected) */}
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

      {/* Household Archetype Modal (when Edit clicked) */}
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

      {/* Full Scenario Workspace Modal (when Testbench clicked) */}
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
              onClose={() => setIsScenarioWorkspaceOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Forecast Horizon Modal (when Edit clicked on Forecast Horizon metric) */}
      <ForecastHorizonModal
        isOpen={isForecastModalOpen}
        currentHorizon={forecastHorizon}
        onClose={() => setIsForecastModalOpen(false)}
        onApplyHorizon={(horizon) => setForecastHorizon(horizon)}
      />
    </AppLayout>
    </>
  );
};
