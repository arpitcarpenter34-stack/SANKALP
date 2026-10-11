import React, { useState, useMemo, useCallback } from 'react';
import {
  ConsumptionTimePeriod,
  ConsumptionProfileType,
  ConsumptionAssumptions,
  CommodityItem,
  GlobalEventImpactItem,
} from './types';
import { PROFILE_PRESETS } from './consumptionData';
import { calculateConsumptionDashboard } from './consumptionCalculation';
import { ConsumptionHeader } from './ConsumptionHeader';
import { ConsumptionKpis } from './ConsumptionKpis';
import { ConsumptionCompositionDonut } from './ConsumptionCompositionDonut';
import { ConsumptionTrendChart } from './ConsumptionTrendChart';
import { StateConsumptionMapCard } from './StateConsumptionMapCard';
import { KeyCommoditiesPanel } from './KeyCommoditiesPanel';
import { ConsumptionVsNationalAverageChart } from './ConsumptionVsNationalAverageChart';
import { GlobalEventsImpactPanel } from './GlobalEventsImpactPanel';
import { HouseholdConsumptionProfileEditor } from './HouseholdConsumptionProfileEditor';
import { ProjectedConsumptionChart } from './ProjectedConsumptionChart';
import { ConsumptionInsightsPanel } from './ConsumptionInsightsPanel';
import styles from './ConsumptionView.module.css';

export interface ConsumptionViewProps {
  initialAssumptions?: Partial<ConsumptionAssumptions>;
  onNavigateToHousehold?: () => void;
  onNavigateToSectors?: (sectorId?: string) => void;
  onNavigateToGraph?: () => void;
  onNavigateToGlobalEvents?: (eventId?: string) => void;
  onNavigateToSipForecasts?: () => void;
}

export const ConsumptionView: React.FC<ConsumptionViewProps> = ({
  initialAssumptions,
  onNavigateToHousehold: _onNavigateToHousehold,
  onNavigateToSectors,
  onNavigateToGraph: _onNavigateToGraph,
  onNavigateToGlobalEvents,
  onNavigateToSipForecasts: _onNavigateToSipForecasts,
}) => {
  const [timePeriod, setTimePeriod] = useState<ConsumptionTimePeriod>('6m');
  const [location, setLocation] = useState<string>(
    initialAssumptions?.location || 'India (All States)'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);

  const [assumptions, setAssumptions] = useState<ConsumptionAssumptions>({
    ...PROFILE_PRESETS.urban_middle,
    ...initialAssumptions,
  });

  // Calculate dashboard dataset deterministically
  const dashboardData = useMemo(() => {
    return calculateConsumptionDashboard(assumptions, timePeriod, location);
  }, [assumptions, timePeriod, location]);

  const handleProfileTypeChange = useCallback((newProfile: ConsumptionProfileType) => {
    const presetValues = PROFILE_PRESETS[newProfile];
    setAssumptions({ ...presetValues });
    if (presetValues.location) {
      setLocation(presetValues.location);
    }
  }, []);

  const handleLocationChange = useCallback((newLocation: string) => {
    setLocation(newLocation);
    setAssumptions((prev) => ({ ...prev, location: newLocation }));
  }, []);

  const handleApplyAssumptions = useCallback((newAssumptions: ConsumptionAssumptions) => {
    setAssumptions(newAssumptions);
    if (newAssumptions.location) {
      setLocation(newAssumptions.location);
    }
  }, []);

  const handleSelectCommodity = useCallback((commodity: CommodityItem) => {
    if (commodity.relatedSectorId && onNavigateToSectors) {
      onNavigateToSectors(commodity.relatedSectorId);
    }
  }, [onNavigateToSectors]);

  const handleSelectEvent = useCallback((event: GlobalEventImpactItem) => {
    if (onNavigateToGlobalEvents) {
      onNavigateToGlobalEvents(event.id);
    } else if (event.relatedSectorId && onNavigateToSectors) {
      onNavigateToSectors(event.relatedSectorId);
    }
  }, [onNavigateToGlobalEvents, onNavigateToSectors]);

  return (
    <main className={styles.dashboardContainer} aria-label="BharatImpact Consumption Dashboard">
      {/* 1. Header with Time Period, Location, and Profile Selectors */}
      <ConsumptionHeader
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        location={location}
        onLocationChange={handleLocationChange}
        profileType={assumptions.profileType}
        onProfileTypeChange={handleProfileTypeChange}
      />

      {/* 2. Top-Level KPI Cards (5 Cards) */}
      <ConsumptionKpis kpis={dashboardData.kpis} />

      {/* 3. Row 2: Composition Donut, Trend Chart, State Map */}
      <section className={styles.threeColumnRow} aria-label="Consumption Breakdown and Geography">
        <ConsumptionCompositionDonut
          slices={dashboardData.categorySlices}
          totalMonthly={dashboardData.kpis.totalMonthly.amount}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />
        <ConsumptionTrendChart
          trendPoints={dashboardData.trendPoints}
          timePeriod={timePeriod}
          onTimePeriodChange={setTimePeriod}
        />
        <StateConsumptionMapCard
          stateVariations={dashboardData.stateVariations}
          selectedLocation={location}
          onSelectState={handleLocationChange}
        />
      </section>

      {/* 4. Row 3: Key Commodities, National Average Comparison, Global Events Impact */}
      <section className={styles.threeColumnRow} aria-label="Commodities and Scenario Transmission">
        <KeyCommoditiesPanel
          commodities={dashboardData.commodities}
          onSelectCommodity={handleSelectCommodity}
        />
        <ConsumptionVsNationalAverageChart
          comparisons={dashboardData.nationalComparisons}
        />
        <GlobalEventsImpactPanel
          events={dashboardData.globalEventImpacts}
          onSelectEvent={handleSelectEvent}
        />
      </section>

      {/* 5. Row 4: Profile Editor, Projections, Key Insights */}
      <section className={styles.threeColumnRow} aria-label="Household Customization and Projections">
        <HouseholdConsumptionProfileEditor
          currentAssumptions={assumptions}
          onApplyAssumptions={handleApplyAssumptions}
        />
        <ProjectedConsumptionChart
          projectionPoints={dashboardData.projectionPoints}
          summary={dashboardData.projectionSummary}
        />
        <ConsumptionInsightsPanel
          insights={dashboardData.insights}
          onSelectCategory={setSelectedCategoryId}
        />
      </section>
    </main>
  );
};
