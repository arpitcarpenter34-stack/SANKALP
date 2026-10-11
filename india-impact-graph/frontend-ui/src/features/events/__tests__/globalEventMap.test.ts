import { describe, it, expect } from 'vitest';
import { getMarkerColor, createPopupHtml } from '../GlobalEventMap';
import { GLOBAL_EVENTS_DATA } from '../eventsData';
import { GlobalEventRecord } from '../types';

describe('GlobalEventMap Geographic Visualization & Coordinate Integrity Tests', () => {
  describe('1. Impact Severity Color Mapping', () => {
    it('maps high impact events to red #EF4444', () => {
      expect(getMarkerColor('high')).toBe('#EF4444');
    });

    it('maps medium impact events to orange #F97316', () => {
      expect(getMarkerColor('medium')).toBe('#F97316');
    });

    it('maps low impact events to yellow #EAB308', () => {
      expect(getMarkerColor('low')).toBe('#EAB308');
    });

    it('maps monitoring events to emerald green #10B981', () => {
      expect(getMarkerColor('monitoring')).toBe('#10B981');
    });
  });

  describe('2. Event Popup Callout Content Generation', () => {
    it('generates callout markup with location, title, severity label, and date', () => {
      const fedEvent = GLOBAL_EVENTS_DATA.find((e) => e.locationName === 'Washington D.C.')!;
      expect(fedEvent).toBeDefined();

      const html = createPopupHtml(fedEvent);
      expect(html).toContain('Washington D.C.');
      expect(html).toContain('US Fed rate outlook change');
      expect(html).toContain('Medium Impact');
      expect(html).toContain('Oct 05, 2024');
    });

    it('escapes special characters to prevent HTML injection in popups', () => {
      const xssEvent: GlobalEventRecord = {
        ...GLOBAL_EVENTS_DATA[0],
        title: '<script>alert("xss")</script>',
        locationName: '<b>Dangerous Place</b>',
      };

      const html = createPopupHtml(xssEvent);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<b>Dangerous Place</b>');
      expect(html).toContain('&lt;b&gt;Dangerous Place&lt;/b&gt;');
    });
  });

  describe('3. Real World Geographic Coordinates Verification', () => {
    it('verifies all events have authentic North/South latitude and East/West longitude', () => {
      GLOBAL_EVENTS_DATA.forEach((ev) => {
        expect(typeof ev.coordinates.lat).toBe('number');
        expect(typeof ev.coordinates.lng).toBe('number');
        expect(isNaN(ev.coordinates.lat)).toBe(false);
        expect(isNaN(ev.coordinates.lng)).toBe(false);

        // Latitude [-90, +90]
        expect(ev.coordinates.lat).toBeGreaterThanOrEqual(-90);
        expect(ev.coordinates.lat).toBeLessThanOrEqual(90);

        // Longitude [-180, +180]
        expect(ev.coordinates.lng).toBeGreaterThanOrEqual(-180);
        expect(ev.coordinates.lng).toBeLessThanOrEqual(180);
      });
    });

    it('verifies Washington D.C. matches actual coordinates in the Western hemisphere', () => {
      const fedEvent = GLOBAL_EVENTS_DATA.find((e) => e.locationName === 'Washington D.C.');
      expect(fedEvent).toBeDefined();
      expect(fedEvent!.coordinates.lat).toBeCloseTo(38.9, 1);
      expect(fedEvent!.coordinates.lng).toBeCloseTo(-77.03, 1);
      // North America latitude is positive, longitude is negative
      expect(fedEvent!.coordinates.lat).toBeGreaterThan(0);
      expect(fedEvent!.coordinates.lng).toBeLessThan(0);
    });

    it('verifies Taiwan matches actual coordinates in East Asia', () => {
      const taiwanEvent = GLOBAL_EVENTS_DATA.find((e) => e.locationName === 'Taiwan');
      expect(taiwanEvent).toBeDefined();
      expect(taiwanEvent!.coordinates.lat).toBeCloseTo(23.69, 1);
      expect(taiwanEvent!.coordinates.lng).toBeCloseTo(120.96, 1);
      expect(taiwanEvent!.coordinates.lat).toBeGreaterThan(0);
      expect(taiwanEvent!.coordinates.lng).toBeGreaterThan(0);
    });

    it('verifies Strait of Hormuz matches actual coordinates in the Middle East', () => {
      const hormuzEvent = GLOBAL_EVENTS_DATA.find((e) => e.locationName === 'Strait of Hormuz');
      expect(hormuzEvent).toBeDefined();
      expect(hormuzEvent!.coordinates.lat).toBeCloseTo(26.56, 1);
      expect(hormuzEvent!.coordinates.lng).toBeCloseTo(56.25, 1);
    });
  });
});
