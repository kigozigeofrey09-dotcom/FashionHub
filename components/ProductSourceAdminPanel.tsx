import { useEffect, useState } from 'react';
import { Globe, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { UGANDA_DISCOVERY_CATEGORIES } from '../types';

interface SimpleWebSource {
  id: string;
  name: string;
  url: string;
  createdAt: string;
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function mapSourceRow(row: any): SimpleWebSource {
  const nameVal =
    row?.business_name ?? row?.name ?? row?.title ?? row?.source_name ?? 'Web Source';
  const urlVal =
    row?.website_url ?? row?.website ?? row?.url ?? row?.web_url ?? '';
  return {
    id: String(row?.id ?? ''),
    name: String(nameVal),
    url: String(urlVal),
    createdAt: String(row?.created_at ?? new Date().toISOString()),
  };
}

export function ProductSourceAdminPanel() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [sources, setSources] = useState<SimpleWebSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function loadSources() {
    setLoading(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('product_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) throw new Error(dbErr.message);

      setSources((data || []).map(mapSourceRow));
    } catch (err: any) {
      setError(err?.message || 'Could not load web sources.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSources();
  }, []);

  async function syncStoreProducts(sourceId: string, sourceName: string, storeUrl: string) {
    const cleanHost = hostnameFromUrl(storeUrl);
    const canonicalKey = `web:${cleanHost.toLowerCase().replace(/[^a-z0-9.-]/g, '-')}`;

    const { data: existing, error: selErr } = await supabase
      .from('discovery_products')
      .select('id')
      .eq('source_id', sourceId)
      .limit(1);

    if (selErr) throw new Error(selErr.message);
    if (existing && existing.length > 0) return;

    const { error: insErr } = await supabase.from('discovery_products').insert({
      canonical_product_key: canonicalKey,
      name: `${sourceName} Catalogue`,
      description: `Products from ${sourceName} (${storeUrl}) in Uganda.`,
      brand: sourceName,
      category: UGANDA_DISCOVERY_CATEGORIES[0],
      subcategory: 'Featured Store',
      images: [],
      price_ugx: 0,
      currency: 'UGX',
      product_condition: 'new',
      seller_name: sourceName,
      seller_location: 'Kampala',
      external_url: storeUrl,
      original_source: cleanHost,
      source_type: 'manual_submission',
      source_id: sourceId,
      availability_status: 'in_stock',
      verification_status: 'verified',
      updated_at: new Date().toISOString(),
    });

    if (insErr) throw new Error(insErr.message);
  }

  async function handleAddSource(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanUrl = normalizeUrl(url);
    if (!cleanName || !cleanUrl) {
      setError('Enter both a name and a web URL.');
      return;
    }

    setSubmitting(true);
    setError('');
    setStatus('');
    try {
      const payload: Record<string, any> = {
        name: cleanName,
        business_name: cleanName,
        website_url: cleanUrl,
        website: cleanUrl,
        source_type: 'web_store',
        integration_type: 'manual',
        integration_method: 'manual_submission',
        permission_status: 'authorised',
        refresh_interval_minutes: 1440,
        import_frequency: 'manual',
        country: 'Uganda',
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      const { data, error: insErr } = await supabase
        .from('product_sources')
        .insert(payload)
        .select('*')
        .single();

      if (insErr) throw new Error(insErr.message);

      await syncStoreProducts(String(data.id), cleanName, cleanUrl);

      setName('');
      setUrl('');
      setStatus(`Added "${cleanName}" and published its products to /marketplace.`);
      await loadSources();
    } catch (err: any) {
      setError(err?.message || 'Failed to add web source.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveSource(id: string, sourceName: string) {
    setError('');
    setStatus('');
    try {
      await supabase.from('discovery_products').delete().eq('source_id', id);
      const { error: delErr } = await supabase.from('product_sources').delete().eq('id', id);
      if (delErr) throw new Error(delErr.message);
      setStatus(`Removed "${sourceName}".`);
      await loadSources();
    } catch (err: any) {
      setError(err?.message || 'Could not remove source.');
    }
  }

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #E6E4DE',
        borderRadius: '12px',
        padding: '22px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
            Web Sources
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6E6D68' }}>
            Add a name and web URL to show its products on /marketplace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSources()}
          style={{
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid #D4D0C5',
            background: '#FAF9F6',
            color: '#141414',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {status && <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: '#EEF2EC', color: '#2C4734', fontSize: '13px' }}>{status}</div>}
      {error && <div style={{ marginBottom: '12px', padding: '10px 12px', borderRadius: '8px', background: '#FDF2F2', color: '#8B2626', fontSize: '13px' }}>{error}</div>}

      <form
        onSubmit={(e) => void handleAddSource(e)}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '20px' }}
      >
        <input
          type="text"
          placeholder="Name (e.g. Kampala Electronics)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #D4D0C5', fontSize: '13px' }}
        />
        <input
          type="text"
          placeholder="Web URL (e.g. https://example.ug)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #D4D0C5', fontSize: '13px' }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #2C4734',
            background: '#2C4734',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
          }}
        >
          <Plus size={15} /> {submitting ? 'Adding…' : 'Add Web Source'}
        </button>
      </form>

      {loading ? (
        <p style={{ color: '#6E6D68', fontSize: '13px' }}>Loading…</p>
      ) : sources.length === 0 ? (
        <p style={{ color: '#6E6D68', fontSize: '13px' }}>No web sources added yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {sources.map((src) => (
            <div
              key={src.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #E6E4DE',
                background: '#FAF9F6',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#141414' }}>{src.name}</div>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '12.5px', color: '#2C4734', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <Globe size={12} /> {src.url}
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleRemoveSource(src.id, src.name)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #D4D0C5',
                  background: '#FFFFFF',
                  color: '#8B2626',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={13} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}