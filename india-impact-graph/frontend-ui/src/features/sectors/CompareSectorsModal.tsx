import React, { useState } from 'react';
import { SectorId } from './types';
import { SECTORS_DATA, SECTOR_CATEGORIES } from './sectorsData';
import styles from './CompareSectorsModal.module.css';

export interface CompareSectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSectorIdA?: SectorId;
}

export const CompareSectorsModal: React.FC<CompareSectorsModalProps> = ({
  isOpen,
  onClose,
  defaultSectorIdA = 'semiconductors',
}) => {
  const [sectorA, setSectorA] = useState<SectorId>(defaultSectorIdA);
  const [sectorB, setSectorB] = useState<SectorId>(
    defaultSectorIdA === 'petrol' ? 'semiconductors' : 'petrol'
  );

  if (!isOpen) return null;

  const dataA = SECTORS_DATA[sectorA];
  const dataB = SECTORS_DATA[sectorB];

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      onClick={onClose}
    >
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 id="compare-modal-title" className={styles.modalTitle}>
            Cross-Sector Vulnerability Comparison
          </h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close Comparison Modal"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Selectors */}
          <div className={styles.sectorSelectRow}>
            <span className={styles.selectLabel}>Select Sectors:</span>
            <div className={styles.selectBoxes}>
              <select
                className={styles.selectInput}
                value={sectorA}
                onChange={(e) => setSectorA(e.target.value as SectorId)}
                aria-label="Sector A"
              >
                {SECTOR_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <span className={styles.vsBadge}>VS</span>

              <select
                className={styles.selectInput}
                value={sectorB}
                onChange={(e) => setSectorB(e.target.value as SectorId)}
                aria-label="Sector B"
              >
                {SECTOR_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <table className={styles.compareTable}>
            <thead>
              <tr>
                <th className={styles.tableHeaderCell}>Indicator</th>
                <th className={styles.tableHeaderCell}>{dataA.name}</th>
                <th className={styles.tableHeaderCell}>{dataB.name}</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.tableRow}>
                <td className={styles.featureCell}>Import Dependence</td>
                <td className={styles.valCell}>
                  {dataA.importDependence.totalDependencePct}% ({dataA.importDependence.totalLabel})
                </td>
                <td className={styles.valCell}>
                  {dataB.importDependence.totalDependencePct}% ({dataB.importDependence.totalLabel})
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.featureCell}>6-Month Benchmark Trend</td>
                <td className={styles.valCell}>{dataA.kpis[0]?.change || 'N/A'}</td>
                <td className={styles.valCell}>{dataB.kpis[0]?.change || 'N/A'}</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.featureCell}>Most Exposed Downstream Sector</td>
                <td className={styles.valCell}>
                  {dataA.downstreamImpacts[0]?.name} ({dataA.downstreamImpacts[0]?.keyEffectPct})
                </td>
                <td className={styles.valCell}>
                  {dataB.downstreamImpacts[0]?.name} ({dataB.downstreamImpacts[0]?.keyEffectPct})
                </td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.featureCell}>Direct Household Channel</td>
                <td className={styles.valCell}>{dataA.details.householdConnection}</td>
                <td className={styles.valCell}>{dataB.details.householdConnection}</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.featureCell}>Global Supply Share</td>
                <td className={styles.valCell}>{dataA.details.globalShare}</td>
                <td className={styles.valCell}>{dataB.details.globalShare}</td>
              </tr>
              <tr className={styles.tableRow}>
                <td className={styles.featureCell}>Primary Policy Cushion</td>
                <td className={styles.valCell}>{dataA.takeaways[3]?.text || dataA.takeaways[0]?.text}</td>
                <td className={styles.valCell}>{dataB.takeaways[3]?.text || dataB.takeaways[0]?.text}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.doneBtn} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
