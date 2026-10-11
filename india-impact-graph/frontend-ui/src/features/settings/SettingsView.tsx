import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/react';
import {
  SettingsTabId,
  SettingsState,
  UserProfile,
  DashboardPreferences,
  NotificationPreferences,
  DisplayPreferences,
  ApiIntegrationsState,
} from './types';
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
  applyTheme,
  downloadUserDataExport,
  clearUserSettings,
  syncUserProfileWithClerk,
  extractClerkIdentity,
  ClerkUserLike,
} from './settingsStorage';
import { SettingsHeader } from './SettingsHeader';
import { ProfileAccountCard } from './ProfileAccountCard';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { DashboardPreferencesCard } from './DashboardPreferencesCard';
import { NotificationSettingsCard } from './NotificationSettingsCard';
import { WatchlistInterestsCard } from './WatchlistInterestsCard';
import { DataPrivacyCard } from './DataPrivacyCard';
import { DisplaySettingsCard } from './DisplaySettingsCard';
import { ApiIntegrationsCard } from './ApiIntegrationsCard';
import styles from './SettingsView.module.css';

const isClerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

interface ClerkSettingsBridgeProps {
  onSync: (user: ClerkUserLike | null, isLoaded: boolean) => void;
  setUpdateClerkName: (fn: ((fullName: string) => Promise<void>) | null) => void;
}

/**
 * Isolated bridge component to interact with Clerk React hooks.
 * Only mounted when Clerk publishable key is present and no override is injected.
 */
