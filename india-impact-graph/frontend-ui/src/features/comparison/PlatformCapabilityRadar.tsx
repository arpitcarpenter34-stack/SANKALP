import React, { useState, useMemo } from 'react';
import { PlatformId, RadarCapabilityDimension } from './types';
import { calculateRadarGeometry, RadarPoint } from './comparisonCalculation';
import styles from './PlatformCapabilityRadar.module.css';

interface PlatformCapabilityRadarProps {
  dimensions: RadarCapabilityDimension[];
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
}

interface SeriesConfig {
  id: PlatformId;
  label: string;
  stroke: string;
  fill: string;
  dotColor: string;
}

const SERIES_CONFIGS: SeriesConfig[] = [
  {
    id: 'bharat_impact',
    label: 'BharatImpact',
    stroke: '#059669',
    fill: 'rgba(5, 150, 105, 0.22)',
    dotColor: '#047857',
  },
  {
    id: 'research_platforms',
    label: 'Research Platforms',
    stroke: '#0284c7',
    fill: 'rgba(2, 132, 199, 0.16)',
    dotColor: '#0369a1',
  },
  {
    id: 'financial_tools',
    label: 'Financial Tools',
    stroke: '#d97706',
    fill: 'rgba(217, 119, 6, 0.14)',
    dotColor: '#b45309',
  },
  {
    id: 'news_apps',
    label: 'News Apps',
    stroke: '#dc2626',
    fill: 'rgba(220, 38, 38, 0.12)',
    dotColor: '#b91c1c',
  },
];

export const PlatformCapabilityRadar: React.FC<PlatformCapabilityRadarProps> = ({
  dimensions,
  selectedPlatform,
  onSelectPlatform,
}) => {
  // Enabled state for each series in the radar
  const [visibleSeries, setVisibleSeries] = useState<Record<PlatformId, boolean>>({
    bharat_impact: true,
    research_platforms: true,
    financial_tools: true,
    news_apps: true,
  });

  const [activeTooltip, setActiveTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    score: number;
    platformName: string;
    criteria?: string;
  } | null>(null);

  const toggleSeries = (id: PlatformId, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisibleSeries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const radarGeo = useMemo(() => {
    return calculateRadarGeometry(dimensions, 220, 200, 135);
  }, [dimensions]);

  return (
    <div className={styles.radarCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Platform Capability Comparison</h2>
          <p className={styles.cardSubtitle}>
            Radar benchmark across 8 core capability dimensions (0 to 5.0 scale)
          </p>
        </div>
      </div>

      {/* Series toggle chips / legend */}
      <div className={styles.legendBar} aria-label="Toggle platform radar series">
        {SERIES_CONFIGS.map((conf) => {
          const isVisible = visibleSeries[conf.id];
          const isSelected = selectedPlatform === conf.id;

          return (
            <button
              key={conf.id}
              type="button"
              className={`
                ${styles.legendChip}
                ${!isVisible ? styles.chipDisabled : ''}
                ${isSelected ? styles.chipSelected : ''}
              `}
              onClick={(e) => toggleSeries(conf.id, e)}
              title={`Click to ${isVisible ? 'hide' : 'show'} ${conf.label}`}
              aria-pressed={isVisible}
            >
              <span
                className={styles.legendColorDot}
                style={{ backgroundColor: conf.stroke }}
              />
              <span className={styles.legendLabel}>{conf.label}</span>
              {!isVisible && <span className={styles.hiddenNotice}>off</span>}
            </button>
          );
        })}
      </div>

      {/* SVG Radar Chart */}
      <div className={styles.chartContainer}>
        <svg
          viewBox="0 0 440 400"
          className={styles.svgChart}
          role="img"
          aria-label="Radar chart comparing BharatImpact against News Apps, Financial Tools, and Research Platforms"
        >
          {/* Concentric polygon grid levels */}
          <g className={styles.gridLines}>
            {radarGeo.gridLevels.map((lvl) => (
              <polygon
                key={lvl.level}
                points={lvl.polygonString}
                className={styles.gridPolygon}
              />
            ))}
          </g>

          {/* Spokes */}
          <g className={styles.spokes}>
            {radarGeo.axisSpokes.map((spoke) => (
              <line
                key={spoke.id}
                x1={spoke.xStart}
                y1={spoke.yStart}
                x2={spoke.xEnd}
                y2={spoke.yEnd}
                className={styles.spokeLine}
              />
            ))}
          </g>

          {/* Numeric Level Labels along vertical top axis */}
          {[1, 2, 3, 4, 5].map((val) => {
            const yPos = radarGeo.cy - (val / 5) * radarGeo.radius;
            return (
              <text
                key={`lvl-${val}`}
                x={radarGeo.cx + 6}
                y={yPos + 3}
                className={styles.levelValueText}
              >
                {val}
              </text>
            );
          })}

          {/* Series Polygons in reverse order so BharatImpact renders on top */}
          {[...SERIES_CONFIGS].reverse().map((conf) => {
            if (!visibleSeries[conf.id]) return null;
            const seriesCoords = radarGeo.calculateSeries(conf.id);
            const isPlatformFocused = selectedPlatform === conf.id;

            return (
              <g
                key={conf.id}
                className={`${styles.seriesGroup} ${isPlatformFocused ? styles.seriesFocused : ''}`}
                onClick={() => onSelectPlatform(conf.id)}
              >
                <polygon
                  points={seriesCoords.pointsString}
                  fill={conf.fill}
                  stroke={conf.stroke}
                  strokeWidth={isPlatformFocused ? 3 : 2}
                  strokeLinejoin="round"
                  className={styles.seriesPolygon}
                />
                {seriesCoords.points.map((pt: RadarPoint, idx: number) => (
                  <circle
                    key={`${conf.id}-pt-${idx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={isPlatformFocused ? 5 : 3.5}
                    fill={conf.dotColor}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className={styles.seriesDot}
                    onMouseEnter={() => {
                      const dim = dimensions[idx];
                      setActiveTooltip({
                        x: pt.x,
                        y: pt.y,
                        label: pt.label,
                        score: pt.value,
                        platformName: conf.label,
                        criteria: dim?.scoringCriteria,
                      });
                    }}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />
                ))}
              </g>
            );
          })}

          {/* Axis Labels */}
          {radarGeo.axisSpokes.map((spoke) => (
            <text
              key={`label-${spoke.id}`}
              x={spoke.xLabel}
              y={spoke.yLabel}
              textAnchor={spoke.textAnchor}
              className={styles.axisLabel}
            >
              {spoke.label}
            </text>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeTooltip && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${(activeTooltip.x / 440) * 100}%`,
              top: `${(activeTooltip.y / 400) * 100}%`,
            }}
          >
            <div className={styles.tooltipPlatform}>{activeTooltip.platformName}</div>
            <div className={styles.tooltipDim}>
              {activeTooltip.label}: <strong>{activeTooltip.score.toFixed(1)} / 5.0</strong>
            </div>
            {activeTooltip.criteria && (
              <div className={styles.tooltipCriteria}>{activeTooltip.criteria}</div>
            )}
          </div>
        )}
      </div>

      <div className={styles.chartFooter}>
        <p className={styles.scoringFootnote}>
          * Radar ratings based on transparent scoring criteria (0–5). BharatImpact connects macro
          events directly to household-level cost impacts.
        </p>
      </div>
    </div>
  );
};
