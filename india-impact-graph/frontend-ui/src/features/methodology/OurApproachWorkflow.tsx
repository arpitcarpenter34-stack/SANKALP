import React, { useState } from 'react';
import { WorkflowStage } from './types';
import styles from './OurApproachWorkflow.module.css';

interface OurApproachWorkflowProps {
  stages: WorkflowStage[];
  onNavigateToSection?: (targetSection: string) => void;
}

export const OurApproachWorkflow: React.FC<OurApproachWorkflowProps> = ({
  stages,
  onNavigateToSection,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[0]?.id || '');

  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  const renderStageIcon = (iconType: WorkflowStage['iconType']) => {
    switch (iconType) {
      case 'globe':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case 'database':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          </svg>
        );
      case 'chart':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'home':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'forecast':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        );
      case 'bulb':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="18" x2="15" y2="18" />
            <line x1="10" y1="22" x2="14" y2="22" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
          </svg>
        );
    }
  };

  return (
    <section className={styles.workflowCard} aria-label="Our Six-Stage Methodology Approach">
      <div className={styles.header}>
        <h2 className={styles.title}>Our Approach</h2>
        <p className={styles.subtitle}>
          We follow a multi-layered methodology to analyze global events and estimate their impact
          on Indian economy, sectors and households.
        </p>
      </div>

      {/* 6 Stage Horizontal Workflow Strip */}
      <div className={styles.stagesStrip}>
        {stages.map((stage, idx) => {
          const isSelected = selectedStageId === stage.id;
          const isLast = idx === stages.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <div
                className={`
                  ${styles.stageItem}
                  ${isSelected ? styles.stageSelected : ''}
                `}
                onClick={() => setSelectedStageId(stage.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`Stage ${stage.stepNumber}: ${stage.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedStageId(stage.id);
                  }
                }}
              >
                <div className={styles.stageTopRow}>
                  <div
                    className={styles.stepBadge}
                    style={{
                      backgroundColor: stage.badgeBg,
                      color: stage.accentColor,
                      borderColor: stage.badgeBorder,
                    }}
                  >
                    {stage.stepNumber}
                  </div>
                  <h3 className={styles.stageTitle}>{stage.title}</h3>
                </div>

                <div
                  className={styles.iconCircle}
                  style={{
                    backgroundColor: stage.badgeBg,
                    color: stage.accentColor,
                  }}
                >
                  {renderStageIcon(stage.iconType)}
                </div>

                <p className={styles.stageShortDesc}>{stage.shortDesc}</p>

                {isSelected && <div className={styles.activePillIndicator} />}
              </div>

              {!isLast && (
                <div className={styles.arrowSeparator} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Detailed Stage Exploration Drawer */}
      {selectedStage && (
        <div className={styles.stageDetailDrawer}>
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitleRow}>
              <span
                className={styles.drawerStepNumber}
                style={{
                  backgroundColor: selectedStage.accentColor,
                }}
              >
                Stage {selectedStage.stepNumber}
              </span>
              <h4 className={styles.drawerTitle}>{selectedStage.title}</h4>
            </div>

            {selectedStage.targetSection && onNavigateToSection && (
              <button
                type="button"
                className={styles.jumpToFeatureBtn}
                onClick={() => onNavigateToSection(selectedStage.targetSection!)}
                title={`Open the ${selectedStage.title} feature in the app`}
              >
                Explore Active Feature →
              </button>
            )}
          </div>

          <p className={styles.drawerFullDesc}>{selectedStage.fullDesc}</p>

          <div className={styles.drawerMetaGrid}>
            <div className={styles.metaBox}>
              <span className={styles.metaLabel}>Verified Implementation:</span>
              <span className={styles.metaVal}>{selectedStage.implementedMechanism}</span>
            </div>
            <div className={styles.metaBox}>
              <span className={styles.metaLabel}>Methodological Constraints:</span>
              <span className={styles.metaValWarning}>{selectedStage.limitations}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
