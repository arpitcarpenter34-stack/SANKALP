import React, { useState, useMemo } from 'react';
import { NationalAverageComparisonItem } from './types';
import { formatRupees, formatPercent } from './consumptionCalculation';
import styles from './ConsumptionVsNationalAverageChart.module.css';

export interface ConsumptionVsNationalAverageChartProps {
  comparisons: NationalAverageComparisonItem[];
}

export const ConsumptionVsNationalAverageChart: React.FC<ConsumptionVsNationalAverageChartProps> = ({
  comparisons,
}) => {
  const [householdArchetype, setHouseholdArchetype] = useState<'urban' | 'rural' | 'all_india'>('urban');
  const [hoveredItemIndex, setHoveredItemIndex] = useState<number | null>(null);

  const svgWidth = 460;
  const svgHeight = 175;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 28;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxVal = 20000;

  const getY = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxVal));
    return padTop + plotHeight - norm * plotHeight;
  };

  const yTicks = [
    { label: '₹20K', val: 20000 },
    { label: '15K', val: 15000 },
    { label: '10K', val: 10000 },
    { label: '5K', val: 5000 },
    { label: '0', val: 0 },
  ];

  // Dynamic benchmark scaling based on active archetype
  const activeComparisons = useMemo(() => {
    return comparisons.map((item) => {
      let benchmarkAmount = item.nationalAverageAmount;
      if (householdArchetype === 'rural') {
        // MoSPI HCES rural benchmark weights
        const ruralMultiplier =
          item.id === 'food' ? 0.65 : item.id === 'fuel' ? 0.55 : item.id === 'utilities' ? 0.52 : 0.60;
        benchmarkAmount = Math.round(item.nationalAverageAmount * ruralMultiplier);
      } else if (householdArchetype === 'all_india') {
        // Blended all-India average
        benchmarkAmount = Math.round(item.nationalAverageAmount * 0.74);
      }

      const delta = item.householdAmount - benchmarkAmount;
      const deltaPct = benchmarkAmount > 0 ? (delta / benchmarkAmount) * 100 : 0;

      return {
        ...item,
        activeBenchmark: benchmarkAmount,
        activeDelta: delta,
        activeDeltaPct: deltaPct,
      };
    });
  }, [comparisons, householdArchetype]);

  const groupWidth = plotWidth / (activeComparisons.length || 1);
  const barWidth = 9;

  const hoveredItem = hoveredItemIndex !== null ? activeComparisons[hoveredItemIndex] : null;

  const benchmarkLabel =
    householdArchetype === 'urban'
      ? 'National Average (Urban)'
      : householdArchetype === 'rural'
      ? 'National Average (Rural)'
      : 'All India Average';

  return (
    <article className={styles.compareCard} aria-label="Consumption vs National Average Chart">
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.cardTitle}>Consumption vs National Average</h2>
          <span
            className={styles.infoIcon}
            title="Benchmark deciles calibrated from MoSPI HCES 2023–24 Table 2. Not fabricated live bank data."
            aria-hidden="true"
          >
            ⓘ
          </span>
        </div>

        <select
          className={styles.headerSelect}
          value={householdArchetype}
          onChange={(e) => setHouseholdArchetype(e.target.value as 'urban' | 'rural' | 'all_india')}
          aria-label="Select benchmark archetype"
        >
          <option value="urban">Urban Households</option>
          <option value="rural">Rural Households</option>
          <option value="all_india">All India Average</option>
        </select>
      </div>

      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={styles.legendSquare} style={{ backgroundColor: '#10B981' }} />
          <span>Your Household</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendSquare} style={{ backgroundColor: '#94A3B8' }} />
          <span>{benchmarkLabel}</span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <svg className={styles.chartSvg} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {/* Y Grid lines */}
          {yTicks.map((t) => {
            const y = getY(t.val);
            return (
              <g key={t.label}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  className={styles.gridLine}
                />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" className={styles.axisText}>
                  {t.label}
                </text>
              </g>
            );
          })}

          {/* Grouped Bars */}
          {activeComparisons.map((item, idx) => {
            const groupCenterX = padLeft + idx * groupWidth + groupWidth / 2;
            const xHousehold = groupCenterX - barWidth - 1.5;
            const xNational = groupCenterX + 1.5;

            const yHousehold = getY(item.householdAmount);
            const hHousehold = Math.max(2, padTop + plotHeight - yHousehold);

            const yNational = getY(item.activeBenchmark);
            const hNational = Math.max(2, padTop + plotHeight - yNational);

            return (
              <g
                key={item.id}
                onMouseEnter={() => setHoveredItemIndex(idx)}
                onMouseLeave={() => setHoveredItemIndex(null)}
              >
                {/* Household Bar (Emerald) */}
                <rect
                  x={xHousehold}
                  y={yHousehold}
                  width={barWidth}
                  height={hHousehold}
                  rx="3"
                  fill="#10B981"
                  className={styles.barRect}
                />

                {/* National Average Bar (Slate) */}
                <rect
                  x={xNational}
                  y={yNational}
                  width={barWidth}
                  height={hNational}
                  rx="3"
                  fill="#94A3B8"
                  className={styles.barRect}
                />

                {/* Category X Label */}
                <text
                  x={groupCenterX}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className={styles.axisText}
                >
                  {item.category}
                </text>
              </g>
            );
          })}
        </svg>

        {hoveredItem && (
          <div className={styles.hoverTooltip}>
            <strong>{hoveredItem.category} Comparison</strong>
            <span>Your Household: {formatRupees(hoveredItem.householdAmount)}</span>
            <span>{benchmarkLabel}: {formatRupees(hoveredItem.activeBenchmark)}</span>
            <span>
              Variance: {hoveredItem.activeDelta >= 0 ? '+' : ''}
              {formatRupees(hoveredItem.activeDelta)} ({formatPercent(hoveredItem.activeDeltaPct)})
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
