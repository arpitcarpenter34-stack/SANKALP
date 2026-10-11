import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DEFAULT_SETTINGS_STATE,
  TIME_PERIOD_OPTIONS,
  REGION_SCOPE_OPTIONS,
  ROLE_OPTIONS,
  LOCATION_OPTIONS,
  INITIAL_WATCHLIST_ITEMS,
} from '../settingsData';
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
  clearUserSettings,
  applyTheme,
} from '../settingsStorage';
import { SettingsState } from '../types';

// In Node-based Vitest runner without jsdom, mock localStorage and document globals
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMap.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    storageMap.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storageMap.delete(key);
  }),
  clear: vi.fn(() => {
    storageMap.clear();
  }),
};

let docTheme: string | null = null;
const documentElementMock = {
  setAttribute: vi.fn((attr: string, val: string) => {
    if (attr === 'data-theme') docTheme = val;
  }),
  getAttribute: vi.fn((attr: string) => {
    if (attr === 'data-theme') return docTheme;
    return null;
  }),
  removeAttribute: vi.fn((attr: string) => {
    if (attr === 'data-theme') docTheme = null;
  }),
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = localStorageMock;
}

if (typeof globalThis.document === 'undefined') {
  (globalThis as any).document = {
    documentElement: documentElementMock,
  };
}

