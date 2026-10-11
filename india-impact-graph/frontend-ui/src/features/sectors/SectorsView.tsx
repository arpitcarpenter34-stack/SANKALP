import React, { useState } from 'react';
import { SectorId } from './types';
import { SECTOR_CATEGORIES, SECTORS_DATA } from './sectorsData';
import { SectorHeader } from './SectorHeader';
import { SectorSelectorTabs } from './SectorSelectorTabs';
import { SectorSummaryCard } from './SectorSummaryCard';
import { DualPriceChart } from './DualPriceChart';
import { ImportDonutChart } from './ImportDonutChart';
import { DownstreamImpactTable } from './DownstreamImpactTable';
import { StockPerformanceCard } from './StockPerformanceCard';
import { SectorDetailsPanel } from './SectorDetailsPanel';
import { SectorNewsPanel } from './SectorNewsPanel';
import { SectorTakeawaysCard } from './SectorTakeawaysCard';
import { CompareSectorsModal } from './CompareSectorsModal';
import styles from './SectorsView.module.css';

export interface SectorsViewProps {
  initialSectorId?: SectorId;
  onNavigateToGraph?: (domainId: string) => void;
  onNavigateToHousehold?: () => void;
  onNavigateToNews?: () => void;
}

export const SectorsView: React.FC<SectorsViewProps> = ({
  initialSectorId = 'semiconductors',
  onNavigateToGraph,
  onNavigateToHousehold,
  onNavigateToNews,
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<SectorId>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const s = params.get('sector') as SectorId;
      if (s && SECTORS_DATA[s]) return s;
    } catch {
      // ignore
    }
    return initialSectorId;
  });
  const [timeRange, setTimeRange] = useState<string>('6M');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('compare') === 'true';
    } catch {
      return false;
    }
  });

  const currentSector = SECTORS_DATA[selectedSectorId] || SECTORS_DATA.semiconductors;

  const handleViewDetailedGraph = (domainId: string) => {
    if (onNavigateToGraph) {
      onNavigateToGraph(domainId);
    }
  };

  return (
    <div className={styles.sectorsContainer}>
      {/* 1. Page Header */}
      <SectorHeader onOpenCompare={() => setIsCompareModalOpen(true)} />

      {/* 2. Horizontal Sector Tabs Navigation */}
      <SectorSelectorTabs
        categories={SECTOR_CATEGORIES}
        selectedSectorId={selectedSectorId}
        onSelectSector={setSelectedSectorId}
      />

      {/* 3. Primary Sector Overview Banner & 4 Compact KPIs */}
      <SectorSummaryCard
        sector={currentSector}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onViewDetailedGraph={handleViewDetailedGraph}
      />

      {/* 4. 2-Column Responsive Dashboard Layout */}
      <div className={styles.dashboardGrid}>
        {/* Left / Center Main Visualizations Column */}
        <div className={styles.mainColumn}>
          {/* Row 1: Dual Price Line Chart + Import Donut Chart */}
          <div className={styles.twoColRow}>
            <DualPriceChart config={currentSector.priceComparison} />
            <ImportDonutChart config={currentSector.importDependence} />
          </div>

          {/* Row 2: Impact on Indian Sectors Table + Stock Performance */}
          <div className={styles.twoColRow}>
            <DownstreamImpactTable
              impacts={currentSector.downstreamImpacts}
              onSelectIndustry={() => handleViewDetailedGraph(currentSector.domainId)}
            />
            <StockPerformanceCard config={currentSector.stockPerformance} />
          </div>
        </div>

        {/* Right Side Column */}
        <div className={styles.sideColumn}>
          {/* Panel 1: Sector Details */}
          <SectorDetailsPanel
            sector={currentSector}
            onViewFullAnalysis={() => handleViewDetailedGraph(currentSector.domainId)}
            onNavigateToHousehold={onNavigateToHousehold}
          />

          {/* Panel 2: Latest News */}
          <SectorNewsPanel
            sectorName={currentSector.name}
            news={currentSector.news}
            onViewAllNews={onNavigateToNews}
          />

          {/* Panel 3: Key Takeaways */}
          <SectorTakeawaysCard takeaways={currentSector.takeaways} />
        </div>
      </div>

      {/* Cross-Sector Comparison Modal */}
      <CompareSectorsModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        defaultSectorIdA={selectedSectorId}
      />
    </div>
  );
};
