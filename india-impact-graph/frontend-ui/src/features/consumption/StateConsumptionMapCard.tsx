import React, { useState, useMemo } from 'react';
import { StateConsumptionItem } from './types';
import { formatRupees } from './consumptionCalculation';
import styles from './StateConsumptionMapCard.module.css';

export interface StateConsumptionMapCardProps {
  stateVariations: StateConsumptionItem[];
  selectedLocation?: string;
  onSelectState?: (stateName: string) => void;
}

export const StateConsumptionMapCard: React.FC<StateConsumptionMapCardProps> = ({
  stateVariations,
  selectedLocation,
  onSelectState,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredStateId, setHoveredStateId] = useState<string | null>(null);

  // Category multiplier relative to total expenditure
  const categoryRatio = useMemo(() => {
    switch (selectedCategory) {
      case 'fuel':
        return 0.301;
      case 'food':
        return 0.299;
      case 'utilities':
        return 0.195;
      default:
        return 1.0;
    }
  }, [selectedCategory]);

  const categoryLabel = useMemo(() => {
    switch (selectedCategory) {
      case 'fuel':
        return 'Fuel & Energy';
      case 'food':
        return 'Food & Groceries';
      case 'utilities':
        return 'Utilities';
      default:
        return 'All Categories';
    }
  }, [selectedCategory]);

  // Scaled state rankings based on active category
  const filteredStates = useMemo(() => {
    return stateVariations.slice(0, 5).map((st) => ({
      ...st,
      displayAmount: Math.round(st.monthlyAverage * categoryRatio),
    }));
  }, [stateVariations, categoryRatio]);

  const legendMin = selectedCategory === 'all' ? '₹20K' : selectedCategory === 'utilities' ? '₹4K' : '₹6K';
  const legendMax = selectedCategory === 'all' ? '₹60K' : selectedCategory === 'utilities' ? '₹12K' : '₹18K';

  return (
    <article className={styles.mapCard} aria-label="State-wise Consumption Variation">
      <div className={styles.cardHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <h2 className={styles.cardTitle}>State-wise Consumption Variation</h2>
          <span
            style={{ fontSize: '0.75rem', color: '#8298a9', cursor: 'help' }}
            title="State expenditure benchmarks calibrated from MoSPI state MPCE survey tables. Not connected to live state sales tax APIs."
          >
            ⓘ
          </span>
        </div>

        <select
          className={styles.categorySelect}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          <option value="fuel">Fuel & Energy</option>
          <option value="food">Food & Groceries</option>
          <option value="utilities">Utilities</option>
        </select>
      </div>

      <div className={styles.bodyRow}>
        <div className={styles.mapColumn}>
          <div className={styles.mapSvgWrapper}>
            {/* India Map Geo Representation */}
            <svg
              className={styles.mapSvg}
              viewBox="0 0 100 115"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Map of India showing consumption variance"
            >
              {/* Northern Region (Kashmir/Punjab/Delhi) */}
              <path
                d="M38 5 L48 8 L54 18 L46 25 L36 22 L32 14 Z"
                fill={hoveredStateId === 'delhi' ? '#047857' : '#10B981'}
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onMouseEnter={() => setHoveredStateId('delhi')}
                onMouseLeave={() => setHoveredStateId(null)}
                onClick={() => onSelectState && onSelectState('Delhi')}
              >
                <title>Delhi / North: {formatRupees(Math.round(48230 * categoryRatio))}</title>
              </path>

              {/* Western Region (Gujarat/Rajasthan) */}
              <path
                d="M20 30 L36 28 L42 42 L30 52 L16 48 L14 36 Z"
                fill={hoveredStateId === 'gujarat' ? '#047857' : '#34D399'}
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onMouseEnter={() => setHoveredStateId('gujarat')}
                onMouseLeave={() => setHoveredStateId(null)}
                onClick={() => onSelectState && onSelectState('Gujarat')}
              >
                <title>Gujarat / West: {formatRupees(Math.round(41880 * categoryRatio))}</title>
              </path>

              {/* Central Region (Madhya Pradesh / Maharashtra North) */}
              <path
                d="M36 38 L54 36 L58 52 L44 58 L32 50 Z"
                fill="#6EE7B7"
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onClick={() => onSelectState && onSelectState('Madhya Pradesh')}
              >
                <title>Madhya Pradesh: {formatRupees(Math.round(34200 * categoryRatio))}</title>
              </path>

              {/* Eastern Region (Bengal / Bihar / Odisha) */}
              <path
                d="M58 40 L76 38 L84 48 L74 62 L58 54 Z"
                fill="#A7F3D0"
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onClick={() => onSelectState && onSelectState('West Bengal')}
              >
                <title>East India: {formatRupees(Math.round(35400 * categoryRatio))}</title>
              </path>

              {/* Western-Central Region (Maharashtra) */}
              <path
                d="M26 54 L44 56 L46 72 L30 76 L22 64 Z"
                fill={hoveredStateId === 'maharashtra' ? '#047857' : '#059669'}
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onMouseEnter={() => setHoveredStateId('maharashtra')}
                onMouseLeave={() => setHoveredStateId(null)}
                onClick={() => onSelectState && onSelectState('Maharashtra')}
              >
                <title>Maharashtra: {formatRupees(Math.round(45810 * categoryRatio))}</title>
              </path>

              {/* Southern-Western Region (Karnataka / Goa) */}
              <path
                d="M30 74 L46 72 L48 90 L34 94 L28 84 Z"
                fill={hoveredStateId === 'karnataka' ? '#047857' : '#10B981'}
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onMouseEnter={() => setHoveredStateId('karnataka')}
                onMouseLeave={() => setHoveredStateId(null)}
                onClick={() => onSelectState && onSelectState('Karnataka')}
              >
                <title>Karnataka: {formatRupees(Math.round(43920 * categoryRatio))}</title>
              </path>

              {/* Southern-Eastern Region (Tamil Nadu / AP) */}
              <path
                d="M48 70 L62 68 L60 92 L44 106 L44 88 Z"
                fill={hoveredStateId === 'tamil_nadu' ? '#047857' : '#34D399'}
                stroke="#ffffff"
                strokeWidth="1"
                className={styles.statePath}
                onMouseEnter={() => setHoveredStateId('tamil_nadu')}
                onMouseLeave={() => setHoveredStateId(null)}
                onClick={() => onSelectState && onSelectState('Tamil Nadu')}
              >
                <title>Tamil Nadu: {formatRupees(Math.round(42660 * categoryRatio))}</title>
              </path>
            </svg>
          </div>

          <div className={styles.gradientLegend}>
            <span>{legendMin}</span>
            <div className={styles.gradientBar} />
            <span>{legendMax}</span>
          </div>
        </div>

        <div className={styles.rankingColumn}>
          <div className={styles.rankingHeader}>
            {selectedCategory === 'all'
              ? 'Top 5 States (Monthly Avg ₹)'
              : `Top 5 States — ${categoryLabel} (₹)`}
          </div>
          <div className={styles.rankingList} role="list">
            {filteredStates.map((st) => {
              const isSelected = selectedLocation === st.stateName || hoveredStateId === st.id;
              return (
                <div
                  key={st.id}
                  role="listitem"
                  className={styles.rankingRow}
                  style={isSelected ? { backgroundColor: '#e8f5ec' } : undefined}
                  onMouseEnter={() => setHoveredStateId(st.id)}
                  onMouseLeave={() => setHoveredStateId(null)}
                  onClick={() => onSelectState && onSelectState(st.stateName)}
                >
                  <div className={styles.rankingLeft}>
                    <span className={styles.rankBadge}>{st.rank}</span>
                    <span className={styles.stateLabel}>{st.stateName}</span>
                  </div>
                  <span className={styles.stateAmount}>{formatRupees(st.displayAmount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </article>
  );
};
