import React from 'react';
import { DownstreamIndustryRow } from './types';
import styles from './DownstreamImpactTable.module.css';

export interface DownstreamImpactTableProps {
  impacts: DownstreamIndustryRow[];
  onSelectIndustry?: (row: DownstreamIndustryRow) => void;
}

export const DownstreamImpactTable: React.FC<DownstreamImpactTableProps> = ({
  impacts,
  onSelectIndustry,
}) => {
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'smartphone':
      case 'monitor':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        );
      case 'truck':
      case 'car':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        );
      case 'radio':
      case 'signal':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
            <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
            <circle cx="12" cy="12" r="2" />
            <path d="M12 14v8" />
          </svg>
        );
      case 'tool':
      case 'settings':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        );
      case 'laptop':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="2" y1="20" x2="22" y2="20" />
          </svg>
        );
      case 'leaf':
      case 'sun':
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.tableCard}>
      <h3 className={styles.cardTitle}>Impact on Indian Sectors</h3>

      <div className={styles.tableResponsive}>
        <table className={styles.impactTable}>
          <thead>
            <tr>
              <th className={styles.thCell}>Sector</th>
              <th className={styles.thCell}>Impact Level</th>
              <th className={styles.thCell}>Key Effect</th>
              <th className={styles.thCell}>Details</th>
            </tr>
          </thead>
          <tbody>
            {impacts.map((row) => {
              const badgeClass =
                row.severity === 'High'
                  ? styles.badgeHigh
                  : row.severity === 'Medium'
                  ? styles.badgeMedium
                  : styles.badgeLow;

              // Scale width percentage between 10% and 100% based on max impact
              const barWidth = Math.min(100, Math.max(15, row.keyEffectNum * 7));

              return (
                <tr
                  key={row.id}
                  className={styles.trRow}
                  onClick={() => onSelectIndustry && onSelectIndustry(row)}
                  title={`Inspect ${row.name} causal transmission pathway`}
                >
                  <td className={styles.tdCell}>
                    <div className={styles.sectorCol}>
                      <span className={styles.sectorIcon} aria-hidden="true">
                        {renderIcon(row.icon)}
                      </span>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className={styles.tdCell}>
                    <span className={badgeClass}>{row.severity}</span>
                  </td>
                  <td className={styles.tdCell}>
                    <div className={styles.keyEffectWrap}>
                      <div className={styles.effectBarTrack}>
                        <div
                          className={styles.effectBarFill}
                          style={{
                            width: `${barWidth}%`,
                            background: row.effectColor,
                          }}
                        />
                      </div>
                      <span
                        className={styles.effectPctText}
                        style={{ color: row.effectColor }}
                      >
                        {row.keyEffectPct}
                      </span>
                    </div>
                  </td>
                  <td className={styles.tdCell}>
                    <span className={styles.detailsText}>{row.details}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
