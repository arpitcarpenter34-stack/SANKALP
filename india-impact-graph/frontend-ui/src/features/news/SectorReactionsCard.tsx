import React from 'react';
import styles from './SectorReactionsCard.module.css';
import { SectorReactionItem } from './types';

interface SectorReactionsCardProps {
  reactions: SectorReactionItem[];
  onSelectSector?: (sectorId: string) => void;
}

const SECTOR_ICONS: Record<string, string> = {
  energy: '⚡',
  transportation: '🚢',
  electronics: '💻',
  banking: '🏦',
  fmcg: '🛒',
  automotive: '🚗',
  pharma: '💊',
  metals: '🏗️',
};

export const SectorReactionsCard: React.FC<SectorReactionsCardProps> = ({
  reactions,
  onSelectSector,
}) => {
  // Determine max absolute change to scale bar widths nicely (max ~ 6%)
  const maxAbsChange = Math.max(
    ...reactions.map((r) => Math.abs(r.change_pct)),
    5
  );

  return (
    <div className={styles.cardContainer} data-testid="sector-reactions-card">
      <div className={styles.titleGroup}>
        <h3 className={styles.cardTitle}>Sector Reactions</h3>
        <p className={styles.cardSubtitle}>Impact across key sectors</p>
      </div>

      <div className={styles.sectorsList} role="list">
        {reactions.map((sector) => {
          const isUp = sector.change_pct > 0;
          const absPct = Math.abs(sector.change_pct);
          const barWidth = Math.min(100, Math.round((absPct / maxAbsChange) * 100));
          const icon = SECTOR_ICONS[sector.sector_id] || '📊';

          return (
            <div
              key={sector.sector_id}
              className={styles.sectorRow}
              onClick={() => onSelectSector && onSelectSector(sector.sector_id)}
              role="listitem"
              title={`Click to view ${sector.name} sector details: ${sector.supporting_driver}`}
              data-testid={`sector-row-${sector.sector_id}`}
            >
              <div className={styles.sectorNameGroup}>
                <span className={styles.sectorIcon} aria-hidden="true">
                  {icon}
                </span>
                <span>{sector.name}</span>
              </div>

              <div className={styles.barTrack} aria-hidden="true">
                <div
                  className={`${styles.barFill} ${
                    isUp ? styles.barPositiveRisk : styles.barNegativeEasing
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <div
                className={`${styles.deltaText} ${
                  isUp ? styles.textPositiveRisk : styles.textNegativeEasing
                }`}
              >
                {isUp ? `+${sector.change_pct.toFixed(1)}%` : `${sector.change_pct.toFixed(1)}%`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
