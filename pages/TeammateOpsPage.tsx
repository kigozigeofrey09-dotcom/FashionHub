import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, ShieldCheck, AlertTriangle, RefreshCw, Search,
  CheckCircle2, XCircle, ArrowUpRight, Compass, Check, Send, Copy
} from 'lucide-react';
import { Loading, Notice } from '../components/ui';
import { useAppContext } from '../context/AppContext';
import { adminService } from '../services/adminService';
import { shopService } from '../services/shopService';
import { listingService } from '../services/listingService';
import { errorMessage } from '../services/http';
import type { Listing, SafetyReport, Shop } from '../types';

export const TEAMMATE_EMAIL = 'semmyarsene0@gmail.com';

function buildSellerNudgeMessage(shop: Shop, listingCount: number): string {
  if (listingCount === 0) {
    return `Hi ${shop.name}, this is Seller Ops at FashionHub Kampala. We noticed your shop is set up with 0 live listings yet—reply here if you need help uploading your first pieces so buyers can discover you.`;
  }
  return `Hi ${shop.name}, this is Seller Ops at FashionHub Kampala. We're reviewing your storefront (${listingCount} active listing${listingCount === 1 ? '' : 's'}) for verification—let us know if you have any updates.`;
}

function buildSellerWhatsAppNudgeUrl(shop: Shop, listingCount: number): string {
  const digits = (shop.whatsappNumber || '').replace(/[^\d]/g, '');
  const phone = digits.startsWith('0') && digits.length === 10 ? `256${digits.slice(1)}` : digits;
  const text = encodeURIComponent(buildSellerNudgeMessage(shop, listingCount));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

export function TeammateOpsPage() {
  const { session } = useAppContext();
  const navigate = useNavigate();
  const [section, setSection] = useState<'all' | 'journey' | 'verifications' | 'reports'>('all');
  const [journeyFilter, setJourneyFilter] = useState<'all' | 'needs-listings' | 'unverified'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [shops, setShops] = useState<Shop[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [reportNotes, setReportNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const currentEmail = (session?.user?.email || '').trim().toLowerCase();
  const isAssignedTeammate = currentEmail === TEAMMATE_EMAIL.toLowerCase();

  async function loadOpsData() {
    setLoading(true);
    setError('');
    try {
      const [shopsRes, listingsRes, reportsRes] = await Promise.all([
        shopService.list(),
        listingService.search(new URLSearchParams()).catch(() => [] as Listing[]),
        adminService.reportsQueue(),
      ]);
      setShops(shopsRes);
      setListings(listingsRes);
      setReports(reportsRes);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOpsData();
  }, []);

  async function handleCopyNudge(shop: Shop, listingCount: number) {
    const msg = buildSellerNudgeMessage(shop, listingCount);
    try {
      await navigator.clipboard.writeText(msg);
      setFeedback(`Copied onboarding nudge for ${shop.name}.`);
    } catch {
      setFeedback(`Nudge ready for ${shop.name}: ${msg}`);
    }
  }

  async function handleToggleVerify(shop: Shop) {
    setBusyId(shop.id);
    setError('');
    setFeedback('');
    try {
      const updated = await adminService.verifyShop(shop.id, !shop.isVerified);
      setShops((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setFeedback(`${updated.name} is now ${updated.isVerified ? 'Verified' : 'Unverified'}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId('');
    }
  }

  async function handleReportAction(reportId: string, nextStatus: 'resolved' | 'dismissed') {
    setBusyId(reportId);
    setError('');
    setFeedback('');
    const note = (reportNotes[reportId] || '').trim();
    try {
      const updated = await adminService.reviewReport(reportId, nextStatus);
      setReports((prev) =>
        prev.map((item) =>
          item.id === reportId
            ? { ...item, status: updated.status || nextStatus, details: note ? `${item.details ? `${item.details} · ` : ''}[Note: ${note}]` : item.details }
            : item
        )
      );
      setFeedback(`Report marked as ${nextStatus}${note ? ` (${note})` : ''}.`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId('');
    }
  }

  const listingCountByShop = listings.reduce<Record<string, number>>((acc, item) => {
    if (item.shopId) {
      acc[item.shopId] = (acc[item.shopId] || 0) + 1;
    }
    return acc;
  }, {});

  const q = searchTerm.trim().toLowerCase();

  const journeyShops = shops.filter((shop) => {
    const count = listingCountByShop[shop.id] || 0;
    if (journeyFilter === 'needs-listings' && count > 0) return false;
    if (journeyFilter === 'unverified' && shop.isVerified) return false;
    if (!q) return true;
    return [shop.name, shop.city, shop.countryName, ...(shop.categories || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const filteredShopsForVerify = shops.filter(
    (shop) =>
      !q ||
      [shop.name, shop.city, shop.countryName, shop.isVerified ? 'verified' : 'pending']
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
  );

  const filteredReports = reports.filter(
    (rep) =>
      !q ||
      [rep.id, rep.reason, rep.details, rep.status, rep.listingId]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
  );

  const verifiedCount = shops.filter((s) => s.isVerified).length;
  const zeroListingShops = shops.filter((s) => (listingCountByShop[s.id] || 0) === 0).length;
  const openReportCount = reports.filter((r) => (r.status || 'open') === 'open').length;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', color: '#141414', padding: '28px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header
          style={{
            background: '#FFFFFF',
            border: '1px solid #E6E4DE',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  background: '#2C4734',
                  color: '#FFFFFF',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                }}
              >
                Seller &amp; Trust Desk
              </span>
              <span style={{ fontSize: '12px', color: '#6E6D68' }}>
                Assigned Operator: <strong>{TEAMMATE_EMAIL}</strong>
              </span>
            </div>
            <h1 style={{ margin: '8px 0 4px', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '32px', fontWeight: 500 }}>
              Seller Journey, Verifications &amp; <em>Reports.</em>
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: '#5A5852' }}>
              Signed in as: <strong>{session?.user?.email || 'Guest / Unauthenticated'}</strong>
              {isAssignedTeammate ? ' · Verified Teammate Operator' : ''}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#6E6D68" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shops or reports..."
                style={{
                  background: '#FAF9F6',
                  border: '1px solid #D4D0C5',
                  borderRadius: '8px',
                  padding: '8px 12px 8px 34px',
                  fontSize: '12.5px',
                  color: '#141414',
                  width: '220px',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => void loadOpsData()}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #D4D0C5',
                background: '#FFFFFF',
                color: '#141414',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} /> Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '8px 13px',
                borderRadius: '8px',
                border: '1px solid #141414',
                background: '#141414',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              Storefront <ArrowUpRight size={13} />
            </button>
          </div>
        </header>

        {!session && (
          <Notice tone="info">
            Sign in with <strong>{TEAMMATE_EMAIL}</strong> to track your teammate session. You can still inspect live shops and reports below.
          </Notice>
        )}
        {feedback && <Notice tone="success">{feedback}</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {loading && <Loading label="Loading seller journey, verifications & reports..." />}

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Total Shops in Journey', value: shops.length, sub: `${zeroListingShops} need first listing` },
            { label: 'Verified Shops', value: verifiedCount, sub: `${Math.max(0, shops.length - verifiedCount)} awaiting verification` },
            { label: 'Open Safety Reports', value: openReportCount, sub: `${reports.length} total logged` },
            { label: 'Active Catalog Items', value: listings.length, sub: 'Across onboarded shops' },
          ].map((card) => (
            <div key={card.label} style={{ background: '#FFFFFF', border: '1px solid #E6E4DE', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5A5852' }}>{card.label}</div>
              <div style={{ fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '32px', fontWeight: 600, marginTop: '6px' }}>
                {loading ? '—' : card.value}
              </div>
              <div style={{ fontSize: '11.5px', color: '#2C4734', fontWeight: 500, marginTop: '6px' }}>{card.sub}</div>
            </div>
          ))}
        </section>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Workstreams' },
            { id: 'journey', label: '1. Seller Journey' },
            { id: 'verifications', label: '2. Shop Verifications' },
            { id: 'reports', label: '3. Safety Reports' },
          ].map((tab) => {
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id as typeof section)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  border: active ? '1px solid #2C4734' : '1px solid #D4D0C5',
                  background: active ? '#2C4734' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#141414',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {(section === 'all' || section === 'journey') && (
          <section style={{ background: '#FFFFFF', border: '1px solid #E6E4DE', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} color="#2C4734" />
                <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                  Seller Journey &amp; Onboarding Readiness
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Shops' },
                  { id: 'needs-listings', label: 'Needs Listings (0)' },
                  { id: 'unverified', label: 'Unverified' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setJourneyFilter(f.id as typeof journeyFilter)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: '7px',
                      border: '1px solid #D4D0C5',
                      background: journeyFilter === f.id ? '#F3F0E8' : '#FFFFFF',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {journeyShops.map((shop) => {
                const count = listingCountByShop[shop.id] || 0;
                const stage =
                  shop.isVerified && count > 0
                    ? 'Active & Verified'
                    : count > 0
                    ? 'Catalog Live · Awaiting Verification'
                    : 'Onboarding · Needs First Listing';

                return (
                  <div
                    key={shop.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: '#FAF9F6',
                      border: '1px solid #E6E4DE',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{shop.name}</div>
                      <div style={{ fontSize: '12px', color: '#6E6D68' }}>
                        {shop.city}, {shop.countryName} · {count} listing{count === 1 ? '' : 's'} · Stage: <strong>{stage}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => void handleCopyNudge(shop, count)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '7px',
                          border: '1px solid #D4D0C5',
                          background: '#FFFFFF',
                          color: '#141414',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        <Copy size={12} /> Copy Nudge
                      </button>
                      <a
                        href={buildSellerWhatsAppNudgeUrl(shop, count)}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '7px',
                          border: '1px solid #2C4734',
                          background: '#EEF2EC',
                          color: '#2C4734',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Send size={12} /> WhatsApp Seller
                      </a>
                      <Link
                        to={`/shops/${shop.id}`}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '7px',
                          border: '1px solid #D4D0C5',
                          background: '#FFFFFF',
                          color: '#141414',
                          fontSize: '12px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Inspect Shop <ArrowUpRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {!loading && journeyShops.length === 0 && (
                <p style={{ margin: 0, fontSize: '13px', color: '#6E6D68' }}>No shops match this journey filter.</p>
              )}
            </div>
          </section>
        )}

        {(section === 'all' || section === 'verifications') && (
          <section style={{ background: '#FFFFFF', border: '1px solid #E6E4DE', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldCheck size={18} color="#2C4734" />
              <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                Shop Verifications
              </h2>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredShopsForVerify.map((shop) => (
                <div
                  key={shop.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#FAF9F6',
                    border: '1px solid #E6E4DE',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{shop.name}</div>
                    <div style={{ fontSize: '12px', color: '#6E6D68' }}>
                      {shop.city}, {shop.countryName} · {shop.isVerified ? 'Verified Storefront' : 'Pending Verification'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: shop.isVerified ? '#2C4734' : '#6E6D68',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      {shop.isVerified ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {shop.isVerified ? 'Verified' : 'Pending'}
                    </span>
                    <button
                      type="button"
                      disabled={busyId === shop.id}
                      onClick={() => void handleToggleVerify(shop)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '7px',
                        border: shop.isVerified ? '1px solid #D4D0C5' : '1px solid #2C4734',
                        background: shop.isVerified ? '#FFFFFF' : '#2C4734',
                        color: shop.isVerified ? '#141414' : '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {busyId === shop.id ? 'Saving...' : shop.isVerified ? 'Unverify' : 'Verify Shop'}
                    </button>
                  </div>
                </div>
              ))}
              {!loading && filteredShopsForVerify.length === 0 && (
                <p style={{ margin: 0, fontSize: '13px', color: '#6E6D68' }}>No shops found.</p>
              )}
            </div>
          </section>
        )}

        {(section === 'all' || section === 'reports') && (
          <section style={{ background: '#FFFFFF', border: '1px solid #E6E4DE', borderRadius: '14px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={18} color="#2C4734" />
              <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                Safety &amp; Listing Reports
              </h2>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: '#FAF9F6',
                    border: '1px solid #E6E4DE',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 260px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{rep.reason || 'Reported item'}</div>
                    <div style={{ fontSize: '12px', color: '#6E6D68' }}>
                      {rep.details ? `${rep.details} · ` : ''}Status: <strong>{rep.status || 'open'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      value={reportNotes[rep.id] || ''}
                      onChange={(e) => setReportNotes((prev) => ({ ...prev, [rep.id]: e.target.value }))}
                      placeholder="Resolution note (optional)"
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D4D0C5',
                        background: '#FFFFFF',
                        fontSize: '12px',
                        color: '#141414',
                        width: '190px',
                      }}
                    />
                    {rep.listingId && (
                      <Link
                        to={`/listings/${rep.listingId}`}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: '1px solid #D4D0C5',
                          background: '#FFFFFF',
                          color: '#141414',
                          fontSize: '11.5px',
                          textDecoration: 'none',
                        }}
                      >
                        View Listing
                      </Link>
                    )}
                    <button
                      type="button"
                      disabled={busyId === rep.id}
                      onClick={() => void handleReportAction(rep.id, 'resolved')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #2C4734',
                        background: '#2C4734',
                        color: '#FFFFFF',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      <Check size={12} /> Resolve
                    </button>
                    <button
                      type="button"
                      disabled={busyId === rep.id}
                      onClick={() => void handleReportAction(rep.id, 'dismissed')}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: '1px solid #D4D0C5',
                        background: '#FFFFFF',
                        color: '#6E6D68',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
              {!loading && filteredReports.length === 0 && (
                <p style={{ margin: 0, fontSize: '13px', color: '#6E6D68' }}>No safety reports found.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default TeammateOpsPage;
