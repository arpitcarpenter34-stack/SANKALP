import React, { useState, useMemo } from 'react';
import { ForecastScenarioId, ForecastScenarioItem } from './types';
import { formatIndianCurrency, formatRupees } from './forecastCalculation';
import styles from './SipCorpusComparisonChart.module.css';

export interface SipCorpusComparisonChartProps {
  scenarios: Record<ForecastScenarioId, ForecastScenarioItem>;
  selectedScenarioId: ForecastScenarioId;
  onSelectScenario?: (id: ForecastScenarioId) => void;
}

export const SipCorpusComparisonChart: React.FC<SipCorpusComparisonChartProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
}) => {
  const [hoveredScenario, setHoveredScenario] = useState<ForecastScenarioItem | null>(null);

  const scenarioList: ForecastScenarioItem[] = useMemo(() => {
    return [
      scenarios.pessimistic,
      scenarios.base,
      scenarios.optimistic,
    ].filter(Boolean);
  }, [scenarios]);

  // SVG Geometry
  const svgWidth = 320;
  const svgHeight = 180;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 22;
  const padBottom = 28;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxVal = useMemo(() => {
    const raw = Math.max(...scenarioList.map((s) => s.projectedCorpus), 10000000);
    return Math.ceil(raw / 5000000) * 5000000;
  }, [scenarioList]);

  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

  const getY = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxVal));
    return padTop + plotHeight - norm * plotHeight;
  };

  const barWidth = 38;
  const barGap = (plotWidth - scenarioList.length * barWidth) / (scenarioList.length + 1);

  return (
    <article className={styles.cardContainer} aria-label="SIP Corpus Comparison Chart">
      <div className={styles.headerRow}>
        <h2 className={styles.title}>SIP Corpus Comparison</h2>
        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.boxInvested}`} aria-hidden="true" />
            <span>Total Investment</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendBox} ${styles.boxReturns}`} aria-hidden="true" />
            <span>Estimated Returns</span>
          </div>
        </div>
      </div>

      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
        >
          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tickVal, idx) => {
            const yPos = getY(tickVal);
            return (
              <g key={`cmp-y-${idx}`}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + plotWidth}
                  y2={yPos}
                  className={styles.gridLine}
                />
                <text
                  x={padLeft - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  className={styles.axisLabel}
                >
                  {formatIndianCurrency(tickVal)}
                </text>
              </g>
            );
          })}

          {/* Stacked Bars */}
          {scenarioList.map((sc, i) => {
            const barX = padLeft + barGap + i * (barWidth + barGap);
            const totalY = getY(sc.projectedCorpus);
            const investedHeight = (sc.totalInvested / maxVal) * plotHeight;
            const returnsHeight = (sc.estimatedGains / maxVal) * plotHeight;
            const investedY = padTop + plotHeight - investedHeight;
            const returnsY = investedY - returnsHeight;

            const isSelected = selectedScenarioId === sc.id;

            return (
              <g
                key={sc.id}
                className={styles.barGroup}
                onClick={() => onSelectScenario?.(sc.id)}
                onPointerEnter={() => setHoveredScenario(sc)}
                onPointerLeave={() => setHoveredScenario(null)}
              >
                {/* Total label on top of bar */}
                <text
                  x={barX + barWidth / 2}
                  y={totalY - 5}
                  textAnchor="middle"
                  className={styles.topTotalLabel}
                >
                  {formatIndianCurrency(sc.projectedCorpus)}
                </text>

                {/* Returns bar (top stacked segment - emerald) */}
                <rect
                  x={barX}
                  y={returnsY}
                  width={barWidth}
                  height={Math.max(2, returnsHeight)}
                  rx="3"
                  className={styles.barReturns}
                  stroke={isSelected ? '#059669' : 'none'}
                  strokeWidth={isSelected ? '2' : '0'}
                />

                {/* Invested bar (bottom stacked segment - mint) */}
                <rect
                  x={barX}
                  y={investedY}
                  width={barWidth}
                  height={Math.max(2, investedHeight)}
                  rx="2"
                  className={styles.barInvested}
                />

                {/* Category name on X-axis */}
                <text
                  x={barX + barWidth / 2}
                  y={padTop + plotHeight + 16}
                  textAnchor="middle"
                  className={styles.xCategoryLabel}
                >
                  {sc.name.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredScenario && (
          <div
            className={styles.floatingTooltip}
            style={{
              left: '50%',
            }}
          >
            <div style={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: 2 }}>
              {hoveredScenario.name}
            </div>
            <div>Invested: <strong>{formatRupees(hoveredScenario.totalInvested)}</strong></div>
            <div>Gains: <strong>{formatRupees(hoveredScenario.estimatedGains)}</strong></div>
            <div>Total: <strong>{formatRupees(hoveredScenario.projectedCorpus)}</strong></div>
          </div>
        )}
      </div>
    </article>
  );
};
