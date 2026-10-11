import React from 'react';
import { NewsArticleRecord, EconomicTagKind } from './types';
import styles from './TopStoriesSection.module.css';

export interface TopStoriesSectionProps {
  articles: NewsArticleRecord[];
  onSelectArticle?: (article: NewsArticleRecord) => void;
  onViewAll?: () => void;
}

export const TopStoriesSection: React.FC<TopStoriesSectionProps> = ({
  articles,
  onSelectArticle,
  onViewAll,
}) => {
  const topArticles = articles.filter((a) => a.is_top_story).slice(0, 4);

  const getTagClass = (kind: EconomicTagKind) => {
    switch (kind) {
      case 'negative':
        return styles.tagNegative;
      case 'positive':
        return styles.tagPositive;
      case 'risk':
        return styles.tagRisk;
      default:
        return styles.tagNeutral;
    }
  };

  return (
    <section className={styles.sectionContainer} aria-label="Top News Stories">
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2 className={styles.sectionTitle}>Top Stories</h2>
          <p className={styles.sectionSubtitle}>
            Latest and most impactful news with analysis for India
          </p>
        </div>
        {onViewAll && (
          <button type="button" className={styles.viewAllLink} onClick={onViewAll}>
            <span>View All News</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      <div className={styles.cardsGrid}>
        {topArticles.map((story) => (
          <article
            key={story.article_id}
            className={styles.storyCard}
            onClick={() => onSelectArticle && onSelectArticle(story)}
            tabIndex={0}
            role="article"
          >
            <div className={styles.imageContainer}>
              {story.image_url ? (
                <img
                  src={story.image_url}
                  alt={story.headline}
                  className={styles.storyImage}
                  loading="lazy"
                />
              ) : (
                <div className={styles.storyImage} style={{ background: '#e2e8f0' }} />
              )}
              <span className={styles.categoryBadge}>{story.category_label}</span>
              <a
                href={story.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalIconBtn}
                title={`Read original article on ${story.publisher}`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Read full story on ${story.publisher}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>

            <div className={styles.cardBody}>
              <h3 className={styles.headline} title={story.headline}>
                {story.headline}
              </h3>

              <div className={styles.publisherRow}>
                <span className={styles.publisherIcon}>
                  {story.publisher.charAt(0).toUpperCase()}
                </span>
                <span>
                  {story.publisher} • {story.relative_time}
                </span>
              </div>

              <p className={styles.summary}>{story.summary}</p>

              {story.economic_tags.length > 0 && (
                <div className={styles.tagsRow}>
                  {story.economic_tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`${styles.tagPill} ${getTagClass(tag.kind)}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
