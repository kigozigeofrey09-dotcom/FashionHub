import { useEffect, useState } from 'react';
import {
  buildCsvTemplate,
  discoveryCatalogService,
  type CsvRowPreview,
  type ProductImportLog,
  type ProductSourceRecord,
  type SourceIntegrationMethod,
  type SourcePermissionStatus,
} from '../services/discoveryCatalogService';
import { UGANDA_DISCOVERY_CATEGORIES } from '../types';

export function ProductSourceAdminPanel() {
  const [sources, setSources] = useState<ProductSourceRecord[]>([]);
  const [logs, setLogs] = useState<ProductImportLog[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [savingSource, setSavingSource] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [integrationMethod, setIntegrationMethod] = useState<SourceIntegrationMethod>('csv_import');
  const [permissionStatus, setPermissionStatus] = useState<SourcePermissionStatus>('authorised');
  const [importFrequency, setImportFrequency] = useState<'hourly' | 'daily' | 'weekly' | 'manual'>('daily');
  const [apiEndpoint, setApiEndpoint] = useState('');

  const [csvText, setCsvText] = useState(() => buildCsvTemplate());
  const [previewRows, setPreviewRows] = useState<CsvRowPreview[]>([]);
  const [previewCounts, setPreviewCounts] = useState({ valid: 0, invalid: 0, duplicate: 0 });
  const [skipDuplicates, setSkipDuplicates] = useState(true);

  const [intelSummary, setIntelSummary] = useState({
    totalCatalogProducts: 0,
    uniqueCanonicalKeys: 0,
    activeSources: 0,
    authorisedSources: 0,
    verifiedOffers: 0,
    categoryCount: UGANDA_DISCOVERY_CATEGORIES.length,
  });

  async function refreshAll() {
    setLoading(true);
    setErrorMessage('');
    try {
      const [srcList, importLogs, sampleSearch] = await Promise.all([
        discoveryCatalogService.listSources(),
        discoveryCatalogService.listImportLogs(),
        discoveryCatalogService.searchProducts({ page: 1, pageSize: 100 }),
      ]);
      setSources(srcList);
      setLogs(importLogs);
      if (srcList.length > 0 && !selectedSourceId) {
        setSelectedSourceId(srcList[0].id);
      }

      const uniqueKeys = new Set(sampleSearch.items.map((p) => p.canonicalProductKey).filter(Boolean));
      const verifiedCount = sampleSearch.items.filter((p) => p.verificationStatus === 'verified').length;

      setIntelSummary({
        totalCatalogProducts: sampleSearch.total,
        uniqueCanonicalKeys: uniqueKeys.size,
        activeSources: srcList.filter((s) => s.status === 'active').length,
        authorisedSources: srcList.filter((s) => s.permissionStatus === 'authorised').length,
        verifiedOffers: verifiedCount,
        categoryCount: UGANDA_DISCOVERY_CATEGORIES.length,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load Product Source Manager data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  const activeSource = sources.find((s) => s.id === selectedSourceId) || sources[0] || null;

  function handleDownloadTemplate() {
    const template = buildCsvTemplate();
    setCsvText(template);
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'terrabok-uganda-products-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleCreateSource(e: React.FormEvent) {
    e.preventDefault();
    if (!businessName.trim()) {
      setErrorMessage('Business name is required.');
      return;
    }
    setSavingSource(true);
    setErrorMessage('');
    setStatusMessage('');
    try {
      const created = await discoveryCatalogService.upsertSource({
        businessName,
        website,
        contactName,
        contactPhone,
        contactEmail,
        integrationMethod,
        permissionStatus,
        importFrequency,
        status: 'active',
        apiEndpoint: integrationMethod === 'api_feed' ? apiEndpoint : undefined,
      });
      setBusinessName('');
      setWebsite('');
      setContactName('');
      setContactPhone('');
      setContactEmail('');
      setApiEndpoint('');
      if (created?.id) setSelectedSourceId(created.id);
      setStatusMessage(`Saved product source "${created?.businessName || businessName}".`);
      await refreshAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not save product source.');
    } finally {
      setSavingSource(false);
    }
  }

  async function handleToggleSourceStatus(src: ProductSourceRecord) {
    setErrorMessage('');
    setStatusMessage('');
    try {
      await discoveryCatalogService.upsertSource({
        ...src,
        status: src.status === 'active' ? 'suspended' : 'active',
      });
      setStatusMessage(`Updated ${src.businessName} status.`);
      await refreshAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Could not update source status.');
    }
  }

  async function handlePreviewCsv() {
    setErrorMessage('');
    setStatusMessage('');
    if (!activeSource) {
      setErrorMessage('Register or select a product source first.');
      return;
    }
    const res = await discoveryCatalogService.previewCsvImport(csvText, activeSource);
    setPreviewRows(res.rows);
    setPreviewCounts({
      valid: res.validCount,
      invalid: res.invalidCount,
      duplicate: res.duplicateCount,
    });
  }

  async function handleCommitCsv() {
    setErrorMessage('');
    setStatusMessage('');
    if (!activeSource) {
      setErrorMessage('Select an authorised product source first.');
      return;
    }
    if (previewRows.length === 0) {
      setErrorMessage('Preview rows before importing.');
      return;
    }
    setImportingCsv(true);
    try {
      const result = await discoveryCatalogService.commitCsvBatch(previewRows, activeSource, skipDuplicates);
      setStatusMessage(
        `Imported ${result.imported} products for ${activeSource.businessName} (${result.skippedDuplicates} duplicates skipped, ${result.invalid} invalid rows).`
      );
      setPreviewRows([]);
      await refreshAll();
    } catch (err: any) {
      setErrorMessage(err?.message || 'CSV import failed.');
    } finally {
      setImportingCsv(false);
    }
  }

  return (
    <section className="admin-discovery-section">
      <h2>Product Intelligence</h2>
      <p>
        Uganda discovery catalogue telemetry (UGX). TerraBok operates as a product discovery and offer comparison
        engine connecting shoppers directly to sellers via WhatsApp or original store links.
      </p>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <strong>{intelSummary.totalCatalogProducts.toLocaleString('en-UG')}</strong>
          <span>Indexed Products</span>
        </div>
        <div className="stat-card">
          <strong>{intelSummary.uniqueCanonicalKeys.toLocaleString('en-UG')}</strong>
          <span>Canonical Product Groups (Sampled)</span>
        </div>
        <div className="stat-card">
          <strong>{intelSummary.activeSources}</strong>
          <span>Active Sources (UG)</span>
        </div>
        <div className="stat-card">
          <strong>{intelSummary.authorisedSources}</strong>
          <span>Authorised Sources</span>
        </div>
        <div className="stat-card">
          <strong>{intelSummary.verifiedOffers}</strong>
          <span>Verified Offers (Sampled)</span>
        </div>
        <div className="stat-card">
          <strong>{intelSummary.categoryCount}</strong>
          <span>Uganda Categories</span>
        </div>
      </div>

      {statusMessage && <div className="notice notice-success" style={{ marginBottom: '1rem' }}>{statusMessage}</div>}
      {errorMessage && <div className="notice notice-error" style={{ marginBottom: '1rem' }}>{errorMessage}</div>}

      <h2>Product Source Manager</h2>
      <p>
        Register authorised Ugandan retailers, wholesalers, distributors, and manufacturers. Only active, authorised
        sources can import products.
      </p>

      <form onSubmit={(e) => void handleCreateSource(e)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Business name *"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          required
        />
        <input
          type="url"
          placeholder="Website (https://...)"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <input
          type="text"
          placeholder="Contact person"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
        />
        <input
          type="text"
          placeholder="WhatsApp / Phone (e.g. 256700...)"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
        />
        <input
          type="email"
          placeholder="Contact email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
        <select value={integrationMethod} onChange={(e) => setIntegrationMethod(e.target.value as SourceIntegrationMethod)}>
          <option value="csv_import">CSV Importer</option>
          <option value="api_feed">API Feed</option>
          <option value="manual_submission">Manual Product Submission</option>
        </select>
        <select value={permissionStatus} onChange={(e) => setPermissionStatus(e.target.value as SourcePermissionStatus)}>
          <option value="authorised">Permission: Authorised</option>
          <option value="pending">Permission: Pending</option>
          <option value="revoked">Permission: Revoked</option>
        </select>
        <select value={importFrequency} onChange={(e) => setImportFrequency(e.target.value as any)}>
          <option value="hourly">Frequency: Hourly</option>
          <option value="daily">Frequency: Daily</option>
          <option value="weekly">Frequency: Weekly</option>
          <option value="manual">Frequency: Manual</option>
        </select>
        {integrationMethod === 'api_feed' && (
          <input
            type="url"
            placeholder="Supplier API feed endpoint (HTTPS)"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
          />
        )}
        <button type="submit" className="button button-dark" disabled={savingSource}>
          {savingSource ? 'Saving Source…' : 'Register Source'}
        </button>
      </form>

      {loading ? (
        <p>Loading product sources…</p>
      ) : sources.length === 0 ? (
        <p>No product sources registered yet.</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Business</th>
                <th>Method</th>
                <th>Permission</th>
                <th>Frequency</th>
                <th>Last Sync</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr key={src.id}>
                  <td>
                    <strong>{src.businessName}</strong>
                    {src.website && <div><small>{src.website}</small></div>}
                  </td>
                  <td>{src.integrationMethod}</td>
                  <td>{src.permissionStatus}</td>
                  <td>{src.importFrequency}</td>
                  <td>{src.lastSyncedAt ? new Date(src.lastSyncedAt).toLocaleString() : 'Never'}</td>
                  <td>{src.status}</td>
                  <td>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setSelectedSourceId(src.id)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Select for CSV
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => void handleToggleSourceStatus(src)}
                    >
                      {src.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3>CSV Importer (Validate, Preview &amp; Batch Import)</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <label>
          Target Source:{' '}
          <select value={selectedSourceId} onChange={(e) => setSelectedSourceId(e.target.value)}>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName} ({s.permissionStatus}, {s.status})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="button button-outline" onClick={handleDownloadTemplate}>
          Download CSV Template
        </button>
        <button type="button" className="button button-outline" onClick={() => void handlePreviewCsv()}>
          Validate &amp; Preview Rows
        </button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="checkbox"
            checked={skipDuplicates}
            onChange={(e) => setSkipDuplicates(e.target.checked)}
          />
          Skip duplicate canonical SKUs
        </label>
        <button
          type="button"
          className="button button-dark"
          disabled={importingCsv || previewRows.length === 0}
          onClick={() => void handleCommitCsv()}
        >
          {importingCsv ? 'Importing Batch…' : 'Commit Valid Rows'}
        </button>
      </div>

      <textarea
        rows={6}
        style={{ width: '100%', fontFamily: 'monospace', marginBottom: '0.75rem' }}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
      />

      {previewRows.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <p>
            Preview: <strong>{previewCounts.valid}</strong> new valid ·{' '}
            <strong>{previewCounts.duplicate}</strong> duplicates ·{' '}
            <strong>{previewCounts.invalid}</strong> invalid
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Product</th>
                  <th>Brand / Category</th>
                  <th>Price (UGX)</th>
                  <th>State</th>
                  <th>Issues</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r) => (
                  <tr key={r.rowNumber}>
                    <td>{r.rowNumber}</td>
                    <td>{r.product?.name || '—'}</td>
                    <td>{r.product ? `${r.product.brand} · ${r.product.category}` : '—'}</td>
                    <td>{r.product ? `UGX ${r.product.priceUgx.toLocaleString('en-UG')}` : '—'}</td>
                    <td>{!r.valid ? 'Invalid' : r.duplicateOfExisting ? 'Duplicate' : 'Ready'}</td>
                    <td>{r.errors.join('; ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <h3>Recent Import &amp; Sync Logs</h3>
      {logs.length === 0 ? (
        <p>No import batches logged yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Method</th>
                <th>Imported</th>
                <th>Duplicates</th>
                <th>Invalid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                  <td>{l.sourceName}</td>
                  <td>{l.importMethod}</td>
                  <td>{l.importedCount}</td>
                  <td>{l.duplicateCount}</td>
                  <td>{l.invalidCount}</td>
                  <td>{l.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}