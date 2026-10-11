import React, { useState } from 'react';
import styles from './SubscriptionPlanCard.module.css';

export const SubscriptionPlanCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.card} id="settings-subscription-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Subscription & Plan</h2>
        <p className={styles.subtitle}>Manage your plan and unlock more insights.</p>
      </div>

      <div className={styles.columnsGrid}>
        {/* Left Box: Current Plan */}
        <div className={styles.currentPlanBox}>
          <div className={styles.planBadgeRow}>
            <div className={styles.crownBadgeBlue} aria-hidden="true">
              👑
            </div>
            <div>
              <span className={styles.planTypeLabel}>Current Plan</span>
              <h3 className={styles.planName}>Free Plan</h3>
            </div>
          </div>
          <p className={styles.planDescription}>Explore key features with limited access</p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Access global events</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Basic impact insights</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Limited sector data</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Standard charts</span>
            </li>
          </ul>
        </div>

        {/* Right Box: Upgrade to Pro */}
        <div className={styles.upgradeBox}>
          <div className={styles.upgradeHeader}>
            <div className={styles.crownBadgeAmber} aria-hidden="true">
              👑
            </div>
            <h3 className={styles.upgradeTitle}>Upgrade to Pro</h3>
          </div>
          <p className={styles.upgradeDesc}>
            Get deeper insights, advanced forecasts and personalized recommendations.
          </p>

          <ul className={styles.featureList}>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Advanced sector analysis</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>AI-powered forecasts</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Household impact simulations</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Custom alerts & watchlists</span>
            </li>
            <li className={styles.featureItem}>
              <span className={styles.checkIconGreen}>✔</span>
              <span>Export reports (PDF/Excel)</span>
            </li>
          </ul>

          <button
            type="button"
            className={styles.upgradeBtn}
            onClick={() => setIsModalOpen(true)}
          >
            <span>Upgrade to Pro</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>BharatImpact Pro Tier</h3>
            <p className={styles.modalText}>
              BharatImpact Pro includes real-time macroeconomic event triggers, unlimited household
              fractile scenario modeling, and full API data exports.
            </p>
            <p className={styles.modalText} style={{ fontSize: '0.8rem', color: '#047857' }}>
              ℹ️ <strong>System Notice:</strong> Pro plan billing gateway integration is currently in
              Developer Preview. All existing core analytics features remain completely open for
              educational research.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
