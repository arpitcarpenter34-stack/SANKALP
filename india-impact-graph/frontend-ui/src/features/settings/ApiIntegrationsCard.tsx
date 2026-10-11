import React, { useState } from 'react';
import { ApiIntegrationsState, ExportFormat } from './types';
import styles from './ApiIntegrationsCard.module.css';

interface ApiIntegrationsCardProps {
  integrations: ApiIntegrationsState;
  onChangeIntegrations: (integrations: ApiIntegrationsState) => void;
}

export const ApiIntegrationsCard: React.FC<ApiIntegrationsCardProps> = ({
  integrations,
  onChangeIntegrations,
}) => {
  const [activeModal, setActiveModal] = useState<'api_key' | 'connect' | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleGenerateKey = () => {
    onChangeIntegrations({
      ...integrations,
      hasApiKey: true,
      createdAt: new Date().toISOString(),
    });
    setActiveModal('api_key');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText('bi_live_7a9f82d1e04b94c25f');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className={styles.card} id="settings-api-card">
      <div className={styles.header}>
        <h2 className={styles.title}>API & Integrations</h2>
        <p className={styles.subtitle}>Connect with external tools and platforms.</p>
      </div>

      <div className={styles.itemList}>
        {/* Item 1: API Access */}
        <div className={styles.rowItem}>
          <div className={styles.leftGroup}>
            <div className={`${styles.iconBadge} ${styles.iconBadgePurple}`} aria-hidden="true">
              &lt;/&gt;
            </div>
            <div className={styles.textGroup}>
              <h3 className={styles.rowTitle}>API Access</h3>
              <p className={styles.rowDesc}>Get API key to access BharatImpact data.</p>
            </div>
          </div>
          <button type="button" className={styles.actionBtn} onClick={handleGenerateKey}>
            {integrations.hasApiKey ? 'View API Key' : 'Generate API Key'}
          </button>
        </div>

        {/* Item 2: Integrations */}
        <div className={styles.rowItem}>
          <div className={styles.leftGroup}>
            <div className={`${styles.iconBadge} ${styles.iconBadgeTeal}`} aria-hidden="true">
              🔗
            </div>
            <div className={styles.textGroup}>
              <h3 className={styles.rowTitle}>Integrations</h3>
              <p className={styles.rowDesc}>
                Connect with your favorite tools (Excel, Google Sheets, etc.).
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setActiveModal('connect')}
          >
            Connect
          </button>
        </div>

        {/* Item 3: Export Settings */}
        <div className={styles.rowItem}>
          <div className={styles.leftGroup}>
            <div className={`${styles.iconBadge} ${styles.iconBadgeEmerald}`} aria-hidden="true">
              📥
            </div>
            <div className={styles.textGroup}>
              <h3 className={styles.rowTitle}>Export Settings</h3>
              <p className={styles.rowDesc}>Choose default format for data exports.</p>
            </div>
          </div>
          <select
            className={styles.select}
            value={integrations.defaultExportFormat}
            onChange={(e) =>
              onChangeIntegrations({
                ...integrations,
                defaultExportFormat: e.target.value as ExportFormat,
              })
            }
            aria-label="Default format for data exports"
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="markdown">Markdown</option>
          </select>
        </div>
      </div>

      {activeModal === 'api_key' && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>BharatImpact Developer API Key</h3>
            <p className={styles.modalText}>
              Use this key in the <code>Authorization: Bearer &lt;TOKEN&gt;</code> header to query
              macroeconomic scenario projections and commodity pass-through tables programmatically.
            </p>
            <div className={styles.codeBox}>
              <span>bi_live_7a9f82d1e04b94c25f</span>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  background: '#047857',
                  border: 'none',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                }}
              >
                {copiedKey ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className={styles.modalText} style={{ fontSize: '0.76rem', color: '#64748b' }}>
              🔒 <strong>Security Warning:</strong> Keep your API key secret. Do not commit keys into
              public git repositories or expose them in browser scripts.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'connect' && (
        <div className={styles.modalBackdrop} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Tool Connectors (Excel & Google Sheets)</h3>
            <p className={styles.modalText}>
              Connect live macroeconomic data directly into Microsoft Excel or Google Sheets using
              our REST web queries:
            </p>
            <div
              style={{
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                marginBottom: '14px',
                border: '1px solid #e2e8f0',
              }}
            >
              =WEBSERVICE(&quot;http://localhost:8000/api/registries/consumption-items&quot;)
            </div>
            <p className={styles.modalText} style={{ fontSize: '0.76rem', color: '#047857' }}>
              ✔ Direct CSV import compatible with Excel PowerQuery and Google Sheets <code>IMPORTDATA</code>.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
