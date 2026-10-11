import React, { useState, useMemo, useCallback } from 'react';
import {
  HouseholdAssumptions,
  HouseholdProfileType,
} from './types';
import {
  PROFILE_PRESETS,
  calculateHouseholdImpact,
} from './householdData';
import { HouseholdHeader } from './HouseholdHeader';
import { HouseholdFinancialKpis } from './HouseholdFinancialKpis';
import { MonthlyExpenseBreakdownChart } from './MonthlyExpenseBreakdownChart';
import { ExpenseShareDonutChart } from './ExpenseShareDonutChart';
import { HouseholdAssumptionsCard } from './HouseholdAssumptionsCard';
import { CategoryImpactDriversCard } from './CategoryImpactDriversCard';
import { IncomeSavingsTrendChart } from './IncomeSavingsTrendChart';
import { SipCapacityCard } from './SipCapacityCard';
import { HouseholdInsightsCard } from './HouseholdInsightsCard';
import styles from './HouseholdView.module.css';

interface HouseholdViewProps {
  onNavigateToSectors?: (sectorId?: string) => void;
  onNavigateToGraph?: () => void;
  onNavigateToSipForecasts?: () => void;
  onNavigateToConsumption?: () => void;
  selectedEventId?: string;
  assumptions?: HouseholdAssumptions;
  onAssumptionsChange?: (newAssumptions: HouseholdAssumptions) => void;
}

export const HouseholdView: React.FC<HouseholdViewProps> = ({
  onNavigateToSectors,
  onNavigateToGraph: _onNavigateToGraph,
  onNavigateToSipForecasts,
  onNavigateToConsumption: _onNavigateToConsumption,
  selectedEventId,
  assumptions: externalAssumptions,
  onAssumptionsChange,
}) => {
  // Current active assumptions (controlled if externalAssumptions passed, otherwise internal)
  const [internalAssumptions, setInternalAssumptions] = useState<HouseholdAssumptions>(
    externalAssumptions || PROFILE_PRESETS.urban_middle
  );

  const assumptions = externalAssumptions || internalAssumptions;

  const setAssumptions = useCallback((action: React.SetStateAction<HouseholdAssumptions>) => {
    setInternalAssumptions((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      onAssumptionsChange?.(next);
      return next;
    });
  }, [onAssumptionsChange]);

  // Selected category for synchronized highlighting across breakdown, donut, and drivers
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Recalculating state for smooth feedback
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  // Compute deterministic household data
  const dashboardData = useMemo(() => {
    return calculateHouseholdImpact(assumptions, selectedEventId);
  }, [assumptions, selectedEventId]);

  // Profile switch from header
  const handleProfileChange = useCallback((newProfile: HouseholdProfileType) => {
    setIsRecalculating(true);
    setAssumptions(PROFILE_PRESETS[newProfile]);
    setTimeout(() => setIsRecalculating(false), 150);
  }, []);

  // Location switch from header
  const handleLocationChange = useCallback((newLocation: string) => {
    setAssumptions((prev) => ({
      ...prev,
      location: newLocation,
    }));
  }, []);

  // Apply new assumptions from the Assumptions card
  const handleApplyAssumptions = useCallback((newAssumptions: HouseholdAssumptions) => {
    setIsRecalculating(true);
    setAssumptions(newAssumptions);
    setTimeout(() => setIsRecalculating(false), 200);
  }, []);

  // SIP contribution amount update
  const handleUpdateSipAmount = useCallback((amount: number) => {
    setAssumptions((prev) => ({
      ...prev,
      currentSip: amount,
    }));
  }, []);

  // Category selection handler (toggles selection if clicked again)
  const handleSelectCategory = useCallback((catId: string) => {
    setSelectedCategoryId((prev) => (prev === catId ? null : catId));
  }, []);

  return (
    <div className={styles.container} id="household-impact-dashboard">
      {/* 1. Header with Profile & Location Selectors */}
      <HouseholdHeader
        selectedProfile={assumptions.profileType}
        selectedLocation={assumptions.location}
        onProfileChange={handleProfileChange}
        onLocationChange={handleLocationChange}
      />

      {/* 2. Top-Level Financial KPI Cards */}
      <HouseholdFinancialKpis financials={dashboardData.financials} />

      {/* 3. Main Row 1: Monthly Expense Breakdown (65%) + Expense Share Donut (35%) */}
      <div className={styles.chartsGridRow}>
        <div className={styles.breakdownCol}>
          <MonthlyExpenseBreakdownChart
            categories={dashboardData.categories}
            selectedCategoryId={selectedCategoryId || undefined}
            onSelectCategory={handleSelectCategory}
          />
        </div>
        <div className={styles.donutCol}>
          <ExpenseShareDonutChart
            categories={dashboardData.categories}
            totalExpenses={dashboardData.financials.totalMonthlyExpenses}
            selectedCategoryId={selectedCategoryId || undefined}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      </div>

      {/* 4. Middle Row 2: Assumptions (33%) + Drivers (33%) + Income/Savings Trend (33%) */}
      <div className={styles.threeCardsRow}>
        <div className={styles.threeCardCol}>
          <HouseholdAssumptionsCard
            assumptions={assumptions}
            onApplyAssumptions={handleApplyAssumptions}
            isRecalculating={isRecalculating}
          />
        </div>
        <div className={styles.threeCardCol}>
          <CategoryImpactDriversCard
            categories={dashboardData.categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={handleSelectCategory}
            onNavigateToSector={onNavigateToSectors}
          />
        </div>
        <div className={styles.threeCardCol}>
          <IncomeSavingsTrendChart trend={dashboardData.trend} />
        </div>
      </div>

      {/* 5. Bottom Row 3: SIP & Investment Capacity (65%) + Key Insights (35%) */}
      <div className={styles.bottomGridRow}>
        <div className={styles.sipCol}>
          <SipCapacityCard
            sipProjection={dashboardData.sipProjection}
            onUpdateSipAmount={handleUpdateSipAmount}
            onNavigateToSipForecasts={onNavigateToSipForecasts}
          />
        </div>
        <div className={styles.insightsCol}>
          <HouseholdInsightsCard
            insights={dashboardData.insights}
            onSelectInsightCategory={(type) => {
              if (type === 'driver') setSelectedCategoryId('transport');
              else if (type === 'inflation') setSelectedCategoryId('food');
              else if (type === 'housing') setSelectedCategoryId('housing');
              else setSelectedCategoryId(null);
            }}
          />
        </div>
      </div>
    </div>
  );
};
