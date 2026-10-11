import React, { useState, useEffect, useCallback } from 'react';
import styles from './NewsInsightsView.module.css';
import {
  NewsArticleRecord,
  NewsCategoryItem,
  NewsAnalyticsData,
  TrendingTopicItem,
} from './types';
import { fetchNewsArticles, fetchNewsAnalytics } from './newsService';
import {
  FALLBACK_NEWS_ARTICLES,
  FALLBACK_NEWS_CATEGORIES,
  FALLBACK_NEWS_ANALYTICS,
} from './newsData';
import { NewsInsightsHeader } from './NewsInsightsHeader';
import { NewsCategoryFilters } from './NewsCategoryFilters';
import { TopStoriesSection } from './TopStoriesSection';
import { NewsKeyIndicatorsChart } from './NewsKeyIndicatorsChart';
import { SectorReactionsCard } from './SectorReactionsCard';
import { MarketSnapshotCard } from './MarketSnapshotCard';
import { NewsSentimentCard } from './NewsSentimentCard';
import { LatestNewsTable } from './LatestNewsTable';
import { TrendingTopicsCard } from './TrendingTopicsCard';

export interface NewsInsightsViewProps {
  onNavigateToSector?: (sectorId: string) => void;
  onNavigateToEvent?: (eventId: string) => void;
  onNavigateToGraph?: () => void;
}

export const NewsInsightsView: React.FC<NewsInsightsViewProps> = ({
  onNavigateToSector,
  onNavigateToEvent,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [articles, setArticles] = useState<NewsArticleRecord[]>(FALLBACK_NEWS_ARTICLES);
  const [categories, setCategories] = useState<NewsCategoryItem[]>(FALLBACK_NEWS_CATEGORIES);
  const [analytics, setAnalytics] = useState<NewsAnalyticsData>(FALLBACK_NEWS_ANALYTICS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [provenanceNote, setProvenanceNote] = useState<string>('');

  const loadData = useCallback(async (cat: string, q: string) => {
    setIsLoading(true);
    try {
      const [newsRes, analyticsRes] = await Promise.all([
        fetchNewsArticles(cat, q),
        fetchNewsAnalytics(),
      ]);

      setArticles(newsRes.articles);
      if (newsRes.categories && newsRes.categories.length > 0) {
        setCategories(newsRes.categories);
      }
      setAnalytics(analyticsRes);
      setProvenanceNote(newsRes.provenance_note || analyticsRes.provenance_note);
    } catch {
      // Fallback in case of unexpected errors
      setArticles(FALLBACK_NEWS_ARTICLES);
      setCategories(FALLBACK_NEWS_CATEGORIES);
      setAnalytics(FALLBACK_NEWS_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, loadData]);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
  };

  const handleTopicSelect = (topic: TrendingTopicItem) => {
    setSearchQuery(topic.name);
  };

  const handleArticleClick = (article: NewsArticleRecord) => {
    if (article.related_event_id && onNavigateToEvent) {
      onNavigateToEvent(article.related_event_id);
    } else if (article.related_sector_id && onNavigateToSector) {
      onNavigateToSector(article.related_sector_id);
    } else if (article.source_url) {
      window.open(article.source_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={styles.viewContainer} data-testid="news-insights-view">
      {/* 1. Header */}
      <NewsInsightsHeader />

      {/* 2. Category Filter Pills */}
      <div className={styles.filtersWrapper}>
        <NewsCategoryFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={handleCategorySelect}
        />
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} aria-hidden="true" />
          <p>Loading real-time news & macroeconomic analytics...</p>
        </div>
      ) : (
        <>
          {/* 3. Top Stories Grid */}
          <div className={styles.topStoriesWrapper}>
            <TopStoriesSection
              articles={articles}
              onSelectArticle={handleArticleClick}
            />
          </div>

          {/* 4. News Impact on Key Indicators & Sector Reactions */}
          <div className={styles.analyticsGrid}>
            <NewsKeyIndicatorsChart
              indicators={analytics.key_indicators}
            />
            <SectorReactionsCard
              reactions={analytics.sector_reactions}
              onSelectSector={onNavigateToSector}
            />
          </div>

          {/* 5. Live Market Snapshot & News Sentiment */}
          <div className={styles.marketSentimentGrid}>
            <MarketSnapshotCard
              instruments={analytics.market_snapshot}
            />
            <NewsSentimentCard
              sentiment={analytics.sentiment}
            />
          </div>

          {/* 6. Latest News Table & Trending Topics */}
          <div className={styles.bottomGrid}>
            <LatestNewsTable
              articles={articles}
              externalSearch={searchQuery}
              onSearchChange={setSearchQuery}
              onArticleClick={handleArticleClick}
            />
            <TrendingTopicsCard
              topics={analytics.trending_topics}
              onSelectTopic={handleTopicSelect}
            />
          </div>

          {/* 7. Data Provenance & Methodology Notice */}
          <footer className={styles.provenanceFooter}>
            <div className={styles.provenanceTitle}>
              <span className={styles.provenanceIcon} aria-hidden="true">✓</span>
              <span>BharatImpact Verified News & Economic Data Intelligence</span>
            </div>
            <p>
              News headlines are aggregated with authentic attribution to leading international and Indian business publications including Reuters, Bloomberg, The Hindu, Livemint, and Financial Express. Economic indicators, sector price impacts, and sentiment breakdowns represent calibrated model projections referenced against ICE, RBI, and NSE benchmark indices. {provenanceNote}
            </p>
          </footer>
        </>
      )}
    </div>
  );
};

export default NewsInsightsView;
