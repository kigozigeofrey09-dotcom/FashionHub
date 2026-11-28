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

interface ScrapedItem {
  name: string;
  description: string;
  priceUgx: number;
  imageUrl: string;
  productUrl: string;
  sku?: string;
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchJsonWithFallback(targetUrl: string): Promise<any | null> {
  const attempts = [
    targetUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  ];
  for (const endpoint of attempts) {
    try {
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next
    }
  }
  return null;
}

async function fetchTextWithFallback(targetUrl: string): Promise<string | null> {
  const attempts = [
    targetUrl,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
  ];
  for (const endpoint of attempts) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      return await res.text();
    } catch {
      // try next
    }
  }
  return null;
}

function parseJinaMarkdownProducts(
  md: string,
  baseOrigin: string,
  fallbackUrl: string,
  storeName: string,
  seenNames: Set<string>
): ScrapedItem[] {
  const found: ScrapedItem[] = [];
  const skipWords = /^(home|shop|about|about us|contact|contact us|cart|bag|checkout|login|log in|sign in|register|account|my account|privacy|privacy policy|terms|terms of service|refund|shipping|menu|search|view all|see all|learn more|read more|instagram|facebook|twitter|tiktok|whatsapp|youtube|subscribe|next|previous|prev|discover fashion|thrifter)$/i;
  const priceLineRegex = /^(?:UGX|USh|Shs)\s*([0-9][0-9,]*)|^([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UGX|USh|Shs|\/=)$/i;

  // Pattern 0: Markdown ### headings paired with a nearby UGX / USh / Shs price line
  const lines = md.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length && found.length < 60; i++) {
    const headingMatch = lines[i].match(/^#{2,4}\s+(.+)$/);
    if (!headingMatch) continue;

    const rawTitle = headingMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();
    if (!rawTitle || rawTitle.length < 2 || skipWords.test(rawTitle)) continue;

    // Look ahead up to 5 non-empty lines for a price line and optional sub-brand
    let matchedPrice = 0;
    let subSeller = '';
    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 5); j++) {
      if (/^#{2,4}\s+/.test(lines[j])) break;
      const pMatch = lines[j].match(priceLineRegex);
      if (pMatch) {
        const digits = (pMatch[1] || pMatch[2] || '0').replace(/,/g, '');
        const val = Number(digits);
        if (Number.isFinite(val) && val > 0) {
          matchedPrice = val;
        }
        break;
      }
      if (!subSeller && !lines[j].startsWith('![') && !lines[j].startsWith('http')) {
        subSeller = lines[j].replace(/[*_`]/g, '').trim();
      }
    }

    if (matchedPrice <= 0) continue;
    const key = rawTitle.toLowerCase();
    if (seenNames.has(key)) continue;
    seenNames.add(key);

    const lookback = lines.slice(Math.max(0, i - 3), i).join(' ');
    const imgMatch = lookback.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);

    found.push({
      name: rawTitle,
      description: subSeller
        ? `${rawTitle} by ${subSeller} via ${storeName} (${baseOrigin}).`
        : `${rawTitle} from ${storeName} (${baseOrigin}).`,
      priceUgx: matchedPrice,
      imageUrl: imgMatch ? imgMatch[1] : '',
      productUrl: fallbackUrl,
    });
  }

  if (found.length > 0) return found;

  // Pattern A: Markdown links (absolute or relative) paired with product paths or UGX/USh prices
  const linkRegex = /\[([^\]]{2,110})\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(md)) !== null && found.length < 60) {
    const rawLabel = m[1].replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    let href = m[2].trim();
    if (href.startsWith('/')) href = `${baseOrigin}${href}`;

    if (!rawLabel || rawLabel.length < 2 || skipWords.test(rawLabel)) continue;
    if (/\.(png|jpe?g|webp|gif|svg|css|js)(\?|$)/i.test(href)) continue;

    const isProductPath = /\/(product|products|item|items|listing|listings|p|shop|collection|collections|wear|outfit|dress|shoe|bag|shirt|top|pant|jacket|hoodie|sneaker|watch|accessory|accessories)\/[^/?#]+/i.test(href);
    const windowSlice = md.slice(Math.max(0, m.index - 180), Math.min(md.length, m.index + 380));
    const priceMatch = windowSlice.match(/(?:UGX|USh|Shs)\s*([0-9][0-9,]{2,})|([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UGX|USh|Shs|\/=)/i);
    const imgMatch = windowSlice.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);

    if (isProductPath || priceMatch) {
      const cleanTitle = rawLabel
        .replace(/(?:UGX|USh|Shs)\s*[0-9,]+/gi, '')
        .replace(/[0-9]{1,3}(?:,[0-9]{3})+\s*(?:UGX|USh|Shs|\/=)/gi, '')
        .trim() || rawLabel;
      if (cleanTitle.length < 2 || skipWords.test(cleanTitle)) continue;
      if (seenNames.has(cleanTitle.toLowerCase())) continue;
      seenNames.add(cleanTitle.toLowerCase());

      const rawDigits = priceMatch ? (priceMatch[1] || priceMatch[2] || '0').replace(/,/g, '') : '0';
      const parsedPrice = Number(rawDigits);
      found.push({
        name: cleanTitle,
        description: `${cleanTitle} from ${storeName} (${baseOrigin}).`,
        priceUgx: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0,
        imageUrl: imgMatch ? imgMatch[1] : '',
        productUrl: href || fallbackUrl,
      });
    }
  }

  // Pattern B: Card blocks with Image + Title + UGX price even when link is on a "Buy / View" button
  if (found.length === 0) {
    for (let i = 0; i < lines.length && found.length < 60; i++) {
      const priceMatch = lines[i].match(/(?:UGX|USh|Shs)\s*([0-9][0-9,]{2,})|([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UGX|USh|Shs|\/=)/i);
      if (!priceMatch) continue;
      const candidateTitle = (lines[i - 1] || '')
        .replace(/^#+\s*/, '')
        .replace(/[*_`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
      if (!candidateTitle || candidateTitle.length < 3 || candidateTitle.length > 90 || skipWords.test(candidateTitle)) continue;
      if (seenNames.has(candidateTitle.toLowerCase())) continue;
      seenNames.add(candidateTitle.toLowerCase());

      const contextBlock = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join(' ');
      const imgMatch = contextBlock.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/);
      const linkMatch = contextBlock.match(/\[[^\]]+\]\(((?:https?:\/\/|\/)[^\s)]+)\)/);
      let productUrl = linkMatch ? linkMatch[1] : fallbackUrl;
      if (productUrl.startsWith('/')) productUrl = `${baseOrigin}${productUrl}`;

      const rawDigits = (priceMatch[1] || priceMatch[2] || '0').replace(/,/g, '');
      const parsedPrice = Number(rawDigits);
      found.push({
        name: candidateTitle,
        description: `${candidateTitle} from ${storeName} (${baseOrigin}).`,
        priceUgx: Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0,
        imageUrl: imgMatch ? imgMatch[1] : '',
        productUrl,
      });
    }
  }

  return found;
}
async function extractProductsFromStore(storeUrl: string, storeName: string): Promise<ScrapedItem[]> {
  const baseOrigin = (() => {
    try {
      return new URL(storeUrl).origin;
    } catch {
      return storeUrl.replace(/\/+$/, '');
    }
  })();

  const items: ScrapedItem[] = [];
  const seenNames = new Set<string>();

  // 1. Shopify /products.json
  const shopifyData = await fetchJsonWithFallback(`${baseOrigin}/products.json?limit=50`);
  if (shopifyData && Array.isArray(shopifyData.products) && shopifyData.products.length > 0) {
    for (const p of shopifyData.products) {
      const title = String(p?.title || '').trim();
      if (!title || seenNames.has(title.toLowerCase())) continue;
      seenNames.add(title.toLowerCase());
      const variant = Array.isArray(p?.variants) ? p.variants[0] : null;
      const rawPrice = Number(variant?.price ?? 0);
      const img = Array.isArray(p?.images) && p.images[0]?.src ? String(p.images[0].src) : '';
      const handle = p?.handle ? `${baseOrigin}/products/${p.handle}` : storeUrl;
      items.push({
        name: title,
        description: stripHtml(String(p?.body_html || `${title} from ${storeName}`)).slice(0, 300),
        priceUgx: Number.isFinite(rawPrice) && rawPrice > 0 ? Math.round(rawPrice) : 0,
        imageUrl: img,
        productUrl: handle,
        sku: variant?.sku ? String(variant.sku) : undefined,
      });
    }
    if (items.length > 0) return items;
  }

  // 2. WooCommerce Store API
  const wooData = await fetchJsonWithFallback(`${baseOrigin}/wp-json/wc/store/v1/products?per_page=50`);
  if (Array.isArray(wooData) && wooData.length > 0) {
    for (const p of wooData) {
      const title = String(p?.name || '').trim();
      if (!title || seenNames.has(title.toLowerCase())) continue;
      seenNames.add(title.toLowerCase());
      const minorUnit = Number(p?.prices?.currency_minor_unit ?? 0);
      const rawMinor = Number(p?.prices?.price ?? 0);
      const priceUgx = minorUnit > 0 ? Math.round(rawMinor / Math.pow(10, minorUnit)) : Math.round(rawMinor);
      const img = Array.isArray(p?.images) && p.images[0]?.src ? String(p.images[0].src) : '';
      items.push({
        name: title,
        description: stripHtml(String(p?.short_description || p?.description || `${title} from ${storeName}`)).slice(0, 300),
        priceUgx: Number.isFinite(priceUgx) && priceUgx > 0 ? priceUgx : 0,
        imageUrl: img,
        productUrl: p?.permalink ? String(p.permalink) : storeUrl,
        sku: p?.sku ? String(p.sku) : undefined,
      });
    }
    if (items.length > 0) return items;
  }

  // 3. Rendered storefront + common catalog paths via r.jina.ai
  const pagesToScan = Array.from(
    new Set([
      storeUrl,
      `${baseOrigin}/shop`,
      `${baseOrigin}/products`,
      `${baseOrigin}/collections/all`,
    ])
  );

  for (const targetPage of pagesToScan) {
    if (items.length >= 20) break;
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${targetPage}`);
      if (!jinaRes.ok) continue;
      const md = await jinaRes.text();
      const extracted = parseJinaMarkdownProducts(md, baseOrigin, targetPage, storeName, seenNames);
      items.push(...extracted);
    } catch {
      // try next catalog page
    }
  }
  if (items.length > 0) return items;

  // 4. Raw HTML JSON-LD fallback
  const html = await fetchTextWithFallback(storeUrl);
  if (html) {
    const ldMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of ldMatches) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
        for (const node of nodes) {
          if (node?.['@type'] === 'Product' && node?.name) {
            const title = String(node.name).trim();
            if (seenNames.has(title.toLowerCase())) continue;
            seenNames.add(title.toLowerCase());
            const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            const price = Number(offers?.price ?? 0);
            const img = Array.isArray(node.image) ? String(node.image[0] || '') : String(node.image || '');
            items.push({
              name: title,
              description: stripHtml(String(node.description || `${title} from ${storeName}`)).slice(0, 300),
              priceUgx: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
              imageUrl: img,
              productUrl: node.url ? String(node.url) : storeUrl,
              sku: node.sku ? String(node.sku) : undefined,
            });
          }
        }
      } catch {
        // ignore invalid JSON-LD
      }
    }
  }

  return items;
}
export function ProductSourceAdminPanel() {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [sources, setSources] = useState<SimpleWebSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function syncStoreProducts(sourceId: string, sourceName: string, storeUrl: string): Promise<number> {
    const cleanHost = hostnameFromUrl(storeUrl);
    const scraped = await extractProductsFromStore(storeUrl, sourceName);

    const rowsToInsert: ScrapedItem[] =
      scraped.length > 0
        ? scraped
        : [
            {
              name: `${sourceName} Catalogue`,
              description: `Explore products from ${sourceName} (${storeUrl}) in Uganda.`,
              priceUgx: 0,
              imageUrl: '',
              productUrl: storeUrl,
            },
          ];

    await supabase.from('discovery_products').delete().eq('source_id', sourceId);

    const payload = rowsToInsert.map((item, idx) => {
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
      const canonicalKey = item.sku
        ? `sku:${item.sku.toLowerCase().replace(/[^a-z0-9_-]/g, '')}`
        : `web:${cleanHost}:${slug}:${idx}`;
      return {
        canonical_product_key: canonicalKey,
        name: item.name,
        description: item.description,
        brand: sourceName,
        category: UGANDA_DISCOVERY_CATEGORIES[0],
        subcategory: scraped.length > 0 ? 'Catalogue Item' : 'Featured Store',
        images: item.imageUrl ? [item.imageUrl] : [],
        price_ugx: item.priceUgx,
        currency: 'UGX',
        product_condition: 'new',
        seller_name: sourceName,
        seller_location: 'Kampala',
        external_url: item.productUrl || storeUrl,
        original_source: cleanHost,
        source_type: 'manual_submission',
        source_id: sourceId,
        availability_status: 'in_stock',
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      };
    });

    const { error: insErr } = await supabase.from('discovery_products').insert(payload);
    if (insErr) throw new Error(`Product insert failed: ${insErr.message}`);

    return payload.length;
  }

  async function loadSources(runSync = false) {
    setLoading(true);
    setError('');
    try {
      const { data, error: dbErr } = await supabase
        .from('product_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbErr) throw new Error(dbErr.message);

      const mapped = (data || []).map(mapSourceRow);
      setSources(mapped);

      if (runSync) {
        let totalProducts = 0;
        for (const s of mapped) {
          if (s.id && s.url) {
            totalProducts += await syncStoreProducts(s.id, s.name, s.url);
          }
        }
        setStatus(`Synced ${totalProducts} product${totalProducts === 1 ? '' : 's'} across ${mapped.length} web source${mapped.length === 1 ? '' : 's'} to /marketplace.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not load or sync web sources.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSources(false);
  }, []);

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
      const basePayload: Record<string, any> = {
        name: cleanName,
        business_name: cleanName,
        website_url: cleanUrl,
        website: cleanUrl,
        integration_type: 'manual',
        integration_method: 'manual_submission',
        refresh_interval_minutes: 1440,
        import_frequency: 'manual',
        country: 'Uganda',
        status: 'active',
        updated_at: new Date().toISOString(),
      };

      const permissionCandidates = ['authorised', 'approved', 'authorized', 'pending'];
      const sourceTypeCandidates = ['retailer', 'supplier', 'seller', 'manufacturer'];
      let insertedRow: any = null;
      let lastErrMsg = '';

      outerLoop: for (const srcType of sourceTypeCandidates) {
        for (const perm of permissionCandidates) {
          const { data, error: insErr } = await supabase
            .from('product_sources')
            .insert({ ...basePayload, source_type: srcType, permission_status: perm })
            .select('*')
            .single();

          if (!insErr && data) {
            insertedRow = data;
            break outerLoop;
          }
          lastErrMsg = insErr?.message || 'Insert failed';
          const isCheckErr =
            lastErrMsg.includes('product_sources_permission_status_check') ||
            lastErrMsg.includes('product_sources_source_type_check');
          if (!isCheckErr) {
            throw new Error(lastErrMsg);
          }
        }
      }

      if (!insertedRow) {
        throw new Error(lastErrMsg || 'Failed to insert product source.');
      }

      const count = await syncStoreProducts(String(insertedRow.id), cleanName, cleanUrl);

      setName('');
      setUrl('');
      setStatus(`Added "${cleanName}" and published ${count} product${count === 1 ? '' : 's'} to /marketplace.`);
      await loadSources(false);
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
      await loadSources(false);
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
            Add a name and web URL to import and show its products on /marketplace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadSources(true)}
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
          <RefreshCw size={13} /> Sync &amp; Refresh
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
          placeholder="Name (e.g. Thrifter UG)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #D4D0C5', fontSize: '13px' }}
        />
        <input
          type="text"
          placeholder="Web URL (e.g. https://www.thrifter-ug.com)"
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
          <Plus size={15} /> {submitting ? 'Importing…' : 'Add Web Source'}
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