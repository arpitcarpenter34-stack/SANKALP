import React, { useState } from 'react';
import styles from './ExpenseForecastChart.module.css';

export interface ExpenseForecastChartProps {
  scenarioTitle?: string;
  forecastHorizon?: number;
}

export const ExpenseForecastChart: React.FC<ExpenseForecastChartProps> = ({
  forecastHorizon = 6,
}) => {
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'quarterly'>('monthly');

  // Chart coordinates & geometry
  // Actual data: Jan to Oct 2024 (indices 0 to 9)
  // Dynamic forecast data adjusted by forecastHorizon (3, 6, or 12 months)
  const ALL_MONTHS = [
    'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024',
    'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024',
    'Nov 2024', 'Dec 2024', 'Jan 2025', 'Feb 2025', 'Mar 2025',
    'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025'
  ];

  // Actual data (Jan to Oct 2024 - indices 0 to 9)
  const ACTUAL_VALUES = [
    48500, 50200, 53800, 51900, 54600, 53200, 55800, 58000, 54500, 58000
  ];

  // Full 12-month potential forecast trajectory
  const FULL_FORECAST_VALUES = [
    58000, 59500, 61200, 63400, 65500, 68000,
    69200, 70100, 71500, 72800, 73500, 74200, 75000
  ];

  const FULL_UNCERTAINTY = [
    { idx: 9, u2: 58000, u1: 58000, val: 58000, l1: 58000, l2: 58000 },
    { idx: 10, u2: 62000, u1: 60800, val: 59500, l1: 58200, l2: 57000 },
    { idx: 11, u2: 65000, u1: 63100, val: 61200, l1: 59300, l2: 57500 },
    { idx: 12, u2: 68500, u1: 66000, val: 63400, l1: 60800, l2: 58500 },
    { idx: 13, u2: 71500, u1: 68500, val: 65500, l1: 62500, l2: 59800 },
    { idx: 14, u2: 74500, u1: 71200, val: 68000, l1: 64800, l2: 61500 },
    { idx: 15, u2: 76000, u1: 72800, val: 69200, l1: 65800, l2: 62200 },
    { idx: 16, u2: 77500, u1: 74000, val: 70100, l1: 66500, l2: 63000 },
    { idx: 17, u2: 79200, u1: 75500, val: 71500, l1: 67600, l2: 63800 },
    { idx: 18, u2: 81000, u1: 77000, val: 72800, l1: 68600, l2: 64500 },
    { idx: 19, u2: 82000, u1: 78000, val: 73500, l1: 69200, l2: 65000 },
    { idx: 20, u2: 83200, u1: 79000, val: 74200, l1: 69800, l2: 65500 },
  ];

  // Slice based on forecastHorizon (3, 6, or 12 months)
  const horizonMonthsCount = forecastHorizon === 3 ? 3 : forecastHorizon === 12 ? 12 : 6;
  const FORECAST_VALUES = FULL_FORECAST_VALUES.slice(0, horizonMonthsCount + 1);
  const UNCERTAINTY_BOUNDS = FULL_UNCERTAINTY.slice(0, horizonMonthsCount + 1);
  const totalPoints = 9 + horizonMonthsCount;

  const chartW = 900;
  const chartH = 220;
  const padLeft = 60;
  const padRight = 130;
  const padTop = 25;
  const padBottom = 35;

  const usableW = chartW - padLeft - padRight;
  const usableH = chartH - padTop - padBottom;

  const MONTHS = ALL_MONTHS.slice(0, totalPoints + 1);

  const getX = (idx: number) => padLeft + (idx / totalPoints) * usableW;
  const getY = (val: number) => {
    const min = 40000;
    const max = 80000;
    const norm = (val - min) / (max - min);
    return padTop + usableH * (1 - norm);
  };

  // Build actual path
  const actualPath = ACTUAL_VALUES.map((val, i) => {
    const x = getX(i);
    const y = getY(val);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Build forecast path
  const forecastPath = FORECAST_VALUES.map((val, i) => {
    const x = getX(i + 9);
    const y = getY(val);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Build 2-sigma ribbon
  const u2Upper = UNCERTAINTY_BOUNDS.map((b) => `${getX(b.idx)} ${getY(b.u2)}`).join(' L ');
  const u2Lower = [...UNCERTAINTY_BOUNDS].reverse().map((b) => `${getX(b.idx)} ${getY(b.l2)}`).join(' L ');
  const ribbon2Sigma = `M ${u2Upper} L ${u2Lower} Z`;

  // Build 1-sigma ribbon
  const u1Upper = UNCERTAINTY_BOUNDS.map((b) => `${getX(b.idx)} ${getY(b.u1)}`).join(' L ');
  const u1Lower = [...UNCERTAINTY_BOUNDS].reverse().map((b) => `${getX(b.idx)} ${getY(b.l1)}`).join(' L ');
  const ribbon1Sigma = `M ${u1Upper} L ${u1Lower} Z`;

  const octX = getX(9);
  const lastIdx = totalPoints;
  const lastVal = FORECAST_VALUES[FORECAST_VALUES.length - 1];
  const lastX = getX(lastIdx);
  const lastY = getY(lastVal);
  const lastMonthLabel = MONTHS[lastIdx] || 'Forecast End';

  return (
    <div className={styles.chartCard}>
      {/* Header with Title and Legend */}
      <div className={styles.header}>
        <div className={styles.titleCol}>
          <h3 className={styles.title}>{forecastHorizon}-Month Expense Forecast</h3>
          <p className={styles.subtitle}>
            Monthly household expenses (₹) projected across a {forecastHorizon}-month horizon with 1σ / 2σ uncertainty bounds
          </p>
        </div>

        <div className={styles.legendRow}>
          <div className={styles.legendItem}>
            <span className={styles.actualLineLegend} />
            <span className={styles.legendText}>Actual</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.forecastLineLegend} />
            <span className={styles.legendText}>Forecast</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.sigma1Box} />
            <span className={styles.legendText}>Uncertainty range (1σ)</span>
          </div>

          <div className={styles.legendItem}>
            <span className={styles.sigma2Box} />
            <span className={styles.legendText}>Uncertainty range (2σ)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Plot */}
      <div className={styles.plotContainer}>
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className={styles.svgPlot}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y Gridlines and Labels */}
          {[40000, 50000, 60000, 70000, 80000].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartW - padRight + 20}
                  y2={y}
                  stroke="#E2ECE5"
                  strokeWidth="1"
                  strokeDasharray={level === 40000 ? '0' : '2 2'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  fill="#8298A9"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-sans)"
                >
                  {level.toLocaleString('en-IN')}
                </text>
              </g>
            );
          })}

          {/* 2-sigma envelope */}
          <path d={ribbon2Sigma} fill="#D1FAE5" opacity="0.45" />

          {/* 1-sigma envelope */}
          <path d={ribbon1Sigma} fill="#A7F3D0" opacity="0.6" />

          {/* Vertical divider line: Forecast starts */}
          <line
            x1={octX}
            y1={padTop - 5}
            x2={octX}
            y2={padTop + usableH}
            stroke="#047857"
            strokeWidth="1.2"
            strokeDasharray="3 3"
          />
          <text
            x={octX + 4}
            y={padTop + 6}
            fill="#047857"
            fontSize="10"
            fontWeight="600"
            fontFamily="var(--font-sans)"
          >
            Forecast starts
          </text>

          {/* Actual series line */}
          <path
            d={actualPath}
            fill="none"
            stroke="#047857"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Actual dots */}
          {ACTUAL_VALUES.map((val, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(val)}
              r="3.5"
              fill="#FFFFFF"
              stroke="#047857"
              strokeWidth="2"
            />
          ))}

          {/* Forecast series line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="#047857"
            strokeWidth="2.2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Forecast endpoint dot */}
          <circle
            cx={lastX}
            cy={lastY}
            r="4.5"
            fill="#047857"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* X Axis Month Labels */}
          {MONTHS.map((month, i) => {
            const x = getX(i);
            return (
              <text
                key={month}
                x={x}
                y={chartH - 10}
                fill="#8298A9"
                fontSize="9"
                textAnchor="middle"
                fontFamily="var(--font-sans)"
              >
                {month}
              </text>
            );
          })}

          {/* Callout Bubble at Forecast End Point */}
          <g transform={`translate(${Math.min(lastX + 8, chartW - padRight + 10)}, ${Math.max(lastY - 50, 10)})`}>
            <rect
              x="0"
              y="0"
              width="112"
              height="58"
              rx="6"
              fill="#FFFFFF"
              stroke="#D1E3D7"
              strokeWidth="1"
              filter="drop-shadow(0 2px 4px rgba(16, 24, 40, 0.08))"
            />
            <text x="8" y="14" fill="#5A7184" fontSize="8.5" fontWeight="500">
              {lastMonthLabel} (Forecast)
            </text>
            <text x="8" y="28" fill="#172B3A" fontSize="13" fontWeight="700">
              ₹{lastVal.toLocaleString('en-IN')}
            </text>
            <text x="8" y="40" fill="#8298A9" fontSize="8">
              Range ₹{(lastVal - 5000).toLocaleString('en-IN')} – ₹{(lastVal + 6000).toLocaleString('en-IN')}
            </text>
            <text x="8" y="51" fill="#059669" fontSize="8.5" fontWeight="600">
              +{(((lastVal - 58000) / 58000) * 100).toFixed(1)}% vs. Oct 2024
            </text>
          </g>
        </svg>
      </div>

      {/* Footer info & selector */}
      <div className={styles.footerRow}>
        <div className={styles.infoCol}>
          <span className={styles.infoIcon}>ⓘ</span>
          <span className={styles.infoText}>
            Illustrative scenario • connect verified live data for real-time estimates
          </span>
        </div>

        <div className={styles.dropdownCol}>
          <button
            type="button"
            className={styles.dropdownBtn}
            onClick={() => setSelectedInterval(selectedInterval === 'monthly' ? 'quarterly' : 'monthly')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ textTransform: 'capitalize' }}>{selectedInterval}</span>
            <span style={{ fontSize: '9px' }}>▾</span>
          </button>
        </div>
      </div>
    </div>
  );
};
