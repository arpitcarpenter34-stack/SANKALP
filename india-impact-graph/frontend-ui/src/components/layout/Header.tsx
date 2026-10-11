import React, { useState, useEffect, useRef } from 'react';
import { Show, UserButton, SignInButton, SignUpButton } from '@clerk/react';
import { BackendConnectionStatus } from '../../types';
import { loadSettingsFromStorage, saveSettingsToStorage } from '../../features/settings/settingsStorage';
import { DEFAULT_SETTINGS_STATE } from '../../features/settings/settingsData';
import styles from './Header.module.css';

export interface HeaderProps {
  isAiOff: boolean;
  onToggleAi: () => void;
  activeScenarioTitle?: string;
  backendStatus?: BackendConnectionStatus;
  onToggleForceOffline?: () => void;
  onOpenAiAssistant?: () => void;
  activeNavTab?: string;
  onSelectNavTab?: (tab: string) => void;
  activeSidebarTab?: string;
  onSelectSidebarTab?: (tab: string) => void;
}

export interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: 'high' | 'medium' | 'info';
  unread: boolean;
  targetNav?: string;
  targetSidebar?: string;
}

const INITIAL_NOTIFICATIONS: HeaderNotification[] = [
  {
    id: 'notif-crude',
    title: 'Crude Oil Price Surge (+12%)',
    message: 'Global energy benchmark escalates past $88/bbl. Domestic freight pass-through active.',
    time: '15m ago',
    severity: 'high',
    unread: true,
    targetSidebar: 'overview',
  },
  {
    id: 'notif-taiwan',
    title: 'Taiwan Semiconductor Supply Tension',
    message: 'Electronics input cost pass-through evaluated at +8–12% in Global Event Map.',
    time: '1h ago',
    severity: 'medium',
    unread: true,
    targetSidebar: 'global-events',
  },
  {
    id: 'notif-mospi',
    title: 'MoSPI HCES 2023–24 Baseline Calibrated',
    message: 'Madhya Pradesh rural MPCE baseline calibrated at ₹3,179/mo from official FactSheet Table 2.',
    time: '3h ago',
    severity: 'info',
    unread: true,
    targetSidebar: 'household-impact',
  },
];

