import React, { useState, useRef, useEffect } from 'react';
import { NewsCategoryItem } from './types';
import styles from './NewsCategoryFilters.module.css';

export interface NewsCategoryFiltersProps {
  categories: NewsCategoryItem[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

export const NewsCategoryFilters: React.FC<NewsCategoryFiltersProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const mainCategories = categories.slice(0, 9);
  const extraCategories = categories.slice(9);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderIcon = (catId: string) => {
    switch (catId) {
      case 'global_economy':
        return '🌐';
      case 'india_economy':
        return '🏛️';
      case 'commodities':
        return '🛢️';
      case 'energy':
        return '⚡';
      case 'technology':
        return '💻';
      case 'policy':
        return '🛡️';
      case 'geopolitics':
        return '⚖️';
      case 'markets':
        return '📈';
      default:
        return null;
    }
  };

  return (
    <nav className={styles.filtersRow} aria-label="News domain categories">
      {mainCategories.map((cat) => {
        const isActive = selectedCategory === cat.id;
        const icon = renderIcon(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
            onClick={() => onSelectCategory(cat.id)}
            aria-pressed={isActive}
          >
            {icon && <span className={styles.filterIcon}>{icon}</span>}
            <span>{cat.label}</span>
          </button>
        );
      })}

      {extraCategories.length > 0 && (
        <div className={styles.moreDropdown} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.filterBtn} ${extraCategories.some((c) => c.id === selectedCategory) ? styles.active : ''}`}
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-expanded={isMoreOpen}
            aria-haspopup="true"
          >
            <span>More</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isMoreOpen && (
            <div className={styles.dropdownMenu} role="menu">
              {extraCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="menuitem"
                  className={`${styles.dropdownItem} ${selectedCategory === cat.id ? styles.itemActive : ''}`}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    setIsMoreOpen(false);
                  }}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
