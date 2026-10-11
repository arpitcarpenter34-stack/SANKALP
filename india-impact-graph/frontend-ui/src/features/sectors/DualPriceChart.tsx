import React, { useState } from 'react';
import { DualPriceChartConfig, TimeRangeKey } from './types';
import styles from './DualPriceChart.module.css';

export interface DualPriceChartProps {
  config: DualPriceChartConfig;
}

export const DualPriceChart: React.FC<DualPriceChartProps> = ({ config }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRangeKey>(config.defaultRange);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rangeData = config.ranges[selectedRange] || config.ranges['6M'];
  const dates = rangeData.dates;
  const seriesA = rangeData.seriesA;
  const seriesB = rangeData.seriesB;

  // SVG Geometry
  const width = 500;
  const height = 230;
  const paddingLeft = 36;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  // Find min and max for Y-scale
  const allVals = [...seriesA, ...seriesB];
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  const yMin = Math.floor(rawMin * 0.85);
  const yMax = Math.ceil(rawMax * 1.15) || 100;
  const yRange = yMax - yMin || 1;

  const numPoints = dates.length;

  const getX = (idx: number) => {
    if (numPoints <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (numPoints - 1)) * chartW;
  };

  const getY = (val: number) => {
    const normalized = (val - yMin) / yRange;
    return paddingTop + chartH * (1 - normalized);
  };

  // Build SVG Path strings
  const pathA = seriesA
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(val).toFixed(1)}`)
    .join(' ');

  const pathB = seriesB
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(val).toFixed(1)}`)
    .join(' ');

  // Y-axis grid ticks (4 steps)
  const yTicks = [0, 0.33, 0.66, 1].map((step) => {
    const val = Math.round(yMin + step * yRange);
    const y = paddingTop + chartH * (1 - step);
    return { val, y };
  });

  const activeIdx = hoverIndex !== null ? hoverIndex : numPoints - 1;
  const activeX = getX(activeIdx);
  const activeValA = seriesA[activeIdx];
  const activeValB = seriesB[activeIdx];
  const activeDate = dates[activeIdx];

  return (
    <div className={styles.chartCard}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h3 className={styles.chartTitle}>{config.title}</h3>
          <button
            type="button"
            className={styles.infoBtn}
            title={config.infoTooltip}
            aria-label="Information about price comparison chart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </div>

        {/* Range Selector Pills */}
        <div className={styles.rangePills} role="group" aria-label="Select historical range">
          {(['6M', '1Y', '3Y', '5Y'] as TimeRangeKey[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`${styles.rangeBtn} ${selectedRange === r ? styles.activeRange : ''}`}
              onClick={() => {
                setSelectedRange(r);
                setHoverIndex(null);
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={styles.legendDotA} />
          <span>{config.seriesAName}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotB} />
          <span>{config.seriesBName}</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className={styles.svgWrap}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.chartSvg}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines and Y axis labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={width - paddingRight}
                y2={tick.y}
                className={styles.gridLine}
              />
              <text
                x={paddingLeft - 6}
                y={tick.y + 3}
                textAnchor="end"
                className={styles.axisText}
              >
                {tick.val}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {dates.map((date, idx) => {
            // Show all if <=6, otherwise step to prevent crowding
            const showLabel = numPoints <= 6 || idx === 0 || idx === numPoints - 1 || idx % Math.ceil(numPoints / 5) === 0;
            if (!showLabel) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - 8}
                textAnchor="middle"
                className={styles.axisText}
              >
                {date.split(' ')[0]}
              </text>
            );
          })}

          {/* Lines */}
          <path
            d={pathA}
            fill="none"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={pathB}
            fill="none"
            stroke="#0284C7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Crosshair & Points */}
          {activeIdx !== null && (
            <>
              <line
                x1={activeX}
                y1={paddingTop}
                x2={activeX}
                y2={height - paddingBottom}
                className={styles.crosshair}
              />
              <circle
                cx={activeX}
                cy={getY(activeValA)}
                r="4.5"
                fill="#047857"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle
                cx={activeX}
                cy={getY(activeValB)}
                r="4.5"
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </>
          )}

          {/* Hover zones along X */}
          {dates.map((_, idx) => {
            const x = getX(idx);
            const stepW = chartW / Math.max(1, numPoints - 1);
            return (
              <rect
                key={idx}
                x={x - stepW / 2}
                y={paddingTop}
                width={stepW}
                height={chartH}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeIdx !== null && (
          <div
            className={styles.tooltipOverlay}
            style={{
              left: `${(activeX / width) * 100}%`,
              top: `${(getY(Math.min(activeValA, activeValB)) / height) * 100}%`,
            }}
          >
            <div className={styles.tooltipMonth}>{activeDate}</div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipDotA} />
              <span>{config.seriesAName.split(' ')[0]}:</span>
              <span className={styles.tooltipValue}>{activeValA}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipDotB} />
              <span>{config.seriesBName.split(' ')[0]}:</span>
              <span className={styles.tooltipValue}>{activeValB}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
