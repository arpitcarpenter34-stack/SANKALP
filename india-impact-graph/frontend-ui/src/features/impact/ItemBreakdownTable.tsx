import React from 'react';
import type { PersonaItemImpact, SourceReceipt } from '../../types/contracts';
import styles from './impact.module.css';

export interface ItemBreakdownTableProps {
  items: PersonaItemImpact[];
  onSelectReceipt?: (receipt: SourceReceipt, title: string) => void;
}

export const ItemBreakdownTable: React.FC<ItemBreakdownTableProps> = ({
  items,
  onSelectReceipt,
}) => {
  if (!items || items.length === 0) {
    return (
      <div style={{ padding: '16px', color: 'var(--muted-text)', fontSize: '13px' }}>
        No item-level breakdown data available for this persona.
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.impactTable} aria-label="Itemized Consumption Basket Impact Breakdown">
        <thead>
          <tr>
            <th>Consumption Item</th>
            <th>Monthly Base (INR)</th>
            <th>Basket Share</th>
            <th>Upstream Shock</th>
            <th>Pass-Through (β)</th>
            <th>Net Monthly Range</th>
            <th>Provenance</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const isCalculated = row.dataStatus === 'available';

            return (
              <tr
                key={row.itemId}
                className={!isCalculated ? styles.tableRowUnavailable : undefined}
              >
                <td style={{ fontWeight: 600 }}>{row.itemName}</td>

                <td>
                  {/* Not in canonical contract yet */}
                  —
                </td>

                <td>
                  {typeof row.budgetSharePct === 'number'
                    ? `${row.budgetSharePct.toFixed(1)}%`
                    : '—'}
                </td>

                <td>
                  {/* Not in canonical contract yet */}
                  —
                </td>

                <td>
                  {isCalculated &&
                  row.passThroughFactor
                    ? `${row.passThroughFactor.low.toFixed(2)} - ${row.passThroughFactor.high.toFixed(2)}`
                    : <span className={styles.unavailBadge}>Data not available</span>}
                </td>

                <td style={{ fontWeight: isCalculated ? 700 : 400, color: isCalculated ? 'var(--primary-teal)' : undefined }}>
                  {isCalculated &&
                  row.estimatedMonthlyImpactInr
                    ? `+₹${row.estimatedMonthlyImpactInr.low.toFixed(2)} to +₹${row.estimatedMonthlyImpactInr.high.toFixed(2)}`
                    : <span className={styles.unavailBadge}>Data not available</span>}
                </td>

                <td>
                  {row.receipt && onSelectReceipt ? (
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--primary-teal)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                      }}
                      onClick={() => onSelectReceipt(row.receipt!, row.itemName)}
                    >
                      View Receipt ↗
                    </button>
                  ) : row.receipt ? (
                    <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                      {row.receipt.verificationStatus}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                      Unverified
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
