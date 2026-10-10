/**
 * India Impact Graph — Shared TypeScript Contracts
 * Agreed interface contracts for Laptop A (App Shell/Workspace) & Laptop B (Graph/Evidence/Impact)
 */

export type VerificationStatus = '[VERIFIED]' | '[VERIFY]' | '[INFERENCE]' | '[UNVERIFIED]';

export type NodeType =
  | 'commodity'
  | 'household_item'
  | 'economic_indicator'
  | 'sector'
  | 'instrument_asset'
  | 'persona';

export type PropagationPathCategory = 'food_cost' | 'transport_cost' | 'financial_market' | 'other';

/** Source receipt backing every displayed number or relationship */
export interface SourceReceipt {
  sourceTitle: string;
  publisher: string;
  tableOrSeriesId?: string | null;
  vintageYear?: string | null;
  geography?: string | null;
  unit?: string | null;
  verificationStatus: VerificationStatus;
  formulaDetails?: string | null;
  sourceUrl?: string | null;
  caveats?: string[];
}

/** 1. Financial Event Scenario Definition */
export interface EventScenario {
  id: string;
  title: string;
  eventType: 'commodity_shock' | 'geopolitical' | 'interest_rate' | 'regulatory' | 'custom';
  magnitude: string; // e.g., "+12.0%"
  magnitudeNumeric: number | null; // null if unquantified
  magnitudeUnit: string | null; // e.g., "%", "$/barrel"
  isHypotheticalScenario: boolean; // true if scenario, false if dated historical event
  eventDate?: string | null;
  headline?: string;
  summaryText: string;
  fullArticleText?: string;
  sourceReceipt: SourceReceipt;
}

/** 2. Knowledge Graph Node Definition (Laptop B Slot) */
export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  budgetSharePct?: number | null; // null if not a household item or missing from HCES
  isObservedFact: boolean; // true = observed, false = inferred
  receipt?: SourceReceipt;
}

/** 3. Knowledge Graph Edge Definition (Laptop B Slot) */
export interface KnowledgeGraphEdge {
  id: string;
  from: string;
  to: string;
  relationType: string; // e.g. "refines_into", "freight_cost_for"
  kind: 'observed' | 'inferred'; // Observed = Solid line, Inferred = Dashed line
  direction: 'positive' | 'negative' | 'ambiguous';
  strengthScore?: number | null; // elasticity coefficient if supported, null if unquantified
  confidence: 'high' | 'medium' | 'low';
  evidenceQuote: string;
  pathCategory: PropagationPathCategory;
  whatCouldBeWrong?: string; // Counter-arguments, subsidies, policy interventions
  receipt: SourceReceipt;
}

/** Full Knowledge Graph Payload */
export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  availablePaths: {
    id: PropagationPathCategory;
    name: string;
    description: string;
    active: boolean;
  }[];
}

/** 4. Household Persona Configuration */
export interface HouseholdPersonaConfig {
  state: string; // Default: "Madhya Pradesh"
  sector: 'Rural' | 'Urban';
  expenditureClass: 'Low' | 'Middle' | 'High'; // MPCE fractile classes
}

/** 5. Item-Level Expenditure Impact Breakdown */
export interface PersonaItemImpact {
  itemId: string;
  itemName: string;
  budgetSharePct: number | null; // null if missing
  passThroughFactor: { low: number; high: number } | null; // null if pass-through is unverified
  estimatedMonthlyImpactInr: { low: number; high: number } | null; // null if missing data
  dataStatus: 'available' | 'data_not_available';
  receipt: SourceReceipt;
}

/** 6. Persona Impact Card Calculated State (Laptop B Slot) */
export interface PersonaImpactSummary {
  persona: HouseholdPersonaConfig;
  mpceBaselineInr: number | null; // null if unverified
  mpceBaselineReceipt?: SourceReceipt; // Source attribution for the MPCE baseline value
  totalMonthlyImpactRangeInr: { low: number; high: number } | null; // null if missing data
  unit: string; // e.g., "₹ / person / month (Per Capita)"
  isHouseholdConversion: boolean;
  averageHouseholdSize?: number | null;
  itemCoverage: {
    totalCandidateItems: number;
    calculatedItemsCount: number;
    uncalculatedItemsCount: number;
    calculatedExpenditureSharePct: number;
  };
  itemBreakdown: PersonaItemImpact[];
  isAiOff: boolean;
  notes: string;
}

/** 7. Transmission Analysis State */
export interface TransmissionAnalysisState {
  status: 'idle' | 'loading' | 'analyzed' | 'error';
  selectedScenario: EventScenario;
  graphData: KnowledgeGraphData | null;
  personaData: PersonaImpactSummary | null;
  isAiOff: boolean;
  errorMessage?: string;
}

/** 8. Backend Connectivity Contract */
export interface BackendConnectionStatus {
  isLive: boolean;
  endpointUrl: string;
  checkedAt: string;
  mode: 'live_backend' | 'offline_demo_engine' | 'partial_backend';
  label: string;
  latencyMs?: number | null;
}

/** 9. Integration Slot Props — Laptop B Feature Contracts */

/** Props contract for Laptop B's Interactive Knowledge Graph Canvas Slot */
export interface GraphCanvasSlotProps {
  data: KnowledgeGraphData | null;
  selectedPath: PropagationPathCategory | 'all';
  onSelectPath?: (path: PropagationPathCategory | 'all') => void;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  selectedEdgeId?: string | null;
  onSelectEdge?: (edgeId: string | null) => void;
  isLoading?: boolean;
}

/** Props contract for Laptop B's Household Persona Impact Card Slot */
export interface HouseholdImpactSlotProps {
  data: PersonaImpactSummary | null;
  selectedPersona: HouseholdPersonaConfig;
  onPersonaChange?: (newConfig: HouseholdPersonaConfig) => void;
  isAiOff: boolean;
  isLoading?: boolean;
}

/** Props contract for Laptop B's Evidence Receipts & Source Audit Drawer Slot */
export interface EvidencePanelSlotProps {
  receipt: SourceReceipt | null;
  contextTitle?: string;
  whatCouldBeWrong?: string | null;
  onClose?: () => void;
}


/**
 * Request payload for the /scenarios/analyze live backend endpoint.
 */
export interface AnalysisRequest {
  scenarioId: string;
  customText?: string;
  isAiOff: boolean;
  state?: string;
  sector?: string;
  expenditureClass?: string;
}

/**
 * Response payload from the /scenarios/analyze live backend endpoint.
 * Combines scenario metadata, topological graph dependencies, and calculated persona impact.
 */
export interface AnalysisResponse {
  scenario: EventScenario;
  graph: KnowledgeGraphData;
  persona: PersonaImpactSummary;
  isAiOff: boolean;
  analyzedAt: string;
  isLiveBackend: boolean;
  dataSourceLabel: string;
}
