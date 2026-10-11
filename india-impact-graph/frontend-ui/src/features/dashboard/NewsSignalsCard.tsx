import React, { useState } from 'react';
import styles from './NewsSignalsCard.module.css';

export interface NewsArticle {
  id: string;
  title: string;
  publisher: string;
  date: string;
  category: string;
  categoryTag: string;
  impactLevel: 'high' | 'medium';
  thumbnailType: 'oil' | 'shipping' | 'chip' | 'fed';
}

const NEWS_ITEMS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Crude oil prices rise on Middle East tensions, keeping fuel costs elevated',
    publisher: 'Reuters',
    date: 'Oct 12, 2024',
    category: 'Energy',
    categoryTag: 'petrol',
    impactLevel: 'high',
    thumbnailType: 'oil',
  },
  {
    id: 'news-2',
    title: 'Red Sea shipping disruptions raise freight costs, trade delays likely',
    publisher: 'Bloomberg',
    date: 'Oct 09, 2024',
    category: 'Trade & Supply Chain',
    categoryTag: 'economy',
    impactLevel: 'medium',
    thumbnailType: 'shipping',
  },
  {
    id: 'news-3',
    title: 'Taiwan semiconductor tensions may affect electronics, auto, and IT hardware',
    publisher: 'Financial Times',
    date: 'Oct 08, 2024',
    category: 'Technology',
    categoryTag: 'semiconductors',
    impactLevel: 'high',
    thumbnailType: 'chip',
  },
  {
    id: 'news-4',
    title: 'US Fed rate outlook change impacts INR and capital flows',
    publisher: 'Mint',
    date: 'Oct 07, 2024',
    category: 'Financial Markets',
    categoryTag: 'economy',
    impactLevel: 'medium',
    thumbnailType: 'fed',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'petrol', label: 'Petrol & Diesel' },
  { id: 'semiconductors', label: 'Semiconductors' },
  { id: 'economy', label: 'Economy' },
  { id: 'geopolitics', label: 'Geopolitics' },
  { id: 'climate', label: 'Climate & Energy' },
];

export const NewsSignalsCard: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filteredNews = selectedCat === 'all'
    ? NEWS_ITEMS
    : NEWS_ITEMS.filter((item) => item.categoryTag === selectedCat);

  const renderThumbnail = (type: string) => {
    switch (type) {
      case 'oil':
        return (
          <div className={styles.thumbOil} aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <path d="M12 2v20M17 5H7M15 9H9M19 19H5" />
              <polygon points="12 2 15 9 9 9" fill="#F59E0B" fillOpacity="0.5" />
            </svg>
          </div>
        );
      case 'shipping':
        return (
          <div className={styles.thumbShipping} aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <path d="M2 19h20M2 15l2-6h16l2 6H2Z" />
              <rect x="6" y="5" width="4" height="4" fill="#6EE7B7" fillOpacity="0.5" />
              <rect x="12" y="5" width="4" height="4" fill="#6EE7B7" fillOpacity="0.5" />
            </svg>
          </div>
        );
      case 'chip':
        return (
          <div className={styles.thumbChip} aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" fill="#38BDF8" fillOpacity="0.5" />
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
            </svg>
          </div>
        );
      case 'fed':
        return (
          <div className={styles.thumbFed} aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.card}>
      {/* 1. Header with View all button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconCircle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8" />
              <path d="M15 18h-5" />
              <path d="M10 6h8v4h-8V6Z" />
            </svg>
          </div>
          <div className={styles.titleCol}>
            <h3 className={styles.title}>News &amp; Signals</h3>
            <span className={styles.subtitle}>Real-time news and developments from verified sources</span>
          </div>
        </div>

        <button type="button" className={styles.viewAllBtn}>
          <span>View all</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* 2. Filter Category Pills */}
      <div className={styles.pillsRow} role="tablist" aria-label="News categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.pill} ${selectedCat === cat.id ? styles.pillActive : ''}`}
            onClick={() => setSelectedCat(cat.id)}
            role="tab"
            aria-selected={selectedCat === cat.id}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 3. Horizontal Grid of News Cards */}
      <div className={styles.newsGrid}>
        {filteredNews.map((article) => (
          <article key={article.id} className={styles.newsCard}>
            <div className={styles.thumbContainer}>
              {renderThumbnail(article.thumbnailType)}
            </div>

            <div className={styles.cardContent}>
              <div className={styles.badgeRow}>
                <span
                  className={
                    article.impactLevel === 'high'
                      ? styles.impactBadgeHigh
                      : styles.impactBadgeMedium
                  }
                >
                  <span className={styles.badgeDot}>•</span>
                  {article.impactLevel === 'high' ? 'High Impact' : 'Medium'}
                </span>
              </div>

              <h4 className={styles.articleTitle}>{article.title}</h4>

              <div className={styles.cardFooter}>
                <span className={styles.publisher}>{article.publisher}</span>
                <span className={styles.bullet}>•</span>
                <span className={styles.date}>{article.date}</span>
                <span className={styles.bullet}>•</span>
                <span className={styles.category}>{article.category}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
