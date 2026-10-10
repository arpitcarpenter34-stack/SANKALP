import { describe, it, expect } from 'vitest';
import {
  GLOBAL_EVENTS_DATA,
  EVENT_CATEGORIES,
  MARKET_INSTRUMENTS_DATA,
  GLOBAL_NEWS_DATA,
} from '../eventsData';

describe('Global Events & Market Signals — Unit & Data Integrity Tests', () => {
  it('Category definitions match the 8 categories from reference design', () => {
    expect(EVENT_CATEGORIES.length).toBe(8);
    const categoryIds = EVENT_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('all');
    expect(categoryIds).toContain('geopolitics');
    expect(categoryIds).toContain('commodities');
    expect(categoryIds).toContain('economy');
    expect(categoryIds).toContain('technology');
    expect(categoryIds).toContain('trade');
    expect(categoryIds).toContain('climate');
    expect(categoryIds).toContain('finance');
  });

  it('All global events have valid ISO 8601 date stamps and data provenance tags', () => {
    GLOBAL_EVENTS_DATA.forEach((ev) => {
      expect(ev.eventDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(ev.dataSourceKind).toBe('curated_benchmark');
      expect(ev.eventDate).toBeTruthy();
      expect(ev.publisher).toBeTruthy();
      expect(ev.sourceUrl).toMatch(/^https?:\/\//);
    });
  });

  it('Ranked events are ordered 1 to 5 with accurate headlines and severities', () => {
    expect(GLOBAL_EVENTS_DATA.length).toBeGreaterThanOrEqual(5);

    const ranks = GLOBAL_EVENTS_DATA.slice(0, 5).map((e) => e.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5]);

    const top1 = GLOBAL_EVENTS_DATA.find((e) => e.rank === 1);
    expect(top1?.title).toBe('Taiwan semiconductor tensions');
    expect(top1?.severity).toBe('high');
    expect(top1?.locationName).toBe('Taiwan');
    expect(top1?.eventDateIso).toBe('2024-10-10');

    const top2 = GLOBAL_EVENTS_DATA.find((e) => e.rank === 2);
    expect(top2?.title).toBe('Crude oil prices rise');
    expect(top2?.severity).toBe('high');
    expect(top2?.eventDateIso).toBe('2024-10-09');

    const top3 = GLOBAL_EVENTS_DATA.find((e) => e.rank === 3);
    expect(top3?.title).toBe('China export restrictions');
    expect(top3?.severity).toBe('medium');
    expect(top3?.eventDateIso).toBe('2024-10-08');

    const top4 = GLOBAL_EVENTS_DATA.find((e) => e.rank === 4);
    expect(top4?.title).toBe('Red Sea shipping disruptions');
    expect(top4?.severity).toBe('medium');
    expect(top4?.eventDateIso).toBe('2024-10-06');

    const top5 = GLOBAL_EVENTS_DATA.find((e) => e.rank === 5);
    expect(top5?.title).toBe('US Fed rate outlook change');
    expect(top5?.severity).toBe('medium');
    expect(top5?.eventDateIso).toBe('2024-10-05');
  });

  it('Geographic coordinates and bounds validation for map projection', () => {
    GLOBAL_EVENTS_DATA.forEach((event) => {
      expect(event.coordinates.lat).toBeGreaterThanOrEqual(-90);
      expect(event.coordinates.lat).toBeLessThanOrEqual(90);
      expect(event.coordinates.lng).toBeGreaterThanOrEqual(-180);
      expect(event.coordinates.lng).toBeLessThanOrEqual(180);
      expect(typeof event.coordinates.lat).toBe('number');
      expect(typeof event.coordinates.lng).toBe('number');
      expect(isNaN(event.coordinates.lat)).toBe(false);
      expect(isNaN(event.coordinates.lng)).toBe(false);
    });
  });

  it('Sector impact estimates contain valid ranges and non-empty rationale', () => {
    const taiwanEvent = GLOBAL_EVENTS_DATA.find((e) => e.id === 'taiwan-semiconductors-2024');
    expect(taiwanEvent).toBeDefined();
    expect(taiwanEvent!.sectorImpacts.length).toBe(4);

    const electronics = taiwanEvent!.sectorImpacts.find((s) => s.sector === 'Electronics');
    expect(electronics?.impactRange).toBe('+8-12%');
    expect(electronics?.metricLabel).toBe('Input costs');

    const auto = taiwanEvent!.sectorImpacts.find((s) => s.sector === 'Automotive');
    expect(auto?.impactRange).toBe('+5-10%');

    const itHardware = taiwanEvent!.sectorImpacts.find((s) => s.sector === 'IT Hardware');
    expect(itHardware?.impactRange).toBe('+3-6%');

    const industrial = taiwanEvent!.sectorImpacts.find((s) => s.sector === 'Industrial');
    expect(industrial?.impactRange).toBe('+4-8%');
  });

  it('Events without sector impacts have empty array and are handled gracefully', () => {
    // Some monitoring signals may have unmodeled sector impacts
    const monitoringEvent = GLOBAL_EVENTS_DATA.find((e) => e.id === 'india-rbi-mpc-monitoring-2024');
    expect(monitoringEvent).toBeDefined();
    expect(monitoringEvent?.sectorImpacts.length).toBeLessThanOrEqual(2);
  });

  it('Market pulse instruments distinguish available supported feeds from offline feeds', () => {
    // Crude oil is supported with verified PPAC archive / backend integration
    const crude = MARKET_INSTRUMENTS_DATA['crude-oil'];
    expect(crude).toBeDefined();
    expect(crude.isAvailable).toBe(true);
    expect(crude.currentValue).toBe(82.4);
    expect(crude.unit).toBe('barrel');
    expect(crude.timeSeries.length).toBeGreaterThanOrEqual(7);
    expect(crude.dataSourceKind).toBe('curated_benchmark');

    // Brent, Natural Gas, Gold, DXY are explicitly marked unavailable
    const unsupportedInstruments = ['brent', 'natural-gas', 'gold', 'dxy'];
    unsupportedInstruments.forEach((instId) => {
      const data = MARKET_INSTRUMENTS_DATA[instId];
      expect(data).toBeDefined();
      expect(data.isAvailable).toBe(false);
      expect(data.unavailableReason).toBeTruthy();
      expect(data.dataSourceKind).toBe('unavailable');
      expect(data.timeSeries).toHaveLength(0);
    });
  });

  it('News articles have verified sources and strict cross-event identifiers', () => {
    expect(GLOBAL_NEWS_DATA.length).toBe(5);

    const chipNews = GLOBAL_NEWS_DATA.find((n) => n.id === 'news-taiwan-chips');
    expect(chipNews).toBeDefined();
    expect(chipNews?.publisher).toBe('Reuters');
    expect(chipNews?.severity).toBe('high');
    expect(chipNews?.eventDateIso).toBe('2024-10-12');
    expect(chipNews?.relatedEventId).toBe('taiwan-semiconductors-2024');

    const oilNews = GLOBAL_NEWS_DATA.find((n) => n.id === 'news-crude-oil-mideast');
    expect(oilNews?.publisher).toBe('Bloomberg');
    expect(oilNews?.relatedEventId).toBe('crude-oil-spike-2024');

    // Article without an event relationship must NOT have arbitrary relation
    const weatherNews = GLOBAL_NEWS_DATA.find((n) => n.id === 'news-food-prices-weather');
    expect(weatherNews).toBeDefined();
    expect(weatherNews?.relatedEventId).toBeUndefined();
  });

  it('Category filtering filters events accurately', () => {
    const techEvents = GLOBAL_EVENTS_DATA.filter((e) => e.category === 'technology');
    expect(techEvents.length).toBeGreaterThanOrEqual(1);
    techEvents.forEach((e) => {
      expect(e.category).toBe('technology');
    });

    const commEvents = GLOBAL_EVENTS_DATA.filter((e) => e.category === 'commodities');
    commEvents.forEach((e) => {
      expect(e.category).toBe('commodities');
    });
  });

  it('Date filtering genuinely filters events by ISO date ranges', () => {
    // 7-day range from 2024-10-05 to 2024-10-12
    const sevenDays = GLOBAL_EVENTS_DATA.filter(
      (e) => e.eventDateIso >= '2024-10-05' && e.eventDateIso <= '2024-10-12'
    );
    expect(sevenDays.length).toBeGreaterThan(0);
    // Event from Oct 04 (europe-ecb-guidance-2024) must NOT be in 7-day window
    expect(sevenDays.some((e) => e.id === 'europe-ecb-guidance-2024')).toBe(false);

    // 30-day range includes Oct 04 event
    const thirtyDays = GLOBAL_EVENTS_DATA.filter(
      (e) => e.eventDateIso >= '2024-09-12' && e.eventDateIso <= '2024-10-12'
    );
    expect(thirtyDays.some((e) => e.id === 'europe-ecb-guidance-2024')).toBe(true);

    // Narrow custom window (2024-10-09 to 2024-10-10)
    const narrow = GLOBAL_EVENTS_DATA.filter(
      (e) => e.eventDateIso >= '2024-10-09' && e.eventDateIso <= '2024-10-10'
    );
    const narrowIds = narrow.map((e) => e.id);
    expect(narrowIds).toContain('taiwan-semiconductors-2024');
    expect(narrowIds).toContain('crude-oil-spike-2024');
    expect(narrowIds).toContain('india-rbi-mpc-monitoring-2024');
    expect(narrowIds).not.toContain('us-fed-rate-outlook-2024');

    // Future or empty date window yields zero events (empty state test)
    const emptyWindow = GLOBAL_EVENTS_DATA.filter(
      (e) => e.eventDateIso >= '2025-01-01' && e.eventDateIso <= '2025-01-31'
    );
    expect(emptyWindow).toHaveLength(0);
  });
});
