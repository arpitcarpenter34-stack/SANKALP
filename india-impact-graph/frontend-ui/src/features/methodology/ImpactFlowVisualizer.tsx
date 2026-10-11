import React, { useState } from 'react';
import { ImpactFlowStage } from './types';
import styles from './ImpactFlowVisualizer.module.css';

interface ImpactFlowVisualizerProps {
  stages: ImpactFlowStage[];
}

export const ImpactFlowVisualizer: React.FC<ImpactFlowVisualizerProps> = ({ stages }) => {
  const [activeStageId, setActiveStageId] = useState<string>(stages[0]?.id || '');

  const activeStage = stages.find((s) => s.id === activeStageId) || stages[0];

  const renderIcon = (iconType: ImpactFlowStage['iconType']) => {
    switch (iconType) {
      case 'globe':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case 'trending':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case 'sector':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 20h20" />
            <path d="M6 20V8l4 4V8l4 4V4l6 4v12" />
          </svg>
        );
      case 'home':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
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
    <div className={styles.flowCard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Impact Flow</h2>
        <span className={styles.subtitle}>End-to-end causal transmission chain</span>
      </div>

      <div className={styles.flowList}>
        {stages.map((stage, idx) => {
          const isActive = activeStageId === stage.id;
          const isLast = idx === stages.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <div
                className={`
                  ${styles.flowNode}
                  ${isActive ? styles.nodeActive : ''}
                `}
                onClick={() => setActiveStageId(stage.id)}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveStageId(stage.id);
                  }
                }}
              >
                <div className={styles.iconCircle}>{renderIcon(stage.iconType)}</div>

                <div className={styles.nodeText}>
                  <div className={styles.nodeLabelRow}>
                    <span className={styles.nodeLabel}>{stage.label}</span>
                    <span className={styles.categoryBadge}>{stage.category}</span>
                  </div>
                  <div className={styles.nodeExample}>{stage.exampleValue}</div>
                </div>
              </div>

              {!isLast && (
                <div className={styles.downArrow} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {activeStage && (
        <div className={styles.activeDetailBox}>
          <div className={styles.activeDetailHeader}>
            <strong>{activeStage.label}</strong> — {activeStage.category}
          </div>
          <p className={styles.activeDetailDesc}>{activeStage.description}</p>
        </div>
      )}
    </div>
  );
};
