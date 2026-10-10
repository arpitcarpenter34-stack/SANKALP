import React from 'react';
import type { ItemImpactRow, SourceReceipt } from '../../types/contracts';
import styles from './impact.module.css';

export interface ItemBreakdownTableProps {
  items: ItemImpactRow[];
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
            const isCalculated = row.status === 'calculated';

            return (
              <tr
                key={row.itemId}
                className={!isCalculated ? styles.tableRowUnavailable : undefined}
              >
                <td style={{ fontWeight: 600 }}>{row.itemName}</td>

                <td>
                  {isCalculated && typeof row.spendingInr === 'number'
                    ? `₹${row.spendingInr.toFixed(2)}`
                    : '—'}
                </td>

                <td>
                  {typeof row.expenditureWeightPct === 'number'
                    ? `${row.expenditureWeightPct.toFixed(1)}%`
                    : '—'}
                </td>

                <td>
                  {isCalculated && typeof row.upstreamShockPct === 'number'
                    ? `+${row.upstreamShockPct.toFixed(1)}%`
                    : '—'}
                </td>

                <td>
                  {isCalculated &&
                  typeof row.passThroughLow === 'number' &&
                  typeof row.passThroughHigh === 'number'
                    ? `${row.passThroughLow.toFixed(2)} - ${row.passThroughHigh.toFixed(2)}`
                    : <span className={styles.unavailBadge}>Data not available</span>}
                </td>

                <td style={{ fontWeight: isCalculated ? 700 : 400, color: isCalculated ? 'var(--primary-teal)' : undefined }}>
                  {isCalculated &&
                  typeof row.monthlyImpactLowInr === 'number' &&
                  typeof row.monthlyImpactHighInr === 'number'
                    ? `+₹${row.monthlyImpactLowInr.toFixed(2)} to +₹${row.monthlyImpactHighInr.toFixed(2)}`
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
                      {row.receipt.verification_status}
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
