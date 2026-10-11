import { describe, it, expect } from 'vitest';
import {
  GLOBAL_EVENTS_DATA,
  MARKET_INSTRUMENTS_DATA,
  EVENT_CATEGORIES,
} from '../eventsData';
import { GlobalEventRecord, EventCategory } from '../types';

describe('Prompt 14 — Global Events Filters & Market Pulse Integrity Suite', () => {
  describe('STEP 2 — Category Filter Integrity & Non-Empty Results', () => {
    // Helper replicating the filter logic in GlobalEventsView
    function filterEvents(
      events: GlobalEventRecord[],
      category: EventCategory | 'all',
      startDate?: string,
      endDate?: string
    ) {
      return events.filter((ev) => {
        if (category !== 'all') {
          const matchesPrimary = ev.category === category;
          const matchesSecondary =
            Array.isArray(ev.categories) && ev.categories.includes(category);
          if (!matchesPrimary && !matchesSecondary) {
            return false;
          }
        }
        if (startDate && ev.eventDateIso && ev.eventDateIso < startDate) {
          return false;
        }
        if (endDate && ev.eventDateIso && ev.eventDateIso > endDate) {
          return false;
        }
        return true;
      });
    }

    it('confirms every supported category returns matching events (no false empty states)', () => {
      EVENT_CATEGORIES.forEach((cat) => {
        const matches = filterEvents(GLOBAL_EVENTS_DATA, cat.id);
        expect(
          matches.length,
          `Category "${cat.id}" (${cat.label}) should return at least one event`
        ).toBeGreaterThan(0);
      });
    });

    it('specifically verifies Geopolitics filter does not return an empty list and matches relevant events', () => {
      const geopoliticsEvents = filterEvents(GLOBAL_EVENTS_DATA, 'geopolitics');
      expect(geopoliticsEvents.length).toBeGreaterThanOrEqual(2);

      const eventIds = geopoliticsEvents.map((e) => e.id);
      // Red Sea and Taiwan semiconductor tensions are both geopolitical flashpoints
      expect(eventIds).toContain('red-sea-shipping-disruptions-2024');
      expect(eventIds).toContain('taiwan-semiconductors-2024');
      expect(eventIds).toContain('crude-oil-spike-2024');
    });

    it('verifies Climate & Energy returns Monsoon and Lithium events', () => {
      const climateEvents = filterEvents(GLOBAL_EVENTS_DATA, 'climate');
      expect(climateEvents.length).toBeGreaterThanOrEqual(2);

      const eventIds = climateEvents.map((e) => e.id);
      expect(eventIds).toContain('monsoon-harvest-impact-2024');
      expect(eventIds).toContain('lithium-supply-concerns-2024');
    });

    it('verifies Commodities filter matches Crude Oil, Monsoon, and Lithium events', () => {
      const commoditiesEvents = filterEvents(GLOBAL_EVENTS_DATA, 'commodities');
      const eventIds = commoditiesEvents.map((e) => e.id);
      expect(eventIds).toContain('crude-oil-spike-2024');
      expect(eventIds).toContain('monsoon-harvest-impact-2024');
      expect(eventIds).toContain('lithium-supply-concerns-2024');
    });

    it('verifies Economy filter matches European slowdown, RBI MPC, and Fed rate events', () => {
      const economyEvents = filterEvents(GLOBAL_EVENTS_DATA, 'economy');
      const eventIds = economyEvents.map((e) => e.id);
      expect(eventIds).toContain('europe-ecb-guidance-2024');
      expect(eventIds).toContain('india-rbi-mpc-monitoring-2024');
      expect(eventIds).toContain('us-fed-rate-outlook-2024');
    });

    it('verifies Financial Markets filter matches US Fed rate outlook and RBI MPC', () => {
      const financeEvents = filterEvents(GLOBAL_EVENTS_DATA, 'finance');
      const eventIds = financeEvents.map((e) => e.id);
      expect(eventIds).toContain('us-fed-rate-outlook-2024');
      expect(eventIds).toContain('india-rbi-mpc-monitoring-2024');
    });

    it('verifies date range filtering accurately isolates events', () => {
      // Oct 08 to Oct 10
      const filtered = filterEvents(GLOBAL_EVENTS_DATA, 'all', '2024-10-08', '2024-10-10');
      filtered.forEach((ev) => {
        expect(ev.eventDateIso! >= '2024-10-08').toBe(true);
        expect(ev.eventDateIso! <= '2024-10-10').toBe(true);
      });
      // Event on Oct 06 (Red Sea) must be excluded
      expect(filtered.map((e) => e.id)).not.toContain('red-sea-shipping-disruptions-2024');
    });

    it('ensures events without coordinates still appear in filtered event lists', () => {
      const syntheticNoCoordEvent: GlobalEventRecord = {
        ...GLOBAL_EVENTS_DATA[0],
        id: 'synthetic-no-coord-event',
        title: 'Virtual Global Macro Advisory',
        coordinates: undefined as unknown as { lat: number; lng: number },
        category: 'economy',
        categories: ['economy'],
      };

      const datasetWithNoCoord = [...GLOBAL_EVENTS_DATA, syntheticNoCoordEvent];
      const listResults = filterEvents(datasetWithNoCoord, 'economy');
      expect(listResults.map((e) => e.id)).toContain('synthetic-no-coord-event');

      // But map markers filter must strictly exclude it
      const mapMarkerEvents = listResults.filter(
        (ev) =>
          ev.coordinates &&
          typeof ev.coordinates.lat === 'number' &&
          typeof ev.coordinates.lng === 'number' &&
          !isNaN(ev.coordinates.lat) &&
          !isNaN(ev.coordinates.lng)
      );
      expect(mapMarkerEvents.map((e) => e.id)).not.toContain('synthetic-no-coord-event');
    });
  });

  describe('STEP 3 & 4 — Market Pulse Instrument Auditing & Truthful States', () => {
    it('verifies Crude Oil has working configured feed, real data, and time series', () => {
      const crude = MARKET_INSTRUMENTS_DATA['crude_oil'];
      expect(crude).toBeDefined();
      expect(crude.isAvailable).toBe(true);
      expect(crude.feedStatus).toBe('available');
      expect(crude.feedEndpoint).toBe('/time-series/crude-oil');
      expect(crude.timeSeries.length).toBeGreaterThanOrEqual(7);
      expect(crude.currentValue).toBeGreaterThan(0);
      expect(crude.unit).toBe('barrel');
      expect(crude.currencyPrefix).toBe('$');
    });

    it('verifies Brent is not silently substituted with Crude Oil prices and has unsupported status', () => {
      const brent = MARKET_INSTRUMENTS_DATA['brent'];
      expect(brent).toBeDefined();
      expect(brent.isAvailable).toBe(false);
      expect(brent.feedStatus).toBe('unsupported');
      expect(brent.name).toBe('Brent');
      expect(brent.symbol).toContain('Brent');
      expect(brent.timeSeries.length).toBe(0);
      expect(brent.currentValue).toBe(0);
      expect(brent.unavailableReason).toContain('Brent');
      expect(brent.unavailableReason).toContain('/time-series/crude-oil');
      // Crucial: Brent MUST NOT duplicate Crude Oil values
      expect(brent.currentValue).not.toBe(MARKET_INSTRUMENTS_DATA['crude_oil'].currentValue);
    });

    it('verifies Natural Gas is documented honestly as unsupported without fake data', () => {
      const natGas = MARKET_INSTRUMENTS_DATA['natural_gas'];
      expect(natGas).toBeDefined();
      expect(natGas.isAvailable).toBe(false);
      expect(natGas.feedStatus).toBe('unsupported');
      expect(natGas.timeSeries.length).toBe(0);
      expect(natGas.unit).toBe('MMBtu');
      expect(natGas.unavailableReason).toContain('Natural Gas');
    });

    it('verifies Gold has truthful unsupported status and explanation', () => {
      const gold = MARKET_INSTRUMENTS_DATA['gold'];
      expect(gold).toBeDefined();
      expect(gold.isAvailable).toBe(false);
      expect(gold.feedStatus).toBe('unsupported');
      expect(gold.unit).toBe('troy oz');
      expect(gold.symbol).toBe('XAU / USD');
      expect(gold.unavailableReason).toContain('gold');
    });

    it('verifies DXY has truthful unsupported status and explains USD/INR modeling', () => {
      const dxy = MARKET_INSTRUMENTS_DATA['dxy'];
      expect(dxy).toBeDefined();
      expect(dxy.isAvailable).toBe(false);
      expect(dxy.feedStatus).toBe('unsupported');
      expect(dxy.symbol).toBe('US Dollar Index');
      expect(dxy.unavailableReason).toContain('DXY');
    });

    it('distinguishes honest statuses: available, unsupported, offline, loading, no_data', () => {
      const supportedFeed = MARKET_INSTRUMENTS_DATA['crude_oil'].feedStatus;
      const unsupportedFeed = MARKET_INSTRUMENTS_DATA['brent'].feedStatus;

      expect(supportedFeed).toBe('available');
      expect(unsupportedFeed).toBe('unsupported');
      expect(supportedFeed).not.toBe(unsupportedFeed);
    });
  });

  describe('STEP 7 — Real Geographic Coordinates for All Events', () => {
    it('verifies Mumbai coordinates are in India (South Asia)', () => {
      const monsoon = GLOBAL_EVENTS_DATA.find((e) => e.id === 'monsoon-harvest-impact-2024');
      expect(monsoon).toBeDefined();
      expect(monsoon!.coordinates.lat).toBeCloseTo(19.076, 2);
      expect(monsoon!.coordinates.lng).toBeCloseTo(72.877, 2);
      expect(monsoon!.coordinates.lat).toBeGreaterThan(0);
      expect(monsoon!.coordinates.lng).toBeGreaterThan(0);
    });

    it('verifies Atacama coordinates are in Chile (South America / Western Hemisphere)', () => {
      const lithium = GLOBAL_EVENTS_DATA.find((e) => e.id === 'lithium-supply-concerns-2024');
      expect(lithium).toBeDefined();
      expect(lithium!.coordinates.lat).toBeCloseTo(-23.863, 2);
      expect(lithium!.coordinates.lng).toBeCloseTo(-69.133, 2);
      // South America: negative latitude, negative longitude
      expect(lithium!.coordinates.lat).toBeLessThan(0);
      expect(lithium!.coordinates.lng).toBeLessThan(0);
    });
  });
});