const ClerkSettingsBridge: React.FC<ClerkSettingsBridgeProps> = ({
  onSync,
  setUpdateClerkName,
}) => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    onSync(user ?? null, Boolean(isLoaded));
  }, [user, isLoaded, onSync]);

  useEffect(() => {
    if (!user) {
      setUpdateClerkName(null);
      return;
    }

    setUpdateClerkName(async (fullName: string) => {
      const trimmed = fullName.trim();
      const parts = trimmed.split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      await user.update({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
    });
  }, [user, setUpdateClerkName]);

  return null;
};

export interface SettingsViewProps {
  onNavigateSection?: (sectionId: string) => void;
  currentUser?: ClerkUserLike | null;
  isUserLoaded?: boolean;
  onUpdateUser?: (fullName: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigateSection,
  currentUser,
  isUserLoaded,
  onUpdateUser,
}) => {
  const [activeUser, setActiveUser] = useState<ClerkUserLike | null>(currentUser ?? null);
  const [isAuthLoaded, setIsAuthLoaded] = useState<boolean>(
    currentUser !== undefined ? (isUserLoaded ?? true) : !isClerkConfigured
  );
  const [settings, setSettings] = useState<SettingsState>(() => loadSettingsFromStorage(currentUser?.id));
  const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [saveProfileError, setSaveProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const updateClerkNameRef = useRef<((fullName: string) => Promise<void>) | null>(
    onUpdateUser ?? null
  );

  const handleClerkSync = useCallback((user: ClerkUserLike | null, loaded: boolean) => {
    setActiveUser(user);
    setIsAuthLoaded(loaded);
  }, []);

  const handleSetUpdateClerkName = useCallback(
    (fn: ((fullName: string) => Promise<void>) | null) => {
      if (!onUpdateUser) {
        updateClerkNameRef.current = fn;
      }
    },
    [onUpdateUser]
  );

  // Synchronize settings state whenever authenticated user changes or finishes loading
  useEffect(() => {
    if (!isAuthLoaded) return;

    const targetUserId = activeUser?.id;
    const loaded = loadSettingsFromStorage(targetUserId);

    let finalProfile = loaded.profile;
    if (activeUser) {
      finalProfile = syncUserProfileWithClerk(loaded.profile, activeUser);
      saveSettingsToStorage({ ...loaded, profile: finalProfile }, targetUserId);
    }

    setSettings({ ...loaded, profile: finalProfile });
    setSaveProfileError(null);
  }, [activeUser, isAuthLoaded]);

  // Initial and subsequent theme application
  useEffect(() => {
    applyTheme(settings.display.theme);
  }, [settings.display.theme]);

  // Persist settings whenever changed, scoped by active user ID
  const updateSettings = (updater: (prev: SettingsState) => SettingsState) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveSettingsToStorage(next, activeUser?.id);
      return next;
    });
  };

  const handleSaveProfile = async (profile: UserProfile): Promise<boolean | void> => {
    setSaveProfileError(null);
    setIsSavingProfile(true);

    try {
      if (activeUser && updateClerkNameRef.current) {
        const currentClerkName = extractClerkIdentity(activeUser).fullName;
        if (profile.fullName.trim() !== currentClerkName) {
          await updateClerkNameRef.current(profile.fullName.trim());
        }
      }

      updateSettings((prev) => ({ ...prev, profile }));
      return true;
    } catch (err: unknown) {
      let msg = 'Failed to update Clerk profile identity.';
      if (err && typeof err === 'object' && 'errors' in err && Array.isArray((err as any).errors)) {
        msg = (err as any).errors[0]?.message || msg;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setSaveProfileError(msg);
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePreferences = (preferences: DashboardPreferences) => {
    updateSettings((prev) => ({ ...prev, preferences }));
  };

  const handleChangeNotifications = (notifications: NotificationPreferences) => {
    updateSettings((prev) => ({ ...prev, notifications }));
  };

  const handleToggleWatchlist = (itemId: string) => {
    updateSettings((prev) => ({
      ...prev,
      watchlist: prev.watchlist.map((item) =>
        item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
      ),
    }));
  };

  const handleChangeDisplay = (display: DisplayPreferences) => {
    updateSettings((prev) => ({ ...prev, display }));
    applyTheme(display.theme);
  };

  const handleChangeIntegrations = (integrations: ApiIntegrationsState) => {
    updateSettings((prev) => ({ ...prev, integrations }));
  };

  const handleTabChange = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    const elementMap: Record<SettingsTabId, string> = {
      profile: 'settings-profile-card',
      preferences: 'settings-preferences-card',
      notifications: 'settings-notifications-card',
      privacy: 'settings-privacy-card',
      display: 'settings-display-card',
      watchlist: 'settings-watchlist-card',
      api: 'settings-api-card',
    };
    const element = document.getElementById(elementMap[tabId]);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDownloadData = () => {
    downloadUserDataExport(settings);
  };

  const handleClearData = () => {
    const defaultState = clearUserSettings(activeUser?.id);
    if (activeUser) {
      const synced = syncUserProfileWithClerk(defaultState.profile, activeUser);
      setSettings({ ...defaultState, profile: synced });
      saveSettingsToStorage({ ...defaultState, profile: synced }, activeUser.id);
    } else {
      setSettings(defaultState);
    }
  };

  // Search filter helper to highlight matching cards
  const q = searchQuery.toLowerCase().trim();
  const matchesSearch = (keywords: string[]) => {
    if (!q) return false;
    return keywords.some((kw) => kw.toLowerCase().includes(q));
  };

  const isProfileMatch = !q || matchesSearch(['profile', 'name', 'email', 'account', 'location', 'role']);
  const isPlanMatch = !q || matchesSearch(['plan', 'subscription', 'free', 'pro', 'upgrade', 'billing']);
  const isPrefsMatch = !q || matchesSearch(['preferences', 'view', 'time period', 'currency', 'language', 'location']);
  const isNotifsMatch = !q || matchesSearch(['notification', 'alerts', 'email', 'events', 'sip', 'weekly', 'updates']);
  const isWatchlistMatch = !q || matchesSearch(['watchlist', 'sectors', 'commodities', 'topics', 'energy', 'oil']);
  const isPrivacyMatch = !q || matchesSearch(['privacy', 'data', 'download', 'delete', 'security', 'export']);
  const isDisplayMatch = !q || matchesSearch(['display', 'theme', 'dark', 'light', 'chart', 'density', 'compact']);
  const isApiMatch = !q || matchesSearch(['api', 'key', 'integrations', 'excel', 'sheets', 'format', 'csv', 'json']);

  return (
    <div className={styles.container} data-testid="settings-view">
      {/* Mount Clerk bridge when publishable key is present and no override supplied */}
      {isClerkConfigured && currentUser === undefined && (
        <ClerkSettingsBridge
          onSync={handleClerkSync}
          setUpdateClerkName={handleSetUpdateClerkName}
        />
      )}

      <SettingsHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Row 1: Profile & Account (Left) | Subscription & Plan (Right) */}
      <div className={styles.rowTwoCols}>
        <div className={`${q && isProfileMatch ? styles.highlightCard : ''} ${q && !isProfileMatch ? styles.dimmedCard : ''}`}>
          <ProfileAccountCard
            profile={settings.profile}
            onSaveProfile={handleSaveProfile}
            isClerkAuthenticated={Boolean(activeUser)}
            isLoading={!isAuthLoaded}
            isSaving={isSavingProfile}
            errorMessage={saveProfileError}
          />
        </div>

        <div className={`${q && isPlanMatch ? styles.highlightCard : ''} ${q && !isPlanMatch ? styles.dimmedCard : ''}`}>
          <SubscriptionPlanCard />
        </div>
      </div>

      {/* Row 2: Dashboard Preferences | Notification Settings | Watchlist & Interests */}
      <div className={styles.rowThreeCols}>
        <div className={`${q && isPrefsMatch ? styles.highlightCard : ''} ${q && !isPrefsMatch ? styles.dimmedCard : ''}`}>
          <DashboardPreferencesCard
            preferences={settings.preferences}
            onChangePreferences={handleChangePreferences}
            onNavigateSection={onNavigateSection}
          />
        </div>

        <div className={`${q && isNotifsMatch ? styles.highlightCard : ''} ${q && !isNotifsMatch ? styles.dimmedCard : ''}`}>
          <NotificationSettingsCard
            notifications={settings.notifications}
            onChangeNotifications={handleChangeNotifications}
          />
        </div>

        <div className={`${q && isWatchlistMatch ? styles.highlightCard : ''} ${q && !isWatchlistMatch ? styles.dimmedCard : ''}`}>
          <WatchlistInterestsCard
            watchlist={settings.watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        </div>
      </div>

      {/* Row 3: Data & Privacy | Display Settings | API & Integrations */}
      <div className={styles.rowThreeCols}>
        <div className={`${q && isPrivacyMatch ? styles.highlightCard : ''} ${q && !isPrivacyMatch ? styles.dimmedCard : ''}`}>
          <DataPrivacyCard
            onDownloadData={handleDownloadData}
            onClearData={handleClearData}
          />
        </div>

        <div className={`${q && isDisplayMatch ? styles.highlightCard : ''} ${q && !isDisplayMatch ? styles.dimmedCard : ''}`}>
          <DisplaySettingsCard
            display={settings.display}
            onChangeDisplay={handleChangeDisplay}
          />
        </div>

        <div className={`${q && isApiMatch ? styles.highlightCard : ''} ${q && !isApiMatch ? styles.dimmedCard : ''}`}>
          <ApiIntegrationsCard
            integrations={settings.integrations}
            onChangeIntegrations={handleChangeIntegrations}
          />
        </div>
      </div>
    </div>
  );
};
