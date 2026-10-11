import React, { useState } from 'react';
import { StockPerformanceConfig } from './types';
import styles from './StockPerformanceCard.module.css';

export interface StockPerformanceCardProps {
  config: StockPerformanceConfig;
}

export const StockPerformanceCard: React.FC<StockPerformanceCardProps> = ({ config }) => {
  const [activeIndexId, setActiveIndexId] = useState<string>(
    config.defaultIndexId || config.indices[0]?.id || 'nifty-it'
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activeIndex =
    config.indices.find((idx) => idx.id === activeIndexId) || config.indices[0];

  if (!activeIndex) return null;

  // SVG Geometry
  const width = 500;
  const height = 180;
  const paddingLeft = 46;
  const paddingRight = 16;
  const paddingTop = 12;
  const paddingBottom = 26;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const points = activeIndex.chartPoints;
  const months = activeIndex.months;
  const numPoints = points.length;

  const rawMin = Math.min(...points);
  const rawMax = Math.max(...points);
  const yMin = activeIndex.minY || Math.floor(rawMin * 0.95);
  const yMax = activeIndex.maxY || Math.ceil(rawMax * 1.05);
  const yRange = yMax - yMin || 1;

  const getX = (idx: number) => {
    if (numPoints <= 1) return paddingLeft + chartW / 2;
    return paddingLeft + (idx / (numPoints - 1)) * chartW;
  };

  const getY = (val: number) => {
    const norm = (val - yMin) / yRange;
    return paddingTop + chartH * (1 - norm);
  };

  const pathD = points
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(val).toFixed(1)}`)
    .join(' ');

  // Y-axis grid ticks (3 steps)
  const yTicks = [0, 0.5, 1].map((step) => {
    const val = Math.round(yMin + step * yRange);
    const y = paddingTop + chartH * (1 - step);
    return { val, y };
  });

  const activePointIdx = hoverIndex !== null ? hoverIndex : numPoints - 1;

  const strokeColor = activeIndex.trend === 'down' ? '#DC2626' : '#047857';

  return (
    <div className={styles.stockCard}>
      <h3 className={styles.title}>Stock Performance (Related Indices)</h3>

      {/* Tabs and Current Quote Header */}
      <div className={styles.tabsRow}>
        <div className={styles.indexPills} role="tablist">
          {config.indices.map((idx) => {
            const isSelected = idx.id === activeIndexId;
            return (
              <button
                key={idx.id}
                role="tab"
                aria-selected={isSelected}
                className={`${styles.indexTabBtn} ${isSelected ? styles.activeTab : ''}`}
                onClick={() => {
                  setActiveIndexId(idx.id);
                  setHoverIndex(null);
                }}
              >
                {idx.name}
              </button>
            );
          })}
        </div>

        <div className={styles.currentQuote}>
          <span className={styles.quoteVal}>{activeIndex.currentValue}</span>
          <span
            className={
              activeIndex.trend === 'down'
                ? styles.quoteChangeNegative
                : styles.quoteChangePositive
            }
          >
            {activeIndex.change}
          </span>
        </div>
      </div>

      {/* Line Chart Area */}
      <div className={styles.chartArea}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.chartSvg}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Grid lines */}
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
                {tick.val.toLocaleString('en-IN')}
              </text>
            </g>
          ))}

          {/* X axis labels */}
          {months.map((m, idx) => (
            <text
              key={idx}
              x={getX(idx)}
              y={height - 6}
              textAnchor="middle"
              className={styles.axisText}
            >
              {m}
            </text>
          ))}

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((val, idx) => {
            const isHovered = idx === activePointIdx;
            return (
              <circle
                key={idx}
                cx={getX(idx)}
                cy={getY(val)}
                r={isHovered ? 4.5 : 3}
                fill={strokeColor}
                stroke="#FFFFFF"
                strokeWidth={isHovered ? 2 : 1}
              />
            );
          })}

          {/* Hover interactive rectangles */}
          {points.map((_, idx) => {
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
      </div>

      {/* 4 Bottom Mini Index Cards */}
      <div className={styles.summaryRow}>
        {config.indices.map((idx) => {
          const isSelected = idx.id === activeIndexId;
          const isDown = idx.trend === 'down';
          return (
            <button
              key={idx.id}
              type="button"
              className={`${styles.summaryMiniCard} ${isSelected ? styles.activeMiniCard : ''}`}
              onClick={() => {
                setActiveIndexId(idx.id);
                setHoverIndex(null);
              }}
              title={`View ${idx.name} performance chart`}
            >
              <span className={styles.miniCardName}>{idx.name}</span>
              <span className={styles.miniCardVal}>{idx.currentValue}</span>
              <span
                className={
                  isDown ? styles.miniCardChangeNegative : styles.miniCardChangePositive
                }
              >
                {idx.change}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
