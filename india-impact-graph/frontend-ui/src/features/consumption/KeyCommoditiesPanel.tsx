import React, { useState } from 'react';
import { CommodityItem } from './types';
import { formatRupees, formatPercent } from './consumptionCalculation';
import styles from './KeyCommoditiesPanel.module.css';

export interface KeyCommoditiesPanelProps {
  commodities: CommodityItem[];
  onSelectCommodity?: (commodity: CommodityItem) => void;
}

export const KeyCommoditiesPanel: React.FC<KeyCommoditiesPanelProps> = ({
  commodities,
  onSelectCommodity,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'fuel' | 'food' | 'utilities' | 'others'
  >('fuel');

  const filteredCommodities = commodities.filter(
    (c) => c.category === activeCategoryTab
  );

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'fuel':
      case 'gas-pump':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="3" y1="22" x2="15" y2="22" />
            <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
            <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
          </svg>
        );
      case 'gas':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="7" y="5" width="10" height="16" rx="3" />
            <line x1="10" y1="2" x2="14" y2="2" />
            <line x1="12" y1="2" x2="12" y2="5" />
          </svg>
        );
      case 'bottle':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 3h6v4H9z" />
            <path d="M8 7v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7z" />
          </svg>
        );
      case 'cup':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
          </svg>
        );
      case 'bolt':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case 'droplet':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        );
      case 'train':
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="4" y="3" width="16" height="16" rx="2" />
            <line x1="16" y1="19" x2="19" y2="22" />
            <line x1="8" y1="19" x2="5" y2="22" />
            <circle cx="8" cy="15" r="1" />
            <circle cx="16" cy="15" r="1" />
          </svg>
        );
      default:
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
    }
  };

  const renderSparkline = (points: number[]) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const width = 48;
    const height = 20;

    const pathD = points.reduce((acc, pt, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((pt - min) / range) * (height - 4) - 2;
      return i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');

    return (
      <svg className={styles.sparklineSvg} viewBox={`0 0 ${width} ${height}`}>
        <path d={pathD} fill="none" stroke="#E11D48" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <article className={styles.panelCard} aria-label="Key Commodities Consumption">
      <div className={styles.headerRow}>
        <h2 className={styles.cardTitle}>Key Commodities Consumption</h2>

        <div className={styles.tabsGroup} role="tablist" aria-label="Commodity Categories">
          {(['fuel', 'food', 'utilities', 'others'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeCategoryTab === tab}
              className={`${styles.tabBtn} ${activeCategoryTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveCategoryTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.commoditiesGrid}>
        {filteredCommodities.map((item) => (
          <div
            key={item.id}
            className={styles.itemCard}
            onClick={() => onSelectCommodity && onSelectCommodity(item)}
            title={`Click to view commodity transmission: ${item.name} @ ₹${item.unitPrice}/${item.unit}`}
          >
            <div>
              <div className={styles.itemTopRow}>
                <div className={styles.itemIconBadge}>{renderIcon(item.iconName)}</div>
                <div className={styles.itemName}>{item.name}</div>
              </div>
              <div className={styles.quantitySub}>
                {item.quantity} {item.unit}
              </div>
            </div>

            <div className={styles.itemBottomRow}>
              <div className={styles.costGroup}>
                <span className={styles.itemCost}>{formatRupees(item.monthlyCost)}</span>
                <span className={styles.itemChange}>{formatPercent(item.changePct)}</span>
              </div>
              {renderSparkline(item.sparkline)}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};
