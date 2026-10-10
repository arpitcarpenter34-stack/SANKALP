import React from 'react';
import type { SourceReceipt } from '../../types/contracts';
import { ObservedInferredBadge } from './ObservedInferredBadge';
import { isSafeUrl } from './url-utils';
import styles from './evidence.module.css';

export { isSafeUrl };

export interface SourceReceiptCardProps {
  receipt: SourceReceipt;
  title?: string;
}

export const SourceReceiptCard: React.FC<SourceReceiptCardProps> = ({ receipt, title }) => {
  const hasSafeUrl = isSafeUrl(receipt.source_url);

  return (
    <div className={styles.receiptCard} role="region" aria-label="Source Receipt Details">
      <div className={styles.receiptCardTitle}>
        <span>{title || receipt.source_title}</span>
        <ObservedInferredBadge verificationStatus={receipt.verification_status} />
      </div>

      <div className={styles.metaGrid}>
        {receipt.table_or_series_id ? (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Table / Series</span>
            <span className={styles.metaValue}>{receipt.table_or_series_id}</span>
          </div>
        ) : null}

        {receipt.year_or_date ? (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Vintage / Year</span>
            <span className={styles.metaValue}>{receipt.year_or_date}</span>
          </div>
        ) : null}

        {receipt.geography ? (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Geography</span>
            <span className={styles.metaValue}>{receipt.geography}</span>
          </div>
        ) : null}

        {receipt.unit ? (
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Unit</span>
            <span className={styles.metaValue}>{receipt.unit}</span>
          </div>
        ) : null}
      </div>

      {receipt.formula_details ? (
        <div className={styles.formulaBox}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted-text)', marginBottom: '4px' }}>
            Deterministic Calculation Formula
          </div>
          <div>{receipt.formula_details}</div>
        </div>
      ) : null}

      {hasSafeUrl ? (
        <div>
          <a
            href={receipt.source_url!}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceLink}
          >
            ↗ View Primary Publication
          </a>
        </div>
      ) : receipt.source_url ? (
        <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
          Source Ref: {receipt.source_url}
        </div>
      ) : null}
    </div>
  );
};
