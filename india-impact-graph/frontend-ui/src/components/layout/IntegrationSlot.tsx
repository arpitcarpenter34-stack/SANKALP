import React from 'react';
import { Badge } from '../ui/Badge';
import styles from './IntegrationSlot.module.css';

export interface IntegrationSlotProps {
  slotName: string;
  slotType: 'graph_canvas' | 'evidence_panel' | 'household_impact';
  ownerLabel?: string;
  children?: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyNotice?: string;
  className?: string;
}

export const IntegrationSlot: React.FC<IntegrationSlotProps> = ({
  slotName,
  slotType,
  ownerLabel = 'Laptop B Feature Slot',
  children,
  isLoading = false,
  isEmpty = false,
  emptyNotice,
  className = '',
}) => {
  if (children && !isEmpty) {
    return <div className={`${styles.slotContainer} ${className}`}>{children}</div>;
  }

  return (
    <div className={`${styles.slotPlaceholder} ${styles[slotType]} ${className}`}>
      <div className={styles.slotHeader}>
        <div className={styles.slotTitleRow}>
          <span className={styles.slotCoordinate}>SLOT // {slotType.toUpperCase()}</span>
          <span className={styles.slotName}>{slotName}</span>
        </div>
        <Badge variant="inferred" size="sm">{ownerLabel}</Badge>
      </div>

      <div className={styles.slotBody}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <span className={styles.slotSpinner} />
            <p className={styles.loadingText}>Evaluating transmission vectors...</p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.wireframeGrid} aria-hidden="true">
              <span className={styles.wireNode} />
              <span className={styles.wireLine} />
              <span className={styles.wireNode} />
            </div>
            <p className={styles.emptyNotice}>
              {emptyNotice || 'Select a financial event and trigger "Analyze Event" to view propagation.'}
            </p>
            <p className={styles.contractHint}>
              Contract ready: Consumes <code>KnowledgeGraphData</code> &amp; <code>PersonaImpactSummary</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
