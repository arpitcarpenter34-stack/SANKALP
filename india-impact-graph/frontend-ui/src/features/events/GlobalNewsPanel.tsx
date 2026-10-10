import React, { useState, useMemo } from 'react';
import { NewsArticleRecord, EventCategory, GeographicRegion, ImpactSeverity } from './types';
import styles from './GlobalNewsPanel.module.css';

export interface GlobalNewsPanelProps {
  articles: NewsArticleRecord[];
  selectedArticleId?: string;
  onSelectArticle: (articleId: string, relatedEventId?: string) => void;
}

export const GlobalNewsPanel: React.FC<GlobalNewsPanelProps> = ({
  articles,
  selectedArticleId,
  onSelectArticle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<GeographicRegion | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<ImpactSeverity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      if (selectedRegion !== 'all' && article.region !== selectedRegion) {
        return false;
      }
      if (selectedSeverity !== 'all' && article.severity !== selectedSeverity) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesPub = article.publisher.toLowerCase().includes(q);
        const matchesCat = article.categoryLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesPub && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [articles, selectedCategory, selectedRegion, selectedSeverity, searchQuery]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedRegion('all');
    setSelectedSeverity('all');
    setSearchQuery('');
  };

  const renderThumbnailIcon = (thumb: string) => {
    switch (thumb) {
      case 'chip':
        return (
          <div className={`${styles.thumbnailWrapper} ${styles.thumbChip}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
          </div>
        );
      case 'oil':
        return (
          <div className={`${styles.thumbnailWrapper} ${styles.thumbOil}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8 6 6 10 6 14a6 6 0 0 0 12 0c0-4-2-8-6-12Z" />
              <path d="M8 14a4 4 0 0 0 7.5 1.5" />
            </svg>
          </div>
        );
      case 'ship':
        return (
          <div className={`${styles.thumbnailWrapper} ${styles.thumbShip}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 20a4 4 0 0 0 4-2 4 4 0 0 1 4-2 4 4 0 0 1 4 2 4 4 0 0 0 4 2 4 4 0 0 0 4-2 4 4 0 0 1 4-2" />
              <path d="M4 18l2-8h12l2 8" />
              <path d="M9 10V6h6v4" />
            </svg>
          </div>
        );
      case 'fed':
        return (
          <div className={`${styles.thumbnailWrapper} ${styles.thumbFed}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 22 7 12 2" />
              <line x1="5" y1="10" x2="5" y2="18" />
              <line x1="9" y1="10" x2="9" y2="18" />
              <line x1="15" y1="10" x2="15" y2="18" />
              <line x1="19" y1="10" x2="19" y2="18" />
              <line x1="2" y1="21" x2="22" y2="21" />
            </svg>
          </div>
        );
      case 'wheat':
      default:
        return (
          <div className={`${styles.thumbnailWrapper} ${styles.thumbWheat}`}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 22 16 8" />
              <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
              <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
              <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={styles.panelCard} aria-label="Latest Global News">
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Latest Global News</h2>
        <p className={styles.panelSubtitle}>
          Real-time news and developments from verified sources
        </p>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        {/* Category Filter */}
        <div className={styles.selectWrapper}>
          <select
            className={styles.filterSelect}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as EventCategory | 'all')}
            aria-label="Filter by Category"
          >
            <option value="all">All Categories</option>
            <option value="technology">Technology</option>
            <option value="commodities">Commodities</option>
            <option value="trade">Trade &amp; Supply Chain</option>
            <option value="finance">Financial Markets</option>
            <option value="climate">Climate &amp; Energy</option>
            <option value="geopolitics">Geopolitics</option>
            <option value="economy">Economy</option>
          </select>
          <span className={styles.selectArrow} aria-hidden="true">▼</span>
        </div>

        {/* Region Filter */}
        <div className={styles.selectWrapper}>
          <select
            className={styles.filterSelect}
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as GeographicRegion | 'all')}
            aria-label="Filter by Region"
          >
            <option value="all">All Regions</option>
            <option value="asia_pacific">Asia Pacific</option>
            <option value="middle_east">Middle East</option>
            <option value="north_america">North America</option>
            <option value="europe">Europe</option>
            <option value="south_asia">South Asia</option>
          </select>
          <span className={styles.selectArrow} aria-hidden="true">▼</span>
        </div>

        {/* Impact Level Filter */}
        <div className={styles.selectWrapper}>
          <select
            className={styles.filterSelect}
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value as ImpactSeverity | 'all')}
            aria-label="Filter by Impact Level"
          >
            <option value="all">All Impact Levels</option>
            <option value="high">High Impact</option>
            <option value="medium">Medium Impact</option>
            <option value="low">Low Impact</option>
            <option value="monitoring">Monitoring</option>
          </select>
          <span className={styles.selectArrow} aria-hidden="true">▼</span>
        </div>

        {/* Search input */}
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon} aria-hidden="true">🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search articles"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearchBtn}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Articles List */}
      <div className={styles.articlesList} role="feed" aria-busy="false">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => {
            const isSelected = article.id === selectedArticleId;
            return (
              <button
                key={article.id}
                type="button"
                className={`${styles.articleCard} ${isSelected ? styles.articleCardActive : ''}`}
                onClick={() => onSelectArticle(article.id, article.relatedEventId)}
                aria-current={isSelected ? 'true' : undefined}
              >
                {/* Visual Thumbnail */}
                {renderThumbnailIcon(article.imageThumbnail)}

                {/* Article Info */}
                <div className={styles.articleDetails}>
                  <h3 className={styles.articleHeadline}>{article.title}</h3>

                  <div className={styles.articleMetaRow}>
                    <span className={styles.publisherName}>{article.publisher}</span>
                    <span className={styles.dotSep}>•</span>
                    <span>{article.publishedDate}</span>
                    <span className={styles.dotSep}>•</span>
                    <span>{article.relativeTime}</span>

                    <span
                      className={`${styles.severityPill} ${
                        article.severity === 'high'
                          ? styles.sevHigh
                          : article.severity === 'medium'
                          ? styles.sevMedium
                          : article.severity === 'low'
                          ? styles.sevLow
                          : styles.sevMonitoring
                      }`}
                    >
                      {article.severity === 'high'
                        ? 'High Impact'
                        : article.severity === 'medium'
                        ? 'Medium Impact'
                        : article.severity === 'low'
                        ? 'Low Impact'
                        : 'Monitoring'}
                    </span>

                    <span className={styles.categoryTag}>{article.categoryLabel}</span>
                  </div>
                </div>

                {/* Arrow affordance */}
                <span className={styles.arrowAffordance} aria-hidden="true">
                  ›
                </span>
              </button>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <span>No articles match the selected filter criteria.</span>
            <button
              type="button"
              className={styles.resetBtn}
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
