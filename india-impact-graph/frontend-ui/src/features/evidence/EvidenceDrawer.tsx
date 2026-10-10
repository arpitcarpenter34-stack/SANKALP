import React, { useEffect } from 'react';
import type { EvidencePanelSlotProps } from '../../types/contracts';
import { SourceReceiptCard } from './SourceReceiptCard';
import styles from './evidence.module.css';

export const EvidenceDrawer: React.FC<EvidencePanelSlotProps> = ({
  receipt,
  contextTitle,
  whatCouldBeWrong,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // If drawer is closed/no receipt, render empty or hidden
  if (!receipt && !contextTitle) {
    return null;
  }

  return (
    <div
      className={styles.drawerBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.drawerPanel}
        role="dialog"
        aria-modal="true"
        aria-label="Evidence and Source Receipt Details"
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>
            {contextTitle || 'Evidence Receipt Details'}
          </h2>
          {onClose ? (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close evidence panel"
            >
              ✕ Close
            </button>
          ) : null}
        </div>

        <div className={styles.drawerContent}>
          {receipt ? (
            <SourceReceiptCard receipt={receipt} title={receipt.sourceTitle} />
          ) : (
            <div className={styles.emptyEvidence}>
              <p>No verifiable receipt metadata provided for this entity.</p>
            </div>
          )}

          {/* Known Countervailing Factors & Risks Box */}
          {whatCouldBeWrong ? (
            <div className={styles.caveatsBox} role="note" aria-label="Mitigating Factors and Caveats">
              <div className={styles.caveatsTitle}>
                <span>⚠️ What Could Break This Chain?</span>
              </div>
              <p className={styles.caveatsText}>{whatCouldBeWrong}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
