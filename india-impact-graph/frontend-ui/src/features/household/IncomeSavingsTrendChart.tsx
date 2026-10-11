import React, { useState } from 'react';
import { HouseholdTrendPoint } from './types';
import styles from './IncomeSavingsTrendChart.module.css';

interface IncomeSavingsTrendChartProps {
  trend: HouseholdTrendPoint[];
}

export const IncomeSavingsTrendChart: React.FC<IncomeSavingsTrendChartProps> = ({
  trend,
}) => {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y'>('6m');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);
  const [showSavings, setShowSavings] = useState(true);

  // Filter or scale trend data based on range
  const displayedTrend = timeRange === '3m' ? trend.slice(-3) : trend;

  // Chart coordinate space
  const chartWidth = 460;
  const chartHeight = 170;
  const paddingLeft = 38;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 28;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const maxY = 80000;
  const yTicks = [0, 20000, 40000, 60000, 80000];

  const getYPos = (val: number) => {
    const clamped = Math.max(0, Math.min(maxY, val));
    return paddingTop + innerHeight - (clamped / maxY) * innerHeight;
  };

  const getXPos = (index: number) => {
    if (displayedTrend.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (displayedTrend.length - 1)) * innerWidth;
  };

  // Generate SVG path for lines
  const incomePoints = displayedTrend.map((p, i) => `${getXPos(i)},${getYPos(p.income)}`);
  const expensePoints = displayedTrend.map((p, i) => `${getXPos(i)},${getYPos(p.expenses)}`);

  const activePoint = hoveredPointIndex !== null && displayedTrend[hoveredPointIndex]
    ? displayedTrend[hoveredPointIndex]
    : displayedTrend[displayedTrend.length - 1]; // Default to latest (Oct) like screenshot

  const activeIndex = hoveredPointIndex !== null
    ? hoveredPointIndex
    : displayedTrend.length - 1;

  return (
    <div className={styles.card} id="income-savings-trend-panel">
      <div className={styles.header}>
        <div className={styles.titleCol}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className={styles.title}>Monthly Income & Savings Trend</h3>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#059669',
                backgroundColor: '#ecfdf5',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid #a7f3d0',
              }}
              title="Illustrative trajectory simulated from MoSPI historical CPI trend elasticity"
            >
              Modeled Simulation
            </span>
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.legend}>
            <button
              type="button"
              className={`${styles.legendItem} ${!showIncome ? styles.legendDisabled : ''}`}
              onClick={() => setShowIncome((v) => !v)}
            >
              <span className={styles.incomeDot} />
              <span>Income</span>
            </button>
            <button
              type="button"
              className={`${styles.legendItem} ${!showExpenses ? styles.legendDisabled : ''}`}
              onClick={() => setShowExpenses((v) => !v)}
            >
              <span className={styles.expensesDot} />
              <span>Expenses</span>
            </button>
            <button
              type="button"
              className={`${styles.legendItem} ${!showSavings ? styles.legendDisabled : ''}`}
              onClick={() => setShowSavings((v) => !v)}
            >
              <span className={styles.savingsDot} />
              <span>Savings</span>
            </button>
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className={styles.rangeSelect}
            aria-label="Trend Time Range"
          >
            <option value="3m">3 Months</option>
            <option value="6m">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className={styles.svg}
          preserveAspectRatio="none"
        >
          {/* Horizontal Grid Lines & Y Ticks */}
          {yTicks.map((tick) => {
            const yPos = getYPos(tick);
            return (
              <g key={tick} className={styles.gridGroup}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={chartWidth - paddingRight}
                  y2={yPos}
                  className={styles.gridLine}
                />
                <text
                  x={paddingLeft - 6}
                  y={yPos + 3}
                  textAnchor="end"
                  className={styles.yTickText}
                >
                  {tick === 0 ? '0' : `${tick / 1000}K`}
                </text>
              </g>
            );
          })}

          {/* Savings Bars */}
          {showSavings &&
            displayedTrend.map((p, i) => {
              const xPos = getXPos(i);
              const barWidth = 16;
              const yPos = getYPos(p.savings);
              const barHeight = Math.max(2, getYPos(0) - yPos);

              return (
                <rect
                  key={`savings-${p.month}`}
                  x={xPos - barWidth / 2}
                  y={yPos}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  className={`${styles.savingsBar} ${activeIndex === i ? styles.savingsBarActive : ''}`}
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />
              );
            })}

          {/* Income Line */}
          {showIncome && (
            <polyline
              points={incomePoints.join(' ')}
              className={styles.incomeLine}
            />
          )}

          {/* Expense Line */}
          {showExpenses && (
            <polyline
              points={expensePoints.join(' ')}
              className={styles.expenseLine}
            />
          )}

          {/* Dots on points */}
          {displayedTrend.map((p, i) => {
            const xPos = getXPos(i);
            const isHovered = activeIndex === i;

            return (
              <g key={`dots-${p.month}`}>
                {/* Invisible hover capture rect */}
                <rect
                  x={xPos - 18}
                  y={paddingTop}
                  width={36}
                  height={innerHeight}
                  fill="transparent"
                  className={styles.hoverTarget}
                  onMouseEnter={() => setHoveredPointIndex(i)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                />

                {/* X Axis Month Label */}
                <text
                  x={xPos}
                  y={chartHeight - 6}
                  textAnchor="middle"
                  className={`${styles.xTickText} ${isHovered ? styles.xTickActive : ''}`}
                >
                  {p.month}
                </text>

                {/* Income point */}
                {showIncome && (
                  <circle
                    cx={xPos}
                    cy={getYPos(p.income)}
                    r={isHovered ? 5 : 3.5}
                    className={styles.incomeCircle}
                  />
                )}

                {/* Expense point */}
                {showExpenses && (
                  <circle
                    cx={xPos}
                    cy={getYPos(p.expenses)}
                    r={isHovered ? 5 : 3.5}
                    className={styles.expenseCircle}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Callout matching reference screenshot */}
        {activePoint && (
          <div
            className={styles.tooltipCard}
            style={{
              left: `${(getXPos(activeIndex) / chartWidth) * 100}%`,
            }}
          >
            <div className={styles.tooltipHeader}>
              {activePoint.month} 2024
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipIncomeDot} />
              <span>Income: ₹{activePoint.income.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipExpenseDot} />
              <span>Expenses: ₹{activePoint.expenses.toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipSavingsDot} />
              <span>Savings: ₹{activePoint.savings.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
