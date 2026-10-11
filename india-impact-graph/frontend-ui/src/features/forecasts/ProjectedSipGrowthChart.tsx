import React, { useState, useMemo } from 'react';
import {
  GrowthTrajectoryPoint,
  ForecastViewMode,
} from './types';
import { formatIndianCurrency, formatRupees } from './forecastCalculation';
import styles from './ProjectedSipGrowthChart.module.css';

export interface ProjectedSipGrowthChartProps {
  trajectory: GrowthTrajectoryPoint[];
  viewMode: ForecastViewMode;
  onChangeViewMode: (mode: ForecastViewMode) => void;
  baselineSip: number;
  afterImpactSip: number;
  reducedSip: number;
  totalInvested: number;
  projectedCorpus: number;
  estimatedReturns: number;
  wealthMultiplier: number;
  durationYears: number;
  activeScenarioName?: string;
}

export const ProjectedSipGrowthChart: React.FC<ProjectedSipGrowthChartProps> = ({
  trajectory,
  viewMode,
  onChangeViewMode,
  baselineSip,
  afterImpactSip,
  reducedSip,
  totalInvested,
  projectedCorpus,
  estimatedReturns,
  wealthMultiplier,
  durationYears,
  activeScenarioName,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // SVG Geometry Dimensions
  const svgWidth = 620;
  const svgHeight = 270;
  const padLeft = 55;
  const padRight = 65;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Final values
  const lastPoint = trajectory[trajectory.length - 1] || {
    baselineCorpus: 0,
    afterImpactCorpus: 0,
    reducedCorpus: 0,
    baselineWealthReal: 0,
    afterImpactWealthReal: 0,
    reducedWealthReal: 0,
  };

  const isWealth = viewMode === 'wealth';
  const finalBaseline = isWealth ? (lastPoint.baselineWealthReal || 0) : lastPoint.baselineCorpus;
  const finalAfter = isWealth ? (lastPoint.afterImpactWealthReal || 0) : lastPoint.afterImpactCorpus;
  const finalReduced = isWealth ? (lastPoint.reducedWealthReal || 0) : lastPoint.reducedCorpus;

  // Compute maximum Y for scale
  const maxY = useMemo(() => {
    const rawMax = Math.max(
      ...trajectory.map((p) =>
        isWealth
          ? Math.max(p.baselineWealthReal, p.afterImpactWealthReal, p.reducedWealthReal)
          : Math.max(p.baselineCorpus, p.afterImpactCorpus, p.reducedCorpus)
      ),
      1000000
    );
    // Round up to clean multiple
    if (rawMax > 10000000) {
      return Math.ceil(rawMax / 5000000) * 5000000;
    }
    return Math.ceil(rawMax / 1000000) * 1000000;
  }, [trajectory, isWealth]);

  // Coordinate scales
  const getX = (year: number) => {
    return padLeft + (year / Math.max(1, durationYears)) * plotWidth;
  };

  const getY = (val: number) => {
    const norm = Math.max(0, Math.min(1, val / maxY));
    return padTop + plotHeight - norm * plotHeight;
  };

  // Build SVG Paths
  const { pathBaseline, pathAfter, pathReduced, areaBaseline } = useMemo(() => {
    if (trajectory.length < 2) {
      return { pathBaseline: '', pathAfter: '', pathReduced: '', areaBaseline: '' };
    }

    const baselineCoords = trajectory.map((p) => ({
      x: getX(p.year),
      y: getY(isWealth ? p.baselineWealthReal : p.baselineCorpus),
    }));

    const afterCoords = trajectory.map((p) => ({
      x: getX(p.year),
      y: getY(isWealth ? p.afterImpactWealthReal : p.afterImpactCorpus),
    }));

    const reducedCoords = trajectory.map((p) => ({
      x: getX(p.year),
      y: getY(isWealth ? p.reducedWealthReal : p.reducedCorpus),
    }));

    const toSvgPath = (coords: Array<{ x: number; y: number }>) => {
      return coords.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        // Smooth cubic bezier
        const prev = coords[i - 1];
        const cp1x = prev.x + (pt.x - prev.x) / 2;
        const cp2x = prev.x + (pt.x - prev.x) / 2;
        return `${acc} C ${cp1x.toFixed(1)} ${prev.y.toFixed(1)}, ${cp2x.toFixed(1)} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }, '');
    };

    const bPath = toSvgPath(baselineCoords);
    const aPath = toSvgPath(afterCoords);
    const rPath = toSvgPath(reducedCoords);

    // Area fill under baseline
    const bottomY = padTop + plotHeight;
    const aFill = `${bPath} L ${baselineCoords[baselineCoords.length - 1].x.toFixed(1)} ${bottomY} L ${baselineCoords[0].x.toFixed(1)} ${bottomY} Z`;

    return {
      pathBaseline: bPath,
      pathAfter: aPath,
      pathReduced: rPath,
      areaBaseline: aFill,
    };
  }, [trajectory, isWealth, maxY, durationYears]);

  // Y-axis tick values (0, 25%, 50%, 75%, 100%)
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];

  // X-axis year ticks (e.g. 0, 2, 4, 6... up to durationYears)
  const xTicks = useMemo(() => {
    const step = durationYears <= 10 ? 2 : durationYears <= 20 ? 2 : 5;
    const ticks: number[] = [];
    for (let y = 0; y <= durationYears; y += step) {
      ticks.push(y);
    }
    if (ticks[ticks.length - 1] !== durationYears) {
      ticks.push(durationYears);
    }
    return ticks;
  }, [durationYears]);

  // Handle pointer interactions
  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaledX = (clientX / rect.width) * svgWidth;

    const plotRelX = Math.max(0, Math.min(plotWidth, scaledX - padLeft));
    const approxYear = Math.round((plotRelX / plotWidth) * durationYears);
    setHoverIndex(approxYear);
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
  };

  const activeHoverPoint = hoverIndex !== null ? trajectory[hoverIndex] : null;

  return (
    <article className={styles.chartCard} aria-label="Projected SIP Growth Chart">
      {/* 1. Header with View Mode Toggle */}
      <div className={styles.chartHeader}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Projected SIP Growth</h2>
          <span
            className={styles.tooltipBtn}
            title={
              isWealth
                ? "Wealth View: Displays future wealth discounted for inflation (real purchasing power)."
                : "Amount View: Displays nominal rupee future value assuming steady compounding."
            }
            aria-label="Chart mode details"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        </div>

        <div className={styles.viewModeToggle} role="group" aria-label="Forecast view mode">
          <button
            type="button"
            className={`${styles.toggleBtn} ${!isWealth ? styles.active : ''}`}
            onClick={() => onChangeViewMode('amount')}
          >
            Amount View
          </button>
          <button
            type="button"
            className={`${styles.toggleBtn} ${isWealth ? styles.active : ''}`}
            onClick={() => onChangeViewMode('wealth')}
          >
            Wealth View
          </button>
        </div>
      </div>

      {/* 2. Interactive Legend Row */}
      <div className={styles.legendRow}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotBaseline}`} aria-hidden="true" />
          <span className={styles.legendLabel}>Baseline ({formatRupees(baselineSip)}):</span>
          <span className={styles.legendVal}>{formatIndianCurrency(finalBaseline)}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotAfterImpact}`} aria-hidden="true" />
          <span className={styles.legendLabel}>
            {activeScenarioName ? `${activeScenarioName} (${formatRupees(afterImpactSip)}):` : `After Impact (${formatRupees(afterImpactSip)}):`}
          </span>
          <span className={styles.legendVal}>{formatIndianCurrency(finalAfter)}</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.dotReduced}`} aria-hidden="true" />
          <span className={styles.legendLabel}>Reduced SIP ({formatRupees(reducedSip)}):</span>
          <span className={styles.legendVal}>{formatIndianCurrency(finalReduced)}</span>
        </div>
      </div>

      {/* 3. SVG Multi-curve Canvas */}
      <div className={styles.svgWrapper}>
        <svg
          className={styles.chartSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="baselineAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#047857" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="afterAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284C7" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {yTicks.map((tickVal, idx) => {
            const yPos = getY(tickVal);
            return (
              <g key={`y-tick-${idx}`}>
                <line
                  x1={padLeft}
                  y1={yPos}
                  x2={padLeft + plotWidth}
                  y2={yPos}
                  className={styles.gridLine}
                />
                <text
                  x={padLeft - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className={styles.axisLabel}
                >
                  {formatIndianCurrency(tickVal)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {xTicks.map((yearVal, idx) => {
            const xPos = getX(yearVal);
            return (
              <text
                key={`x-tick-${idx}`}
                x={xPos}
                y={padTop + plotHeight + 18}
                textAnchor="middle"
                className={styles.axisLabel}
              >
                {yearVal === 0 ? 'Year 0' : `${yearVal}`}
              </text>
            );
          })}

          {/* Gradient area under baseline */}
          {areaBaseline && <path d={areaBaseline} fill="url(#baselineAreaGrad)" />}

          {/* Reduced SIP curve (Orange) */}
          {pathReduced && <path d={pathReduced} className={styles.curveReduced} />}

          {/* After Impact curve (Blue dashed) */}
          {pathAfter && <path d={pathAfter} className={styles.curveAfterImpact} />}

          {/* Baseline curve (Emerald Solid) */}
          {pathBaseline && <path d={pathBaseline} className={styles.curveBaseline} />}

          {/* End badges on the curves */}
          <g>
            {/* Baseline end badge */}
            <rect
              x={padLeft + plotWidth + 4}
              y={getY(finalBaseline) - 9}
              width="54"
              height="18"
              rx="4"
              fill="#047857"
            />
            <text
              x={padLeft + plotWidth + 31}
              y={getY(finalBaseline) + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="700"
            >
              {formatIndianCurrency(finalBaseline)}
            </text>

            {/* After Impact end badge */}
            <rect
              x={padLeft + plotWidth + 4}
              y={getY(finalAfter) - 9}
              width="54"
              height="18"
              rx="4"
              fill="#0284C7"
            />
            <text
              x={padLeft + plotWidth + 31}
              y={getY(finalAfter) + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="700"
            >
              {formatIndianCurrency(finalAfter)}
            </text>

            {/* Reduced SIP end badge */}
            <rect
              x={padLeft + plotWidth + 4}
              y={getY(finalReduced) - 9}
              width="54"
              height="18"
              rx="4"
              fill="#F59E0B"
            />
            <text
              x={padLeft + plotWidth + 31}
              y={getY(finalReduced) + 4}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="700"
            >
              {formatIndianCurrency(finalReduced)}
            </text>
          </g>

          {/* Interactive Hover Vertical Line and Points */}
          {hoverIndex !== null && activeHoverPoint && (
            <g>
              <line
                x1={getX(activeHoverPoint.year)}
                y1={padTop}
                x2={getX(activeHoverPoint.year)}
                y2={padTop + plotHeight}
                className={styles.hoverLine}
              />
              {/* Baseline Point */}
              <circle
                cx={getX(activeHoverPoint.year)}
                cy={getY(isWealth ? activeHoverPoint.baselineWealthReal : activeHoverPoint.baselineCorpus)}
                r="4.5"
                fill="#047857"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* After Point */}
              <circle
                cx={getX(activeHoverPoint.year)}
                cy={getY(isWealth ? activeHoverPoint.afterImpactWealthReal : activeHoverPoint.afterImpactCorpus)}
                r="4.5"
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              {/* Reduced Point */}
              <circle
                cx={getX(activeHoverPoint.year)}
                cy={getY(isWealth ? activeHoverPoint.reducedWealthReal : activeHoverPoint.reducedCorpus)}
                r="4.5"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip */}
        {hoverIndex !== null && activeHoverPoint && (
          <div
            className={styles.floatingTooltip}
            style={{
              left: `${(getX(activeHoverPoint.year) / svgWidth) * 100}%`,
            }}
          >
            <div className={styles.tooltipTitle}>Year {activeHoverPoint.year} Projection</div>
            <div className={styles.tooltipRow}>
              <span>Baseline ({formatRupees(baselineSip)}):</span>
              <span className={styles.tooltipValBaseline}>
                {formatIndianCurrency(isWealth ? activeHoverPoint.baselineWealthReal : activeHoverPoint.baselineCorpus)}
              </span>
            </div>
            <div className={styles.tooltipRow}>
              <span>{activeScenarioName ? activeScenarioName : 'After Impact'} ({formatRupees(afterImpactSip)}):</span>
              <span className={styles.tooltipValAfter}>
                {formatIndianCurrency(isWealth ? activeHoverPoint.afterImpactWealthReal : activeHoverPoint.afterImpactCorpus)}
              </span>
            </div>
            <div className={styles.tooltipRow}>
              <span>Reduced SIP ({formatRupees(reducedSip)}):</span>
              <span className={styles.tooltipValReduced}>
                {formatIndianCurrency(isWealth ? activeHoverPoint.reducedWealthReal : activeHoverPoint.reducedCorpus)}
              </span>
            </div>
            <div className={styles.tooltipRow} style={{ marginTop: 2, fontSize: '0.7rem', color: '#94A3B8' }}>
              <span>Principal Invested:</span>
              <span>{formatIndianCurrency(activeHoverPoint.afterImpactInvested)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Metric Summary Pills */}
      <div className={styles.summaryPillsRow}>
        <div className={styles.pillCard}>
          <div className={styles.pillIconCircle} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div className={styles.pillTextCol}>
            <span className={styles.pillLabel}>Total Investment</span>
            <span className={styles.pillValue}>{formatRupees(totalInvested)}</span>
          </div>
        </div>

        <div className={styles.pillCard}>
          <div className={styles.pillIconCircle} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className={styles.pillTextCol}>
            <span className={styles.pillLabel}>Projected Corpus</span>
            <span className={styles.pillValue}>{formatRupees(projectedCorpus)}</span>
          </div>
        </div>

        <div className={styles.pillCard}>
          <div className={styles.pillIconCircle} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className={styles.pillTextCol}>
            <span className={styles.pillLabel}>Estimated Returns</span>
            <span className={styles.pillValue}>{formatRupees(estimatedReturns)}</span>
          </div>
        </div>

        <div className={styles.pillCard}>
          <div className={styles.pillIconCircle} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className={styles.pillTextCol}>
            <span className={styles.pillLabel}>Wealth Multiplier</span>
            <span className={styles.pillValue}>{wealthMultiplier}x</span>
          </div>
        </div>
      </div>
    </article>
  );
};
