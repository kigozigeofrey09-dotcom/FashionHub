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

function resolveShopCover(shop: Shop): string {
  if (shop.coverUrl && shop.coverUrl.trim()) return shop.coverUrl.trim();
  const primary = (shop.categories?.[0] || '').toLowerCase();
  if (primary.includes('shoe') || primary.includes('foot')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80';
  }
  if (primary.includes('bag') || primary.includes('leather')) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80';
  }
  if (primary.includes('jewel') || primary.includes('access')) {
    return 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=80';
  }
  if (primary.includes('tailor') || primary.includes('custom')) {
    return 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80';
  }
  return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80';
}
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
      <section className="hero-grid">
        <div className="market-hero-copy">
          <p className="eyebrow">
            <span className="eyebrow-rule" />
            KAMPALA &amp; UGANDA · EDITORIAL MARKETPLACE
          </p>
          <h1 className="hero-title">
            Effortless style,
            <br />
            <em>made to be found.</em>
          </h1>
          <p className="hero-copy">
            Discover independent designers, everyday essentials, and custom makers across Uganda. Clean silhouettes, direct ordering, and instant sign-in.
          </p>
          <div className="hero-actions">
            <a href="#discover" className="btn-primary">
              Explore the edit <ArrowDown size={15} />
            </a>
            <Link to="/seller/setup" className="btn-secondary">
              Open a shop <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="hero-note">
            <span className="hero-dot" />
            Direct WhatsApp &amp; independent maker storefronts across Kampala
          </div>
        </div>

        <div className="hero-frame">
          <img
            src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=88"
            alt="Editorial lookbook piece in warm natural light"
          />
          <div className="hero-caption-strip">
            <span>
              <strong>Kampala Edit</strong> · Independent makers
            </span>
            <span>Season 2026</span>
          </div>
        </div>
      </section>

      <section id="discover" className="section-block">
        <div className="section-head">
          <div>
            <p className="eyebrow">
              <span className="eyebrow-rule" />
              CURATED COLLECTION
            </p>
            <h2 className="section-title">
              Pieces worth <em>keeping.</em>
            </h2>
          </div>

          <div className="controls-row">
            <label className="search-wrap">
              <Search size={15} className="search-icon" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search pieces, studios, cities..."
                aria-label="Search listings"
              />
            </label>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowMoreFilters((prev) => !prev)}
              style={{ height: '40px', padding: '0 14px' }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
            </button>
          </div>
        </div>

        <div className="category-bar" aria-label="Filter by category">
          {categoryOptions.map((item) => (
            <button
              key={item}
              type="button"
              className={`cat-pill ${category === item ? 'is-active' : ''}`}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {showMoreFilters && (
          <div className="filter-panel">
            <div>
              <label htmlFor="fh-filter-country">Country</label>
              <select
                id="fh-filter-country"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
              >
                <option value="">All countries</option>
                {countries.map((country) => (
                  <option value={country.code} key={country.code}>
                    {country.name} ({country.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="fh-filter-city">City</label>
              {cities.length ? (
                <select
                  id="fh-filter-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                >
                  <option value="">Any city</option>
                  {cities.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="fh-filter-city"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="Any city"
                />
              )}
            </div>

            <div>
              <label htmlFor="fh-filter-type">Type</label>
              <select
                id="fh-filter-type"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                <option value="all">Products &amp; services</option>
                <option value="product">Products only</option>
                <option value="service">Services only</option>
              </select>
            </div>

            <div>
              <label htmlFor="fh-filter-sort">Sort</label>
              <select
                id="fh-filter-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="curated">Curated</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <div>
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                />
                <span>Verified shops only</span>
              </label>
            </div>
          </div>
        )}

        {seedFallback && <SeedNotice />}
        {apiNotice && (
          <Notice tone={demoDataEnabled ? 'warning' : 'error'}>
            {apiNotice}
            {!demoDataEnabled && (
              <button
                className="text-button"
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Retry
              </button>
            )}
          </Notice>
        )}
        {feedback && <Notice tone="info">{feedback}</Notice>}

        <div className="results-strip">
          <span>
            {loading
              ? 'Loading collection...'
              : `${visible.length} ${visible.length === 1 ? 'piece' : 'pieces'} available`}
            {hasActiveFilters && (
              <button
                type="button"
                className="link-btn"
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
          <Link to="/seller/setup" className="link-btn">
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
            <div className="empty-box">
              <h3>No pieces match your search</h3>
              <p>Try clearing your filters or searching for another style.</p>
              <button
                type="button"
                className="btn-secondary"
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

        <div className="section-head" style={{ marginTop: '52px' }}>
          <div>
            <p className="eyebrow">
              <span className="eyebrow-rule" />
              INDEPENDENT STUDIOS
            </p>
            <h2 className="section-title">
              Featured <em>shops.</em>
            </h2>
          </div>
        </div>

        {visibleShops.length ? (
          <div className="shop-grid">
            {visibleShops.map((shop) => (
              <article className="shop-card" key={shop.id}>
                <div className="shop-cover">
                  <img src={resolveShopCover(shop)} alt={shop.name} />
                  <div
                    className="shop-badge-avatar"
                    style={!shop.logoUrl && shop.accent ? { backgroundColor: shop.accent } : undefined}
                  >
                    {shop.logoUrl ? (
                      <img
                        src={shop.logoUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      shop.name.slice(0, 1)
                    )}
                  </div>
                </div>

                <div className="shop-card-body">
                  <p className="eyebrow" style={{ margin: '0 0 4px' }}>
                    {shop.countryCode || 'UG'} · {shop.city || 'Kampala'}
                  </p>
                  <h3 className="shop-card-title">
                    <span>{shop.name}</span>
                    {shop.isVerified && (
                      <span className="verified-chip" title="Verified Storefront">
                        ✓
                      </span>
                    )}
                  </h3>
                  <p className="shop-story">
                    {shop.tagline || (shop.story ? `${shop.story.slice(0, 80)}...` : 'Independent studio')}
                  </p>
                  <div className="chip-list">
                    {shop.categories.map((item) => (
                      <span className="mini-chip" key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <Link to={`/shops/${shop.id}`} className="link-btn" style={{ marginTop: 'auto' }}>
                    Visit shop <span aria-hidden="true">↗</span>
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
        <div>
          <p className="eyebrow">
            <span className="eyebrow-rule" />
            SELL ON FASHIONHUB
          </p>
          <h2>
            Launch your <em>own storefront.</em>
          </h2>
          <p>List your pieces in minutes and reach shoppers directly across Kampala and Uganda.</p>
        </div>
        <Link className="btn-primary" to="/seller/setup">
          Open a shop <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </>
  );
}