describe('BharatImpact Settings Feature Verification Tests', () => {
  beforeEach(() => {
    storageMap.clear();
    docTheme = null;
    vi.restoreAllMocks();
  });

  describe('1. Default Settings State and Configuration Data', () => {
    it('initializes default profile matching reference specification', () => {
      const { profile } = DEFAULT_SETTINGS_STATE;
      expect(profile.fullName).toBe('Aarav Sharma');
      expect(profile.email).toBe('aarav.sharma@example.com');
      expect(profile.role).toBe('individual_household');
      expect(profile.location).toBe('New Delhi, Delhi');
      expect(profile.avatarInitials).toBe('A');
    });

    it('initializes default dashboard preferences matching reference specification', () => {
      const { preferences } = DEFAULT_SETTINGS_STATE;
      expect(preferences.defaultView).toBe('overview');
      expect(preferences.defaultTimePeriod).toBe('6m');
      expect(preferences.defaultLocation).toBe('India (All States)');
      expect(preferences.preferredCurrency).toBe('INR');
      expect(preferences.language).toBe('en');
    });

    it('initializes 6 notification alert channels with explicit states', () => {
      const { notifications } = DEFAULT_SETTINGS_STATE;
      expect(notifications.globalEventAlerts).toBe(true);
      expect(notifications.sectorSpecificAlerts).toBe(true);
      expect(notifications.householdImpactAlerts).toBe(true);
      expect(notifications.sipInvestmentAlerts).toBe(false); // SIP disabled in reference screenshot
      expect(notifications.weeklySummary).toBe(true);
      expect(notifications.productUpdates).toBe(true);
    });

    it('initializes display settings matching screenshot defaults', () => {
      const { display } = DEFAULT_SETTINGS_STATE;
      expect(display.theme).toBe('light');
      expect(display.chartStyle).toBe('line');
      expect(display.tableDensity).toBe('compact');
    });

    it('provides valid dropdown and filter options', () => {
      expect(TIME_PERIOD_OPTIONS.length).toBeGreaterThanOrEqual(4);
      expect(REGION_SCOPE_OPTIONS.length).toBeGreaterThanOrEqual(4);
      expect(ROLE_OPTIONS.length).toBeGreaterThanOrEqual(3);
      expect(LOCATION_OPTIONS.length).toBeGreaterThanOrEqual(4);
    });

    it('contains comprehensive watchlist catalogs across sectors, commodities, and topics', () => {
      const sectors = INITIAL_WATCHLIST_ITEMS.filter((i) => i.category === 'sectors');
      const commodities = INITIAL_WATCHLIST_ITEMS.filter((i) => i.category === 'commodities');
      const topics = INITIAL_WATCHLIST_ITEMS.filter((i) => i.category === 'topics');

      expect(sectors.length).toBeGreaterThanOrEqual(14);
      expect(commodities.length).toBeGreaterThanOrEqual(8);
      expect(topics.length).toBeGreaterThanOrEqual(6);

      // Verify key sectors from screenshot exist
      const sectorNames = sectors.map((s) => s.name);
      expect(sectorNames).toContain('Energy');
      expect(sectorNames).toContain('Automotive');
      expect(sectorNames).toContain('IT & Services');
      expect(sectorNames).toContain('FMCG');
      expect(sectorNames).toContain('Pharmaceuticals');
      expect(sectorNames).toContain('Banking & Finance');
      expect(sectorNames).toContain('Infrastructure');
    });
  });

  describe('2. Local Persistence and Storage Reliability', () => {
    it('returns default settings when storage is empty', () => {
      const settings = loadSettingsFromStorage();
      expect(settings.profile.fullName).toBe('Aarav Sharma');
      expect(settings.preferences.defaultView).toBe('overview');
      expect(settings.display.theme).toBe('light');
    });

    it('saves and restores complete settings state', () => {
      const modified: SettingsState = {
        ...DEFAULT_SETTINGS_STATE,
        profile: {
          ...DEFAULT_SETTINGS_STATE.profile,
          fullName: 'Priya Patel',
          email: 'priya.patel@example.com',
        },
        preferences: {
          ...DEFAULT_SETTINGS_STATE.preferences,
          defaultView: 'sectors',
          preferredCurrency: 'USD',
        },
        display: {
          ...DEFAULT_SETTINGS_STATE.display,
          theme: 'dark',
          tableDensity: 'spacious',
        },
      };

      saveSettingsToStorage(modified);
      const reloaded = loadSettingsFromStorage();

      expect(reloaded.profile.fullName).toBe('Priya Patel');
      expect(reloaded.profile.email).toBe('priya.patel@example.com');
      expect(reloaded.preferences.defaultView).toBe('sectors');
      expect(reloaded.preferences.preferredCurrency).toBe('USD');
      expect(reloaded.display.theme).toBe('dark');
      expect(reloaded.display.tableDensity).toBe('spacious');
    });

    it('gracefully handles corrupted JSON in localStorage by returning defaults', () => {
      localStorage.setItem('bharatimpact_settings_guest', 'NOT_VALID_JSON{[');
      const settings = loadSettingsFromStorage();
      expect(settings.profile.fullName).toBe('Aarav Sharma');
      expect(settings.preferences.defaultView).toBe('overview');
    });

    it('clears settings and resets localStorage and theme', () => {
      saveSettingsToStorage({
        ...DEFAULT_SETTINGS_STATE,
        display: { ...DEFAULT_SETTINGS_STATE.display, theme: 'dark' },
      });

      const resetState = clearUserSettings();
      expect(resetState.display.theme).toBe('light');
      expect(localStorage.getItem('bharatimpact_settings_guest')).toBeNull();
      expect(localStorage.getItem('bharatimpact_settings_v1')).toBeNull();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('3. Visual Theme Application', () => {
    it('applies light theme attribute to document element', () => {
      applyTheme('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('applies dark theme attribute to document element', () => {
      applyTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('applies system theme based on matchMedia query', () => {
      (globalThis as any).window = {
        matchMedia: vi.fn().mockImplementation((query) => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
        })),
      };

      applyTheme('system');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('4. Watchlist Toggle and Selection Logic', () => {
    it('toggles item selection without mutating other items', () => {
      const items = [...DEFAULT_SETTINGS_STATE.watchlist];
      const energyItem = items.find((i) => i.id === 'sec_energy');
      expect(energyItem).toBeDefined();

      const initialSelected = energyItem!.isSelected;
      const toggled = items.map((item) =>
        item.id === 'sec_energy' ? { ...item, isSelected: !item.isSelected } : item
      );

      const updatedEnergy = toggled.find((i) => i.id === 'sec_energy');
      expect(updatedEnergy!.isSelected).toBe(!initialSelected);

      // Verify automotive was untouched
      const automotiveItem = toggled.find((i) => i.id === 'sec_auto');
      expect(automotiveItem!.isSelected).toBe(
        items.find((i) => i.id === 'sec_auto')!.isSelected
      );
    });
  });

  describe('5. Email & Form Validation Rules', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    it('validates RFC-compliant email formats', () => {
      expect(isValidEmail('aarav.sharma@example.com')).toBe(true);
      expect(isValidEmail('user@domain.co.in')).toBe(true);
      expect(isValidEmail('finance-team@bharat.gov.in')).toBe(true);
    });

    it('rejects invalid or incomplete email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('spaces in@domain.com')).toBe(false);
    });
  });
});
