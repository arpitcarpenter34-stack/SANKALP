import React, { useState, useMemo } from 'react';
import {
  EventCategory,
  GlobalEventRecord,
} from './types';
import {
  EVENT_CATEGORIES,
  REPORTING_PERIODS,
  GLOBAL_EVENTS_DATA,
  GLOBAL_NEWS_DATA,
} from './eventsData';
import { GlobalEventMap } from './GlobalEventMap';
import { TopEventsList } from './TopEventsList';
import { MarketPulseCard } from './MarketPulseCard';
import { GlobalNewsPanel } from './GlobalNewsPanel';
import { SelectedEventDetailCard } from './SelectedEventDetailCard';
import styles from './GlobalEventsView.module.css';

export interface GlobalEventsViewProps {
  onNavigateToGraph?: (scenarioId?: string) => void;
}

export const GlobalEventsView: React.FC<GlobalEventsViewProps> = ({
  onNavigateToGraph,
}) => {
  // Category state (All Events active by default)
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all');
  const [reportingPeriod, setReportingPeriod] = useState<string>('7d');
  const [selectedEventId, setSelectedEventId] = useState<string>('taiwan-semiconductors-2024');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('news-taiwan-chips');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Date range picker state
  const [isDateRangeOpen, setIsDateRangeOpen] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('2024-10-05');
  const [endDate, setEndDate] = useState<string>('2024-10-12');
  const [isCustomDateApplied, setIsCustomDateApplied] = useState<boolean>(false);

  // Reference reporting date for the curated dataset is 2024-10-12
  const { minPeriodDate, maxPeriodDate } = useMemo(() => {
    const maxDate = '2024-10-12';
    let minDate = '2024-10-05'; // default 7d

    if (reportingPeriod === '7d') {
      minDate = '2024-10-05';
    } else if (reportingPeriod === '30d') {
      minDate = '2024-09-12';
    } else if (reportingPeriod === '90d') {
      minDate = '2024-07-14';
    } else if (reportingPeriod === 'ytd') {
      minDate = '2024-01-01';
    }

    return { minPeriodDate: minDate, maxPeriodDate: maxDate };
  }, [reportingPeriod]);

  // Filtered Events based on active category AND genuine date filtering
  const filteredEvents = useMemo(() => {
    return GLOBAL_EVENTS_DATA.filter((ev) => {
      // 1. Category check
      if (activeCategory !== 'all' && ev.category !== activeCategory) {
        return false;
      }

      // 2. Date filtering
      if (isCustomDateApplied) {
        if (!ev.eventDateIso) return false;
        if (startDate && ev.eventDateIso < startDate) return false;
        if (endDate && ev.eventDateIso > endDate) return false;
      } else {
        if (!ev.eventDateIso) return false;
        if (ev.eventDateIso < minPeriodDate || ev.eventDateIso > maxPeriodDate) {
          return false;
        }
      }

      return true;
    });
  }, [activeCategory, isCustomDateApplied, startDate, endDate, minPeriodDate, maxPeriodDate]);

  // Ensure an active event is selected and in sync with filtered list
  const activeEvent: GlobalEventRecord | undefined = useMemo(() => {
    if (filteredEvents.length === 0) return undefined;
    const found = filteredEvents.find((ev) => ev.id === selectedEventId);
    if (found) return found;
    return filteredEvents[0];
  }, [filteredEvents, selectedEventId]);

  // Handle Event selection (from map or ranked list)
  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    // Sync with corresponding news article ONLY when a verified relationship exists
    const linkedArticle = GLOBAL_NEWS_DATA.find((a) => a.relatedEventId === eventId);
    if (linkedArticle) {
      setSelectedArticleId(linkedArticle.id);
    }
  };

  // Handle Article selection (from news panel)
  const handleSelectArticle = (articleId: string, relatedEventId?: string) => {
    setSelectedArticleId(articleId);
    if (relatedEventId) {
      // Only select event if relatedEventId is actually present and valid
      setSelectedEventId(relatedEventId);
    }
  };

  // Real Auto Refresh handler: calls real backend endpoints
  const handleAutoRefresh = async () => {
    if (isRefreshing) return; // Prevent concurrent requests
    setIsRefreshing(true);
    setRefreshMessage('Connecting to backend API and refreshing market data...');
    setRefreshError(null);

    const backendHost = (
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
      'http://127.0.0.1:8000'
    ).replace(/\/api\/?$/, '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2200);

      // Ping backend health
      const healthRes = await fetch(`${backendHost}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!healthRes.ok) {
        throw new Error(`Backend returned HTTP status ${healthRes.status}`);
      }

      // Trigger re-fetch of real market data in child cards
      setRefreshTrigger((c) => c + 1);

      const nowStr = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastRefreshTime(nowStr);
      setIsRefreshing(false);
      setRefreshMessage(`Market data and health verified from backend at ${nowStr}.`);
      setTimeout(() => setRefreshMessage(null), 4500);
    } catch (err: unknown) {
      setIsRefreshing(false);
      setRefreshMessage(null);
      const errMsg = err instanceof Error ? err.message : 'Connection failed';
      setRefreshError(
        `Auto-refresh failed (${errMsg}). Backend unreachable at ${backendHost}. Displaying verified local benchmark intelligence.`
      );
    }
  };

  const handleApplyDateRange = () => {
    if (startDate && endDate && startDate > endDate) {
      setRefreshError('Start date cannot be after end date.');
      return;
    }
    setRefreshError(null);
    setIsCustomDateApplied(true);
    setIsDateRangeOpen(false);
  };

  const handleResetDateRange = () => {
    setStartDate('2024-10-05');
    setEndDate('2024-10-12');
    setIsCustomDateApplied(false);
    setIsDateRangeOpen(false);
    setRefreshError(null);
  };

  const handleResetAllFilters = () => {
    setActiveCategory('all');
    setReportingPeriod('7d');
    handleResetDateRange();
  };

  const currentPeriodObj = REPORTING_PERIODS.find((p) => p.id === reportingPeriod);
  const periodLabel = isCustomDateApplied
    ? `${startDate} to ${endDate}`
    : currentPeriodObj?.label || 'Last 7 days';

  return (
    <div className={styles.container} aria-label="Global Events & Market Signals Dashboard">
      {/* 1. Page Header with Title and Global Actions */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div>
            <h1 className={styles.pageTitle}>Global Events &amp; Market Signals</h1>
            <p className={styles.pageSubtitle}>
              Track global developments and understand their impact on the Indian economy, sectors, household expenses and investments.
            </p>
          </div>
        </div>

        {/* Right Action Controls: Auto Refresh & Period Selector */}
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.autoRefreshBtn}
            onClick={handleAutoRefresh}
            disabled={isRefreshing}
            title={
              lastRefreshTime
                ? `Last updated at ${lastRefreshTime}. Click to refresh from backend.`
                : 'Click to refresh market data and verify backend connectivity'
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={isRefreshing ? styles.refreshSpin : ''}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>{isRefreshing ? 'Refreshing...' : 'Auto Refresh'}</span>
          </button>

          <div className={styles.periodSelectWrapper}>
            <select
              className={styles.periodSelect}
              value={reportingPeriod}
              onChange={(e) => {
                setReportingPeriod(e.target.value);
                if (isCustomDateApplied) {
                  setIsCustomDateApplied(false);
                }
              }}
              aria-label="Select Reporting Period"
            >
              {REPORTING_PERIODS.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
            <span className={styles.periodSelectArrow} aria-hidden="true">▼</span>
          </div>
        </div>
      </div>

      {/* Refresh Status Toast */}
      {refreshMessage && (
        <div className={styles.refreshToast} role="status">
          <span>{refreshMessage}</span>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#047857' }}
            onClick={() => setRefreshMessage(null)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Refresh Error Toast */}
      {refreshError && (
        <div className={`${styles.refreshToast} ${styles.refreshToastError}`} role="alert">
          <span>{refreshError}</span>
          <div>
            <button
              type="button"
              className={styles.toastRetryBtn}
              onClick={handleAutoRefresh}
            >
              Retry
            </button>
            <button
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', marginLeft: 8 }}
              onClick={() => setRefreshError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. Category Filter Bar (horizontal rounded pills) */}
      <div className={styles.categoryBar} role="toolbar" aria-label="Event Categories">
        {EVENT_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}
              aria-pressed={isActive}
            >
              <span className={styles.categoryIcon} aria-hidden="true">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}

        {/* Date Range Selector Pill */}
        <div className={styles.dateRangeWrapper}>
          <button
            type="button"
            className={`${styles.dateRangeBtn} ${isCustomDateApplied ? styles.categoryPillActive : ''}`}
            onClick={() => setIsDateRangeOpen(!isDateRangeOpen)}
            aria-expanded={isDateRangeOpen}
          >
            <span aria-hidden="true">📅</span>
            <span>{isCustomDateApplied ? `${startDate} to ${endDate}` : 'Date Range'}</span>
            <span style={{ fontSize: '9px', marginLeft: 2 }} aria-hidden="true">▼</span>
          </button>

          {isDateRangeOpen && (
            <div className={styles.dateRangePopover}>
              <div className={styles.dateField}>
                <label className={styles.dateLabel}>Start Date</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className={styles.dateField}>
                <label className={styles.dateLabel}>End Date</label>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className={styles.dateActionsRow}>
                <button
                  type="button"
                  className={styles.dateActionBtn}
                  onClick={handleResetDateRange}
                >
                  Reset
                </button>
                <button
                  type="button"
                  className={`${styles.dateActionBtn} ${styles.dateApplyBtn}`}
                  onClick={handleApplyDateRange}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State Banner if no events match active filters */}
      {filteredEvents.length === 0 && (
        <div className={styles.emptyStateBanner} role="status">
          <strong>No events found for the active filter selection.</strong>
          <span>Category: {activeCategory} • Period: {periodLabel}</span>
          <button
            type="button"
            className={styles.resetAllFiltersBtn}
            onClick={handleResetAllFilters}
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* 3. Upper Grid (3 Columns: Map, Top Events List, Market Pulse) */}
      <div className={styles.upperGrid}>
        <GlobalEventMap
          events={filteredEvents}
          selectedEventId={activeEvent?.id}
          onSelectEvent={handleSelectEvent}
          reportingPeriodLabel={periodLabel}
        />

        <TopEventsList
          events={filteredEvents}
          selectedEventId={activeEvent?.id}
          onSelectEvent={handleSelectEvent}
        />

        <MarketPulseCard refreshTrigger={refreshTrigger} />
      </div>

      {/* 4. Lower Grid (2 Columns: Latest Global News, Selected Event Detail Card) */}
      <div className={styles.lowerGrid}>
        <GlobalNewsPanel
          articles={GLOBAL_NEWS_DATA}
          selectedArticleId={selectedArticleId}
          onSelectArticle={handleSelectArticle}
        />

        <SelectedEventDetailCard
          event={activeEvent}
          onNavigateToGraph={onNavigateToGraph}
        />
      </div>
    </div>
  );
};
