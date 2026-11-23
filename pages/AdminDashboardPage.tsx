import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, CreditCard, AlertTriangle, RefreshCw,
  Search, ShieldCheck, CheckCircle2, XCircle, ArrowUpRight, Check, X
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { shopService } from '../services/shopService';
import { subscriptionsEnabled } from '../config/features';
import { errorMessage } from '../services/http';
import { useAppContext } from '../context/AppContext';
import type { PlatformAnalytics, SafetyReport, Shop, SubscriptionRecord } from '../types';

export const AdminDashboardPage = () => {
  const { session } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'payments' | 'reports'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [payments, setPayments] = useState<SubscriptionRecord[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  async function loadRealData() {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, shopsRes, paymentsRes, reportsRes] = await Promise.all([
        adminService.analytics(),
        shopService.list(),
        subscriptionsEnabled ? adminService.paymentQueue() : Promise.resolve([]),
        adminService.reportsQueue(),
      ]);
      setAnalytics(analyticsRes);
      setShops(shopsRes);
      setPayments(paymentsRes);
      setReports(reportsRes);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRealData();
  }, []);

  async function handleVerifyToggle(shop: Shop) {
    setBusyId(shop.id);
    setError('');
    setFeedback('');
    try {
      const updated = await adminService.verifyShop(shop.id, !shop.isVerified);
      setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setFeedback(`${updated.name} is now ${updated.isVerified ? 'verified' : 'unverified'}.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyId('');
    }
  }

  async function handlePaymentDecision(id: string, decision: 'approved' | 'rejected') {
    setBusyId(id);
    setError('');
    setFeedback('');
    try {
      await adminService.reviewPayment(id, { decision });
      setPayments((prev) => prev.filter((p) => p.id !== id));
      setFeedback(`Payment request ${decision}.`);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyId('');
    }
  }

  const term = searchTerm.trim().toLowerCase();
  const filteredShops = shops.filter(
    (s) =>
      !term ||
      [s.name, s.city, s.countryName, ...(s.categories ?? [])].join(' ').toLowerCase().includes(term)
  );
  const filteredPayments = payments.filter(
    (p) =>
      !term ||
      [p.id, p.shopName, p.planName, p.status, p.referenceCode].filter(Boolean).join(' ').toLowerCase().includes(term)
  );
  const filteredReports = reports.filter(
    (r) =>
      !term ||
      [r.id, r.reason, r.targetType, r.status].filter(Boolean).join(' ').toLowerCase().includes(term)
  );

  const verifiedCount = shops.filter((s) => s.isVerified).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FAF9F6',
        color: '#141414',
        display: 'flex',
        fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
        overflow: 'hidden',
      }}
    >
      {/* Editorial Sidebar */}
      <aside
        style={{
          width: '264px',
          background: '#ffffff',
          borderRight: '1px solid #e6e4de',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '64px',
            padding: '0 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e6e4de',
          }}
        >
          <span
            style={{
              fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)",
              fontSize: '25px',
              fontWeight: 500,
              color: '#141414',
              letterSpacing: '-0.02em',
            }}
          >
            fashion<span style={{ fontStyle: 'italic' }}>hub</span>
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#2c4734',
              background: '#eef2ec',
              padding: '3px 8px',
              borderRadius: '999px',
            }}
          >
            Admin
          </span>
        </div>

        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #e6e4de',
            background: '#f3f0e8',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#141414',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)",
              fontSize: '15px',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {(session?.user?.name || 'Admin').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.email || 'Admin Session'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#2c4734', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Live Backend Connected
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
          <div style={{ padding: '4px 10px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
            Live Operations
          </div>

          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: '' },
            { id: 'shops', label: 'Shops & Verification', icon: Store, badge: String(shops.length) },
            { id: 'payments', label: 'Subscription Queue', icon: CreditCard, badge: String(payments.length) },
            { id: 'reports', label: 'Safety Reports', icon: AlertTriangle, badge: String(reports.length) },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: active ? '1px solid #141414' : '1px solid transparent',
                  background: active ? '#141414' : 'transparent',
                  color: active ? '#ffffff' : '#3b3a36',
                  fontWeight: active ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={15} />
                  <span>{item.label}</span>
                </span>
                {item.badge !== '' && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      background: active ? 'rgba(255,255,255,0.16)' : '#f3f0e8',
                      color: active ? '#ffffff' : '#141414',
                      fontWeight: 600,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FAF9F6', overflow: 'hidden' }}>
        <header
          style={{
            height: '64px',
            background: '#ffffff',
            borderBottom: '1px solid #e6e4de',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#6e6d68' }}>
            <span style={{ fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '21px', fontWeight: 500, color: '#141414' }}>
              Admin Dashboard
            </span>
            <span>/</span>
            <span style={{ color: '#2c4734', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10.5px', fontWeight: 700 }}>
              {activeTab}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#6e6d68' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter shops, payments, reports..."
                style={{
                  background: '#FAF9F6',
                  border: '1px solid #d4d0c5',
                  borderRadius: '999px',
                  padding: '7px 14px 7px 32px',
                  fontSize: '12px',
                  color: '#141414',
                  width: '230px',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => void loadRealData()}
              disabled={loading}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid #d4d0c5',
                background: '#ffffff',
                color: '#141414',
                fontSize: '12px',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={13} /> Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                padding: '8px 14px',
                borderRadius: '7px',
                border: '1px solid #141414',
                background: '#141414',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              Full Admin Center <ArrowUpRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '8px 14px',
                borderRadius: '7px',
                border: '1px solid #d4d0c5',
                background: '#ffffff',
                color: '#141414',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              Storefront
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '9px', background: '#fdf6f6', border: '1px solid #e4c2c2', color: '#8b2626', fontSize: '12.5px' }}>
              {error}
            </div>
          )}
          {feedback && (
            <div style={{ padding: '12px 16px', borderRadius: '9px', background: '#eef2ec', border: '1px solid #c7d4c4', color: '#2c4734', fontSize: '12.5px' }}>
              {feedback}
            </div>
          )}

          {/* Real KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              {
                label: 'Total Shops',
                value: loading ? '...' : String(analytics?.totalShops ?? shops.length),
                sub: `${verifiedCount} verified storefronts`,
              },
              {
                label: 'Active Listings',
                value: loading ? '...' : String(analytics?.totalListings ?? '—'),
                sub: 'Live catalog items',
              },
              {
                label: 'Registered Users',
                value: loading ? '...' : String(analytics?.totalUsers ?? '—'),
                sub: 'Buyers, sellers & admins',
              },
              {
                label: 'Pending Reviews',
                value: loading ? '...' : String(payments.length + reports.length),
                sub: `${payments.length} payments · ${reports.length} reports`,
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6e4de',
                  borderRadius: '10px',
                  padding: '18px',
                }}
              >
                <div style={{ fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#6e6d68' }}>
                  {card.label}
                </div>
                <div style={{ fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '30px', fontWeight: 500, color: '#141414', marginTop: '6px' }}>
                  {card.value}
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e6e4de', fontSize: '11.5px', color: '#2c4734', fontWeight: 500 }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Real Shops Section */}
          {(activeTab === 'overview' || activeTab === 'shops') && (
            <div style={{ background: '#ffffff', border: '1px solid #e6e4de', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
                    STOREFRONT DIRECTORY
                  </p>
                  <h2 style={{ margin: '4px 0 0', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 400 }}>
                    Registered <em>shops.</em>
                  </h2>
                </div>
                <span style={{ fontSize: '12px', color: '#6e6d68' }}>{filteredShops.length} shops</span>
              </div>

              {loading ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>Loading live shops...</p>
              ) : filteredShops.length === 0 ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>No registered shops found.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {filteredShops.map((shop) => (
                    <div
                      key={shop.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '9px',
                        background: '#FAF9F6',
                        border: '1px solid #e6e4de',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#141414' }}>{shop.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#6e6d68' }}>
                          {shop.city}, {shop.countryName} · {(shop.categories ?? []).join(', ') || 'General'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '999px',
                            background: shop.isVerified ? '#eef2ec' : '#f3f0e8',
                            color: shop.isVerified ? '#2c4734' : '#6e6d68',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {shop.isVerified ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {shop.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                        <button
                          type="button"
                          disabled={busyId === shop.id}
                          onClick={() => void handleVerifyToggle(shop)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #141414',
                            background: shop.isVerified ? '#ffffff' : '#141414',
                            color: shop.isVerified ? '#141414' : '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 600,
                          }}
                        >
                          {busyId === shop.id ? 'Updating...' : shop.isVerified ? 'Unverify' : 'Verify Shop'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Real Subscription Payment Queue */}
          {(activeTab === 'overview' || activeTab === 'payments') && (
            <div style={{ background: '#ffffff', border: '1px solid #e6e4de', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
                    SUBSCRIPTION VERIFICATION
                  </p>
                  <h2 style={{ margin: '4px 0 0', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 400 }}>
                    Payment <em>queue.</em>
                  </h2>
                </div>
                <span style={{ fontSize: '12px', color: '#6e6d68' }}>{filteredPayments.length} pending</span>
              </div>

              {loading ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>Loading payment queue...</p>
              ) : filteredPayments.length === 0 ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>No subscription payments awaiting review.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '9px',
                        background: '#FAF9F6',
                        border: '1px solid #e6e4de',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#141414' }}>
                          {payment.shopName || 'Seller Subscription'} · {payment.planName || 'Monthly Plan'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#6e6d68' }}>
                          Ref: {payment.referenceCode || payment.id} · Status: {payment.status}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={busyId === payment.id}
                          onClick={() => void handlePaymentDecision(payment.id, 'approved')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #2c4734',
                            background: '#2c4734',
                            color: '#ffffff',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === payment.id}
                          onClick={() => void handlePaymentDecision(payment.id, 'rejected')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e4c2c2',
                            background: '#fdf6f6',
                            color: '#8b2626',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Real Safety Reports Queue */}
          {(activeTab === 'overview' || activeTab === 'reports') && (
            <div style={{ background: '#ffffff', border: '1px solid #e6e4de', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
                    TRUST &amp; SAFETY
                  </p>
                  <h2 style={{ margin: '4px 0 0', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 400 }}>
                    Reported <em>items.</em>
                  </h2>
                </div>
                <span style={{ fontSize: '12px', color: '#6e6d68' }}>{filteredReports.length} reports</span>
              </div>

              {loading ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>Loading reports...</p>
              ) : filteredReports.length === 0 ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>No open safety reports.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '9px',
                        background: '#FAF9F6',
                        border: '1px solid #e6e4de',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#141414' }}>
                          {report.reason || 'Safety report'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#6e6d68' }}>
                          Target: {report.targetType || 'listing'} · Status: {report.status || 'open'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/admin')}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #d4d0c5',
                          background: '#ffffff',
                          color: '#141414',
                          fontSize: '11.5px',
                          fontWeight: 500,
                        }}
                      >
                        Review in Admin Center
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
