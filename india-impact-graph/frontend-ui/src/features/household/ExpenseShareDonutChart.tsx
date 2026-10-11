import React, { useState } from 'react';
import { ExpenseCategoryItem } from './types';
import styles from './ExpenseShareDonutChart.module.css';

export interface ExpenseShareDonutChartProps {
  categories: ExpenseCategoryItem[];
  totalExpenses: number;
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
}

export const ExpenseShareDonutChart: React.FC<ExpenseShareDonutChartProps> = ({
  categories,
  totalExpenses,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  // Compute total for share calculation
  const totalSum = categories.reduce((acc, cat) => acc + cat.afterImpactAmount, 0) || totalExpenses || 1;

  let currentOffset = 0;
  const slices = categories.map((cat, i) => {
    const fraction = cat.afterImpactAmount / totalSum;
    const strokeDash = fraction * circumference;
    const strokeOffset = -currentOffset;
    currentOffset += strokeDash;

    return {
      cat,
      index: i,
      fraction,
      strokeDash,
      strokeOffset,
      pctDisplay: (fraction * 100).toFixed(1),
    };
  });

  return (
    <div className={styles.donutCard}>
      <h3 className={styles.chartTitle}>Expense Share (After Impact)</h3>

      <div className={styles.bodyRow}>
        {/* SVG Donut Canvas */}
        <div className={styles.donutWrapper}>
          <svg className={styles.donutSvg} viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="18"
            />
            {/* Slices */}
            {slices.map((slice) => {
              const isHovered = hoveredIndex === slice.index || selectedCategoryId === slice.cat.id;
              return (
                <circle
                  key={slice.cat.id}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.cat.color}
                  strokeWidth={isHovered ? 21 : 17}
                  strokeDasharray={`${slice.strokeDash} ${circumference}`}
                  strokeDashoffset={slice.strokeOffset}
                  className={`${styles.sliceSegment} ${isHovered ? styles.sliceHighlighted : ''}`}
                  onMouseEnter={() => setHoveredIndex(slice.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onSelectCategory && onSelectCategory(slice.cat.id)}
                />
              );
            })}
          </svg>

          {/* Central Callout Value */}
          <div className={styles.centerLabel}>
            <span className={styles.centerValue}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
            <span className={styles.centerSubtitle}>Total Expenses</span>
          </div>
        </div>

        {/* Category Legend List */}
        <div className={styles.legendList} role="list">
          {slices.map((slice) => {
            const isHovered = hoveredIndex === slice.index || selectedCategoryId === slice.cat.id;
            return (
              <div
                key={slice.cat.id}
                role="listitem"
                className={`${styles.legendItem} ${isHovered ? styles.legendItemActive : ''}`}
                onMouseEnter={() => setHoveredIndex(slice.index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectCategory && onSelectCategory(slice.cat.id)}
              >
                <div className={styles.legendLeft}>
                  <span
                    className={styles.colorDot}
                    style={{ backgroundColor: slice.cat.color }}
                  />
                  <span className={styles.catName}>{slice.cat.name}</span>
                </div>
                <span className={styles.catPct}>{slice.pctDisplay}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
