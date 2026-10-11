import React from 'react';
import { ImpactAnalysisScenario, PlatformId } from './types';
import { getHouseholdComparisonCategories, formatRupees } from './comparisonCalculation';
import styles from './HouseholdImpactComparisonChart.module.css';

interface HouseholdImpactComparisonChartProps {
  scenario: ImpactAnalysisScenario;
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
}

const PLATFORM_COLORS: Record<PlatformId, string> = {
  news_apps: '#dc2626',
  financial_tools: '#d97706',
  research_platforms: '#0284c7',
  bharat_impact: '#059669',
};

const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: 'news_apps', label: 'News Apps' },
  { id: 'financial_tools', label: 'Financial Tools' },
  { id: 'research_platforms', label: 'Research Platforms' },
  { id: 'bharat_impact', label: 'BharatImpact' },
];

export const HouseholdImpactComparisonChart: React.FC<HouseholdImpactComparisonChartProps> = ({
  scenario,
  selectedPlatform,
  onSelectPlatform,
}) => {
  const categories = getHouseholdComparisonCategories(scenario);
  const maxAxisValue = 3000;

  return (
    <div className={styles.chartCard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Household Impact Comparison</h2>
          <p className={styles.subtitle}>Same event, different insights (Monthly impact in INR)</p>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          {PLATFORMS.map((p) => {
            const isSelected = selectedPlatform === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`
                  ${styles.legendItem}
                  ${isSelected ? styles.legendItemActive : ''}
                `}
                onClick={() => onSelectPlatform(p.id)}
                title={`Highlight ${p.label}`}
              >
                <span
                  className={styles.legendDot}
                  style={{ backgroundColor: PLATFORM_COLORS[p.id] }}
                />
                <span className={styles.legendText}>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={styles.chartArea}>
        {/* Y-axis Ticks & Horizontal Grid lines */}
        <div className={styles.yAxisGuide}>
          {[3000, 2000, 1000, 0].map((tick) => (
            <div key={tick} className={styles.yTick}>
              <span className={styles.yLabel}>{formatRupees(tick)}</span>
              <div className={styles.gridLine} />
            </div>
          ))}
        </div>

        {/* Categories Grouped Bars */}
        <div className={styles.categoriesContainer}>
          {categories.map((cat) => (
            <div key={cat.id} className={styles.categoryCluster}>
              <div className={styles.barsGroup}>
                {PLATFORMS.map((p) => {
                  const rawAmount = cat.amounts[p.id];
                  const hasValue = rawAmount !== null;
                  const amount = rawAmount ?? 0;
                  const heightPct = Math.min(100, (amount / maxAxisValue) * 100);
                  const isSelected = selectedPlatform === p.id;

                  return (
                    <div
                      key={p.id}
                      className={`
                        ${styles.barSlot}
                        ${isSelected ? styles.barSlotSelected : ''}
                      `}
                      onClick={() => onSelectPlatform(p.id)}
                      title={`${p.label} - ${cat.name}: ${
                        hasValue ? formatRupees(amount) : 'Not modeled (no household view)'
                      }`}
                    >
                      {/* Numeric Label above bar */}
                      <span className={styles.barNumberLabel}>
                        {hasValue ? formatRupees(amount) : '₹0'}
                      </span>

                      {/* Bar body */}
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            height: `${hasValue && amount > 0 ? Math.max(4, heightPct) : 2}%`,
                            backgroundColor: PLATFORM_COLORS[p.id],
                            opacity: hasValue ? 1 : 0.35,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category X-axis Label */}
              <div className={styles.categoryName}>{cat.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footnote}>
        * News apps do not model household costs (recorded as ₹0 / unmodeled). Financial tools track
        raw index/commodity delta. BharatImpact models end-to-end consumer basket inflation.
      </div>
    </div>
  );
};
