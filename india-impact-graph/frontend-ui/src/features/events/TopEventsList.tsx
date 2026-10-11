import React, { useState } from 'react';
import { GlobalEventRecord } from './types';
import styles from './TopEventsList.module.css';

export interface TopEventsListProps {
  events: GlobalEventRecord[];
  selectedEventId?: string;
  onSelectEvent: (eventId: string) => void;
}

export const TopEventsList: React.FC<TopEventsListProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  // Sort by rank ascending
  const rankedEvents = [...events].sort((a, b) => a.rank - b.rank);
  const visibleEvents = showAll ? rankedEvents : rankedEvents.slice(0, 5);

  return (
    <div className={styles.card} aria-label="Top Global Events by Potential Impact on India">
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Top Global Events by Potential Impact on India</h2>
        <button
          type="button"
          className={styles.viewAllBtn}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show top 5 ↑' : 'View all →'}
        </button>
      </div>

      <div className={styles.eventsList} role="list">
        {rankedEvents.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <span>No events match the selected filters or date window.</span>
          </div>
        ) : (
          visibleEvents.map((ev) => {
            const isSelected = ev.id === selectedEventId;

            return (
              <button
                key={ev.id}
                type="button"
                className={`${styles.eventRow} ${isSelected ? styles.eventRowSelected : ''}`}
                onClick={() => onSelectEvent(ev.id)}
                aria-current={isSelected ? 'true' : undefined}
              >
                {/* Rank number badge */}
                <div className={`${styles.rankBadge} ${ev.rank === 1 ? styles.rankBadgeFirst : ''}`}>
                  <span>{ev.rank}</span>
                </div>

                {/* Event headline and short explanation */}
                <div className={styles.eventContent}>
                  <div className={styles.eventTitleRow}>
                    <span className={styles.eventTitle}>{ev.title}</span>

                    <span className={styles.badgeRow}>
                      <span
                        className={`${styles.severityBadge} ${
                          ev.severity === 'high'
                            ? styles.badgeHigh
                            : ev.severity === 'medium'
                            ? styles.badgeMedium
                            : ev.severity === 'low'
                            ? styles.badgeLow
                            : styles.badgeMonitoring
                        }`}
                      >
                        {ev.severity === 'high'
                          ? 'High'
                          : ev.severity === 'medium'
                          ? 'Medium'
                          : ev.severity === 'low'
                          ? 'Low'
                          : 'Monitoring'}
                      </span>

                      {ev.trend === 'up' && (
                        <span
                          className={`${styles.trendIcon} ${styles.trendUp}`}
                          title="Rising impact trend"
                        >
                          ↑
                        </span>
                      )}
                      {ev.trend === 'down' && (
                        <span
                          className={`${styles.trendIcon} ${styles.trendDown}`}
                          title="Easing impact trend"
                        >
                          ↓
                        </span>
                      )}
                      {ev.trend === 'neutral' && (
                        <span
                          className={`${styles.trendIcon} ${styles.trendNeutral}`}
                          title="Stable impact trend"
                        >
                          →
                        </span>
                      )}
                    </span>
                  </div>

                  <p className={styles.eventExplanation}>{ev.shortDescription}</p>
                </div>

                {/* Event Date */}
                <span className={styles.eventDate}>{ev.eventDate}</span>

                {/* Event Thumbnail */}
                {ev.imageUrl && (
                  <div className={styles.thumbWrapper}>
                    <img
                      src={ev.imageUrl}
                      alt=""
                      className={styles.eventThumb}
                      loading="lazy"
                    />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Bottom View More toggle button */}
      {rankedEvents.length > 5 && (
        <button
          type="button"
          className={styles.viewMoreRowBtn}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'View Less Events ↑' : 'View More Events →'}
        </button>
      )}
    </div>
  );
};
