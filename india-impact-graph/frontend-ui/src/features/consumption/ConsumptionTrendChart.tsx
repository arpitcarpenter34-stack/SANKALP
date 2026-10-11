import React, { useState } from 'react';
import { TrendDataPoint, ConsumptionTimePeriod } from './types';
import { formatRupees } from './consumptionCalculation';
import styles from './ConsumptionTrendChart.module.css';

export interface ConsumptionTrendChartProps {
  trendPoints: TrendDataPoint[];
  timePeriod: ConsumptionTimePeriod;
  onTimePeriodChange: (p: ConsumptionTimePeriod) => void;
}

export const ConsumptionTrendChart: React.FC<ConsumptionTrendChartProps> = ({
  trendPoints,
  timePeriod,
  onTimePeriodChange,
}) => {
  const [metricMode, setMetricMode] = useState<'amount' | 'units'>('amount');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const svgWidth = 460;
  const svgHeight = 175;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 28;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const isUnits = metricMode === 'units';

  // Compute maximum values based on view mode
  const maxVal = isUnits ? 350 : 20000;

  const getX = (idx: number) => {
    if (trendPoints.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (trendPoints.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxVal));
    return padTop + plotHeight - norm * plotHeight;
  };

  const buildPath = (key: 'fuel' | 'food' | 'utilities' | 'others') => {
    return trendPoints.reduce((acc, pt, i) => {
      let val = pt[key];
      if (isUnits) {
        if (key === 'fuel') val = pt.fuelUnits || 48;
        else if (key === 'food') val = pt.foodUnits || 85;
        else if (key === 'utilities') val = pt.utilitiesUnits || 310;
        else val = pt.othersUnits || 45;
      }
      const x = getX(i);
      const y = getY(val);
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      return `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const yTicks = isUnits
    ? [
        { label: '350', val: 350 },
        { label: '250', val: 250 },
        { label: '150', val: 150 },
        { label: '50', val: 50 },
        { label: '0', val: 0 },
      ]
    : [
        { label: '₹20K', val: 20000 },
        { label: '15K', val: 15000 },
        { label: '10K', val: 10000 },
        { label: '5K', val: 5000 },
        { label: '0', val: 0 },
      ];

  const hoveredPoint = hoverIndex !== null ? trendPoints[hoverIndex] : null;

  return (
    <article className={styles.trendCard} aria-label="Consumption Trend Chart">
      <div className={styles.cardHeader}>
        <div className={styles.titleArea}>
          <h2 className={styles.cardTitle}>Consumption Trend</h2>
          <span
            className={styles.infoIcon}
            title="Monthly expenditure trajectory across key consumption categories. Units show physical commodity volume."
            aria-hidden="true"
          >
            ⓘ
          </span>
        </div>

        <div className={styles.controlsArea}>
          <div className={styles.toggleGroup} role="group" aria-label="Metric Mode Toggle">
            <button
              type="button"
              className={`${styles.toggleBtn} ${!isUnits ? styles.toggleActive : ''}`}
              onClick={() => setMetricMode('amount')}
            >
              Amount
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${isUnits ? styles.toggleActive : ''}`}
              onClick={() => setMetricMode('units')}
            >
              Units
            </button>
          </div>

          <select
            className={styles.periodSelect}
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value as ConsumptionTimePeriod)}
            aria-label="Select Range"
          >
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>

      {/* Legend Row */}
      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }} />
          <span>Fuel & Energy</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#0284C7' }} />
          <span>Food & Groceries</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#F59E0B' }} />
          <span>Utilities</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#8B5CF6' }} />
          <span>Others</span>
        </div>
      </div>

      <div className={styles.chartSvgWrapper}>
        <svg className={styles.chartSvg} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
          {/* Y-Axis Grid Lines & Labels */}
          {yTicks.map((tick) => {
            const y = getY(tick.val);
            return (
              <g key={tick.label}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  className={styles.gridLine}
                />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" className={styles.axisText}>
                  {tick.label}
                </text>
              </g>
            );
          })}

          {/* Series Lines */}
          <path d={buildPath('fuel')} stroke="#10B981" className={styles.seriesLine} />
          <path d={buildPath('food')} stroke="#0284C7" className={styles.seriesLine} />
          <path d={buildPath('utilities')} stroke="#F59E0B" className={styles.seriesLine} />
          <path d={buildPath('others')} stroke="#8B5CF6" className={styles.seriesLine} />

          {/* Data Points and X-Axis Labels */}
          {trendPoints.map((pt, i) => {
            const x = getX(i);
            const yFuel = getY(isUnits ? pt.fuelUnits || 48 : pt.fuel);
            const yFood = getY(isUnits ? pt.foodUnits || 85 : pt.food);
            const yUtil = getY(isUnits ? pt.utilitiesUnits || 310 : pt.utilities);
            const yOther = getY(isUnits ? pt.othersUnits || 45 : pt.others);

            return (
              <g key={pt.month}>
                <text
                  x={x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className={styles.axisText}
                >
                  {pt.month}
                </text>

                {/* Circle handles for hover interaction */}
                <circle
                  cx={x}
                  cy={yFuel}
                  r="3.5"
                  fill="#10B981"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className={styles.dataPoint}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                <circle
                  cx={x}
                  cy={yFood}
                  r="3.5"
                  fill="#0284C7"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className={styles.dataPoint}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                <circle
                  cx={x}
                  cy={yUtil}
                  r="3.5"
                  fill="#F59E0B"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className={styles.dataPoint}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
                <circle
                  cx={x}
                  cy={yOther}
                  r="3.5"
                  fill="#8B5CF6"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className={styles.dataPoint}
                  onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(null)}
                />
              </g>
            );
          })}
        </svg>

        {hoveredPoint && (
          <div className={styles.hoverTooltip}>
            <strong>{hoveredPoint.month} Snapshot</strong>
            <span>
              Fuel: {isUnits ? `${hoveredPoint.fuelUnits} L` : formatRupees(hoveredPoint.fuel)}
            </span>
            <span>
              Food: {isUnits ? `${hoveredPoint.foodUnits} kg` : formatRupees(hoveredPoint.food)}
            </span>
            <span>
              Utilities: {isUnits ? `${hoveredPoint.utilitiesUnits} kWh/SCM` : formatRupees(hoveredPoint.utilities)}
            </span>
            <span>
              Others: {isUnits ? `${hoveredPoint.othersUnits} units` : formatRupees(hoveredPoint.others)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};
