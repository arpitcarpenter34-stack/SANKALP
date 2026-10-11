import React from 'react';
import styles from './MarketSnapshotCard.module.css';
import { MarketSnapshotInstrument } from './types';

interface MarketSnapshotCardProps {
  instruments: MarketSnapshotInstrument[];
}

function renderSparklinePath(points: number[], width = 140, height = 30): { linePath: string; areaPath: string } {
  if (!points || points.length < 2) {
    return { linePath: '', areaPath: '' };
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const linePath = coords.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  return { linePath, areaPath };
}

export const MarketSnapshotCard: React.FC<MarketSnapshotCardProps> = ({ instruments }) => {
  return (
    <section className={styles.snapshotSection} aria-labelledby="market-snapshot-title">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h3 id="market-snapshot-title" className={styles.sectionTitle}>
            Market Snapshot
          </h3>
          <p className={styles.sectionSubtitle}>Live market data</p>
        </div>
        <div className={styles.liveBadge} aria-label="Live market data streaming active">
          <span className={styles.pulseDot} aria-hidden="true" />
          <span>Live</span>
        </div>
      </div>

      <div className={styles.grid}>
        {instruments.map((inst) => {
          const isUp = inst.change_pct >= 0;
          const { linePath, areaPath } = renderSparklinePath(inst.sparkline, 160, 32);
          const strokeColor = isUp ? '#059669' : '#dc2626';
          const fillColor = isUp ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';

          const formattedValue =
            inst.current_value >= 1000
              ? inst.current_value.toLocaleString('en-US')
              : inst.current_value.toFixed(1);

          return (
            <article key={inst.id} className={styles.instrumentCard}>
              <div className={styles.cardTop}>
                <span className={styles.instrumentName}>{inst.name}</span>
                <span className={styles.symbolBadge}>{inst.symbol}</span>
              </div>

              <div className={styles.priceRow}>
                <div className={styles.valueContainer}>
                  {inst.currency_prefix && (
                    <span className={styles.currency}>{inst.currency_prefix}</span>
                  )}
                  <span className={styles.priceValue}>{formattedValue}</span>
                  {inst.unit && <span className={styles.priceUnit}>{inst.unit}</span>}
                </div>

                <span
                  className={`${styles.changeBadge} ${
                    isUp ? styles.changePositive : styles.changeNegative
                  }`}
                  aria-label={`${isUp ? 'Up' : 'Down'} ${Math.abs(inst.change_pct)}%`}
                >
                  {isUp ? `+${inst.change_pct.toFixed(1)}%` : `${inst.change_pct.toFixed(1)}%`}
                </span>
              </div>

              <div className={styles.sparklineContainer} aria-hidden="true">
                <svg
                  className={styles.sparklineSvg}
                  viewBox="0 0 160 32"
                  preserveAspectRatio="none"
                >
                  <path d={areaPath} fill={fillColor} />
                  <path
                    d={linePath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.sourceCitation} title={inst.source}>
                  {inst.source}
                </span>
                <span className={styles.updatedTime}>{inst.last_updated}</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
