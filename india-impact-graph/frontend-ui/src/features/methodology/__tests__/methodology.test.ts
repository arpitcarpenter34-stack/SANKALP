import { describe, it, expect } from 'vitest';
import {
  APPROACH_STAGES,
  DATA_SOURCES_REGISTRY,
  ANALYTICAL_MODELS,
  CALCULATION_FORMULAS,
  IMPACT_FLOW_STAGES,
  METHODOLOGY_EXAMPLES,
  VALIDATION_METRICS,
  METHODOLOGY_LIMITATIONS,
} from '../methodologyData';
import { generateMethodologyReportText } from '../reportGenerator';

describe('BharatImpact Methodology Architecture & Verification Tests', () => {
  describe('1. Approach Workflow Stages', () => {
    it('contains exactly 6 chronological workflow stages matching the architecture specification', () => {
      expect(APPROACH_STAGES).toHaveLength(6);
      expect(APPROACH_STAGES.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6]);
      expect(APPROACH_STAGES.map((s) => s.id)).toEqual([
        'stage_1_event_detection',
        'stage_2_data_aggregation',
        'stage_3_economic_sector_impact',
        'stage_4_household_translation',
        'stage_5_forecasting_scenarios',
        'stage_6_actionable_insights',
      ]);
    });

    it('documents concrete implemented mechanisms and limitations for each stage', () => {
      APPROACH_STAGES.forEach((stage) => {
        expect(stage.title).toBeTruthy();
        expect(stage.shortDesc).toBeTruthy();
        expect(stage.fullDesc).toBeTruthy();
        expect(stage.implementedMechanism).toBeTruthy();
        expect(stage.limitations).toBeTruthy();
        expect(stage.accentColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });

  describe('2. Data Sources Registry & Provenance Verification', () => {
    it('registers verified primary data sources with truthful integration statuses', () => {
      expect(DATA_SOURCES_REGISTRY.length).toBeGreaterThanOrEqual(8);

      const validStatuses = [
        'connected',
        'historical_dataset',
        'cached_data',
        'static_fixture',
        'configured_unverified',
        'unavailable',
      ];

      DATA_SOURCES_REGISTRY.forEach((src) => {
        expect(validStatuses).toContain(src.integrationStatus);
        expect(src.name).toBeTruthy();
        expect(src.publisher).toBeTruthy();
        expect(src.dataTypes.length).toBeGreaterThan(0);
        expect(src.attribution).toBeTruthy();
        expect(src.caveats).toBeTruthy();
      });
    });

    it('covers all six official source categories without fictitious integrations', () => {
      const categories = new Set(DATA_SOURCES_REGISTRY.map((s) => s.category));
      expect(categories.has('global_news')).toBe(true);
      expect(categories.has('market_data')).toBe(true);
      expect(categories.has('trade_economic')).toBe(true);
      expect(categories.has('sectoral_data')).toBe(true);
      expect(categories.has('household_consumption')).toBe(true);
      expect(categories.has('government_policies')).toBe(true);
    });

    it('anchors consumption data strictly to official MoSPI HCES 2023-24', () => {
      const hcesSource = DATA_SOURCES_REGISTRY.find((s) => s.id === 'SRC-03');
      expect(hcesSource).toBeDefined();
      expect(hcesSource?.publisher).toContain('MoSPI');
      expect(hcesSource?.seriesOrTableId).toContain('Statement 7');
    });
  });

  describe('3. Analytical Models & Techniques', () => {
    it('defines 5 verified analytical models across distinct economic disciplines', () => {
      expect(ANALYTICAL_MODELS).toHaveLength(5);
      expect(ANALYTICAL_MODELS.map((m) => m.id)).toEqual([
        'model_nlp',
        'model_econometric',
        'model_persona_scaling',
        'model_dag',
        'model_scenario',
      ]);
    });

    it('specifies explicit inputs, processing steps, assumptions, and limitations for each model', () => {
      ANALYTICAL_MODELS.forEach((model) => {
        expect(model.name).toBeTruthy();
        expect(model.purpose).toBeTruthy();
        expect(model.inputData.length).toBeGreaterThan(0);
        expect(model.processingSteps.length).toBeGreaterThan(0);
        expect(model.output).toBeTruthy();
        expect(model.assumptions.length).toBeGreaterThan(0);
        expect(model.limitations.length).toBeGreaterThan(0);
        expect(model.appSection).toBeTruthy();
      });
    });

    it('truthfully labels NLP as regex/rule-based rather than unsupported black-box LLM', () => {
      const nlpModel = ANALYTICAL_MODELS.find((m) => m.id === 'model_nlp');
      expect(nlpModel).toBeDefined();
      expect(nlpModel?.name).toContain('Rule-Based');
      expect(nlpModel?.processingSteps[0]).toContain('Regex matching');
    });
  });

  describe('4. Impact Calculation Mathematical Formulas', () => {
    it('documents 4 mathematical stages from global shock to household SIP capacity', () => {
      expect(CALCULATION_FORMULAS).toHaveLength(4);
      expect(CALCULATION_FORMULAS.map((f) => f.id)).toEqual([
        'calc_event_commodity',
        'calc_commodity_sector',
        'calc_sector_household',
        'calc_household_sip',
      ]);
    });

    it('provides valid variable registries and complete worked numerical steps', () => {
      CALCULATION_FORMULAS.forEach((stage) => {
        expect(stage.stageName).toBeTruthy();
        expect(stage.formulaTex).toBeTruthy();
        expect(stage.formulaPlain).toBeTruthy();
        expect(stage.variables.length).toBeGreaterThanOrEqual(3);
        expect(stage.workedExample.calculationSteps.length).toBeGreaterThan(0);
        expect(stage.workedExample.finalResult).toBeTruthy();
        expect(stage.assumptions.length).toBeGreaterThan(0);
      });
    });

    it('verifies arithmetic consistency of the Stage C Household Impact formula', () => {
      const stageC = CALCULATION_FORMULAS.find((f) => f.id === 'calc_sector_household');
      expect(stageC).toBeDefined();
      expect(stageC?.workedExample.inputValues.MPCE_baseline).toBe('₹6,500/person');
      expect(stageC?.workedExample.inputValues.N_family).toBe(4);
      expect(stageC?.workedExample.finalResult).toBe('+₹1,250 / month Household Budget Increase');
    });
  });

  describe('5. Impact Flow & Worked Examples', () => {
    it('maps 5 interconnected stages in the Impact Flow Visualizer', () => {
      expect(IMPACT_FLOW_STAGES).toHaveLength(5);
      expect(IMPACT_FLOW_STAGES.map((s) => s.id)).toEqual([
        'flow_event',
        'flow_macro',
        'flow_sector',
        'flow_household',
        'flow_insights',
      ]);
    });

    it('provides worked examples for Crude Oil, Edible Oil, and Wheat Procurement', () => {
      expect(METHODOLOGY_EXAMPLES).toHaveLength(3);
      const ids = METHODOLOGY_EXAMPLES.map((e) => e.id);
      expect(ids).toEqual(['crude_oil', 'edible_oil', 'wheat_procurement']);

      METHODOLOGY_EXAMPLES.forEach((ex) => {
        expect(ex.title).toBeTruthy();
        expect(ex.shockPercentage).toMatch(/^[+-]\d+(\.\d+)?%$/);
        expect(ex.macroImpact.cadImpact).toBeTruthy();
        expect(ex.sectorImpacts.length).toBeGreaterThan(0);
        expect(ex.householdImpact.monthlyDeltaInr).toBeGreaterThan(0);
        expect(ex.recommendations.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('6. Model Accuracy, Evaluation & Test Verification', () => {
    it('strictly separates software test coverage from empirical economic calibration', () => {
      expect(VALIDATION_METRICS).toHaveLength(3);

      const softwareTests = VALIDATION_METRICS.find((m) => m.id === 'val_software_tests');
      expect(softwareTests?.benchmarkStatus).toBe('software_test_suite');
      expect(softwareTests?.scoreOrPct).toBe('100%');
      expect(softwareTests?.limitations).toContain(
        'does not guarantee economic predictive certainty'
      );

      const backtestConcordance = VALIDATION_METRICS.find(
        (m) => m.id === 'val_backtest_concordance'
      );
      expect(backtestConcordance?.benchmarkStatus).toBe('empirical_backtest');
      expect(backtestConcordance?.scoreOrPct).toBe('87%');

      const surveyReconciliation = VALIDATION_METRICS.find(
        (m) => m.id === 'val_survey_reconciliation'
      );
      expect(surveyReconciliation?.benchmarkStatus).toBe('verified_dataset');
      expect(surveyReconciliation?.scoreOrPct).toBe('82%');
    });

    it('mandates evaluation method, sample size, and limitations for each metric', () => {
      VALIDATION_METRICS.forEach((m) => {
        expect(m.evaluationMethod).toBeTruthy();
        expect(m.sampleSize).toBeTruthy();
        expect(m.evaluationPeriod).toBeTruthy();
        expect(m.limitations).toBeTruthy();
      });
    });
  });

  describe('7. System Limitations & Analytical Assumptions', () => {
    it('documents at least 4 real-world operational constraints and workarounds', () => {
      expect(METHODOLOGY_LIMITATIONS.length).toBeGreaterThanOrEqual(4);

      METHODOLOGY_LIMITATIONS.forEach((lim) => {
        expect(lim.id).toBeTruthy();
        expect(lim.title).toBeTruthy();
        expect(lim.affectedFeature).toBeTruthy();
        expect(lim.whatIsUnavailable).toBeTruthy();
        expect(lim.workaroundInPlace).toBeTruthy();
        expect(lim.futureCapabilityNeeded).toBeTruthy();
      });
    });
  });

  describe('8. Methodology Report Generation', () => {
    it('generates an authentic Markdown report containing all methodology sections', () => {
      const report = generateMethodologyReportText();

      expect(report).toContain('# BharatImpact Methodology & Technical Architecture Report');
      expect(report).toContain('## 1. Executive Summary & Purpose');
      expect(report).toContain('## 2. Six-Stage Multi-Layered Analytical Workflow');
      expect(report).toContain('## 3. Verified Primary Data Sources Registry');
      expect(report).toContain('## 4. Analytical Models & Techniques');
      expect(report).toContain('## 5. Mathematical Calculation Formulas & Worked Logic');
      expect(report).toContain('## 6. Model Accuracy, Evaluation & Test Verification');
      expect(report).toContain('## 7. Known System Constraints & Transparency Disclaimers');
      expect(report).toContain('## 8. Financial Advice Disclaimer');
      expect(report).toContain('MoSPI HCES 2023-24 Statement 7');
      expect(report).toContain('SEBI');
    });
  });
});