export const Header: React.FC<HeaderProps> = ({
  isAiOff,
  onToggleAi,
  activeScenarioTitle,
  backendStatus,
  onToggleForceOffline,
  onOpenAiAssistant,
  activeSidebarTab = 'overview',
  onSelectSidebarTab,
}) => {
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isDemoInfoOpen, setIsDemoInfoOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>(INITIAL_NOTIFICATIONS);
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const currentSettings = loadSettingsFromStorage('guest');
  const userProfile = currentSettings.profile;

  // Close popovers on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (demoRef.current && !demoRef.current.contains(target)) {
        setIsDemoInfoOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotifOpen(false);
        setIsProfileOpen(false);
        setIsDemoInfoOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (notif: HeaderNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    setIsNotifOpen(false);
    if (notif.targetSidebar && onSelectSidebarTab) {
      onSelectSidebarTab(notif.targetSidebar);
    }
  };

  const handleResetDemoProfile = () => {
    saveSettingsToStorage(DEFAULT_SETTINGS_STATE, 'guest');
    setSignOutNotice('Demo preferences reset to factory defaults.');
    setTimeout(() => setSignOutNotice(null), 2500);
  };

  const handleSignOutClick = () => {
    setSignOutNotice('Clerk Auth not configured. Operating in local guest demonstration session.');
    setTimeout(() => setSignOutNotice(null), 3000);
  };

  return (
    <header className={styles.header}>
      {/* 1. Left Brand & Tagline - Single Brand Identity */}
      <div className={styles.leftSection}>
        <div className={styles.logoBadge} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            {/* Map silhouette & network node hybrid */}
            <circle cx="6" cy="14" r="3.5" fill="#047857" />
            <circle cx="18" cy="7" r="4.5" fill="#10B981" />
            <circle cx="21" cy="20" r="3.5" fill="#059669" />
            <line x1="9" y1="12" x2="14" y2="9" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="9" y1="16" x2="18" y2="19" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="18" y1="11" x2="20" y2="17" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.brandTitle}>BharatImpact</h1>
          <p className={styles.tagline}>
            Global events → Indian economy → your household
            {activeScenarioTitle ? ` (${activeScenarioTitle})` : ''}
          </p>
        </div>
      </div>

      {/* 2. Center: Global Search Bar across all views (Duplicate top nav removed) */}
      <div className={styles.globalSearchBox}>
        <span className={styles.searchIcon} aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="text"
          className={styles.globalSearchInput}
          placeholder={activeSidebarTab === 'global-events' ? 'Search global events, sectors, countries...' : 'Search events, sectors, metrics...'}
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          aria-label="Search global events, sectors, countries"
        />
      </div>

      {/* 3. Right Section: Date Pill, Mode Pill, Notifications, Avatar */}
      <div className={styles.rightSection}>
        {/* Calendar & Clock Timestamp Pill */}
        <div className={styles.datePill} title="Engine baseline timestamp">
          <span className={styles.calendarIcon} aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          <div className={styles.dateCol}>
            <span className={styles.dateMain}>Oct 12, 2024</span>
            <span className={styles.dateSub}>10:48:05</span>
          </div>
        </div>

        {/* Deterministic / Live Mode Status Capsule */}
        <div ref={demoRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.modeCapsule}
            onClick={() => {
              if (onToggleForceOffline) onToggleForceOffline();
              setIsDemoInfoOpen((prev) => !prev);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            aria-expanded={isDemoInfoOpen}
            aria-haspopup="dialog"
            title={
              backendStatus?.isLive
                ? 'FastAPI Connected. Click to toggle offline demo mode.'
                : 'Deterministic Mode active. Anchored to MoSPI HCES 2023–24.'
            }
          >
            <span className={backendStatus?.isLive ? styles.greenDot : styles.emeraldDot} />
            <span className={styles.modeLabel}>
              {backendStatus?.isLive ? 'Live Engine' : 'Deterministic Mode'}
            </span>
          </button>

          {isDemoInfoOpen && (
            <div className={`${styles.popoverMenu} ${styles.demoPopover}`} role="dialog" aria-label="Engine Mode Information">
              <h3 className={styles.demoInfoTitle}>
                {backendStatus?.isLive ? '🟢 FastAPI Live Engine Active' : '🟢 Deterministic Mode Active'}
              </h3>
              <p className={styles.demoInfoText}>
                {backendStatus?.isLive
                  ? 'Connected to local FastAPI backend on http://127.0.0.1:8000. Real-time NLP Reader and dynamic graph generation pipelines are active.'
                  : 'Running in benchmark mode anchored to official MoSPI HCES 2023–24 FactSheet baselines. Synthetic benchmark scenarios (Crude Oil +12%, Edible Oil Tariff +8.5%, Wheat Procurement +6%) are deterministic.'}
              </p>
              <button
                type="button"
                className={styles.demoInfoSwitchBtn}
                onClick={() => {
                  if (onToggleForceOffline) onToggleForceOffline();
                  setIsDemoInfoOpen(false);
                }}
              >
                {backendStatus?.isLive ? 'Switch to Offline Demo Mode' : 'Attempt Reconnection to Live API'}
              </button>
            </div>
          )}
        </div>

        {/* AI Assistant Button */}
        <button
          type="button"
          className={styles.aiAssistantBtn}
          onClick={onOpenAiAssistant || onToggleAi}
          title={`Open BharatImpact AI Economic Assistant (AI ${isAiOff ? 'Bypassed' : 'Active'})`}
        >
          <span className={styles.aiSparkleIcon} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </span>
          <span className={styles.aiBtnLabel}>AI</span>
        </button>

        {/* Notification Bell with Badge & Interactive Popover */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-expanded={isNotifOpen}
            aria-haspopup="dialog"
            title={`Economic Alert Notifications (${unreadCount} unread)`}
            onClick={() => {
              setIsNotifOpen((prev) => !prev);
              setIsProfileOpen(false);
              setIsDemoInfoOpen(false);
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className={styles.notifCountBadge}>{unreadCount}</span>
            )}
          </button>

          {isNotifOpen && (
            <div className={`${styles.popoverMenu} ${styles.notifPopover}`} role="dialog" aria-label="Notifications Center">
              <div className={styles.popoverHeader}>
                <h3 className={styles.popoverTitle}>
                  <span>🔔</span>
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className={styles.popoverAction}
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className={styles.notifList} role="list">
                {notifications.length === 0 ? (
                  <div className={styles.notifEmpty}>
                    <span>🔕</span>
                    <span>No notifications available</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      role="listitem"
                      tabIndex={0}
                      className={`${styles.notifItem} ${notif.unread ? styles.notifItemUnread : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(notif);
                        }
                      }}
                    >
                      <span
                        className={`${styles.notifItemDot} ${
                          notif.severity === 'high'
                            ? styles.dotHighSev
                            : notif.severity === 'medium'
                            ? styles.dotMediumSev
                            : styles.dotInfoSev
                        }`}
                      />
                      <div className={styles.notifItemContent}>
                        <div className={styles.notifItemTitleRow}>
                          <span className={styles.notifItemTitle}>{notif.title}</span>
                          <span className={styles.notifItemTime}>{notif.time}</span>
                        </div>
                        <p className={styles.notifItemMsg}>{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.popoverFooter}>
                <span style={{ color: '#64748b' }}>Live alert channels</span>
                <button
                  type="button"
                  className={styles.footerLink}
                  onClick={() => {
                    setIsNotifOpen(false);
                    if (onSelectSidebarTab) onSelectSidebarTab('settings');
                  }}
                >
                  Configure in Settings ⚙️
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Auth & Profile Controls */}
        {Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) ? (
          <div className={styles.clerkUserWrapper}>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: styles.clerkAvatarBox,
                  },
                }}
              />
            </Show>
            <Show when="signed-out">
              <div className={styles.authActionsRow}>
                <SignInButton mode="modal">
                  <button type="button" className={styles.signInHeaderBtn}>Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button type="button" className={styles.signUpHeaderBtn}>Sign Up</button>
                </SignUpButton>
              </div>
            </Show>
          </div>
        ) : (
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={styles.userAvatar}
              title={`User Profile: ${userProfile.fullName || 'Aarav Sharma'}`}
              aria-label="Open User Profile & Account Menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="menu"
              onClick={() => {
                setIsProfileOpen((prev) => !prev);
                setIsNotifOpen(false);
                setIsDemoInfoOpen(false);
              }}
            >
              <span>{userProfile.avatarInitials || 'A'}</span>
            </button>

            {isProfileOpen && (
              <div className={`${styles.popoverMenu} ${styles.profilePopover}`} role="menu" aria-label="User Account Menu">
                <div className={styles.profileHeaderCard}>
                  <div className={styles.profileAvatarLarge}>
                    {userProfile.avatarInitials || 'A'}
                  </div>
                  <div className={styles.profileInfoCol}>
                    <span className={styles.profileName}>{userProfile.fullName || 'Aarav Sharma'}</span>
                    <span className={styles.profileEmail}>{userProfile.email || 'aarav.sharma@example.in'}</span>
                    <span className={styles.profileBadge}>Guest Demo Profile</span>
                  </div>
                </div>

                {signOutNotice && (
                  <div style={{ padding: '8px 14px', background: '#ecfdf5', color: '#047857', fontSize: '11px', fontWeight: 600, borderBottom: '1px solid #d1fae5' }}>
                    ℹ️ {signOutNotice}
                  </div>
                )}

                <div className={styles.menuList}>
                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onSelectSidebarTab) onSelectSidebarTab('settings');
                    }}
                  >
                    <span className={styles.menuItemIcon}>⚙️</span>
                    <span>Profile & Account Settings</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => {
                      setIsProfileOpen(false);
                      if (onSelectSidebarTab) onSelectSidebarTab('settings');
                    }}
                  >
                    <span className={styles.menuItemIcon}>🔔</span>
                    <span>Notification Preferences</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={handleResetDemoProfile}
                  >
                    <span className={styles.menuItemIcon}>🔄</span>
                    <span>Reset Demo Preferences</span>
                  </button>

                  <div className={styles.menuDivider} />

                  <button
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={handleSignOutClick}
                    style={{ color: '#ef4444' }}
                  >
                    <span className={styles.menuItemIcon}>🚪</span>
                    <span>Sign Out (Guest Mode)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
