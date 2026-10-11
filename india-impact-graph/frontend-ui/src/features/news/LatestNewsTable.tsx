import React, { useState } from 'react';
import styles from './LatestNewsTable.module.css';
import { NewsArticleRecord, ImpactSeverity } from './types';

interface LatestNewsTableProps {
  articles: NewsArticleRecord[];
  onArticleClick?: (article: NewsArticleRecord) => void;
  externalSearch?: string;
  onSearchChange?: (term: string) => void;
}

function getImpactBadge(severity: ImpactSeverity) {
  switch (severity) {
    case 'high':
      return { label: 'High Impact', className: styles.impactHigh };
    case 'medium':
      return { label: 'Med Impact', className: styles.impactMedium };
    case 'positive':
      return { label: 'Positive', className: styles.impactPositive };
    case 'low':
    default:
      return { label: 'Low Impact', className: styles.impactLow };
  }
}

export const LatestNewsTable: React.FC<LatestNewsTableProps> = ({
  articles,
  onArticleClick,
  externalSearch,
  onSearchChange,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const searchTerm = externalSearch !== undefined ? externalSearch : internalSearch;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  const filteredArticles = articles.filter((art) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      art.headline.toLowerCase().includes(term) ||
      art.summary.toLowerCase().includes(term) ||
      art.publisher.toLowerCase().includes(term) ||
      art.category_label.toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.tableContainer} data-testid="latest-news-table">
      <div className={styles.tableHeader}>
        <div className={styles.titleGroup}>
          <h3 className={styles.tableTitle}>Latest News</h3>
          <p className={styles.tableSubtitle}>
            Real-time economic updates ({filteredArticles.length} articles)
          </p>
        </div>

        <div className={styles.searchBox}>
          <span aria-hidden="true">🔍</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search headline or source..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Filter news by headline or publisher"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange ? onSearchChange('') : setInternalSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {filteredArticles.length === 0 ? (
        <div className={styles.emptyState}>
          No news articles match your filter criteria. Try searching with different keywords.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className={styles.tableWrapper}>
            <table className={styles.newsTable}>
              <thead>
                <tr>
                  <th scope="col" style={{ width: '10%' }}>Time</th>
                  <th scope="col" style={{ width: '45%' }}>Headline</th>
                  <th scope="col" style={{ width: '15%' }}>Category</th>
                  <th scope="col" style={{ width: '12%' }}>Impact</th>
                  <th scope="col" style={{ width: '10%' }}>Source</th>
                  <th scope="col" style={{ width: '8%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((art) => {
                  const impact = getImpactBadge(art.impact_severity);
                  return (
                    <tr
                      key={art.article_id}
                      className={styles.tableRow}
                      onClick={() => onArticleClick && onArticleClick(art)}
                    >
                      <td className={styles.timeCell}>{art.relative_time}</td>
                      <td className={styles.headlineCell}>
                        <span className={styles.headlineText}>{art.headline}</span>
                        <span className={styles.summaryText}>{art.summary}</span>
                      </td>
                      <td>
                        <span className={styles.categoryBadge}>{art.category_label}</span>
                      </td>
                      <td>
                        <span className={`${styles.impactBadge} ${impact.className}`}>
                          {impact.label}
                        </span>
                      </td>
                      <td className={styles.sourceCell}>{art.publisher}</td>
                      <td className={styles.actionCell} onClick={(e) => e.stopPropagation()}>
                        <a
                          href={art.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.readButton}
                          title={`Read original article on ${art.publisher}`}
                        >
                          Read ↗
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className={styles.mobileCardList}>
            {filteredArticles.map((art) => {
              const impact = getImpactBadge(art.impact_severity);
              return (
                <div key={art.article_id} className={styles.mobileCard}>
                  <div className={styles.mobileCardTop}>
                    <span className={styles.categoryBadge}>{art.category_label}</span>
                    <span className={styles.timeCell}>{art.relative_time}</span>
                  </div>

                  <strong className={styles.headlineText}>{art.headline}</strong>
                  <p className={styles.summaryText}>{art.summary}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`${styles.impactBadge} ${impact.className}`}>
                        {impact.label}
                      </span>
                      <span className={styles.sourceCell}>{art.publisher}</span>
                    </div>

                    <a
                      href={art.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.readButton}
                    >
                      Read ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
