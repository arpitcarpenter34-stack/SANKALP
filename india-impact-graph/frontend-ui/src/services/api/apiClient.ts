/**
 * India Impact Graph — API Client & Adapter
 * Handles communication with the FastAPI backend with strict payload contract validation
 * and transparent fallback to offline deterministic demo fixtures.
 */

import { BackendConnectionStatus } from '../../types';
import { AnalysisResponse } from './scenarioService';

const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Validates that an API payload strictly adheres to the AnalysisResponse contract.
 * An HTTP 200 alone is never sufficient if the payload is malformed or incomplete.
 */
export function isValidAnalysisPayload(data: unknown): data is AnalysisResponse {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  // 1. Validate scenario object
  if (!d.scenario || typeof d.scenario !== 'object') return false;
  const s = d.scenario as Record<string, unknown>;
  if (typeof s.id !== 'string' || typeof s.title !== 'string' || !s.sourceReceipt) return false;

  // 2. Validate graph object
  if (!d.graph || typeof d.graph !== 'object') return false;
  const g = d.graph as Record<string, unknown>;
  if (!Array.isArray(g.nodes) || !Array.isArray(g.edges) || g.nodes.length === 0) return false;

  // 3. Validate persona object
  if (!d.persona || typeof d.persona !== 'object') return false;
  const p = d.persona as Record<string, unknown>;
  if (!p.persona || typeof p.persona !== 'object' || !Array.isArray(p.itemBreakdown)) return false;
  if (typeof p.itemCoverage !== 'object' || p.itemCoverage === null) return false;

  return true;
}

class ApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private forceOffline: boolean = false;
  private lastAnalysisOperationLive: boolean = false;

  private lastStatus: BackendConnectionStatus = {
    isLive: false,
    endpointUrl: DEFAULT_API_URL,
    checkedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    mode: 'offline_demo_engine',
    label: 'OFFLINE DEMO ENGINE // LOCAL DETERMINISTIC FIXTURES',
    latencyMs: null,
  };

  /**
   * Check basic server reachability.
   * NOTE: A successful health ping alone does NOT mark analysis operations as live-verified.
   */
  async checkBackendHealth(): Promise<BackendConnectionStatus> {
    if (this.forceOffline) {
      this.lastStatus = {
        isLive: false,
        endpointUrl: this.baseUrl,
        checkedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        mode: 'offline_demo_engine',
        label: 'OFFLINE DEMO ENGINE (MANUALLY FORCED)',
        latencyMs: null,
      };
      return this.lastStatus;
    }

    const start = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        this.lastStatus = {
          isLive: this.lastAnalysisOperationLive,
          endpointUrl: this.baseUrl,
          checkedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          mode: this.lastAnalysisOperationLive ? 'live_backend' : 'offline_demo_engine',
          label: this.lastAnalysisOperationLive
            ? `LIVE FASTAPI BACKEND VERIFIED (${latencyMs}ms)`
            : `FASTAPI REACHABLE // AWAITING LIVE ANALYSIS EXECUTION (${latencyMs}ms)`,
          latencyMs,
        };
      } else {
        this.lastAnalysisOperationLive = false;
        this.lastStatus = {
          isLive: false,
          endpointUrl: this.baseUrl,
          checkedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
          mode: 'offline_demo_engine',
          label: `HTTP ${response.status} // DEMO ENGINE ACTIVE`,
          latencyMs,
        };
      }
    } catch {
      this.lastAnalysisOperationLive = false;
      this.lastStatus = {
        isLive: false,
        endpointUrl: this.baseUrl,
        checkedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        mode: 'offline_demo_engine',
        label: 'OFFLINE DEMO ENGINE // BACKEND NOT REACHABLE',
        latencyMs: null,
      };
    }

    return this.lastStatus;
  }

  /** Get cached connection status */
  getStatus(): BackendConnectionStatus {
    return this.lastStatus;
  }

  /** Reset analysis live flag before each execution */
  resetAnalysisLiveStatus(): void {
    this.lastAnalysisOperationLive = false;
  }

  /** Toggle simulation of offline mode for demonstration */
  setForceOffline(force: boolean): void {
    this.forceOffline = force;
    if (force) {
      this.lastAnalysisOperationLive = false;
    }
  }

  isForcedOffline(): boolean {
    return this.forceOffline;
  }

  /**
   * Post scenario transmission analysis request to live backend.
   * Only genuine 200 response with VALID payload contract marks the system as live-verified.
   */
  async postScenarioAnalysis(payload: {
    scenarioId: string;
    customText?: string;
    isAiOff: boolean;
    state?: string;
    sector?: string;
    expenditureClass?: string;
  }): Promise<AnalysisResponse> {
    // Reset status at start of operation
    this.lastAnalysisOperationLive = false;

    if (this.forceOffline) {
      throw new Error('Backend forced offline for demonstration testing.');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${this.baseUrl}/scenarios/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Backend returned HTTP status ${response.status}`);
      }

      const rawData = await response.json();

      // Strict Payload Contract Validation
      if (!isValidAnalysisPayload(rawData)) {
        throw new Error('Backend returned HTTP 200 but response body failed contract validation.');
      }

      this.lastAnalysisOperationLive = true;
      this.lastStatus = {
        isLive: true,
        endpointUrl: this.baseUrl,
        checkedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        mode: 'live_backend',
        label: 'LIVE FASTAPI BACKEND // REAL-TIME EXTRACTION VERIFIED',
        latencyMs: this.lastStatus.latencyMs,
      };

      return rawData;
    } catch (err) {
      clearTimeout(timeoutId);
      this.lastAnalysisOperationLive = false;
      throw err;
    }
  }
}

export const apiClient = new ApiClient();
