import React, { useState } from 'react';
import { ImportDependenceConfig } from './types';
import styles from './ImportDonutChart.module.css';

export interface ImportDonutChartProps {
  config: ImportDependenceConfig;
}

export const ImportDonutChart: React.FC<ImportDonutChartProps> = ({ config }) => {
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  // SVG Geometry
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 62;
  const strokeWidth = 17;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke-dasharray and stroke-dashoffset for each slice
  let accumulatedPct = 0;
  const slices = config.categories.map((cat) => {
    const sliceLen = (cat.percentage / 100) * circumference;
    const offset = circumference - (accumulatedPct / 100) * circumference;
    accumulatedPct += cat.percentage;
    return {
      ...cat,
      sliceLen,
      offset,
    };
  });

  const activeCat = config.categories.find((c) => c.id === hoveredCatId);

  return (
    <div className={styles.donutCard}>
      <h3 className={styles.chartTitle}>Import Dependence by Category</h3>

      <div className={styles.bodyRow}>
        {/* Donut Chart Canvas */}
        <div className={styles.donutWrapper}>
          <svg viewBox={`0 0 ${size} ${size}`} className={styles.donutSvg}>
            {/* Background Track */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#E2ECE5"
              strokeWidth={strokeWidth}
            />

            {/* Category Slices */}
            {slices.map((slice) => {
              const isHighlighted = hoveredCatId === slice.id;
              return (
                <circle
                  key={slice.id}
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHighlighted ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${slice.sliceLen} ${circumference - slice.sliceLen}`}
                  strokeDashoffset={slice.offset}
                  className={`${styles.sliceSegment} ${isHighlighted ? styles.sliceHighlighted : ''}`}
                  onMouseEnter={() => setHoveredCatId(slice.id)}
                  onMouseLeave={() => setHoveredCatId(null)}
                />
              );
            })}
          </svg>

          {/* Center Callout */}
          <div className={styles.centerLabel}>
            {activeCat ? (
              <>
                <span className={styles.centerValue} style={{ color: activeCat.color }}>
                  {activeCat.percentage}%
                </span>
                <span className={styles.centerText}>{activeCat.name}</span>
              </>
            ) : (
              <>
                <span className={styles.centerValue}>{config.totalDependencePct}%</span>
                <span className={styles.centerText}>{config.totalLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className={styles.legendList} role="list">
          {config.categories.map((cat) => {
            const isHighlighted = hoveredCatId === cat.id;
            return (
              <div
                key={cat.id}
                role="listitem"
                className={`${styles.legendItem} ${isHighlighted ? styles.legendItemActive : ''}`}
                onMouseEnter={() => setHoveredCatId(cat.id)}
                onMouseLeave={() => setHoveredCatId(null)}
              >
                <div className={styles.legendLeft}>
                  <span className={styles.colorDot} style={{ background: cat.color }} />
                  <span className={styles.catName} title={cat.name}>
                    {cat.name}
                  </span>
                </div>
                <span className={styles.catPct}>{cat.percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
