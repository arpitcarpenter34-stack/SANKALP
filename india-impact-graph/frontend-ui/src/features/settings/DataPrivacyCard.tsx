import React, { useState } from 'react';
import styles from './DataPrivacyCard.module.css';

interface DataPrivacyCardProps {
  onDownloadData: () => void;
  onClearData: () => void;
}

export const DataPrivacyCard: React.FC<DataPrivacyCardProps> = ({
  onDownloadData,
  onClearData,
}) => {
  const [activeModal, setActiveModal] = useState<'usage' | 'privacy' | 'delete' | null>(null);

  const handleConfirmDelete = () => {
    onClearData();
    setActiveModal(null);
  };

  return (
    <div className={styles.card} id="settings-privacy-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Data & Privacy</h2>
        <p className={styles.subtitle}>Manage your data, privacy and account security.</p>
      </div>

      <div className={styles.itemList}>
        {/* Item 1: Data Usage */}
        <button
          type="button"
          className={styles.itemBtn}
          onClick={() => setActiveModal('usage')}
        >
          <div className={styles.itemLeft}>
            <div className={`${styles.iconBadge} ${styles.iconBadgeBlue}`} aria-hidden="true">
              🌐
            </div>
            <div className={styles.itemText}>
              <h3 className={styles.itemTitle}>Data Usage</h3>
              <p className={styles.itemDesc}>We use your preferences to provide personalized insights.</p>
            </div>
          </div>
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </button>

        {/* Item 2: Privacy Settings */}
        <button
          type="button"
          className={styles.itemBtn}
          onClick={() => setActiveModal('privacy')}
        >
          <div className={styles.itemLeft}>
            <div className={`${styles.iconBadge} ${styles.iconBadgeIndigo}`} aria-hidden="true">
              🔒
            </div>
            <div className={styles.itemText}>
              <h3 className={styles.itemTitle}>Privacy Settings</h3>
              <p className={styles.itemDesc}>Control your data and visibility.</p>
            </div>
          </div>
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </button>

        {/* Item 3: Download My Data */}
        <button
          type="button"
          className={styles.itemBtn}
          onClick={onDownloadData}
          title="Download complete JSON export of your settings and watchlists"
        >
          <div className={styles.itemLeft}>
            <div className={`${styles.iconBadge} ${styles.iconBadgeGreen}`} aria-hidden="true">
              📥
            </div>
            <div className={styles.itemText}>
              <h3 className={styles.itemTitle}>Download My Data</h3>
              <p className={styles.itemDesc}>Export your data, watchlists and settings.</p>
            </div>
          </div>
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </button>

        {/* Item 4: Delete Account */}
        <button
          type="button"
          className={styles.itemBtn}
          onClick={() => setActiveModal('delete')}
        >
          <div className={styles.itemLeft}>
            <div className={`${styles.iconBadge} ${styles.iconBadgeRed}`} aria-hidden="true">
              🗑️
            </div>
            <div className={styles.itemText}>
              <h3 className={`${styles.itemTitle} ${styles.itemTitleDanger}`}>Delete Account</h3>
              <p className={styles.itemDesc}>Permanently delete your account and data.</p>
            </div>
          </div>
          <span className={styles.chevron} aria-hidden="true">
            ›
          </span>
        </button>
      </div>

      {activeModal === 'usage' && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Data Usage Architecture</h3>
            <p className={styles.modalText}>
              BharatImpact executes calculations locally within your browser session or through
              unauthenticated, deterministic REST endpoints. Your consumption profile and watchlist
              preferences are stored securely in browser <code>localStorage</code>.
            </p>
            <p className={styles.modalText} style={{ color: '#047857' }}>
              ✔ Zero third-party ad trackers.
              <br />
              ✔ Zero selling or cross-site fingerprinting of household income data.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'privacy' && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Privacy & Visibility Settings</h3>
            <p className={styles.modalText}>
              All household scenarios, persona customizations, and SIP targets are private to your
              device. No financial data is ever shared publicly or sent to third-party brokers.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'delete' && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Reset & Clear Local Data</h3>
            <p className={styles.modalText}>
              Are you sure you want to clear your local configuration? This will reset your profile,
              custom watchlist, notifications, and dashboard preferences back to initial system
              defaults.
            </p>
            <p className={styles.modalText} style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Note: BharatImpact stores all preferences locally on this browser. No remote server
              account will be affected.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDeleteBtn}
                onClick={handleConfirmDelete}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
