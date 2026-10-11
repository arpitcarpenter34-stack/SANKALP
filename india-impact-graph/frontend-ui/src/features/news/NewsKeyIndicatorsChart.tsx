import React, { useState, useMemo } from 'react';
import { IndicatorSeries } from './types';
import styles from './NewsKeyIndicatorsChart.module.css';

export interface NewsKeyIndicatorsChartProps {
  indicators: Record<string, IndicatorSeries[]>;
}

export const NewsKeyIndicatorsChart: React.FC<NewsKeyIndicatorsChartProps> = ({
  indicators,
}) => {
  const [activeCategory, setActiveCategory] = useState<'commodity_prices' | 'currency_markets' | 'sector_indices'>('commodity_prices');
  const [activeRange, setActiveRange] = useState<'7d' | '1m' | '3m' | '1y'>('7d');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const seriesList = indicators[activeCategory] || [];

  // Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 40;
  const padRight = 50;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Compute Scales
  const allValues = seriesList.flatMap((s) => s.data.map((d) => d.value));
  const rawMin = allValues.length ? Math.min(...allValues) : 80;
  const rawMax = allValues.length ? Math.max(...allValues) : 140;

  const minY = Math.floor(rawMin * 0.95);
  const maxY = Math.ceil(rawMax * 1.05);

  const dates = seriesList[0]?.data.map((d) => d.label) || ['Oct 6', 'Oct 7', 'Oct 8', 'Oct 9', 'Oct 10', 'Oct 11', 'Oct 12'];

  const getX = (index: number) => {
    const total = dates.length - 1;
    if (total <= 0) return padLeft;
    return padLeft + (index / total) * plotWidth;
  };

  const getY = (val: number) => {
    const range = maxY - minY || 1;
    return padTop + plotHeight - ((val - minY) / range) * plotHeight;
  };

  // Build SVG Paths
  const paths = useMemo(() => {
    return seriesList.map((series) => {
      if (!series.data.length) return { id: series.id, path: '', lastPoint: null, series };
      const d = series.data
        .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(pt.value).toFixed(1)}`)
        .join(' ');
      const last = series.data[series.data.length - 1];
      const lastCoord = last ? { x: getX(series.data.length - 1), y: getY(last.value) } : null;
      return { id: series.id, path: d, lastPoint: lastCoord, series };
    });
  }, [seriesList, minY, maxY, plotWidth, plotHeight]);

  const yTicks = [
    minY,
    Math.round(minY + (maxY - minY) * 0.33),
    Math.round(minY + (maxY - minY) * 0.66),
    maxY,
  ];

  return (
    <article className={styles.cardContainer} aria-label="News Impact on Key Economic Indicators">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.cardTitle}>News Impact on Key Indicators</h2>
          <p className={styles.cardSubtitle}>How recent news is affecting key economic indicators</p>
        </div>

        <div className={styles.timeRangeToggle} role="group" aria-label="Chart time horizon">
          {(['7d', '1m', '3m', '1y'] as const).map((rng) => (
            <button
              key={rng}
              type="button"
              className={`${styles.rangeBtn} ${activeRange === rng ? styles.rangeActive : ''}`}
              onClick={() => setActiveRange(rng)}
            >
              {rng.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.subTabsRow} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'commodity_prices'}
          className={`${styles.subTabBtn} ${activeCategory === 'commodity_prices' ? styles.subTabActive : ''}`}
          onClick={() => setActiveCategory('commodity_prices')}
        >
          Commodity Prices
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'currency_markets'}
          className={`${styles.subTabBtn} ${activeCategory === 'currency_markets' ? styles.subTabActive : ''}`}
          onClick={() => setActiveCategory('currency_markets')}
        >
          Currency & Markets
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeCategory === 'sector_indices'}
          className={`${styles.subTabBtn} ${activeCategory === 'sector_indices' ? styles.subTabActive : ''}`}
          onClick={() => setActiveCategory('sector_indices')}
        >
          Sector Indices
        </button>
      </div>

      <div className={styles.chartArea}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={styles.svgChart}
          onPointerLeave={() => setHoverIndex(null)}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            const plotRelX = Math.max(0, Math.min(plotWidth, relX - padLeft));
            const total = dates.length - 1;
            const idx = Math.round((plotRelX / plotWidth) * total);
            setHoverIndex(idx);
          }}
        >
          {/* Y-axis Grid Lines & Labels */}
          {yTicks.map((val) => (
            <g key={val}>
              <line
                x1={padLeft}
                y1={getY(val)}
                x2={padLeft + plotWidth}
                y2={getY(val)}
                className={styles.gridLine}
              />
              <text x={padLeft - 8} y={getY(val) + 4} textAnchor="end" className={styles.axisText}>
                {val}
              </text>
            </g>
          ))}

          {/* X-axis Labels */}
          {dates.map((label, i) => (
            <text
              key={label}
              x={getX(i)}
              y={svgHeight - 8}
              textAnchor="middle"
              className={styles.axisText}
            >
              {label}
            </text>
          ))}

          {/* Series Multi-Curves */}
          {paths.map(({ id, path, series }) => (
            <path
              key={id}
              d={path}
              stroke={series.color}
              className={styles.curveLine}
            />
          ))}

          {/* Series End Badges (+12.4%, etc.) */}
          {paths.map(({ id, lastPoint, series }) => {
            if (!lastPoint) return null;
            const deltaLabel = `${series.change_pct > 0 ? '+' : ''}${series.change_pct}%`;
            return (
              <g key={`badge-${id}`} transform={`translate(${lastPoint.x + 8}, ${lastPoint.y - 10})`}>
                <rect
                  width={38}
                  height={18}
                  fill={series.color}
                  className={styles.badgeRect}
                />
                <text x={19} y={9} textAnchor="middle" className={styles.deltaBadge}>
                  {deltaLabel}
                </text>
              </g>
            );
          })}

          {/* Hover Crosshair Line */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={padTop}
              x2={getX(hoverIndex)}
              y2={padTop + plotHeight}
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && dates[hoverIndex] && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
              top: `${(padTop / svgHeight) * 100}%`,
            }}
          >
            <div className={styles.tooltipDate}>{dates[hoverIndex]}</div>
            {seriesList.map((s) => (
              <div key={s.id} className={styles.tooltipRow}>
                <span style={{ color: s.color }}>{s.name}:</span>
                <strong>
                  {s.data[hoverIndex]?.value} {s.unit}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.legendRow}>
        {seriesList.map((s) => (
          <div key={s.id} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </article>
  );
};
