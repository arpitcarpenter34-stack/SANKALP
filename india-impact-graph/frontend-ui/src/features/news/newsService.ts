import { apiClient } from '../../services/api/apiClient';
import {
  NewsArticleRecord,
  NewsCategoryItem,
  NewsListResponse,
  NewsAnalyticsData,
} from './types';
import {
  FALLBACK_NEWS_ARTICLES,
  FALLBACK_NEWS_CATEGORIES,
  FALLBACK_NEWS_ANALYTICS,
} from './newsData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export class NewsService {
  /**
   * Fetches news articles with category filtering and text search.
   * Gracefully falls back to curated benchmark data if backend is offline.
   */
  static async getNewsArticles(
    category?: string,
    query?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<NewsListResponse> {
    if (!apiClient.isForcedOffline()) {
      try {
        const params = new URLSearchParams();
        if (category && category !== 'all') params.append('category', category);
        if (query && query.trim()) params.append('q', query.trim());
        params.append('limit', String(limit));
        params.append('offset', String(offset));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const res = await fetch(`${API_BASE}/news?${params.toString()}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data: NewsListResponse = await res.json();
          return data;
        }
      } catch {
        // Fall through to deterministic fallback on network or parse failure
      }
    }

    // Deterministic Client-side Fallback
    let filtered = [...FALLBACK_NEWS_ARTICLES];

    if (category && category !== 'all') {
      const catNorm = category.toLowerCase().replace('-', '_').replace(' ', '_');
      filtered = filtered.filter(
        (a) => a.category.toLowerCase() === catNorm || a.category_label.toLowerCase() === category.toLowerCase()
      );
    }

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.publisher.toLowerCase().includes(q) ||
          a.economic_tags.some((t) => t.label.toLowerCase().includes(q))
      );
    }

    const totalCount = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    // Compute dynamic counts
    const categories: NewsCategoryItem[] = FALLBACK_NEWS_CATEGORIES.map((cat) => ({
      ...cat,
      article_count:
        cat.id === 'all'
          ? FALLBACK_NEWS_ARTICLES.length
          : FALLBACK_NEWS_ARTICLES.filter((a) => a.category === cat.id).length,
    }));

    return {
      articles: paginated,
      total_count: totalCount,
      categories,
      freshness_timestamp: 'Oct 12, 2024 • 10:32 AM IST',
      provider_status: apiClient.isForcedOffline() ? 'offline_demo' : 'cached_benchmark',
      provenance_note:
        'Curated verified economic news stream from accredited international and Indian news services (Reuters, Bloomberg, The Hindu, FAO, Livemint, CNBC, Financial Times).',
    };
  }

  /**
   * Fetches news analytics payload (indicators, sector reactions, market snapshot, sentiment).
   */
  static async getNewsAnalytics(): Promise<NewsAnalyticsData> {
    if (!apiClient.isForcedOffline()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const res = await fetch(`${API_BASE}/news/analytics`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data: NewsAnalyticsData = await res.json();
          return data;
        }
      } catch {
        // Fall through to deterministic fallback
      }
    }

    return FALLBACK_NEWS_ANALYTICS;
  }

  /**
   * Fetches single news article by ID.
   */
  static async getNewsArticleById(articleId: string): Promise<NewsArticleRecord | null> {
    if (!apiClient.isForcedOffline()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const res = await fetch(`${API_BASE}/news/${articleId}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fall through
      }
    }

    const found = FALLBACK_NEWS_ARTICLES.find((a) => a.article_id === articleId);
    return found || null;
  }
}

export const fetchNewsArticles = NewsService.getNewsArticles;
export const fetchNewsAnalytics = NewsService.getNewsAnalytics;
export const fetchNewsArticleById = NewsService.getNewsArticleById;
