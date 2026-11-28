import { useEffect, useState } from 'react';
import { Globe, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

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
  sellerLabel?: string;
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80';

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

function inferMarketplaceCategory(title: string): string {
  const t = title.toLowerCase();
  if (/(shoe|sandal|sneaker|boot|heel|loafer|footwear|slipper)/.test(t)) return 'Shoes';
  if (/(bag|tote|purse|backpack|clutch|pouch)/.test(t)) return 'Bags';
  if (/(ring|necklace|bracelet|earring|chain|jewel)/.test(t)) return 'Jewellery';
  if (/(cap|hat|belt|sunglass|watch|scarf|sock|access)/.test(t)) return 'Accessories';
  if (/(dress|shirt|tee|t-shirt|t shirt|hoodie|jacket|windbreaker|blazer|pant|jean|short|skirt|top|jersey|satin|mesh|set|wear)/.test(t)) {
    return 'Clothing';
  }
  return 'Clothing';
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
      // try next endpoint
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
      // try next endpoint
    }
  }
  return null;
}

function normalizeExtractedImageUrl(rawImg: string, baseOrigin: string): string {
  let clean = rawImg.trim().replace(/^<|>$/g, '');
  if (!clean) return '';

  // Unwrap Next.js image proxy URLs like /_next/image?url=https%3A%2F%2F...&w=640&q=75
  if (clean.includes('/_next/image')) {
    try {
      const fullProxy = clean.startsWith('http') ? clean : `${baseOrigin}${clean.startsWith('/') ? '' : '/'}${clean}`;
      const u = new URL(fullProxy);
      const inner = u.searchParams.get('url');
      if (inner) clean = decodeURIComponent(inner);
    } catch {
      // keep raw
    }
  }

  if (clean.startsWith('//')) return `https:${clean}`;
  if (clean.startsWith('/')) return `${baseOrigin}${clean}`;
  return clean;
}

function isLikelyLogoOrIcon(imgUrl: string): boolean {
  const lower = imgUrl.toLowerCase();
  return /(logo|favicon|icon|sprite|avatar|banner-bg|placeholder)/i.test(lower);
}

