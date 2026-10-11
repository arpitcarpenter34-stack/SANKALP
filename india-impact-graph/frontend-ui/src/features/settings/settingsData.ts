import {
  UserProfile,
  DashboardPreferences,
  NotificationPreferences,
  WatchlistItem,
  DisplayPreferences,
  ApiIntegrationsState,
  SettingsState,
} from './types';

export const INITIAL_USER_PROFILE: UserProfile = {
  fullName: 'Aarav Sharma',
  email: 'aarav.sharma@example.com',
  role: 'individual_household',
  location: 'New Delhi, Delhi',
  avatarInitials: 'A',
};

export const ROLE_OPTIONS = [
  { value: 'individual_household', label: 'Individual / Household' },
  { value: 'financial_analyst', label: 'Financial Analyst / Investor' },
  { value: 'business_owner', label: 'Business Owner / MSME' },
  { value: 'policy_researcher', label: 'Policy Researcher / Economist' },
];

export const LOCATION_OPTIONS = [
  { value: 'New Delhi, Delhi', label: 'New Delhi, Delhi' },
  { value: 'Mumbai, Maharashtra', label: 'Mumbai, Maharashtra' },
  { value: 'Bengaluru, Karnataka', label: 'Bengaluru, Karnataka' },
  { value: 'Hyderabad, Telangana', label: 'Hyderabad, Telangana' },
  { value: 'Chennai, Tamil Nadu', label: 'Chennai, Tamil Nadu' },
  { value: 'Kolkata, West Bengal', label: 'Kolkata, West Bengal' },
  { value: 'Indore, Madhya Pradesh', label: 'Indore, Madhya Pradesh' },
  { value: 'Pune, Maharashtra', label: 'Pune, Maharashtra' },
  { value: 'Ahmedabad, Gujarat', label: 'Ahmedabad, Gujarat' },
];

export const INITIAL_DASHBOARD_PREFERENCES: DashboardPreferences = {
  defaultView: 'overview',
  defaultTimePeriod: '6m',
  defaultLocation: 'India (All States)',
  preferredCurrency: 'INR',
  language: 'en',
};

export const TIME_PERIOD_OPTIONS = [
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last 1 Year' },
  { value: 'all', label: 'All Time' },
];

export const REGION_SCOPE_OPTIONS = [
  { value: 'India (All States)', label: 'India (All States)' },
  { value: 'Urban India', label: 'Urban India' },
  { value: 'Rural India', label: 'Rural India' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi NCR', label: 'Delhi NCR' },
  { value: 'Karnataka', label: 'Karnataka' },
];

export const INITIAL_NOTIFICATIONS: NotificationPreferences = {
  globalEventAlerts: true,
  sectorSpecificAlerts: true,
  householdImpactAlerts: true,
  sipInvestmentAlerts: false, // Match screenshot (OFF)
  weeklySummary: true,
  productUpdates: true,
};

export const INITIAL_WATCHLIST_ITEMS: WatchlistItem[] = [
  // Sectors
  { id: 'sec_energy', name: 'Energy', icon: '⚡', category: 'sectors', isSelected: true },
  { id: 'sec_auto', name: 'Automotive', icon: '🚗', category: 'sectors', isSelected: false },
  { id: 'sec_it', name: 'IT & Services', icon: '💻', category: 'sectors', isSelected: false },
  { id: 'sec_fmcg', name: 'FMCG', icon: '🛒', category: 'sectors', isSelected: false },
  { id: 'sec_pharma', name: 'Pharmaceuticals', icon: '💊', category: 'sectors', isSelected: false },
  { id: 'sec_metals', name: 'Metals & Mining', icon: '⛏️', category: 'sectors', isSelected: false },
  { id: 'sec_banking', name: 'Banking & Finance', icon: '🏦', category: 'sectors', isSelected: true },
  { id: 'sec_infra', name: 'Infrastructure', icon: '🏗️', category: 'sectors', isSelected: false },
  { id: 'sec_aviation', name: 'Aviation', icon: '✈️', category: 'sectors', isSelected: false },
  { id: 'sec_agri', name: 'Agriculture', icon: '🌾', category: 'sectors', isSelected: false },
  { id: 'sec_chemicals', name: 'Chemicals', icon: '⚗️', category: 'sectors', isSelected: false },
  { id: 'sec_telecom', name: 'Telecom', icon: '📡', category: 'sectors', isSelected: false },
  { id: 'sec_realestate', name: 'Real Estate', icon: '🏢', category: 'sectors', isSelected: false },
  { id: 'sec_ecommerce', name: 'E-commerce', icon: '📦', category: 'sectors', isSelected: false },
  { id: 'sec_textiles', name: 'Textiles', icon: '👕', category: 'sectors', isSelected: false },

  // Commodities
  { id: 'com_crude', name: 'Crude Oil', icon: '🛢️', category: 'commodities', isSelected: true },
  { id: 'com_diesel', name: 'Diesel', icon: '⛽', category: 'commodities', isSelected: true },
  { id: 'com_palmoil', name: 'Palm Oil', icon: '🌴', category: 'commodities', isSelected: false },
  { id: 'com_wheat', name: 'Wheat', icon: '🌾', category: 'commodities', isSelected: true },
  { id: 'com_gas', name: 'Natural Gas', icon: '🔥', category: 'commodities', isSelected: false },
  { id: 'com_gold', name: 'Gold', icon: '🥇', category: 'commodities', isSelected: false },
  { id: 'com_steel', name: 'Steel', icon: '🔩', category: 'commodities', isSelected: false },
  { id: 'com_fertilizer', name: 'Fertilizers', icon: '🧪', category: 'commodities', isSelected: false },

  // Topics
  { id: 'top_cad', name: 'Current Account Deficit', icon: '📉', category: 'topics', isSelected: true },
  { id: 'top_inflation', name: 'Food & Fuel Inflation', icon: '🥦', category: 'topics', isSelected: true },
  { id: 'top_repo', name: 'RBI Repo Rate', icon: '🏛️', category: 'topics', isSelected: false },
  { id: 'top_monsoon', name: 'Monsoon Deficit', icon: '🌧️', category: 'topics', isSelected: false },
  { id: 'top_supply', name: 'Global Supply Chains', icon: '🚢', category: 'topics', isSelected: false },
  { id: 'top_budget', name: 'Union Budget Outlays', icon: '📑', category: 'topics', isSelected: false },
];

export const INITIAL_DISPLAY_PREFERENCES: DisplayPreferences = {
  theme: 'light',
  chartStyle: 'line',
  tableDensity: 'compact',
};

export const INITIAL_INTEGRATIONS_STATE: ApiIntegrationsState = {
  hasApiKey: false,
  maskedApiKey: 'bi_live_••••••••••••94b2',
  defaultExportFormat: 'csv',
};

export const DEFAULT_SETTINGS_STATE: SettingsState = {
  profile: INITIAL_USER_PROFILE,
  preferences: INITIAL_DASHBOARD_PREFERENCES,
  notifications: INITIAL_NOTIFICATIONS,
  watchlist: INITIAL_WATCHLIST_ITEMS,
  display: INITIAL_DISPLAY_PREFERENCES,
  integrations: INITIAL_INTEGRATIONS_STATE,
};
