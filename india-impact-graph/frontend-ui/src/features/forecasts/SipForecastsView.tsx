import React, { useState, useMemo, useCallback } from 'react';
import {
  SipSimulatorInputs,
  ForecastViewMode,
  ForecastScenarioId,
} from './types';
import {
  calculateSipProjection,
  generateGrowthTrajectory,
  calculateForecastScenarios,
  deriveGlobalEventDrivers,
  generateForecastInsights,
  calculateAffordableSipCapacity,
} from './forecastCalculation';
import { SipForecastsHeader } from './SipForecastsHeader';
import { SipFinancialKpis } from './SipFinancialKpis';
import { SipSimulatorPanel } from './SipSimulatorPanel';
import { ProjectedSipGrowthChart } from './ProjectedSipGrowthChart';
import { FutureScenariosCard } from './FutureScenariosCard';
import { GlobalEventsImpactCard } from './GlobalEventsImpactCard';
import { SipCorpusComparisonChart } from './SipCorpusComparisonChart';
import { AiInsightsPanel } from './AiInsightsPanel';
import { MethodologyDisclaimer } from './MethodologyDisclaimer';
import styles from './SipForecastsView.module.css';

export interface SipForecastsViewProps {
  selectedScenarioTitle?: string;
  onChangeScenario?: () => void;
  onOpenAiAssistant?: () => void;
  onNavigateToHousehold?: () => void;
  onNavigateToSectors?: (sectorId?: string) => void;
  onNavigateToGraph?: () => void;
  householdIncome?: number;
  householdExpenses?: number;
  initialMonthlySip?: number;
  onSipAmountChange?: (amount: number) => void;
}

const DEFAULT_SIMULATOR_INPUTS: SipSimulatorInputs = {
  monthlySip: 5000,
  durationYears: 15,
  annualReturnPct: 12.0,
  expenseImpactPct: 10,
  mode: 'basic',
  annualStepUpPct: 0,
  inflationPct: 6.0,
  timing: 'end_of_period',
  expenseGrowthPct: 5.0,
};