function parseJinaMarkdownProducts(
  md: string,
  baseOrigin: string,
  fallbackUrl: string,
  storeName: string,
  seenNames: Set<string>
): ScrapedItem[] {
  const found: ScrapedItem[] = [];
  const skipWords =
    /^(home|shop|about|about us|contact|contact us|cart|bag|checkout|login|log in|sign in|register|account|my account|privacy|privacy policy|terms|terms of service|refund|shipping|menu|search|view all|see all|learn more|read more|instagram|facebook|twitter|tiktok|whatsapp|youtube|subscribe|next|previous|prev|discover fashion|thrifter)$/i;
  const priceLineRegex =
    /^(?:UGX|USh|Shs)\s*([0-9][0-9,]*)|^([0-9]{1,3}(?:,[0-9]{3})+)\s*(?:UGX|USh|Shs|\/=)$/i;

  const lines = md
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length && found.length < 60; i++) {
    const headingMatch = lines[i].match(/^#{2,4}\s+(.+)$/);
    if (!headingMatch) continue;

    const rawTitle = headingMatch[1]
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_`]/g, '')
      .trim();
    if (!rawTitle || rawTitle.length < 2 || skipWords.test(rawTitle)) continue;

    let matchedPrice = 0;
    let subSeller = '';
    let priceLineIdx = -1;

    for (let j = i + 1; j <= Math.min(lines.length - 1, i + 6); j++) {
      if (/^#{2,4}\s+/.test(lines[j])) break;
      const pMatch = lines[j].match(priceLineRegex);
      if (pMatch) {
        const digits = (pMatch[1] || pMatch[2] || '0').replace(/,/g, '');
        const val = Number(digits);
        if (Number.isFinite(val) && val > 0) {
          matchedPrice = val;
          priceLineIdx = j;
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

    // Search nearby lines before the heading and up to 4 lines after the price for a real product image
    const startSearch = Math.max(0, i - 4);
    const endSearch = Math.min(lines.length - 1, (priceLineIdx >= 0 ? priceLineIdx : i) + 4);
    let resolvedImg = '';

    for (let k = startSearch; k <= endSearch; k++) {
      if (k > i && /^#{2,4}\s+/.test(lines[k])) break;
      const imgMatches = [...lines[k].matchAll(/!\[[^\]]*\]\(([^\s)]+)\)/g)];
      for (const im of imgMatches) {
        const candidate = normalizeExtractedImageUrl(im[1], baseOrigin);
        if (candidate && !isLikelyLogoOrIcon(candidate)) {
          resolvedImg = candidate;
          break;
        }
      }
      if (resolvedImg) break;
    }

    found.push({
      name: rawTitle,
      description: subSeller
        ? `${rawTitle} · ${subSeller} (via ${storeName})`
        : `${rawTitle} · Imported from ${storeName}`,
      priceUgx: matchedPrice,
      imageUrl: resolvedImg || DEFAULT_FALLBACK_IMAGE,
      productUrl: fallbackUrl,
      sellerLabel: subSeller || storeName,
    });
  }

  return found;
}
function extractHtmlProductImages(html: string, baseOrigin: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  const imgTagRegex = /<img\b[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = imgTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0];
    const srcMatch =
      tag.match(/\b(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i) ||
      tag.match(/\bsrcset=["']([^\s,"']+)/i);
    if (!srcMatch?.[1]) continue;

    const normalized = normalizeExtractedImageUrl(srcMatch[1], baseOrigin);
    if (!normalized || isLikelyLogoOrIcon(normalized)) continue;
    if (normalized.startsWith('data:image/svg+xml')) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
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
      const img = Array.isArray(p?.images) && p.images[0]?.src ? String(p.images[0].src) : DEFAULT_FALLBACK_IMAGE;
      const handle = p?.handle ? `${baseOrigin}/products/${p.handle}` : storeUrl;
      items.push({
        name: title,
        description: stripHtml(String(p?.body_html || `${title} from ${storeName}`)).slice(0, 300),
        priceUgx: Number.isFinite(rawPrice) && rawPrice > 0 ? Math.round(rawPrice) : 0,
        imageUrl: img,
        productUrl: handle,
        sellerLabel: storeName,
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
      const img = Array.isArray(p?.images) && p.images[0]?.src ? String(p.images[0].src) : DEFAULT_FALLBACK_IMAGE;
      items.push({
        name: title,
        description: stripHtml(String(p?.short_description || p?.description || `${title} from ${storeName}`)).slice(0, 300),
        priceUgx: Number.isFinite(priceUgx) && priceUgx > 0 ? priceUgx : 0,
        imageUrl: img,
        productUrl: p?.permalink ? String(p.permalink) : storeUrl,
        sellerLabel: storeName,
      });
    }
    if (items.length > 0) return items;
  }

  // Pull real <img> tags from the storefront HTML so products get actual site photos instead of fallback stock images
  const html = await fetchTextWithFallback(storeUrl);
  const htmlImages = html ? extractHtmlProductImages(html, baseOrigin) : [];
  let htmlImgCursor = 0;

  // 3. Rendered storefront + catalog subpaths via r.jina.ai
  const pagesToScan = Array.from(
    new Set([storeUrl, `${baseOrigin}/shop`, `${baseOrigin}/products`, `${baseOrigin}/collections/all`])
  );

  for (const targetPage of pagesToScan) {
    if (items.length >= 25) break;
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${targetPage}`);
      if (!jinaRes.ok) continue;
      const md = await jinaRes.text();
      const extracted = parseJinaMarkdownProducts(md, baseOrigin, targetPage, storeName, seenNames);
      for (const prod of extracted) {
        if (prod.imageUrl === DEFAULT_FALLBACK_IMAGE && htmlImgCursor < htmlImages.length) {
          prod.imageUrl = htmlImages[htmlImgCursor];
          htmlImgCursor += 1;
        }
        items.push(prod);
      }
    } catch {
      // try next page
    }
  }
  if (items.length > 0) return items;

  // 4. Raw HTML JSON-LD fallback
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
            const rawImg = Array.isArray(node.image) ? String(node.image[0] || '') : String(node.image || '');
            const normalizedImg = normalizeExtractedImageUrl(rawImg, baseOrigin) || htmlImages[htmlImgCursor++] || DEFAULT_FALLBACK_IMAGE;
            items.push({
              name: title,
              description: stripHtml(String(node.description || `${title} from ${storeName}`)).slice(0, 300),
              priceUgx: Number.isFinite(price) && price > 0 ? Math.round(price) : 0,
              imageUrl: normalizedImg,
              productUrl: node.url ? String(node.url) : storeUrl,
              sellerLabel: storeName,
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

  async function ensureShopForSource(sourceName: string, storeUrl: string): Promise<string | null> {
    const { data: existingShops } = await supabase
      .from('shops')
      .select('id')
      .eq('name', sourceName)
      .limit(1);

    if (existingShops && existingShops.length > 0 && existingShops[0]?.id) {
      return String(existingShops[0].id);
    }

    const { data: authData } = await supabase.auth.getUser();
    const ownerId = authData?.user?.id || null;

    const shopPayload: Record<string, any> = {
      name: sourceName,
      story: `Synced catalogue from ${storeUrl}`,
      tagline: `Imported web store · ${hostnameFromUrl(storeUrl)}`,
      categories: ['Clothing', 'Shoes', 'Bags'],
      sell_type: 'both',
      country_code: 'UG',
      country_name: 'Uganda',
      city: 'Kampala',
      cover_url: DEFAULT_FALLBACK_IMAGE,
      is_verified: true,
      subscription_status: 'active',
    };
    if (ownerId) {
      shopPayload.owner_id = ownerId;
    }

    const { data: insertedShop, error: shopErr } = await supabase
      .from('shops')
      .insert(shopPayload)
      .select('id')
      .single();

    if (shopErr) {
      throw new Error(`Shop creation for "${sourceName}" failed: ${shopErr.message}`);
    }
    return insertedShop?.id ? String(insertedShop.id) : null;
  }

  async function syncStoreProducts(sourceName: string, storeUrl: string): Promise<number> {
    const scraped = await extractProductsFromStore(storeUrl, sourceName);

    const rowsToInsert: ScrapedItem[] =
      scraped.length > 0
        ? scraped
        : [
            {
              name: `${sourceName} Featured Piece`,
              description: `Explore ${sourceName} (${storeUrl}) in Kampala, Uganda.`,
              priceUgx: 0,
              imageUrl: DEFAULT_FALLBACK_IMAGE,
              productUrl: storeUrl,
              sellerLabel: sourceName,
            },
          ];

    const shopId = await ensureShopForSource(sourceName, storeUrl);

    await supabase.from('listings').delete().eq('shop_name', sourceName).eq('is_seed', false);

    const payload = rowsToInsert.map((item) => {
      const img = item.imageUrl || DEFAULT_FALLBACK_IMAGE;
      const listingRow: Record<string, any> = {
        shop_name: sourceName,
        name: item.name,
        category: inferMarketplaceCategory(item.name),
        type: 'product',
        description: `${item.description} · Source: ${item.productUrl || storeUrl}`,
        price: item.priceUgx,
        currency: 'UGX',
        country_code: 'UG',
        country_name: 'Uganda',
        city: 'Kampala',
        image: img,
        images: [img],
        is_active: true,
        is_seed: false,
      };
      if (shopId) {
        listingRow.shop_id = shopId;
      }
      return listingRow;
    });

    const { error: insErr } = await supabase.from('listings').insert(payload);
    if (insErr) {
      throw new Error(`Listings insert failed: ${insErr.message}`);
    }

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
          if (s.url) {
            totalProducts += await syncStoreProducts(s.name, s.url);
          }
        }
        setStatus(
          `Synced ${totalProducts} listing${totalProducts === 1 ? '' : 's'} across ${mapped.length} web source${mapped.length === 1 ? '' : 's'} straight into your product listings.`
        );
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

      const count = await syncStoreProducts(cleanName, cleanUrl);

      setName('');
      setUrl('');
      setStatus(
        `Added "${cleanName}" and published ${count} product${count === 1 ? '' : 's'} straight to your product listings.`
      );
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
      await supabase.from('listings').delete().eq('shop_name', sourceName).eq('is_seed', false);
      const { error: delErr } = await supabase.from('product_sources').delete().eq('id', id);
      if (delErr) throw new Error(delErr.message);
      setStatus(`Removed "${sourceName}" and its synced listings.`);
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
            Add a name and web URL to import products straight into your product listings.
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
          placeholder="Name (e.g. thrifter)"
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