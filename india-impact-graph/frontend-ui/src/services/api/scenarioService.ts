/**
 * India Impact Graph — Scenario Service
 * Coordinates scenario retrieval and analysis transmission flows.
 * Connects to live FastAPI backend when available, or gracefully falls back
 * to deterministic local demo fixtures with transparent labeling.
 */

import {
  EventScenario,
  PersonaImpactSummary,
  HouseholdPersonaConfig,
  BackendConnectionStatus,
  AnalysisResponse,
} from '../../types';
import {
  MOCK_SCENARIOS,
  getScenarioGraph,
  calculatePersonaImpact,
} from './mockData';
import { apiClient } from './apiClient';



export const scenarioService = {
  /** Check connectivity to the FastAPI backend */
  async checkBackend(): Promise<BackendConnectionStatus> {
    return apiClient.checkBackendHealth();
  },

  /** Retrieve all pre-configured demo benchmark scenarios */
  async getScenarios(): Promise<EventScenario[]> {
    return Promise.resolve(MOCK_SCENARIOS);
  },

  /** Retrieve a scenario by ID */
  async getScenarioById(id: string): Promise<EventScenario | undefined> {
    const scenario = MOCK_SCENARIOS.find((s) => s.id === id);
    return Promise.resolve(scenario);
  },

  /**
   * Recalculate persona impact for the active scenario and archetype
   */
  recalculatePersona(
    scenarioId: string,
    personaConfig: HouseholdPersonaConfig,
    isAiOff: boolean = false
  ): PersonaImpactSummary {
    return calculatePersonaImpact(scenarioId, personaConfig, isAiOff);
  },

  /**
   * Analyze an event scenario or custom news dispatch
   * Tries live backend first, falls back gracefully to deterministic demo engine
   */
  async analyzeScenario(
    scenarioId: string,
    customText?: string,
    isAiOff: boolean = false,
    personaConfig: HouseholdPersonaConfig = {
      state: 'Madhya Pradesh',
      sector: 'Rural',
      expenditureClass: 'Middle',
    },
    simulateError: boolean = false
  ): Promise<AnalysisResponse> {
    if (simulateError) {
      // Allow testing error states explicitly
      await new Promise((resolve) => setTimeout(resolve, 350));
      throw new Error('Simulated transmission evaluation error: Backend connection rejected or invalid payload.');
    }

    // 1. Reset live-analysis status at the start of each new analysis
    apiClient.resetAnalysisLiveStatus();

    // 2. Attempt live backend call if not forced offline
    if (!apiClient.isForcedOffline()) {
      try {
        const liveResult = (await apiClient.postScenarioAnalysis({
          scenarioId,
          customText,
          isAiOff,
          state: personaConfig.state,
          sector: personaConfig.sector,
          expenditureClass: personaConfig.expenditureClass,
        })) as AnalysisResponse;

        if (liveResult && liveResult.graph && liveResult.persona) {
          return {
            ...liveResult,
            isLiveBackend: true,
            dataSourceLabel: 'LIVE FASTAPI BACKEND // REAL-TIME EXTRACTION',
          };
        }
      } catch {
        // Fall through to deterministic demo fallback on unreachable, invalid, or error responses
      }
    }

    // 3. Deterministic Local Demo Engine Fallback (Graceful offline execution)
    // Simulated realistic processing latency (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    let selectedScenario: EventScenario | undefined;

    if (scenarioId === 'custom' || (!scenarioId && customText)) {
      const text = (customText || '').trim();
      selectedScenario = {
        id: 'custom',
        title: 'Custom Financial News Dispatch (User Input)',
        eventType: 'custom',
        magnitude: 'Unquantified',
        magnitudeNumeric: null,
        magnitudeUnit: null,
        isHypotheticalScenario: false,
        headline: text ? text.slice(0, 80) : 'Custom News Bulletin',
        summaryText: text ? text.slice(0, 240) + '...' : 'No news text provided.',
        fullArticleText: text,
        sourceReceipt: {
          sourceTitle: 'Direct User Text Dispatch',
          publisher: 'Manual Input Terminal',
          vintageYear: '2026',
          verificationStatus: '[UNVERIFIED]',
          caveats: [
            'Unextracted user dispatch. Requires live Reader LLM pipeline.',
            'No verified pass-through coefficients available for unquantified text.',
          ],
        },
      };
    } else {
      selectedScenario = MOCK_SCENARIOS.find((s) => s.id === scenarioId);
    }

    if (!selectedScenario) {
      selectedScenario = MOCK_SCENARIOS[0];
    }

    // Get tailored graph and persona fixtures
    const graphData = getScenarioGraph(selectedScenario.id, customText);
    const personaData = calculatePersonaImpact(selectedScenario.id, personaConfig, isAiOff);

    return {
      scenario: selectedScenario,
      graph: graphData,
      persona: personaData,
      isAiOff,
      analyzedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      isLiveBackend: false,
      dataSourceLabel: 'DETERMINISTIC DEMO FIXTURE // OFFLINE ENGINE',
    };
  },
};