export const SipForecastsView: React.FC<SipForecastsViewProps> = ({
  selectedScenarioTitle = 'Global chip supply tensions',
  onChangeScenario,
  onOpenAiAssistant,
  onNavigateToHousehold,
  onNavigateToSectors,
  onNavigateToGraph,
  householdIncome = 60000,
  householdExpenses = 40100,
  initialMonthlySip = 5000,
  onSipAmountChange,
}) => {
  // Simulator inputs state
  const [inputs, setInputs] = useState<SipSimulatorInputs>(() => ({
    ...DEFAULT_SIMULATOR_INPUTS,
    monthlySip: initialMonthlySip,
  }));

  // View mode: 'amount' (nominal) vs 'wealth' (inflation adjusted real)
  const [viewMode, setViewMode] = useState<ForecastViewMode>('amount');

  // Active scenario selection in Future Scenarios ('optimistic' | 'base' | 'pessimistic')
  const [activeScenarioId, setActiveScenarioId] = useState<ForecastScenarioId>('base');

  // Recalculating state for smooth feedback
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // 1. Affordable SIP capacity derived via exact household gross savings model
  const affordability = useMemo(() => {
    return calculateAffordableSipCapacity(
      inputs.monthlySip,
      inputs.expenseImpactPct,
      householdIncome,
      householdExpenses
    );
  }, [inputs.monthlySip, inputs.expenseImpactPct, householdIncome, householdExpenses]);

  const estimatedCapacity = affordability.estimatedCapacity;

  // 2. Stressed reduced SIP
  const reducedSip = useMemo(() => {
    return Math.max(1000, Math.round((inputs.monthlySip * 0.6) / 500) * 500);
  }, [inputs.monthlySip]);

  // 3. Baseline calculation (user's chosen unimpacted baseline)
  const baselineCalc = useMemo(() => {
    return calculateSipProjection(
      inputs.monthlySip,
      inputs.annualReturnPct,
      inputs.durationYears,
      inputs.timing,
      inputs.annualStepUpPct
    );
  }, [inputs]);

  // 4. Future Scenarios: Optimistic, Base, Pessimistic
  const futureScenarios = useMemo(() => {
    return calculateForecastScenarios(
      estimatedCapacity,
      inputs.annualReturnPct,
      inputs.durationYears,
      inputs.timing,
      inputs.annualStepUpPct
    );
  }, [estimatedCapacity, inputs]);

  // Active selected scenario projection
  const selectedScenario = useMemo(() => {
    return futureScenarios[activeScenarioId] || futureScenarios.base;
  }, [futureScenarios, activeScenarioId]);

  const corpusDeltaLakhs = useMemo(() => {
    const diff = (baselineCalc.futureValue - selectedScenario.projectedCorpus) / 100000;
    return parseFloat(diff.toFixed(1));
  }, [baselineCalc.futureValue, selectedScenario.projectedCorpus]);

  // 5. Growth trajectory points (0 to N years) synchronized with active scenario
  const trajectory = useMemo(() => {
    return generateGrowthTrajectory(
      inputs.monthlySip,
      selectedScenario.monthlySip,
      reducedSip,
      inputs.durationYears,
      inputs.annualReturnPct,
      inputs.inflationPct,
      inputs.timing,
      inputs.annualStepUpPct,
      selectedScenario.annualReturnPct
    );
  }, [inputs, selectedScenario, reducedSip]);

  // 6. Global event waterfall drivers reconciled with household deductions
  const drivers = useMemo(() => {
    return deriveGlobalEventDrivers(inputs.monthlySip, estimatedCapacity);
  }, [inputs.monthlySip, estimatedCapacity]);

  // 7. Dynamic AI insights reflecting selected scenario and simulator inputs
  const insights = useMemo(() => {
    return generateForecastInsights(
      inputs,
      estimatedCapacity,
      selectedScenario.projectedCorpus,
      selectedScenarioTitle,
      activeScenarioId,
      selectedScenario
    );
  }, [inputs, estimatedCapacity, selectedScenario, selectedScenarioTitle, activeScenarioId]);

  // Handler for simulator form submission
  const handleUpdateProjection = useCallback((updated: SipSimulatorInputs) => {
    setIsRecalculating(true);
    setInputs(updated);
    onSipAmountChange?.(updated.monthlySip);
    setTimeout(() => {
      setIsRecalculating(false);
    }, 150);
  }, [onSipAmountChange]);

  // Quick edit monthly SIP
  const handleEditSip = useCallback(() => {
    const el = document.getElementById('sip-monthly-input');
    if (el) {
      el.focus();
    }
  }, []);

  return (
    <main className={styles.viewContainer} aria-label="SIP &amp; Forecasts Financial Dashboard">
      {/* 1. Header with Current Scenario and Action */}
      <SipForecastsHeader
        scenarioTitle={selectedScenarioTitle}
        impactLevel="High Impact"
        onChangeScenario={onChangeScenario}
        onNavigateToHousehold={onNavigateToHousehold}
        onNavigateToGraph={onNavigateToGraph}
      />

      {/* 2. Top Financial KPI Cards (5 Cards) - Synchronized with Selected Scenario */}
      <SipFinancialKpis
        currentSip={inputs.monthlySip}
        estimatedCapacity={selectedScenario.monthlySip}
        capacityChangePct={
          inputs.monthlySip > 0
            ? parseFloat((((selectedScenario.monthlySip - inputs.monthlySip) / inputs.monthlySip) * 100).toFixed(1))
            : 0
        }
        projectedCorpus={selectedScenario.projectedCorpus}
        totalInvested={selectedScenario.totalInvested}
        estimatedReturns={selectedScenario.estimatedGains}
        durationYears={inputs.durationYears}
        annualReturnPct={selectedScenario.annualReturnPct}
        corpusDeltaLakhs={corpusDeltaLakhs}
        scenarioName={selectedScenario.name}
        onEditSip={handleEditSip}
      />

      {/* 3. Main 3-Column Dashboard Body */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: SIP Simulator */}
        <section className={styles.leftColumn} aria-label="SIP Simulator Form">
          <SipSimulatorPanel
            inputs={inputs}
            onUpdateProjection={handleUpdateProjection}
            isRecalculating={isRecalculating}
            estimatedCapacity={estimatedCapacity}
          />
        </section>

        {/* Center Column: Projected Growth & Comparisons */}
        <section className={styles.centerColumn} aria-label="SIP Growth Projections and Category Impact">
          {/* Top: Growth Multi-curve Chart */}
          <ProjectedSipGrowthChart
            trajectory={trajectory}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            baselineSip={inputs.monthlySip}
            afterImpactSip={selectedScenario.monthlySip}
            reducedSip={reducedSip}
            totalInvested={selectedScenario.totalInvested}
            projectedCorpus={selectedScenario.projectedCorpus}
            estimatedReturns={selectedScenario.estimatedGains}
            wealthMultiplier={
              selectedScenario.totalInvested > 0
                ? parseFloat((selectedScenario.projectedCorpus / selectedScenario.totalInvested).toFixed(1))
                : 1.0
            }
            durationYears={inputs.durationYears}
            activeScenarioName={selectedScenario.name}
          />

          {/* Bottom Row: Waterfall and Comparison Side-by-Side */}
          <div className={styles.centerBottomRow}>
            <GlobalEventsImpactCard
              currentSip={inputs.monthlySip}
              estimatedCapacity={estimatedCapacity}
              drivers={drivers}
              onNavigateToCategory={(_catKey, sectorId) => {
                if (sectorId && onNavigateToSectors) {
                  onNavigateToSectors(sectorId);
                } else if (onNavigateToHousehold) {
                  onNavigateToHousehold();
                }
              }}
            />

            <SipCorpusComparisonChart
              scenarios={futureScenarios}
              selectedScenarioId={activeScenarioId}
              onSelectScenario={setActiveScenarioId}
            />
          </div>
        </section>

        {/* Right Column: Future Scenarios & AI Recommendations */}
        <section className={styles.rightColumn} aria-label="Economic Scenarios and AI Recommendations">
          <FutureScenariosCard
            scenarios={futureScenarios}
            selectedScenarioId={activeScenarioId}
            durationYears={inputs.durationYears}
            onSelectScenario={setActiveScenarioId}
          />

          <AiInsightsPanel
            insights={insights}
            onAskAi={onOpenAiAssistant}
          />
        </section>
      </div>

      {/* 4. Methodology & Disclaimer Footer */}
      <MethodologyDisclaimer />
    </main>
  );
};
