import React from 'react';
import { ProjectedConsumptionPoint } from './types';
import { formatRupees } from './consumptionCalculation';
import styles from './ProjectedConsumptionChart.module.css';

export interface ProjectedConsumptionChartProps {
  projectionPoints: ProjectedConsumptionPoint[];
  summary: {
    currentEstimate: number;
    pessimistic: number;
    pessimisticPct: number;
    optimistic: number;
    optimisticPct: number;
  };
}

export const ProjectedConsumptionChart: React.FC<ProjectedConsumptionChartProps> = ({
  projectionPoints,
  summary,
}) => {
  const svgWidth = 460;
  const svgHeight = 150;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 26;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxVal = Math.max(
    ...projectionPoints.map((p) => Math.max(p.baseCase, p.optimistic, p.pessimistic)),
    80000
  );

  const getX = (idx: number) => {
    if (projectionPoints.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (projectionPoints.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxVal));
    return padTop + plotHeight - norm * plotHeight;
  };

  const buildPath = (key: 'baseCase' | 'optimistic' | 'pessimistic') => {
    return projectionPoints.reduce((acc, pt, i) => {
      const x = getX(i);
      const y = getY(pt[key]);
      if (i === 0) return `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      return `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const yTicks = [
    { label: '₹80K', val: 80000 },
    { label: '60K', val: 60000 },
    { label: '40K', val: 40000 },
    { label: '20K', val: 20000 },
    { label: '0', val: 0 },
  ];

  return (
    <article className={styles.projectedCard} aria-label="Projected Consumption Next 12 Months">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Projected Consumption (Next 12 Months)</h2>
      </div>

      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#10B981' }} />
          <span>Base Case</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#0284C7' }} />
          <span>Optimistic ({summary.optimisticPct}%)</span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#E11D48' }} />
          <span>Pessimistic (+{summary.pessimisticPct}%)</span>
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

          {/* 3 Scenario Series Lines */}
          <path d={buildPath('baseCase')} stroke="#10B981" className={styles.seriesLine} />
          <path d={buildPath('optimistic')} stroke="#0284C7" className={styles.seriesLine} />
          <path d={buildPath('pessimistic')} stroke="#E11D48" className={styles.seriesLine} />

          {/* X Month Labels */}
          {projectionPoints.map((pt, i) => {
            // Label every other month if dense, or all
            const showLabel = i % 2 === 0 || i === projectionPoints.length - 1;
            if (!showLabel) return null;
            return (
              <text
                key={pt.month}
                x={getX(i)}
                y={svgHeight - 8}
                textAnchor="middle"
                className={styles.axisText}
              >
                {pt.month}
              </text>
            );
          })}
        </svg>
      </div>

      {/* 3 Summary Cards Below Chart */}
      <div className={styles.summaryCardsRow}>
        <div className={styles.miniSummaryCard}>
          <div className={`${styles.miniIconCircle} ${styles.iconCurrent}`} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div className={styles.miniCardText}>
            <span className={styles.miniCardValue}>{formatRupees(summary.currentEstimate)} /mo</span>
            <span className={styles.miniCardLabel}>Current Estimate</span>
          </div>
        </div>

        <div className={styles.miniSummaryCard}>
          <div className={`${styles.miniIconCircle} ${styles.iconPessimistic}`} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className={styles.miniCardText}>
            <span className={styles.miniCardValue}>{formatRupees(summary.pessimistic)} /mo</span>
            <span className={styles.miniCardLabel}>
              Pessimistic (+{summary.pessimisticPct}%)
            </span>
          </div>
        </div>

        <div className={styles.miniSummaryCard}>
          <div className={`${styles.miniIconCircle} ${styles.iconOptimistic}`} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          </div>
          <div className={styles.miniCardText}>
            <span className={styles.miniCardValue}>{formatRupees(summary.optimistic)} /mo</span>
            <span className={styles.miniCardLabel}>
              Optimistic ({summary.optimisticPct}%)
            </span>
          </div>
        </div>
      </div>

      <p className={styles.disclaimerNote}>
        Deterministic model scenarios calibrated to headline CPI inflation (+5.4%), energy disinflation ({summary.optimisticPct}%), and commodity supply shocks (+{summary.pessimisticPct}%). Model estimates, not guaranteed financial forecasts.
      </p>
    </article>
  );
};
