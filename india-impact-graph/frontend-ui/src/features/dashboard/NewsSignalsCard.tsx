import React, { useState } from 'react';
import styles from './NewsSignalsCard.module.css';

export interface NewsArticle {
  id: string;
  title: string;
  publisher: string;
  date: string;
  category: string;
  categoryTag: 'all' | 'petrol' | 'semiconductors' | 'economy';
  isDemo: boolean;
  thumbnailType: 'oil' | 'chip' | 'shipping';
}

const NEWS_ITEMS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Crude oil prices rise on Middle East tensions, seen keeping fuel costs elevated',
    publisher: 'Reuters',
    date: 'Oct 12, 2024',
    category: 'Energy',
    categoryTag: 'petrol',
    isDemo: true,
    thumbnailType: 'oil',
  },
  {
    id: 'news-2',
    title: 'Taiwan tightens export controls on advanced chips, global supply concerns grow',
    publisher: 'The Economic Times',
    date: 'Oct 11, 2024',
    category: 'Semiconductors',
    categoryTag: 'semiconductors',
    isDemo: true,
    thumbnailType: 'chip',
  },
  {
    id: 'news-3',
    title: 'Shipping costs climb as Red Sea disruptions continue to affect global trade',
    publisher: 'Bloomberg',
    date: 'Oct 10, 2024',
    category: 'Logistics',
    categoryTag: 'economy',
    isDemo: true,
    thumbnailType: 'shipping',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'petrol', label: 'Petrol & Diesel' },
  { id: 'semiconductors', label: 'Semiconductors' },
  { id: 'economy', label: 'Economy' },
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <path d="M12 2v20M17 5H7M15 9H9M19 19H5" />
              <polygon points="12 2 15 9 9 9" fill="#F59E0B" fillOpacity="0.4" />
            </svg>
          </div>
        );
      case 'chip':
        return (
          <div className={styles.thumbChip} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" fill="#38BDF8" fillOpacity="0.4" />
              <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
            </svg>
          </div>
        );
      case 'shipping':
        return (
          <div className={styles.thumbShipping} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8">
              <path d="M2 19h20M2 15l2-6h16l2 6H2Z" />
              <rect x="6" y="5" width="4" height="4" fill="#6EE7B7" fillOpacity="0.5" />
              <rect x="12" y="5" width="4" height="4" fill="#6EE7B7" fillOpacity="0.5" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>News & Signals</h3>
        <button type="button" className={styles.viewAllBtn}>
          <span>View all</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* Filter Category Pills */}
      <div className={styles.pillsRow}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`${styles.pill} ${selectedCat === cat.id ? styles.pillActive : ''}`}
            onClick={() => setSelectedCat(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Article List */}
      <div className={styles.articlesList}>
        {filteredNews.map((article) => (
          <article key={article.id} className={styles.articleItem}>
            <div className={styles.thumbWrapper}>
              {renderThumbnail(article.thumbnailType)}
            </div>

            <div className={styles.articleContent}>
              <div className={styles.topMeta}>
                <h4 className={styles.articleTitle}>{article.title}</h4>
                {article.isDemo && (
                  <span className={styles.demoBadge}>Illustrative demo data</span>
                )}
              </div>

              <div className={styles.articleFooter}>
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
