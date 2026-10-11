import React, { useState } from 'react';
import { AnalyticalModel } from './types';
import styles from './ModelsTechniquesCard.module.css';

interface ModelsTechniquesCardProps {
  models: AnalyticalModel[];
}

export const ModelsTechniquesCard: React.FC<ModelsTechniquesCardProps> = ({ models }) => {
  const [expandedModelId, setExpandedModelId] = useState<string | null>(null);

  const renderIcon = (category: AnalyticalModel['category']) => {
    switch (category) {
      case 'nlp':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'econometric':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        );
      case 'rules_ml':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      case 'input_output':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        );
      case 'scenario':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
    }
  };

  const getModelColor = (category: AnalyticalModel['category']) => {
    switch (category) {
      case 'nlp':
        return '#0284c7';
      case 'econometric':
        return '#059669';
      case 'rules_ml':
        return '#10b981';
      case 'input_output':
        return '#6366f1';
      case 'scenario':
      default:
        return '#f59e0b';
    }
  };

  return (
    <div className={styles.containerCard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Models & Techniques</h2>
        <span className={styles.subtitle}>Implemented analytical engines & deterministic models</span>
      </div>

      <div className={styles.modelsList}>
        {models.map((model) => {
          const isExpanded = expandedModelId === model.id;
          const color = getModelColor(model.category);

          return (
            <div
              key={model.id}
              className={`
                ${styles.modelItem}
                ${isExpanded ? styles.modelItemExpanded : ''}
              `}
              onClick={() => setExpandedModelId(isExpanded ? null : model.id)}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setExpandedModelId(isExpanded ? null : model.id);
                }
              }}
            >
              <div className={styles.modelHeaderRow}>
                <div
                  className={styles.iconCircle}
                  style={{
                    color: color,
                    backgroundColor: `${color}18`,
                  }}
                >
                  {renderIcon(model.category)}
                </div>

                <div className={styles.modelHeaderContent}>
                  <h3 className={styles.modelName}>{model.name}</h3>
                  <p className={styles.modelShortDesc}>{model.shortDesc}</p>
                </div>

                <span className={styles.expandChevron}>{isExpanded ? '▲' : '▼'}</span>
              </div>

              {isExpanded && (
                <div className={styles.expandedDetails}>
                  <div className={styles.detailBlock}>
                    <strong>Purpose:</strong> {model.purpose}
                  </div>

                  <div className={styles.detailBlock}>
                    <strong>Processing Steps:</strong>
                    <ol className={styles.stepsList}>
                      {model.processingSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div className={styles.metaRow}>
                    <div>
                      <strong>Inputs:</strong> {model.inputData.join(', ')}
                    </div>
                    <div>
                      <strong>Output:</strong> {model.output}
                    </div>
                  </div>

                  <div className={styles.limitationsBox}>
                    <strong>Known Limitations:</strong> {model.limitations.join('; ')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
