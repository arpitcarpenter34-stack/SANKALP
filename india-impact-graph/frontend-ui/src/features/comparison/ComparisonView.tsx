import React, { useState, useRef } from 'react';
import {
  PlatformId,
  ComparisonTab,
  ImpactAnalysisScenario,
} from './types';
import {
  PLATFORMS_DATA,
  FEATURE_MATRIX_DATA,
  RADAR_DIMENSIONS,
  OVERALL_PERFORMANCE_METRICS,
  SCENARIOS_DATA,
  USER_VALUE_PERSONAS,
} from './comparisonData';
import { ComparisonHeader } from './ComparisonHeader';
import { PlatformOverviewCards } from './PlatformOverviewCards';
import { FeatureComparisonMatrix } from './FeatureComparisonMatrix';
import { PlatformCapabilityRadar } from './PlatformCapabilityRadar';
import { OverallPerformanceScore } from './OverallPerformanceScore';
import { ImpactAnalysisExample } from './ImpactAnalysisExample';
import { HouseholdImpactComparisonChart } from './HouseholdImpactComparisonChart';
import { SipInvestmentComparison } from './SipInvestmentComparison';
import { ValueForDifferentUsers } from './ValueForDifferentUsers';
import styles from './ComparisonView.module.css';

export interface ComparisonViewProps {
  onNavigateToGlobalEvents?: (eventId?: string) => void;
  onNavigateToGraph?: () => void;
  onNavigateToSectors?: (sectorId?: string) => void;
  onNavigateToHousehold?: () => void;
  onNavigateToSipForecasts?: () => void;
  onNavigateToConsumption?: () => void;
  onNavigateToMethodology?: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  onNavigateToGlobalEvents,
  onNavigateToGraph,
  onNavigateToSectors,
  onNavigateToHousehold,
  onNavigateToSipForecasts,
  onNavigateToConsumption,
  onNavigateToMethodology,
}) => {
  const [activeTab, setActiveTab] = useState<ComparisonTab>('overview');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | null>('bharat_impact');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('crude_oil');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Section anchor references for smooth navigation
  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const performanceRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const valueForYouRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: ComparisonTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'overview':
        overviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'features':
        featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'performance':
        performanceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'use_cases':
        useCasesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'value_for_you':
        valueForYouRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
    }
  };

  const handlePlatformSelect = (platformId: PlatformId) => {
    // Toggle platform focus or select
    setSelectedPlatform((prev) => (prev === platformId ? null : platformId));
  };

  const activeScenario: ImpactAnalysisScenario =
    SCENARIOS_DATA.find((s: ImpactAnalysisScenario) => s.id === activeScenarioId) || SCENARIOS_DATA[0];

  const handlePersonaNavigation = (targetSection: string) => {
    switch (targetSection) {
      case 'household':
      case 'household-impact':
        onNavigateToHousehold?.();
        break;
      case 'impact_graph':
      case 'impact-graph':
        onNavigateToGraph?.();
        break;
      case 'sectors':
        onNavigateToSectors?.('consumer_goods');
        break;
      case 'sip_forecasts':
      case 'sip-forecasts':
        onNavigateToSipForecasts?.();
        break;
      case 'consumption':
        onNavigateToConsumption?.();
        break;
      case 'global-events':
        onNavigateToGlobalEvents?.(activeScenarioId);
        break;
      default:
        overviewRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.comparisonRoot}>
      {/* 1. Header with Search and 5 Tab Buttons */}
      <ComparisonHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 2. Platform Overview 4 Cards */}
      <div ref={overviewRef} className={styles.sectionAnchor}>
        <PlatformOverviewCards
          platforms={PLATFORMS_DATA}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handlePlatformSelect}
        />
      </div>

      {/* 3. Middle Analytical Grid: Features, Radar Chart & Performance Score */}
      <div className={styles.middleAnalyticsGrid}>
        <div ref={featuresRef} className={styles.featuresColumn}>
          <FeatureComparisonMatrix
            features={FEATURE_MATRIX_DATA}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={handlePlatformSelect}
            searchFilter={searchQuery}
          />
        </div>

        <div ref={performanceRef} className={styles.performanceColumns}>
          <PlatformCapabilityRadar
            dimensions={RADAR_DIMENSIONS}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={handlePlatformSelect}
          />

          <OverallPerformanceScore
            metrics={OVERALL_PERFORMANCE_METRICS}
            selectedPlatform={selectedPlatform}
            onSelectPlatform={handlePlatformSelect}
          />
        </div>
      </div>

      {/* 4. Use Cases & Household Impact Comparison */}
      <div ref={useCasesRef} className={styles.useCasesGrid}>
        <ImpactAnalysisExample
          scenarios={SCENARIOS_DATA}
          activeScenarioId={activeScenarioId}
          onSelectScenario={setActiveScenarioId}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handlePlatformSelect}
          onNavigateToGraph={onNavigateToGraph}
          onNavigateToSectors={() => onNavigateToSectors?.('energy')}
          onNavigateToHousehold={onNavigateToHousehold}
          onNavigateToSipForecasts={onNavigateToSipForecasts}
        />

        <HouseholdImpactComparisonChart
          scenario={activeScenario}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handlePlatformSelect}
        />
      </div>

      {/* 5. SIP Comparison & Value for Different Users */}
      <div ref={valueForYouRef} className={styles.bottomSectionGrid}>
        <SipInvestmentComparison
          scenario={activeScenario}
          selectedPlatform={selectedPlatform}
          onSelectPlatform={handlePlatformSelect}
          onNavigateToSipForecasts={onNavigateToSipForecasts}
        />

        <ValueForDifferentUsers
          personas={USER_VALUE_PERSONAS}
          onNavigateToSection={handlePersonaNavigation}
        />
      </div>

      {/* 6. Provenance, Governance & Methodology Footer Banner */}
      <footer className={styles.governanceFooter}>
        <div className={styles.governanceText}>
          <strong>Data Integrity & Benchmark Provenance:</strong> Comparison dimensions, platform
          capabilities, and scores are based on manually curated capability evaluations (reviewed
          October 2026). Competitor metrics reflect publicly available feature scopes. BharatImpact
          household and SIP figures are computed using active deterministic transmission models.
        </div>
        {onNavigateToMethodology && (
          <button
            type="button"
            className={styles.methodologyLinkBtn}
            onClick={onNavigateToMethodology}
          >
            Review Full Methodology & Assumptions →
          </button>
        )}
      </footer>
    </div>
  );
};
