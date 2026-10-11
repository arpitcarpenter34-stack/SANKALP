import React, { useState } from 'react';
import { CategoryCompositionSlice } from './types';
import { formatRupees } from './consumptionCalculation';
import styles from './ConsumptionCompositionDonut.module.css';

export interface ConsumptionCompositionDonutProps {
  slices: CategoryCompositionSlice[];
  totalMonthly: number;
  selectedCategoryId?: string;
  onSelectCategory?: (id: string) => void;
}

export const ConsumptionCompositionDonut: React.FC<ConsumptionCompositionDonutProps> = ({
  slices,
  totalMonthly,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [hoveredSliceId, setHoveredSliceId] = useState<string | null>(null);

  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  const renderedSlices = slices.map((slice) => {
    const fraction = slice.amount / (totalMonthly || 1);
    const strokeDash = fraction * circumference;
    const strokeOffset = -currentOffset;
    currentOffset += strokeDash;

    return {
      slice,
      strokeDash,
      strokeOffset,
    };
  });

  return (
    <article className={styles.donutCard} aria-label="Category-wise Consumption Composition">
      <div className={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h2 className={styles.cardTitle}>Category-wise Consumption Composition</h2>
          <span
            className={styles.infoIcon}
            title="7-category MoSPI consumption breakdown. Other Services aggregates non-fuel transport, healthcare, education, and miscellaneous expenses. All percentages sum to exactly 100.0% of Total Monthly Consumption."
            aria-hidden="true"
          >
            ⓘ
          </span>
        </div>
      </div>

      <div className={styles.bodyRow}>
        <div className={styles.donutWrapper}>
          <svg className={styles.donutSvg} viewBox="0 0 160 160" aria-hidden="true">
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="18"
            />
            {/* Donut Slices */}
            {renderedSlices.map(({ slice, strokeDash, strokeOffset }) => {
              const isHighlighted =
                hoveredSliceId === slice.id || selectedCategoryId === slice.id;
              return (
                <circle
                  key={slice.id}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHighlighted ? 22 : 18}
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  className={`${styles.sliceSegment} ${
                    isHighlighted ? styles.sliceHighlighted : ''
                  }`}
                  onMouseEnter={() => setHoveredSliceId(slice.id)}
                  onMouseLeave={() => setHoveredSliceId(null)}
                  onClick={() => onSelectCategory && onSelectCategory(slice.id)}
                />
              );
            })}
          </svg>

          <div className={styles.centerLabel}>
            <span className={styles.centerValue}>{formatRupees(totalMonthly)}</span>
            <span className={styles.centerSubtitle}>Total Monthly</span>
          </div>
        </div>

        {/* Legend List */}
        <div className={styles.legendList} role="list">
          {slices.map((slice) => {
            const isHighlighted =
              hoveredSliceId === slice.id || selectedCategoryId === slice.id;
            return (
              <div
                key={slice.id}
                role="listitem"
                className={`${styles.legendItem} ${
                  isHighlighted ? styles.legendItemActive : ''
                }`}
                onMouseEnter={() => setHoveredSliceId(slice.id)}
                onMouseLeave={() => setHoveredSliceId(null)}
                onClick={() => onSelectCategory && onSelectCategory(slice.id)}
                title={`${slice.name}: ${formatRupees(slice.amount)} (${slice.sharePct}%)`}
              >
                <div className={styles.legendLeft}>
                  <span
                    className={styles.colorDot}
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className={styles.catName}>{slice.name}</span>
                </div>
                <span className={styles.catPct}>{slice.sharePct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
};
