import React, { useState } from 'react';
import { ImpactAnalysisScenario, PlatformId } from './types';
import {
  calculateSipComparisonTrajectories,
  formatRupees,
} from './comparisonCalculation';
import styles from './SipInvestmentComparison.module.css';

interface SipInvestmentComparisonProps {
  scenario: ImpactAnalysisScenario;
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
  onNavigateToSipForecasts?: () => void;
}

const PLATFORM_COLORS: Record<PlatformId, string> = {
  news_apps: '#dc2626',
  financial_tools: '#d97706',
  research_platforms: '#0284c7',
  bharat_impact: '#059669',
};

const PLATFORMS_ORDER: { id: PlatformId; label: string }[] = [
  { id: 'bharat_impact', label: 'BharatImpact' },
  { id: 'research_platforms', label: 'Research Platforms' },
  { id: 'financial_tools', label: 'Financial Tools' },
  { id: 'news_apps', label: 'News Apps' },
];

export const SipInvestmentComparison: React.FC<SipInvestmentComparisonProps> = ({
  scenario,
  selectedPlatform,
  onSelectPlatform,
  onNavigateToSipForecasts,
}) => {
  const [monthlySip, setMonthlySip] = useState<number>(5000);

  const sipCalc = calculateSipComparisonTrajectories(monthlySip, scenario);

  // SVG dimensions for the multi-line chart
  const svgWidth = 480;
  const svgHeight = 200;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Max value scale for SIP trajectory (₹60,000 at base, scales with monthlySip)
  const maxTrajectoryVal = Math.max(60000 * (monthlySip / 5000), 10000);

  // Generate SVG path string for a platform's trajectory
  const generatePath = (values: number[]) => {
    return values
      .map((val, idx) => {
        const x = paddingLeft + (idx / (values.length - 1)) * chartW;
        const y = paddingTop + chartH - (val / maxTrajectoryVal) * chartH;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className={styles.containerCard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>SIP & Investment Impact Comparison</h2>
          <p className={styles.subtitle}>
            Effect on investment capacity due to the same global event
          </p>
        </div>

        {/* Interactive Monthly SIP Budget Controller */}
        <div className={styles.controller}>
          <label htmlFor="sip-budget-range" className={styles.controllerLabel}>
            Monthly SIP: <strong>{formatRupees(monthlySip)}</strong>
          </label>
          <input
            id="sip-budget-range"
            type="range"
            min="2000"
            max="25000"
            step="1000"
            value={monthlySip}
            onChange={(e) => setMonthlySip(Number(e.target.value))}
            className={styles.rangeSlider}
          />
        </div>
      </div>

      <div className={styles.contentLayout}>
        {/* Left Column: 6-Month Multi-Line Trajectory Chart */}
        <div className={styles.lineChartBox}>
          {/* Legend */}
          <div className={styles.legendRow}>
            {PLATFORMS_ORDER.map((p) => {
              const isSelected = selectedPlatform === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`
                    ${styles.legendChip}
                    ${isSelected ? styles.chipSelected : ''}
                  `}
                  onClick={() => onSelectPlatform(p.id)}
                  title={`Highlight ${p.label}`}
                >
                  <span
                    className={styles.colorDot}
                    style={{ backgroundColor: PLATFORM_COLORS[p.id] }}
                  />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.svgWrapper}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className={styles.svgLineChart}
              role="img"
              aria-label="SIP growth trajectory line chart"
            >
              {/* Horizontal Grid Lines & Y-ticks */}
              {[1, 0.66, 0.33, 0].map((ratio) => {
                const y = paddingTop + chartH * (1 - ratio);
                const tickVal = Math.round(maxTrajectoryVal * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={svgWidth - paddingRight}
                      y2={y}
                      className={styles.gridLine}
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className={styles.yTickText}
                    >
                      {formatRupees(tickVal)}
                    </text>
                  </g>
                );
              })}

              {/* Month X-ticks */}
              {sipCalc.monthLabels.map((month, idx) => {
                const x = paddingLeft + (idx / (sipCalc.monthLabels.length - 1)) * chartW;
                return (
                  <text
                    key={month}
                    x={x}
                    y={svgHeight - 10}
                    textAnchor="middle"
                    className={styles.xTickText}
                  >
                    {month}
                  </text>
                );
              })}

              {/* Trajectory Lines */}
              {PLATFORMS_ORDER.map((p) => {
                const values = sipCalc.trajectories[p.id];
                const pathStr = generatePath(values);
                const isSelected = selectedPlatform === p.id;

                return (
                  <g key={p.id}>
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={PLATFORM_COLORS[p.id]}
                      strokeWidth={isSelected ? 3.5 : 2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={styles.trajectoryPath}
                    />
                    {values.map((val, idx) => {
                      const cx = paddingLeft + (idx / (values.length - 1)) * chartW;
                      const cy = paddingTop + chartH - (val / maxTrajectoryVal) * chartH;
                      return (
                        <circle
                          key={idx}
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 4.5 : 3}
                          fill={PLATFORM_COLORS[p.id]}
                          stroke="#ffffff"
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Column: SIP Capacity After 6 Months Horizontal Bar Card */}
        <div className={styles.barSummaryCard}>
          <div className={styles.barSummaryHeader}>
            <h3 className={styles.barSummaryTitle}>SIP Capacity After 6 Months</h3>
            <span className={styles.advantageBadge}>
              +{formatRupees(sipCalc.corpusAdvantageInr)} Protected
            </span>
          </div>

          <div className={styles.horizontalBarsList}>
            {PLATFORMS_ORDER.map((p) => {
              const capacityVal = sipCalc.capacityAfter6m[p.id];
              const maxCap = sipCalc.capacityAfter6m.bharat_impact || 1;
              const widthPct = Math.max(12, (capacityVal / maxCap) * 100);
              const isSelected = selectedPlatform === p.id;

              return (
                <div
                  key={p.id}
                  className={`
                    ${styles.horizontalBarRow}
                    ${isSelected ? styles.barRowSelected : ''}
                  `}
                  onClick={() => onSelectPlatform(p.id)}
                >
                  <div className={styles.barLabel}>{p.label}</div>
                  <div className={styles.barTrackHoriz}>
                    <div
                      className={styles.barFillHoriz}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: PLATFORM_COLORS[p.id],
                      }}
                    >
                      <span className={styles.barCapValue}>
                        {formatRupees(capacityVal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {onNavigateToSipForecasts && (
            <button
              type="button"
              className={styles.exploreSipBtn}
              onClick={onNavigateToSipForecasts}
            >
              Open Comprehensive SIP Forecasts →
            </button>
          )}
        </div>
      </div>

      <div className={styles.disclaimer}>
        * Projections model protected investment capacity under active expense adjustment versus
        unhedged inflation drag. Past performance and scenario models do not constitute guaranteed
        investment returns.
      </div>
    </div>
  );
};
