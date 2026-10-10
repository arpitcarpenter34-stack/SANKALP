import React from 'react';
import type { EdgeKind, VerificationStatus } from '../../types/contracts';
import styles from './evidence.module.css';

export interface ObservedInferredBadgeProps {
  kind?: EdgeKind;
  verificationStatus?: VerificationStatus;
}

export const ObservedInferredBadge: React.FC<ObservedInferredBadgeProps> = ({
  kind,
  verificationStatus,
}) => {
  return (
    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* 1. Relationship Kind Badge (Observed vs Inferred) */}
      {kind ? (
        <span
          className={`${styles.badge} ${
            kind === 'observed' ? styles.badgeObserved : styles.badgeInferred
          }`}
          title={
            kind === 'observed'
              ? 'Empirically measured or directly stated relationship'
              : 'Structural econometric or theoretical transmission linkage'
          }
        >
          {kind === 'observed' ? '● Observed' : '◌ Inferred'}
        </span>
      ) : null}

      {/* 2. Verification Status Badge (Separate governance concept) */}
      {verificationStatus ? (
        <span
          className={`${styles.badge} ${
            verificationStatus === '[VERIFIED]'
              ? styles.badgeVerified
              : verificationStatus === '[VERIFY]'
              ? styles.badgeVerify
              : verificationStatus === '[INFERENCE]'
              ? styles.badgeInference
              : styles.badgeUnverified
          }`}
          title={`Data Governance Status: ${verificationStatus}`}
        >
          {verificationStatus}
        </span>
      ) : null}
    </div>
  );
};
