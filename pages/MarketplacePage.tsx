import { useDeferredValue, useEffect, useState } from 'react';
import { ArrowDown, ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, ListingCard, Loading, Notice, SeedNotice } from '../components/ui';
import { seedListings, seedShops } from '../data/seed';
import { errorMessage } from '../services/http';
import { accountService } from '../services/accountService';
import { marketplaceService } from '../services/marketplaceService';
import { useAppContext } from '../context/AppContext';
import { demoDataEnabled } from '../config/features';
import type { Listing, Shop } from '../types';

const categoryOptions = [
  'All finds',
  'Clothing',
  'Shoes',
  'Bags',
  'Jewellery',
  'Beauty',
  'Tailoring',
  'Accessories',
  'Beds & Curtains',
  'Pet Fashion (PAW)',
  'Other',
];

export function MarketplacePage() {
  const { countries } = useAppContext();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState('All finds');
  const [countryCode, setCountryCode] = useState('');
  const [city, setCity] = useState('');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('curated');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [listings, setListings] = useState<Listing[]>(demoDataEnabled ? seedListings : []);
  const [shops, setShops] = useState<Shop[]>(demoDataEnabled ? seedShops : []);
  const [loading, setLoading] = useState(true);
  const [seedFallback, setSeedFallback] = useState(demoDataEnabled);
  const [apiNotice, setApiNotice] = useState('');
  const [feedback, setFeedback] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (countryCode) params.set('country', countryCode);
    if (city.trim()) params.set('city', city.trim());
    if (category !== 'All finds') params.set('category', category);
    if (kind !== 'all') params.set('type', kind);
    if (deferredQuery.trim()) params.set('q', deferredQuery.trim());
    if (sort === 'price-asc') params.set('sort', sort);
    setLoading(true);
    Promise.allSettled([
      marketplaceService.searchListings(params),
      marketplaceService.searchShops(params),
    ])
      .then(([listingResult, shopResult]) => {
        if (!active) return;
        const listingFailed = listingResult.status === 'rejected';
        const shopsFailed = shopResult.status === 'rejected';
        setListings(listingFailed ? (demoDataEnabled ? seedListings : []) : listingResult.value);
        setShops(shopsFailed ? (demoDataEnabled ? seedShops : []) : shopResult.value);
        setSeedFallback(demoDataEnabled && (listingFailed || shopsFailed));
        setApiNotice(
          listingFailed || shopsFailed
            ? demoDataEnabled
              ? 'Marketplace APIs are not connected. Showing clearly marked development seed data.'
              : 'Could not reach the live marketplace. Start the backend and try again.'
            : ''
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, countryCode, city, kind, deferredQuery, sort, retryCount]);

  let visible = listings.filter((listing) => {
    const matchCategory =
      category === 'All finds' ||
      listing.category === category ||
      (category === 'Tailoring' && listing.type === 'service');
    const matchCountry = !countryCode || listing.countryCode === countryCode;
    const matchCity = !city.trim() || listing.city.toLowerCase().includes(city.trim().toLowerCase());
    const matchKind = kind === 'all' || listing.type === kind;
    const term = deferredQuery.trim().toLowerCase();
    const matchQuery =
      !term ||
      [
        listing.name,
        listing.shopName,
        listing.description,
        listing.city,
        listing.countryName,
        listing.category,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    return matchCategory && matchCountry && matchCity && matchKind && matchQuery;
  });
  if (sort === 'price-asc') visible = [...visible].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') visible = [...visible].sort((a, b) => b.price - a.price);

  const visibleShops = shops.filter((shop) => {
    const term = deferredQuery.trim().toLowerCase();
    const matchCountry = !countryCode || shop.countryCode === countryCode;
    const matchCity = !city.trim() || shop.city.toLowerCase().includes(city.trim().toLowerCase());
    const matchCategory =
      category === 'All finds' ||
      shop.categories.includes(category as (typeof shop.categories)[number]) ||
      (category === 'Tailoring' && shop.sellType !== 'products');
    const matchKind = kind === 'all' || shop.sellType === 'both' || shop.sellType === `${kind}s`;
    const matchVerified = !verifiedOnly || shop.isVerified;
    const matchQuery =
      !term ||
      [shop.name, shop.story, shop.tagline, shop.city, shop.countryName, ...shop.categories]
        .join(' ')
        .toLowerCase()
        .includes(term);
    return matchCountry && matchCity && matchCategory && matchKind && matchVerified && matchQuery;
  });

  async function saveListing(listing: Listing) {
    setFeedback('');
    try {
      await accountService.saveListing(listing.id);
      setFeedback('Saved item updated.');
    } catch (error) {
      setFeedback(errorMessage(error));
    }
  }

  const selectedCountry = countries.find((country) => country.code === countryCode);
  const cities = selectedCountry?.cities ?? [];
  const hasActiveFilters = Boolean(
    query || category !== 'All finds' || countryCode || city || kind !== 'all' || verifiedOnly
  );

  return (
    <>
      <section className="market-hero">
        <div className="market-hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-line" />
            CURATED EDITORIAL · KAMPALA &amp; BEYOND
          </p>
          <h1>
            Effortless style,
            <br />
            <em>made to be found.</em>
          </h1>
          <p>
            Discover independent designers, everyday essentials, and custom makers across Uganda. Clean silhouettes, direct ordering, and instant sign-in.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <a href="#discover" className="button button-dark">
              Shop the collection <ArrowDown size={15} />
            </a>
            <Link to="/auth/sign-in" className="button button-outline">
              Quick sign in <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="hero-foot">
            <span className="hero-dot" />
            Direct Mobile Money &amp; independent shop checkout
          </div>
        </div>

        <div className="market-hero-art">
          <img
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=88"
            alt="Editorial fashion lookbook piece"
          />
          <div className="hero-stamp">
            <span>NEW</span>
            <strong>
              SEASON
              <br />
              EDIT
            </strong>
            <span>2026</span>
          </div>
          <p>
            Kampala Studio Edit <span>01 / 04</span>
          </p>
        </div>
      </section>

      <section id="discover" className="discover-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE COLLECTION</p>
            <h2>
              Curated pieces <em>for you.</em>
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', justifyContent: 'flex-end', minWidth: '240px' }}>
            <label className="search-box" style={{ width: '100%', maxWidth: '340px' }}>
              <Search size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search pieces, brands, cities..."
                aria-label="Search listings"
              />
            </label>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setShowMoreFilters((prev) => !prev)}
              style={{ minHeight: '42px', padding: '0 14px', whiteSpace: 'nowrap' }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="filter-row" aria-label="Filter by category">
          {categoryOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`filter-chip ${category === item ? 'is-selected' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {showMoreFilters && (
          <div className="discovery-filters">
            <label>
              Country
              <select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
                <option value="">All countries</option>
                {countries.map((country) => (
                  <option value={country.code} key={country.code}>
                    {country.name} ({country.currency})
                  </option>
                ))}
              </select>
            </label>

            <label>
              City
              {cities.length ? (
                <select value={city} onChange={(event) => setCity(event.target.value)}>
                  <option value="">Any city</option>
                  {cities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Any city"
                />
              )}
            </label>

            <label>
              Type
              <select value={kind} onChange={(event) => setKind(event.target.value)}>
                <option value="all">Products &amp; services</option>
                <option value="product">Products only</option>
                <option value="service">Services only</option>
              </select>
            </label>

            <label>
              Sort
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="curated">Curated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '8px' }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <span>Verified shops only</span>
            </label>
          </div>
        )}

        {seedFallback && <SeedNotice />}
        {apiNotice && (
          <Notice tone={demoDataEnabled ? 'warning' : 'error'}>
            {apiNotice}
            {!demoDataEnabled && (
              <button className="text-button" type="button" onClick={() => setRetryCount((count) => count + 1)}>
                Retry
              </button>
            )}
          </Notice>
        )}
        {feedback && <Notice tone="info">{feedback}</Notice>}

        <div className="results-meta">
          <span>
            {loading
              ? 'Loading collection...'
              : `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'} available`}
            {hasActiveFilters && (
              <button
                type="button"
                className="text-button"
                style={{ marginLeft: '12px' }}
                onClick={() => {
                  setQuery('');
                  setCategory('All finds');
                  setCountryCode('');
                  setCity('');
                  setKind('all');
                  setVerifiedOnly(false);
                }}
              >
                Reset filters
              </button>
            )}
          </span>
          <Link to="/seller/setup">
            Open your shop <span aria-hidden="true">↗</span>
          </Link>
        </div>

        {loading && <Loading label="Loading pieces..." />}

        {visible.length > 0 ? (
          <div className="product-grid">
            {visible.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onSave={saveListing} />
            ))}
          </div>
        ) : (
          !loading && (
            <div className="empty-state">
              <span className="empty-mark">*</span>
              <h2>No pieces match your search</h2>
              <p>Try clearing your filters or searching for another style.</p>
              <button
                type="button"
                className="button button-outline"
                onClick={() => {
                  setQuery('');
                  setCategory('All finds');
                  setCountryCode('');
                  setCity('');
                  setKind('all');
                  setVerifiedOnly(false);
                }}
              >
                Show all pieces
              </button>
            </div>
          )
        )}

        <div className="section-heading compact">
          <div>
            <p className="eyebrow">INDEPENDENT STUDIOS</p>
            <h2>
              Featured <em>shops.</em>
            </h2>
          </div>
        </div>

        {visibleShops.length ? (
          <div className="shop-grid">
            {visibleShops.map((shop) => (
              <article
                className="shop-card"
                key={shop.id}
                style={{
                  border: '1px solid var(--line)',
                  background: 'var(--white)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div style={{ height: '130px', background: '#eceae4', position: 'relative' }}>
                  <img
                    src={
                      shop.coverUrl ||
                      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={shop.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-18px',
                      left: '16px',
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: '2px solid var(--white)',
                      overflow: 'hidden',
                      background: 'var(--white)',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {shop.logoUrl ? (
                      <img src={shop.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)' }}>
                        {shop.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ padding: '24px 16px 16px' }}>
                  <p className="eyebrow" style={{ margin: '0 0 4px' }}>
                    {shop.countryCode} · {shop.city}
                  </p>
                  <h3 style={{ margin: '0 0 4px', font: '500 18px var(--serif)' }}>
                    {shop.name}{' '}
                    {shop.isVerified && (
                      <span style={{ color: '#141414', fontSize: '12px' }} title="Verified Storefront">
                        ✓
                      </span>
                    )}
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', color: 'var(--muted)', lineHeight: '1.5' }}>
                    {shop.tagline || (shop.story ? `${shop.story.slice(0, 65)}...` : 'Independent studio')}
                  </p>
                  <div className="preview-collections" style={{ marginBottom: '12px' }}>
                    {shop.categories.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <Link
                    to={`/shops/${shop.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--ink)',
                      fontSize: '11px',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Visit shop <span>↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !loading && (
            <EmptyState title="No shops match these filters">
              Try clearing your filters to view all studios.
            </EmptyState>
          )
        )}
      </section>

      <section className="maker-band">
        <span className="maker-icon">*</span>
        <div>
          <p className="eyebrow">SELL ON FASHIONHUB</p>
          <h2>
            Launch your <em>own storefront.</em>
          </h2>
        </div>
        <p>List your pieces in minutes and reach shoppers directly across Uganda.</p>
        <Link className="button button-dark" to="/seller/setup">
          Open a shop <span>↗</span>
        </Link>
      </section>
    </>
  );
}

