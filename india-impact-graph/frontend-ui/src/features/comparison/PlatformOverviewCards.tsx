import React from 'react';
import { PlatformId, PlatformOverview } from './types';
import styles from './PlatformOverviewCards.module.css';

interface PlatformOverviewCardsProps {
  platforms: PlatformOverview[];
  selectedPlatform: PlatformId | null;
  onSelectPlatform: (platformId: PlatformId) => void;
}

export const PlatformOverviewCards: React.FC<PlatformOverviewCardsProps> = ({
  platforms,
  selectedPlatform,
  onSelectPlatform,
}) => {
  const renderIcon = (iconType: PlatformOverview['iconType']) => {
    switch (iconType) {
      case 'news':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8" />
            <path d="M15 18h-5" />
            <path d="M10 6h8v4h-8V6Z" />
          </svg>
        );
      case 'finance':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
            <path d="M19 15V9h-6" />
          </svg>
        );
      case 'research':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'crown':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
          </svg>
        );
    }
  };

  return (
    <section className={styles.container} aria-label="Platform Overview Categories">
      <div className={styles.grid}>
        {platforms.map((platform) => {
          const isSelected = selectedPlatform === platform.id;
          const isBharatImpact = platform.id === 'bharat_impact';

          return (
            <div
              key={platform.id}
              role="button"
              tabIndex={0}
              className={`
                ${styles.card}
                ${isSelected ? styles.selectedCard : ''}
                ${isBharatImpact ? styles.bharatCard : ''}
              `}
              onClick={() => onSelectPlatform(platform.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlatform(platform.id);
                }
              }}
              aria-pressed={isSelected}
              aria-label={`View details for ${platform.name}`}
            >
              <div
                className={styles.iconWrapper}
                style={{
                  backgroundColor: platform.badgeBg,
                  color: platform.accentColor,
                  borderColor: platform.badgeBorder,
                }}
              >
                {renderIcon(platform.iconType)}
              </div>

              <div className={styles.content}>
                <div className={styles.titleRow}>
                  <h3 className={styles.title}>{platform.name}</h3>
                  {isBharatImpact && (
                    <span className={styles.crownBadge} title="Integrated solution">
                      ★ Leader
                    </span>
                  )}
                </div>
                <p className={styles.tagline}>{platform.tagline}</p>
              </div>

              {isSelected && (
                <div className={styles.activeIndicator} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
