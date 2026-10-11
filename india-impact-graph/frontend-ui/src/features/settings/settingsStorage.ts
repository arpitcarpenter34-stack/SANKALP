import { SettingsState, AppTheme, UserProfile } from './types';
import { DEFAULT_SETTINGS_STATE } from './settingsData';

const LEGACY_STORAGE_KEY = 'bharatimpact_settings_v1';
const USER_STORAGE_PREFIX = 'bharatimpact_settings_user_';
const GUEST_STORAGE_KEY = 'bharatimpact_settings_guest';

/**
 * Minimal interface representing authenticated Clerk user attributes
 * required for profile synchronization.
 */
export interface ClerkUserLike {
  id: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses?: Array<{ emailAddress: string }>;
  imageUrl?: string | null;
}

/**
 * Returns a user-scoped storage key to ensure profile and settings isolation
 * between different authenticated accounts and guest sessions.
 */
export function getSettingsStorageKey(userId?: string | null): string {
  if (userId && typeof userId === 'string' && userId.trim()) {
    return `${USER_STORAGE_PREFIX}${userId.trim()}`;
  }
  return GUEST_STORAGE_KEY;
}

/**
 * Safely extracts full name, primary email, and initials from a Clerk user object,
 * providing secure fallbacks without showing another account's data.
 */
export function extractClerkIdentity(user: ClerkUserLike | null | undefined): {
  fullName: string;
  email: string;
  avatarInitials: string;
} {
  if (!user) {
    return {
      fullName: 'Guest Analyst',
      email: 'guest@bharatimpact.internal',
      avatarInitials: 'GA',
    };
  }

  // 1. Primary email extraction
  const email =
    user.primaryEmailAddress?.emailAddress?.trim() ||
    user.emailAddresses?.[0]?.emailAddress?.trim() ||
    '';

  // 2. Full name extraction with fallback chain
  let fullName = user.fullName?.trim() || '';
  if (!fullName) {
    const parts = [user.firstName, user.lastName]
      .filter((p): p is string => Boolean(p && p.trim()))
      .map((p) => p.trim());
    if (parts.length > 0) {
      fullName = parts.join(' ');
    }
  }
  if (!fullName && user.username?.trim()) {
    fullName = user.username.trim();
  }
  if (!fullName && email) {
    fullName = email.split('@')[0];
  }
  if (!fullName) {
    fullName = 'Authenticated User';
  }

  // 3. Dynamic initials derivation
  const words = fullName.split(/\s+/).filter(Boolean);
  let avatarInitials = 'U';
  if (words.length >= 2) {
    avatarInitials = `${words[0][0]}${words[1][0]}`.toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    avatarInitials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1 && words[0].length === 1) {
    avatarInitials = words[0].toUpperCase();
  }

  return { fullName, email, avatarInitials };
}

/**
 * Synchronizes a UserProfile object with verified Clerk user identity.
 * Identity fields (fullName, email, avatarInitials) come strictly from Clerk,
 * while app preferences (role, location) are preserved.
 */
export function syncUserProfileWithClerk(
  currentProfile: UserProfile,
  clerkUser: ClerkUserLike | null | undefined
): UserProfile {
  if (!clerkUser) return currentProfile;
  const identity = extractClerkIdentity(clerkUser);
  return {
    ...currentProfile,
    fullName: identity.fullName,
    email: identity.email,
    avatarInitials: identity.avatarInitials,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Loads persisted settings from browser storage for a specific user ID with safe fallback.
 */
export function loadSettingsFromStorage(userId?: string | null): SettingsState {
  try {
    const key = getSettingsStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // If guest and no storage, return DEFAULT_SETTINGS_STATE
      return DEFAULT_SETTINGS_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      profile: { ...DEFAULT_SETTINGS_STATE.profile, ...parsed.profile },
      preferences: { ...DEFAULT_SETTINGS_STATE.preferences, ...parsed.preferences },
      notifications: { ...DEFAULT_SETTINGS_STATE.notifications, ...parsed.notifications },
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : DEFAULT_SETTINGS_STATE.watchlist,
      display: { ...DEFAULT_SETTINGS_STATE.display, ...parsed.display },
      integrations: { ...DEFAULT_SETTINGS_STATE.integrations, ...parsed.integrations },
    };
  } catch (err) {
    console.warn('Failed to parse settings from storage; using defaults', err);
    return DEFAULT_SETTINGS_STATE;
  }
}

/**
 * Persists complete settings state to browser storage scoped by user ID.
 */
export function saveSettingsToStorage(state: SettingsState, userId?: string | null): void {
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving settings to storage', err);
  }
}

/**
 * Applies visual theme to application document element.
 */
export function applyTheme(theme: AppTheme): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;

  if (theme === 'system') {
    const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

/**
 * Triggers an authentic client-side download of user configuration data.
 */
export function downloadUserDataExport(state: SettingsState): void {
  const dataPayload = {
    exportVersion: '1.0',
    exportDate: new Date().toISOString(),
    system: 'BharatImpact Autonomous Financial Event Market Impact Graph',
    userProfile: {
      fullName: state.profile.fullName,
      email: state.profile.email,
      role: state.profile.role,
      location: state.profile.location,
    },
    dashboardPreferences: state.preferences,
    notificationPreferences: state.notifications,
    activeWatchlist: state.watchlist.filter((w) => w.isSelected),
    displayPreferences: state.display,
    disclaimer:
      'Data is exported strictly from your local client browser session. BharatImpact stores zero unauthorized remote telemetry.',
  };

  const blob = new Blob([JSON.stringify(dataPayload, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bharatimpact_user_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Resets user settings back to initial defaults and clears user-scoped storage.
 */
export function clearUserSettings(userId?: string | null): SettingsState {
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.removeItem(key);
    // Also clean legacy un-namespaced key if it exists
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing settings storage', err);
  }
  applyTheme(DEFAULT_SETTINGS_STATE.display.theme);
  return DEFAULT_SETTINGS_STATE;
}
