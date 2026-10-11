/**
 * Type definitions for BharatImpact Settings Dashboard.
 * Covers user profile, preferences, notifications, watchlists, display, and integrations.
 */

export type SettingsTabId =
  | 'profile'
  | 'preferences'
  | 'notifications'
  | 'privacy'
  | 'display'
  | 'watchlist'
  | 'api';

export type UserRoleType =
  | 'individual_household'
  | 'financial_analyst'
  | 'business_owner'
  | 'policy_researcher';

export interface UserProfile {
  fullName: string;
  email: string;
  role: UserRoleType;
  location: string;
  avatarInitials: string;
  updatedAt?: string;
}

export type DefaultViewType = 'overview' | 'sectors' | 'household-impact' | 'sip-forecasts';

export type DefaultTimePeriod = '6m' | '3m' | '1y' | 'all';

export type PreferredCurrency = 'INR' | 'USD';

export type InterfaceLanguage = 'en' | 'hi';

export interface DashboardPreferences {
  defaultView: DefaultViewType;
  defaultTimePeriod: DefaultTimePeriod;
  defaultLocation: string;
  preferredCurrency: PreferredCurrency;
  language: InterfaceLanguage;
}

export interface NotificationPreferences {
  globalEventAlerts: boolean;
  sectorSpecificAlerts: boolean;
  householdImpactAlerts: boolean;
  sipInvestmentAlerts: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
}

export type WatchlistSubTab = 'sectors' | 'commodities' | 'topics';

export interface WatchlistItem {
  id: string;
  name: string;
  icon: string;
  category: WatchlistSubTab;
  isSelected: boolean;
}

export type AppTheme = 'light' | 'dark' | 'system';

export type ChartStyleType = 'line' | 'bar' | 'area';

export type TableDensityType = 'compact' | 'comfortable' | 'spacious';

export interface DisplayPreferences {
  theme: AppTheme;
  chartStyle: ChartStyleType;
  tableDensity: TableDensityType;
}

export type ExportFormat = 'csv' | 'json' | 'markdown';

export interface ApiIntegrationsState {
  hasApiKey: boolean;
  maskedApiKey: string;
  createdAt?: string;
  defaultExportFormat: ExportFormat;
}

export interface PlanFeature {
  name: string;
  isIncluded: boolean;
}

export interface SettingsState {
  profile: UserProfile;
  preferences: DashboardPreferences;
  notifications: NotificationPreferences;
  watchlist: WatchlistItem[];
  display: DisplayPreferences;
  integrations: ApiIntegrationsState;
}
