import React from 'react';
import { ExpenseCategoryItem } from './types';
import styles from './CategoryImpactDriversCard.module.css';

interface CategoryImpactDriversCardProps {
  categories: ExpenseCategoryItem[];
  selectedCategoryId?: string | null;
  onSelectCategory?: (categoryId: string) => void;
  onNavigateToSector?: (sectorId: string) => void;
}

const renderCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'cart':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case 'car':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H7.5a1 1 0 0 0-.8.4L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      );
    case 'home':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'book':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'heart':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      );
  }
};

export const CategoryImpactDriversCard: React.FC<CategoryImpactDriversCardProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onNavigateToSector,
}) => {
  return (
    <div className={styles.card} id="category-impact-drivers-panel">
      <div className={styles.header}>
        <h3 className={styles.title}>Category-wise Impact Drivers</h3>
        <p className={styles.subtitle}>Which sectors and events are increasing your expenses</p>
      </div>

      <div className={styles.list}>
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;

          return (
            <div
              key={cat.id}
              className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
              onClick={() => onSelectCategory?.(cat.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectCategory?.(cat.id);
                }
              }}
              title={`Click to view ${cat.name} details`}
            >
              <div className={styles.iconCircle} aria-hidden="true">
                {renderCategoryIcon(cat.iconName)}
              </div>

              <div className={styles.infoCol}>
                <div className={styles.nameRow}>
                  <span className={styles.catName}>{cat.name}</span>
                  {cat.relatedSectorId && onNavigateToSector && (
                    <button
                      type="button"
                      className={styles.sectorLink}
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateToSector(cat.relatedSectorId!);
                      }}
                      title={`Inspect ${cat.name} in Sectors Dashboard`}
                    >
                      Sector →
                    </button>
                  )}
                </div>
                <span className={styles.driverText}>{cat.driverText}</span>
              </div>

              <div className={styles.badgeCol}>
                <span
                  className={`${styles.impactBadge} ${
                    cat.increasePct >= 8
                      ? styles.impactHigh
                      : cat.increasePct >= 4
                      ? styles.impactMedium
                      : styles.impactLow
                  }`}
                >
                  +{cat.increasePct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
