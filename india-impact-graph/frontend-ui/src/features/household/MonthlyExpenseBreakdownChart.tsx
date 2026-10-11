import React, { useState } from 'react';
import { ExpenseCategoryItem } from './types';
import styles from './MonthlyExpenseBreakdownChart.module.css';

export interface MonthlyExpenseBreakdownChartProps {
  categories: ExpenseCategoryItem[];
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
}

export const MonthlyExpenseBreakdownChart: React.FC<MonthlyExpenseBreakdownChartProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [viewMode, setViewMode] = useState<'amount' | 'percentage'>('amount');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  const totalBase = categories.reduce((sum, c) => sum + c.baselineAmount, 0);
  const totalAfter = categories.reduce((sum, c) => sum + c.afterImpactAmount, 0);

  const displayedCategories = filterCategory === 'all'
    ? categories
    : categories.filter((c) => c.id === filterCategory);

  const maxVal = Math.max(
    ...displayedCategories.map((c) => Math.max(c.baselineAmount, c.afterImpactAmount)),
    15000
  );

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'cart':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        );
      case 'car':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="8" rx="2" />
            <path d="m5 11 2-5h10l2 5" />
            <circle cx="7.5" cy="15.5" r="1.5" />
            <circle cx="16.5" cy="15.5" r="1.5" />
          </svg>
        );
      case 'home':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        );
      case 'book':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <path d="M6 6h10" />
            <path d="M6 10h10" />
          </svg>
        );
      case 'heart':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        );
    }
  };

  const chartHeight = 160;

  return (
    <div className={styles.chartCard}>
      {/* Top Header & Controls */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h2 className={styles.chartTitle}>Monthly Expense Breakdown</h2>
          <span className={styles.chartSubtitle}>
            Current vs. after impact (₹ per month)
          </span>
        </div>

        <div className={styles.controlsArea}>
          {/* Amount / Percentage Toggle */}
          <div className={styles.toggleGroup} role="group" aria-label="Display View Mode">
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'amount' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('amount')}
            >
              Amount
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'percentage' ? styles.toggleActive : ''}`}
              onClick={() => setViewMode('percentage')}
            >
              Percentage
            </button>
          </div>

          {/* Category Filter */}
          <select
            className={styles.catFilterSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            aria-label="Filter expense category"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={styles.legendDotCurrent} />
          <span>Current (Baseline)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotImpact} />
          <span>After Impact</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotIncrease} />
          <span>Increase</span>
        </div>
      </div>

      {/* Dual Bar Chart Canvas */}
      <div className={styles.chartCanvas}>
        {/* Y Axis Guide Lines */}
        <div className={styles.yAxisLabels}>
          <span>{viewMode === 'amount' ? '20K' : '40%'}</span>
          <span>{viewMode === 'amount' ? '15K' : '30%'}</span>
          <span>{viewMode === 'amount' ? '10K' : '20%'}</span>
          <span>{viewMode === 'amount' ? '5K' : '10%'}</span>
          <span>0</span>
        </div>

        <div className={styles.barsContainer}>
          {displayedCategories.map((cat) => {
            const isHovered = hoveredCatId === cat.id;
            const isSelected = selectedCategoryId === cat.id;

            // Category shares of total household expenses
            const baseSharePct = totalBase > 0 ? (cat.baselineAmount / totalBase) * 100 : 0;
            const afterSharePct = totalAfter > 0 ? (cat.afterImpactAmount / totalAfter) * 100 : 0;

            // Height proportions
            const basePct = viewMode === 'amount'
              ? Math.min(100, (cat.baselineAmount / maxVal) * 100)
              : Math.min(100, (baseSharePct / 40) * 100);
            const afterPct = viewMode === 'amount'
              ? Math.min(100, (cat.afterImpactAmount / maxVal) * 100)
              : Math.min(100, (afterSharePct / 40) * 100);

            const baseHeightPx = (basePct / 100) * chartHeight;
            const afterHeightPx = (afterPct / 100) * chartHeight;

            return (
              <div
                key={cat.id}
                className={`${styles.categoryColumn} ${isSelected ? styles.categorySelected : ''} ${isHovered ? styles.categoryHovered : ''}`}
                onMouseEnter={() => setHoveredCatId(cat.id)}
                onMouseLeave={() => setHoveredCatId(null)}
                onClick={() => onSelectCategory && onSelectCategory(cat.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCategory && onSelectCategory(cat.id);
                  }
                }}
                aria-label={`${cat.name}: Baseline ₹${cat.baselineAmount}, After Impact ₹${cat.afterImpactAmount}`}
              >
                {/* Value labels over bars */}
                <div className={styles.barTopLabels}>
                  <span className={styles.valLabelLeft}>
                    {viewMode === 'amount' ? cat.baselineAmount.toLocaleString('en-IN') : `${baseSharePct.toFixed(1)}%`}
                  </span>
                  <span className={styles.valLabelRight}>
                    {viewMode === 'amount' ? cat.afterImpactAmount.toLocaleString('en-IN') : `${afterSharePct.toFixed(1)}%`}
                  </span>
                </div>

                {/* Bars Pair */}
                <div className={styles.barsPair} style={{ height: chartHeight }}>
                  {/* Baseline Bar */}
                  <div
                    className={styles.barBaseline}
                    style={{ height: `${baseHeightPx}px` }}
                  />
                  {/* After Impact Bar */}
                  <div
                    className={styles.barAfter}
                    style={{ height: `${afterHeightPx}px` }}
                  />
                </div>

                {/* Increase Pill Badge */}
                <div className={styles.increaseBadge}>
                  +{cat.increasePct}%
                </div>

                {/* Bottom Category Icon & Name */}
                <div className={styles.colFooter}>
                  <div className={styles.catIconWrap} aria-hidden="true">
                    {renderIcon(cat.iconName)}
                  </div>
                  <span className={styles.catNameText}>{cat.name}</span>
                </div>

                {/* Interactive Tooltip on Hover */}
                {isHovered && (
                  <div className={styles.hoverTooltip}>
                    <div className={styles.tooltipTitle}>{cat.name}</div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipLabel}>Baseline:</span>
                      <span className={styles.tooltipVal}>₹{cat.baselineAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipLabel}>After Impact:</span>
                      <span className={styles.tooltipVal}>₹{cat.afterImpactAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className={styles.tooltipRow}>
                      <span className={styles.tooltipLabel}>Net Increase:</span>
                      <span className={styles.tooltipValPositive}>
                        +₹{cat.increaseAmount.toLocaleString('en-IN')} (+{cat.increasePct}%)
                      </span>
                    </div>
                    <div className={styles.tooltipDriver}>
                      <em>Driver: {cat.driverText}</em>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
