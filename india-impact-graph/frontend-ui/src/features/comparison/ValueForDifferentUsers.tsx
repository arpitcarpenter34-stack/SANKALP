import React from 'react';
import { UserValuePersona } from './types';
import styles from './ValueForDifferentUsers.module.css';

interface ValueForDifferentUsersProps {
  personas: UserValuePersona[];
  onNavigateToSection?: (targetSection: string) => void;
}

export const ValueForDifferentUsers: React.FC<ValueForDifferentUsersProps> = ({
  personas,
  onNavigateToSection,
}) => {
  const renderPersonaIcon = (iconType: UserValuePersona['iconType']) => {
    switch (iconType) {
      case 'family':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'student':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        );
      case 'analyst':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        );
      case 'institution':
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="22" x2="20" y2="22" />
            <line x1="2" y1="11" x2="22" y2="11" />
            <line x1="12" y1="2" x2="12" y2="7" />
            <polygon points="12 2 2 7 22 7 12 2" />
            <line x1="6" y1="11" x2="6" y2="22" />
            <line x1="10" y1="11" x2="10" y2="22" />
            <line x1="14" y1="11" x2="14" y2="22" />
            <line x1="18" y1="11" x2="18" y2="22" />
          </svg>
        );
    }
  };

  return (
    <div className={styles.containerCard}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Value for Different Users</h2>
          <p className={styles.subtitle}>
            How BharatImpact creates personalized, actionable value across distinct personas
          </p>
        </div>
      </div>

      <div className={styles.personasGrid}>
        {personas.map((persona) => {
          return (
            <div
              key={persona.id}
              className={styles.personaCard}
              onClick={() => {
                if (onNavigateToSection) onNavigateToSection(persona.targetSection);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (onNavigateToSection) onNavigateToSection(persona.targetSection);
                }
              }}
              aria-label={`Explore use case for ${persona.title}`}
            >
              <div className={styles.cardTop}>
                <div className={styles.iconBox}>{renderPersonaIcon(persona.iconType)}</div>
                <div className={styles.personaTitleBox}>
                  <h3 className={styles.personaTitle}>{persona.title}</h3>
                  <span className={styles.audienceNeed}>{persona.audienceNeed}</span>
                </div>
              </div>

              <ul className={styles.featuresList}>
                {persona.features.map((feat, idx) => (
                  <li key={idx} className={styles.featureItem}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.cardFooter}>
                <div className={styles.valueMultiplierBadge} title={persona.practicalCase}>
                  {persona.benchmarkMultiplier}
                </div>
                <span className={styles.qualitativeTag}>{persona.qualitativeBadge}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
