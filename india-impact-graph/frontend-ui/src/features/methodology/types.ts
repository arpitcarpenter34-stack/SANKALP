/**
 * Type definitions and contracts for the BharatImpact Methodology section.
 * Enforces evidence-first transparency, authentic data source statuses,
 * and verifiable calculation models.
 */

export type MethodologyTab =
  | 'how_it_works'
  | 'data_sources'
  | 'models_forecasting'
  | 'impact_calculation'
  | 'validation_accuracy'
  | 'limitations';

export type SourceIntegrationStatus =
  | 'connected'
  | 'historical_dataset'
  | 'cached_data'
  | 'static_fixture'
  | 'configured_unverified'
  | 'unavailable';

export type SourceCategory =
  | 'global_news'
  | 'market_data'
  | 'trade_economic'
  | 'sectoral_data'
  | 'household_consumption'
  | 'government_policies';

export interface WorkflowStage {
  id: string;
  stepNumber: number;
  title: string;
  shortDesc: string;
  fullDesc: string;
  iconType: 'globe' | 'database' | 'chart' | 'home' | 'forecast' | 'bulb';
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  implementedMechanism: string;
  limitations: string;
  targetSection?: string;
}

export interface DataSourceItem {
  id: string;
  name: string;
  publisher: string;
  category: SourceCategory;
  integrationStatus: SourceIntegrationStatus;
  dataTypes: string[];
  frequency: string;
  coverage: string;
  sourceUrl?: string;
  seriesOrTableId?: string;
  lastUpdated?: string;
  attribution: string;
  caveats: string;
}

export interface AnalyticalModel {
  id: string;
  name: string;
  category: 'nlp' | 'econometric' | 'rules_ml' | 'input_output' | 'scenario';
  shortDesc: string;
  purpose: string;
  inputData: string[];
  processingSteps: string[];
  output: string;
  assumptions: string[];
  limitations: string[];
  appSection: string;
}

export interface CalculationFormulaStage {
  id: string;
  stageName: string;
  formulaTex: string;
  formulaPlain: string;
  description: string;
  variables: { symbol: string; name: string; unit: string; description: string }[];
  workedExample: {
    inputValues: Record<string, string | number>;
    calculationSteps: string[];
    finalResult: string;
  };
  assumptions: string[];
}

export interface ImpactFlowStage {
  id: string;
  label: string;
  exampleValue: string;
  description: string;
  category: string;
  iconType: 'globe' | 'trending' | 'sector' | 'home' | 'bulb';
}

export interface MethodologyWorkedExample {
  id: string;
  title: string;
  shockPercentage: string;
  globalEvent: {
    headline: string;
    detectionMethod: string;
    classification: string;
  };
  macroImpact: {
    cadImpact: string;
    inflationPressure: string;
    transmissionSpeed: string;
  };
  sectorImpacts: { sector: string; deltaPct: string }[];
  householdImpact: {
    monthlyDeltaInr: number;
    topCategory: string;
    affectedBaskets: string[];
  };
  recommendations: string[];
  targetEventId?: string;
}

export interface ValidationMetric {
  id: string;
  title: string;
  scoreOrPct: string;
  metricType: 'accuracy_percentage' | 'test_coverage' | 'backtest_concordance';
  benchmarkStatus: 'verified_dataset' | 'empirical_backtest' | 'software_test_suite';
  description: string;
  evaluationMethod: string;
  sampleSize: string;
  evaluationPeriod: string;
  limitations: string;
}

export interface MethodologyLimitation {
  id: string;
  title: string;
  affectedFeature: string;
  whatIsUnavailable: string;
  workaroundInPlace: string;
  futureCapabilityNeeded: string;
}
