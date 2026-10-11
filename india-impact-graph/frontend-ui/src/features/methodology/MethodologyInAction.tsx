import React, { useState } from 'react';
import { METHODOLOGY_EXAMPLES } from './methodologyData';
import styles from './MethodologyInAction.module.css';

interface MethodologyInActionProps {
  onNavigateSection?: (section: string) => void;
}

export const MethodologyInAction: React.FC<MethodologyInActionProps> = ({
  onNavigateSection,
}) => {
  const [selectedExampleId, setSelectedExampleId] = useState<string>(METHODOLOGY_EXAMPLES[0].id);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  const activeExample =
    METHODOLOGY_EXAMPLES.find((ex) => ex.id === selectedExampleId) || METHODOLOGY_EXAMPLES[0];

  return (
    <div className={styles.container} id="methodology-in-action">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2 className={styles.title}>Methodology in Action (Example)</h2>
          <p className={styles.subtitle}>
            How we analyze a global event and estimate its impact through all 5 transmission nodes
          </p>
        </div>

        <div className={styles.selectorWrapper}>
          <select
            className={styles.selectInput}
            value={selectedExampleId}
            onChange={(e) => {
              setSelectedExampleId(e.target.value);
              setActiveStepId(null);
            }}
            aria-label="Select worked methodology scenario"
          >
            {METHODOLOGY_EXAMPLES.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Example: {ex.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.flowRow}>
        {/* Stage 1: Global Event */}
        <div
          className={`${styles.flowCard} ${activeStepId === 'event' ? styles.flowCardSelected : ''}`}
          onClick={() => setActiveStepId(activeStepId === 'event' ? null : 'event')}
          title="Click to view event detection evidence"
        >
          <div className={styles.cardTop}>
            <span className={styles.cardIcon}>🌐</span>
            <span className={styles.shockPill}>{activeExample.shockPercentage}</span>
          </div>
          <h4 className={styles.cardTitle}>Global Event</h4>
          <p className={styles.headlineText}>{activeExample.globalEvent.headline}</p>
          <ul className={styles.bulletList}>
            <li>{activeExample.globalEvent.detectionMethod}</li>
            <li>{activeExample.globalEvent.classification}</li>
          </ul>
        </div>

        <div className={styles.connectorArrow}>→</div>

        {/* Stage 2: Economic Impact */}
        <div
          className={`${styles.flowCard} ${activeStepId === 'macro' ? styles.flowCardSelected : ''}`}
          onClick={() => setActiveStepId(activeStepId === 'macro' ? null : 'macro')}
          title="Click to view macroeconomic transmission details"
        >
          <div className={styles.cardTop}>
            <span className={styles.cardIcon}>📈</span>
          </div>
          <h4 className={styles.cardTitle}>Economic Impact</h4>
          <ul className={styles.bulletList}>
            <li>
              <strong>CAD:</strong> {activeExample.macroImpact.cadImpact}
            </li>
            <li>
              <strong>Inflation:</strong> {activeExample.macroImpact.inflationPressure}
            </li>
            <li>
              <strong>Lag:</strong> {activeExample.macroImpact.transmissionSpeed}
            </li>
          </ul>
        </div>

        <div className={styles.connectorArrow}>→</div>

        {/* Stage 3: Sector Impact */}
        <div
          className={`${styles.flowCard} ${activeStepId === 'sector' ? styles.flowCardSelected : ''}`}
          onClick={() => setActiveStepId(activeStepId === 'sector' ? null : 'sector')}
          title="Click to view sector impact details"
        >
          <div className={styles.cardTop}>
            <span className={styles.cardIcon}>🏭</span>
          </div>
          <h4 className={styles.cardTitle}>Sector Impact</h4>
          <ul className={styles.bulletList}>
            {activeExample.sectorImpacts.slice(0, 4).map((s, idx) => (
              <li key={idx}>
                {s.sector}: <strong>{s.deltaPct}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.connectorArrow}>→</div>

        {/* Stage 4: Household Impact */}
        <div
          className={`${styles.flowCard} ${activeStepId === 'household' ? styles.flowCardSelected : ''}`}
          onClick={() => setActiveStepId(activeStepId === 'household' ? null : 'household')}
          title="Click to view household basket breakdown"
        >
          <div className={styles.cardTop}>
            <span className={styles.cardIcon}>🏠</span>
          </div>
          <h4 className={styles.cardTitle}>Household Impact</h4>
          <p className={styles.headlineText}>
            Monthly expense +₹{activeExample.householdImpact.monthlyDeltaInr.toLocaleString('en-IN')}{' '}
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>(avg. urban)</span>
          </p>
          <ul className={styles.bulletList}>
            {activeExample.householdImpact.affectedBaskets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>

        <div className={styles.connectorArrow}>→</div>

        {/* Stage 5: Recommendation */}
        <div
          className={`${styles.flowCard} ${activeStepId === 'recommendation' ? styles.flowCardSelected : ''}`}
          onClick={() => setActiveStepId(activeStepId === 'recommendation' ? null : 'recommendation')}
          title="Click to view actionable guidance"
        >
          <div className={styles.cardTop}>
            <span className={styles.cardIcon}>💡</span>
          </div>
          <h4 className={styles.cardTitle}>Recommendation</h4>
          <ul className={styles.bulletList}>
            {activeExample.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {activeStepId && (
        <div className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <h4 className={styles.drawerTitle}>
              Detailed Evidence: {activeStepId.toUpperCase()} Stage ({activeExample.title})
            </h4>
            {onNavigateSection && (
              <button
                className={styles.drawerActionBtn}
                onClick={() => {
                  if (activeStepId === 'event') onNavigateSection('global-events');
                  else if (activeStepId === 'macro' || activeStepId === 'sector')
                    onNavigateSection('sectors');
                  else if (activeStepId === 'household') onNavigateSection('household-impact');
                  else onNavigateSection('sip-forecasts');
                }}
              >
                Inspect in Interactive Dashboard →
              </button>
            )}
          </div>
          <div className={styles.drawerGrid}>
            <div className={styles.drawerItem}>
              <strong>Scenario Model ID</strong>
              <span>{activeExample.id}</span>
            </div>
            <div className={styles.drawerItem}>
              <strong>Shock Magnitude</strong>
              <span>{activeExample.shockPercentage} upstream shift</span>
            </div>
            <div className={styles.drawerItem}>
              <strong>Top Impact Category</strong>
              <span>{activeExample.householdImpact.topCategory}</span>
            </div>
            <div className={styles.drawerItem}>
              <strong>Monthly Rupee Delta</strong>
              <span>+₹{activeExample.householdImpact.monthlyDeltaInr} / family</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
