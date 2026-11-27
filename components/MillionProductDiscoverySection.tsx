import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, MessageCircle, Search, SlidersHorizontal } from 'lucide-react';
import {
  buildWhatsAppDiscoveryUrl,
  discoveryCatalogService,
  type DiscoveryProduct,
  type ProductCondition,
} from '../services/discoveryCatalogService';
import { UGANDA_DISCOVERY_CATEGORIES } from '../types';

const UGANDA_LOCATIONS = [
  'All',
  'Kampala',
  'Kampala Road',
  'Nakawa',
  'Wakiso',
  'Entebbe',
  'Mukono',
  'Jinja',
  'Mbarara',
  'Gulu',
];

export function MillionProductDiscoverySection() {
  const { pathname } = useLocation();
  if (pathname !== '/marketplace') return null;

  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState<ProductCondition | ''>('');
  const [location, setLocation] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [items, setItems] = useState<DiscoveryProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const minVal = minPrice.trim() ? Number(minPrice.replace(/[^0-9]/g, '')) : undefined;
    const maxVal = maxPrice.trim() ? Number(maxPrice.replace(/[^0-9]/g, '')) : undefined;

    void discoveryCatalogService
      .searchProducts({
        query,
        brand,
        category,
        condition,
        location,
        minPriceUgx: Number.isFinite(minVal) ? minVal : undefined,
        maxPriceUgx: Number.isFinite(maxVal) ? maxVal : undefined,
        sortBy,
        page,
        pageSize,
      })
      .then((res) => {
        if (!active) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, brand, category, condition, location, minPrice, maxPrice, sortBy, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const listingBaseUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/#` : 'https://www.terrabok.com/#';

  return (
    <section
      aria-label="Uganda Product Discovery Marketplace"
      style={{
        marginTop: '32px',
        padding: '24px',
        borderRadius: '14px',
        border: '1px solid #E6E4DE',
        background: '#FFFFFF',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2C4734' }}>
            UGANDA MARKETPLACE · 1M+ READY (UGX)
          </p>
          <h2 style={{ margin: '4px 0 0', fontSize: '24px' }}>Compare Offers Across Uganda</h2>
        </div>
        <span style={{ fontSize: '12.5px', color: '#6E6D68' }}>
          {loading ? 'Searching indexed catalogue…' : `${total.toLocaleString('en-UG')} products · Page ${page} of ${totalPages}`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6' }}>
          <Search size={14} color="#6E6D68" />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search product or SKU..."
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          />
        </label>

        <input
          type="text"
          value={brand}
          onChange={(e) => { setBrand(e.target.value); setPage(1); }}
          placeholder="Brand (e.g. Samsung)"
          style={{ border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}
        />

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          style={{ border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}
        >
          <option value="All">All 12 Categories</option>
          {UGANDA_DISCOVERY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={condition}
          onChange={(e) => { setCondition(e.target.value as ProductCondition | ''); setPage(1); }}
          style={{ border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}
        >
          <option value="">All Conditions</option>
          <option value="new">New</option>
          <option value="refurbished">Refurbished</option>
          <option value="used">Used</option>
        </select>

        <select
          value={location}
          onChange={(e) => { setLocation(e.target.value); setPage(1); }}
          style={{ border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}
        >
          {UGANDA_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>{loc === 'All' ? 'All UG Locations' : loc}</option>
          ))}
        </select>

        <input
          type="number"
          value={minPrice}
          onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
          placeholder="Min UGX"
          style={{ border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}
        />

        <input
          type="number"
          value={maxPrice}
          onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
          placeholder="Max UGX"
          style={{ border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #D4D0C5', borderRadius: '8px', padding: '8px 10px', background: '#FAF9F6', fontSize: '13px' }}>
          <SlidersHorizontal size={14} color="#6E6D68" />
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setPage(1); }}
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '13px' }}
          >
            <option value="newest">Newest first</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </label>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: '20px', borderRadius: '10px', background: '#FAF9F6', border: '1px dashed #D4D0C5', fontSize: '13.5px', color: '#4A4945' }}>
          {loading
            ? 'Loading marketplace products…'
            : 'No products match this filter on /marketplace yet. Add a name and web URL under Admin -> Product Discovery.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {items.map((prod) => {
            const waUrl = buildWhatsAppDiscoveryUrl({
              whatsappNumber: prod.sellerWhatsapp,
              productName: prod.name,
              priceUgx: prod.priceUgx,
              listingUrl: `${listingBaseUrl}/listings/${encodeURIComponent(prod.id)}`,
              sellerName: prod.sellerName,
            });
            return (
              <article
                key={prod.id}
                style={{
                  border: '1px solid #E6E4DE',
                  borderRadius: '10px',
                  padding: '14px',
                  background: '#FAF9F6',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#6E6D68', fontWeight: 600 }}>
                    {prod.category} · {prod.brand} · {prod.condition}
                  </div>
                  <h3 style={{ margin: '4px 0', fontSize: '16px' }}>
                    <Link to={`/listings/${encodeURIComponent(prod.id)}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {prod.name}
                    </Link>
                  </h3>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#141414' }}>
                    UGX {Math.round(prod.priceUgx).toLocaleString('en-UG')}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4A4945', marginTop: '4px' }}>
                    {prod.sellerName} · {prod.sellerLocation}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary"
                      style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                  {prod.externalUrl && (
                    <a
                      href={prod.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-btn"
                      style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
                    >
                      Store <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {total > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="link-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '12.5px', color: '#6E6D68' }}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="link-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}