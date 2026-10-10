import React, { useState } from 'react';
import type { EvidencePanelSlotProps } from '../../types/contracts';
import styles from './evidence.module.css';

export const EvidenceDrawer: React.FC<EvidencePanelSlotProps> = ({
  receipt,
  contextTitle,
  whatCouldBeWrong,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'evidence' | 'methodology' | 'context'>('evidence');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Default primary benchmark receipt when nothing is clicked
  const defaultSource = {
    title: 'Indian Energy Imports & Transport Share',
    impactBadge: '★ High Impact',
    summary:
      'Higher global crude oil prices increase India\'s import bill, affecting fiscal balance and domestic fuel prices.',
    citation: 'MoSPI – HCES 2023-24',
    citationSub: 'Household Consumption Expenditure Survey (Transport & Fuel Share)',
    url: 'https://mospi.gov.in/hces',
    status: 'Verified',
  };

  const isSelected = !!receipt;
  const displayTitle = isSelected ? (contextTitle || receipt.sourceTitle) : defaultSource.title;
  const displaySummary = isSelected 
    ? (whatCouldBeWrong || receipt.formulaDetails || 'Empirically audited relationship calibrated to official publications.')
    : defaultSource.summary;
  const displayCitation = isSelected ? `${receipt.publisher || 'Official Source'} – ${receipt.sourceTitle}` : defaultSource.citation;
  const displayCitationSub = isSelected ? (receipt.formulaDetails || receipt.unit || 'Calibrated Transmission') : defaultSource.citationSub;
  const displayUrl = isSelected ? (receipt.sourceUrl || defaultSource.url) : defaultSource.url;
  const displayStatus = isSelected ? (receipt.verificationStatus === '[VERIFIED]' ? 'Verified' : 'Inferred') : defaultSource.status;

  return (
    <div className={styles.evidenceCard}>
      {/* 1. Header with Icon & Badge */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Evidence &amp; Source Receipt</h2>
            <p className={styles.subtitle}>Node-level verification and sources</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.primarySourceBadge}>PRIMARY SOURCE</span>
          {isSelected && onClose && (
            <button
              type="button"
              className={styles.clearSelectionBtn}
              onClick={onClose}
              title="Clear selection"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {/* 2. Selected Entity Block */}
        <div className={styles.entityBlock}>
          <div className={styles.entityIconBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className={styles.entityMeta}>
            <div className={styles.entityTitleRow}>
              <span className={styles.entityTitle}>{displayTitle}</span>
              <span className={styles.highImpactBadge}>★ High Impact</span>
            </div>
            <p className={styles.entityDesc}>{displaySummary}</p>
          </div>
        </div>

        {/* 3. Sub-Tabs: Evidence (3) | Methodology | Context */}
        <div className={styles.subTabsRow} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'evidence'}
            className={`${styles.subTab} ${activeTab === 'evidence' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Evidence (3)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'methodology'}
            className={`${styles.subTab} ${activeTab === 'methodology' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('methodology')}
          >
            Methodology
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'context'}
            className={`${styles.subTab} ${activeTab === 'context' ? styles.subTabActive : ''}`}
            onClick={() => setActiveTab('context')}
          >
            Context
          </button>
        </div>

        {/* 4. Primary Source Receipt Box */}
        <div className={styles.receiptBox}>
          <div className={styles.receiptHeaderRow}>
            <div className={styles.citationName}>
              <span className={styles.cyanDot} />
              <span>{displayCitation}</span>
            </div>
            <span className={styles.verifiedPill}>
              ✔ {displayStatus}
            </span>
          </div>

          <div className={styles.receiptSubText}>
            {displayCitationSub}
          </div>

          <div className={styles.linkRow}>
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceUrlLink}
            >
              {displayUrl} ↗
            </a>
          </div>

          {/* Carousel Pagination Dots */}
          <div className={styles.carouselPagination}>
            <button
              type="button"
              className={styles.arrowNav}
              onClick={() => setCarouselIndex((i) => (i > 0 ? i - 1 : 3))}
            >
              ‹
            </button>
            <div className={styles.dotsGroup}>
              {[0, 1, 2, 3].map((idx) => (
                <span
                  key={idx}
                  className={`${styles.dotItem} ${carouselIndex === idx ? styles.dotActive : ''}`}
                  onClick={() => setCarouselIndex(idx)}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.arrowNav}
              onClick={() => setCarouselIndex((i) => (i < 3 ? i + 1 : 0))}
            >
              ›
            </button>
          </div>
        </div>

        {/* 5. Insights & Alerts Section */}
        <div className={styles.insightsSection}>
          <div className={styles.insightsTitle}>
            <span className={styles.lightningIcon}>⚡</span>
            <span>Insights &amp; Alerts</span>
          </div>

          <div className={styles.insightsList}>
            <div className={styles.insightItem}>
              <span className={styles.alertBullet}>⚡</span>
              <span className={styles.alertText}>Fuel prices may increase by 8–15% (est.)</span>
              <span className={styles.chevron}>›</span>
            </div>

            <div className={styles.insightItem}>
              <span className={styles.alertBullet}>⚡</span>
              <span className={styles.alertText}>Rural households are more vulnerable</span>
              <span className={styles.chevron}>›</span>
            </div>

            <div className={styles.insightItem}>
              <span className={styles.alertBullet}>⚡</span>
              <span className={styles.alertText}>Policy intervention can reduce impact by ~3–5%</span>
              <span className={styles.chevron}>›</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
