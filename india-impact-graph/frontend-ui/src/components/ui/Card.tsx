import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  elevated = false,
}) => {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div className={`${styles.card} ${elevated ? styles.elevated : ''} ${className}`}>
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.headerText}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {headerAction && <div className={styles.headerAction}>{headerAction}</div>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  );
};
