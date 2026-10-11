import React from 'react';
import { NotificationPreferences } from './types';
import styles from './NotificationSettingsCard.module.css';

interface NotificationSettingsCardProps {
  notifications: NotificationPreferences;
  onChangeNotifications: (notifs: NotificationPreferences) => void;
}

interface NotificationItemConfig {
  key: keyof NotificationPreferences;
  title: string;
  description: string;
  icon: string;
  iconBg: string;
}

const NOTIFICATION_CONFIGS: NotificationItemConfig[] = [
  {
    key: 'globalEventAlerts',
    title: 'Global Event Alerts',
    description: 'Major global events with potential India impact',
    icon: '🌐',
    iconBg: '#e0f2fe',
  },
  {
    key: 'sectorSpecificAlerts',
    title: 'Sector Specific Alerts',
    description: 'Updates for your selected sectors',
    icon: '📊',
    iconBg: '#fef3c7',
  },
  {
    key: 'householdImpactAlerts',
    title: 'Household Impact Alerts',
    description: 'Changes in estimated household expenses',
    icon: '🏠',
    iconBg: '#d1fae5',
  },
  {
    key: 'sipInvestmentAlerts',
    title: 'SIP & Investment Alerts',
    description: 'Market movements and investment insights',
    icon: '📈',
    iconBg: '#fce7f3',
  },
  {
    key: 'weeklySummary',
    title: 'Weekly Summary',
    description: 'A weekly digest of key insights',
    icon: '✉️',
    iconBg: '#e0e7ff',
  },
  {
    key: 'productUpdates',
    title: 'Product Updates',
    description: 'New features and improvements',
    icon: '🔔',
    iconBg: '#ccfbf1',
  },
];

export const NotificationSettingsCard: React.FC<NotificationSettingsCardProps> = ({
  notifications,
  onChangeNotifications,
}) => {
  const handleToggle = (key: keyof NotificationPreferences) => {
    onChangeNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  return (
    <div className={styles.card} id="settings-notifications-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Notification Settings</h2>
        <p className={styles.subtitle}>Stay updated with the insights that matter to you.</p>
      </div>

      <div className={styles.notifList} role="group" aria-label="Notification alert switches">
        {NOTIFICATION_CONFIGS.map((item) => {
          const isChecked = notifications[item.key];
          return (
            <div key={item.key} className={styles.notifItem}>
              <div className={styles.notifLeft}>
                <div
                  className={styles.notifIconBadge}
                  style={{ backgroundColor: item.iconBg }}
                  aria-hidden="true"
                >
                  {item.icon}
                </div>
                <div className={styles.notifText}>
                  <h3 className={styles.notifTitle}>{item.title}</h3>
                  <p className={styles.notifDesc} title={item.description}>
                    {item.description}
                  </p>
                </div>
              </div>

              <label className={styles.switch}>
                <input
                  type="checkbox"
                  className={styles.switchInput}
                  checked={isChecked}
                  onChange={() => handleToggle(item.key)}
                  aria-label={`Toggle ${item.title}`}
                />
                <span className={styles.slider} />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
