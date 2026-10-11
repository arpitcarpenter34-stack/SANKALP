import { describe, it, expect } from 'vitest';
import {
  FALLBACK_NEWS_ARTICLES,
  FALLBACK_NEWS_CATEGORIES,
  FALLBACK_NEWS_ANALYTICS,
} from '../newsData';
import { fetchNewsArticles, fetchNewsAnalytics } from '../newsService';

describe('BharatImpact News & Insights Data Engine & Integrity (Prompt 7 Verification)', () => {
  // Test 1: News Catalog Authenticity and Structure
  it('validates authentic source attribution and URL integrity for news catalog', () => {
    expect(FALLBACK_NEWS_ARTICLES.length).toBeGreaterThanOrEqual(12);

    const validPublishers = [
      'Reuters',
      'The Hindu',
      'Bloomberg',
      'Livemint',
      'The Economic Times',
      'Financial Times',
      'Food and Agriculture Organization (FAO)',
      'FAO',
      'CNBC',
      'The Financial Express',
      'The Wall Street Journal',
      'Wall Street Journal',
    ];

    FALLBACK_NEWS_ARTICLES.forEach((art) => {
      expect(art.article_id).toBeDefined();
      expect(art.headline.length).toBeGreaterThan(15);
      expect(art.summary.length).toBeGreaterThan(20);
      expect(validPublishers).toContain(art.publisher);
      expect(art.source_url).toMatch(/^https:\/\//);
      expect(art.verification_status).toBe('VERIFIED');
      expect(art.economic_tags.length).toBeGreaterThanOrEqual(1);
    });
  });

  // Test 2: Top Stories Integrity
  it('ensures at least 4 top stories are flagged with economic tags and imagery', () => {
    const topStories = FALLBACK_NEWS_ARTICLES.filter((a) => a.is_top_story);
    expect(topStories.length).toBeGreaterThanOrEqual(4);

    topStories.slice(0, 4).forEach((story) => {
      expect(story.image_key).toBeDefined();
      expect(['oil', 'rbi', 'chip', 'ship']).toContain(story.image_key);
      expect(story.economic_tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  // Test 3: Domain Categories
  it('verifies category taxonomy includes 9 primary domains plus extra categories', () => {
    const expectedPrimary = [
      'all',
      'global_economy',
      'india_economy',
      'commodities',
      'energy',
      'technology',
      'policy',
      'geopolitics',
      'markets',
    ];

    const categoryIds = FALLBACK_NEWS_CATEGORIES.map((c) => c.id);
    expectedPrimary.forEach((id) => {
      expect(categoryIds).toContain(id);
    });

    const allCat = FALLBACK_NEWS_CATEGORIES.find((c) => c.id === 'all');
    expect(allCat).toBeDefined();
    expect(allCat?.article_count).toBe(FALLBACK_NEWS_ARTICLES.length);
  });

  // Test 4: Key Indicators Time-Series Data
  it('validates multi-series indicators have valid dates, positive values, and changes', () => {
    const { key_indicators } = FALLBACK_NEWS_ANALYTICS;
    expect(key_indicators.commodity_prices).toBeDefined();
    expect(key_indicators.currency_markets).toBeDefined();
    expect(key_indicators.sector_indices).toBeDefined();

    // Check Commodity Prices series
    const brent = key_indicators.commodity_prices.find((s) => s.id === 'brent_crude');
    expect(brent).toBeDefined();
    expect(brent?.data.length).toBe(7);
    expect(brent?.change_pct).toBe(12.4);
    brent?.data.forEach((pt) => {
      expect(pt.value).toBeGreaterThan(0);
      expect(pt.label).toBeDefined();
    });
  });

  // Test 5: Sector Reactions Metrics
  it('validates sector reactions reflect positive and easing price pressures', () => {
    const reactions = FALLBACK_NEWS_ANALYTICS.sector_reactions;
    expect(reactions.length).toBeGreaterThanOrEqual(8);

    const energy = reactions.find((s) => s.sector_id === 'energy');
    expect(energy).toBeDefined();
    expect(energy?.change_pct).toBe(4.8);
    expect(energy?.is_negative_for_economy).toBe(true);

    const automotive = reactions.find((s) => s.sector_id === 'automotive');
    expect(automotive).toBeDefined();
    expect(automotive?.change_pct).toBe(-1.8);
    expect(automotive?.is_negative_for_economy).toBe(false);
  });

  // Test 6: Market Snapshot Instruments
  it('validates live market snapshot instruments have sparklines and source tags', () => {
    const instruments = FALLBACK_NEWS_ANALYTICS.market_snapshot;
    expect(instruments.length).toBe(4);

    const brent = instruments.find((i) => i.id === 'brent_crude');
    const gold = instruments.find((i) => i.id === 'gold');
    const usdinr = instruments.find((i) => i.id === 'usd_inr');
    const nifty = instruments.find((i) => i.id === 'nifty_50');

    expect(brent?.current_value).toBe(87.4);
    expect(gold?.current_value).toBe(2652.0);
    expect(usdinr?.current_value).toBe(83.1);
    expect(nifty?.current_value).toBe(24895.0);

    instruments.forEach((inst) => {
      expect(inst.sparkline.length).toBeGreaterThanOrEqual(5);
      expect(inst.source).toBeDefined();
      expect(inst.is_available).toBe(true);
    });
  });

  // Test 7: News Sentiment Mathematical Sum & Methodology
  it('verifies sentiment breakdown totals 128 articles and ~100% distribution', () => {
    const { sentiment } = FALLBACK_NEWS_ANALYTICS;
    expect(sentiment.total_analyzed).toBe(128);
    expect(sentiment.positive_count + sentiment.neutral_count + sentiment.negative_count).toBe(
      sentiment.total_analyzed
    );

    const pctSum = sentiment.positive_pct + sentiment.neutral_pct + sentiment.negative_pct;
    expect(Math.round(pctSum)).toBe(100);
    expect(sentiment.methodology_note.length).toBeGreaterThan(20);
  });

  // Test 8: Trending Topics Ranking
  it('validates trending topics are ranked 1 to 5 with article volume and growth', () => {
    const topics = FALLBACK_NEWS_ANALYTICS.trending_topics;
    expect(topics.length).toBe(5);

    topics.forEach((t, index) => {
      expect(t.rank).toBe(index + 1);
      expect(t.name).toBeDefined();
      expect(t.growth_label).toMatch(/^\+[0-9]+%/);
      expect(t.article_count_label).toBeDefined();
    });
  });

  // Test 9: News Service Client Fallback & Provenance
  it('ensures newsService gracefully returns fallback data when offline or backend unreachable', async () => {
    const res = await fetchNewsArticles('all', '');
    expect(res.articles.length).toBeGreaterThan(0);
    expect(res.categories.length).toBeGreaterThan(0);
    expect(res.provenance_note).toBeDefined();

    const analytics = await fetchNewsAnalytics();
    expect(analytics.market_snapshot.length).toBe(4);
    expect(analytics.sentiment.total_analyzed).toBe(128);
  });
});
