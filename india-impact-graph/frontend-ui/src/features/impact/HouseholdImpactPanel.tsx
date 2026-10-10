import React, { useState } from 'react';
import type {
  HouseholdImpactSlotProps,
  SourceReceipt,
} from '../../types/contracts';
import { PersonaSelector } from './PersonaSelector';
import { MonthlyImpactCard } from './MonthlyImpactCard';
import { ItemBreakdownTable } from './ItemBreakdownTable';
import { EvidenceDrawer } from '../evidence/EvidenceDrawer';
import styles from './impact.module.css';

export const HouseholdImpactPanel: React.FC<HouseholdImpactSlotProps> = ({
  data,
  selectedPersona,
  onPersonaChange,
  isAiOff,
  isLoading = false,
}) => {
  const [activeReceipt, setActiveReceipt] = useState<{
    receipt: SourceReceipt;
    title: string;
  } | null>(null);

  // Maintain local UI state for display mode, which shouldn't pollute the canonical config
  const [isHouseholdMode, setIsHouseholdMode] = useState<boolean>(
    data?.isHouseholdConversion || false
  );

  return (
    <div className={styles.impactContainer}>
      {/* 1. Demographic Persona Archetype Selector */}
      <div className={styles.panelCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span>👤 Household Consumption Archetype</span>
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
            MoSPI HCES 2023–24 Baseline
          </span>
        </div>

        <PersonaSelector
          config={selectedPersona}
          onChange={onPersonaChange}
          isHouseholdMode={isHouseholdMode}
          averageHouseholdSize={data?.averageHouseholdSize}
          onToggleHouseholdMode={setIsHouseholdMode}
        />
      </div>

      {/* 2. Monthly Rupee Impact Metric Card */}
      <div className={styles.panelCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>
            <span>📊 Rupee Spending Impact</span>
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
            Monthly Budget Differential
          </span>
        </div>

        <MonthlyImpactCard
          data={data}
          isAiOff={isAiOff}
          isLoading={isLoading}
          isHouseholdMode={isHouseholdMode}
        />
      </div>

      {/* 3. Itemized Basket Breakdown Table */}
      {data?.itemBreakdown && data.itemBreakdown.length > 0 ? (
        <div className={styles.panelCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <span>📋 Itemized Basket Pass-Through Breakdown</span>
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
              Deterministic Empirical Pass-Through
            </span>
          </div>

          <ItemBreakdownTable
            items={data.itemBreakdown}
            onSelectReceipt={(receipt, title) =>
              setActiveReceipt({ receipt, title })
            }
          />
        </div>
      ) : null}

      {/* Evidence Drawer for Item Receipt Drilldown */}
      {activeReceipt ? (
        <EvidenceDrawer
          receipt={activeReceipt.receipt}
          contextTitle={`Item Receipt: ${activeReceipt.title}`}
          whatCouldBeWrong="Pass-through factors are subject to local supply shocks and transport contract lags."
          onClose={() => setActiveReceipt(null)}
        />
      ) : null}
    </div>
  );
};
