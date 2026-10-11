import React, { useState } from 'react';
import { WatchlistItem, WatchlistSubTab } from './types';
import styles from './WatchlistInterestsCard.module.css';

interface WatchlistInterestsCardProps {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (itemId: string) => void;
}

export const WatchlistInterestsCard: React.FC<WatchlistInterestsCardProps> = ({
  watchlist,
  onToggleWatchlist,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<WatchlistSubTab>('sectors');
  const [chipSearch, setChipSearch] = useState('');

  const currentItems = watchlist.filter((item) => item.category === activeSubTab);
  const filteredItems = currentItems.filter((item) =>
    item.name.toLowerCase().includes(chipSearch.toLowerCase())
  );

  const selectedCount = currentItems.filter((item) => item.isSelected).length;

  return (
    <div className={styles.card} id="settings-watchlist-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Watchlist & Interests</h2>
        <p className={styles.subtitle}>
          Personalize the sectors, commodities and topics you want to track.
        </p>
      </div>

      <div className={styles.subTabsRow}>
        {(['sectors', 'commodities', 'topics'] as WatchlistSubTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.subTabBtn} ${activeSubTab === tab ? styles.subTabActive : ''}`}
            onClick={() => {
              setActiveSubTab(tab);
              setChipSearch('');
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.searchBox}>
        <span className={styles.searchIcon} aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={`Search ${activeSubTab}...`}
          value={chipSearch}
          onChange={(e) => setChipSearch(e.target.value)}
          aria-label={`Search ${activeSubTab}`}
        />
      </div>

      <div className={styles.chipsGrid}>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.chip} ${item.isSelected ? styles.chipSelected : ''}`}
            onClick={() => onToggleWatchlist(item.id)}
            aria-pressed={item.isSelected}
            title={`${item.name} (${item.isSelected ? 'Tracked' : 'Not tracked'})`}
          >
            <span className={styles.chipIcon} aria-hidden="true">
              {item.icon}
            </span>
            <span className={styles.chipName}>{item.name}</span>
            {item.isSelected && <span style={{ fontSize: '0.65rem' }}>✓</span>}
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.selectedBadge}>
          {selectedCount} of {currentItems.length} {activeSubTab} tracked
        </span>
        <span>Auto-synced</span>
      </div>
    </div>
  );
};
