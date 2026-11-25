import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, CreditCard, AlertTriangle, RefreshCw,
  Search, ShieldCheck, CheckCircle2, XCircle, ArrowUpRight, Check, X, Crown, RotateCcw, EyeOff
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { shopService } from '../services/shopService';
import { listingService } from '../services/listingService';
import { subscriptionsEnabled } from '../config/features';
import { errorMessage } from '../services/http';
import { useAppContext } from '../context/AppContext';
import type { Listing, PlatformAnalytics, SafetyReport, Shop, SubscriptionRecord } from '../types';

const VAULT_STORAGE_KEY = 'fashionhub_monthly_vault_v1';
const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

interface VaultConfig {
  monthLabel: string;
  editionTitle: string;
  stockNote: string;
  winnerId: string;
  runnerUpIds: string[];
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
}

const DEFAULT_VAULT: VaultConfig = {
  monthLabel: 'November 2026',
  editionTitle: 'Monthly Admin Crown Drop',
  stockNote: 'Limited 5-day vault drop · While stock lasts',
  winnerId: '',
  runnerUpIds: [],
  startedAt: '',
  expiresAt: '',
  isActive: false,
};

function readInitialVault(): VaultConfig {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? { ...DEFAULT_VAULT, ...(JSON.parse(raw) as Partial<VaultConfig>) } : DEFAULT_VAULT;
  } catch {
    return DEFAULT_VAULT;
  }
}

function formatRemaining(expiresAt: string, nowMs: number): string {
  if (!expiresAt) return 'Not scheduled';
  const diff = new Date(expiresAt).getTime() - nowMs;
  if (diff <= 0) return 'Expired (off display)';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m left`;
}

export const AdminDashboardPage = () => {
  const { session } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'shops' | 'payments' | 'reports' | 'vault'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [payments, setPayments] = useState<SubscriptionRecord[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const initialVault = readInitialVault();
  const [vaultConfig, setVaultConfig] = useState<VaultConfig>(initialVault);
  const [vaultWinnerId, setVaultWinnerId] = useState(initialVault.winnerId);
  const [vaultMonth, setVaultMonth] = useState(initialVault.monthLabel);
  const [vaultEdition, setVaultEdition] = useState(initialVault.editionTitle);
  const [vaultStockNote, setVaultStockNote] = useState(initialVault.stockNote);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadRealData() {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, shopsRes, listingsRes, paymentsRes, reportsRes] = await Promise.all([
        adminService.analytics(),
        shopService.list(),
        listingService.search(new URLSearchParams()).catch(() => [] as Listing[]),
        subscriptionsEnabled ? adminService.paymentQueue() : Promise.resolve([]),
        adminService.reportsQueue(),
      ]);
      setAnalytics(analyticsRes);
      setShops(shopsRes);
      setListings(listingsRes);
      setPayments(paymentsRes);
      setReports(reportsRes);

      const currentVault = readInitialVault();
      setVaultConfig(currentVault);
      const resolvedWinner =
        currentVault.winnerId && listingsRes.some((item) => item.id === currentVault.winnerId)
          ? currentVault.winnerId
          : listingsRes[0]?.id ?? '';
      setVaultWinnerId((prev) => prev || resolvedWinner);
      if (currentVault.monthLabel) setVaultMonth(currentVault.monthLabel);
      if (currentVault.editionTitle) setVaultEdition(currentVault.editionTitle);
      if (currentVault.stockNote) setVaultStockNote(currentVault.stockNote);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRealData();
  }, []);

  function persistVault(nextVault: VaultConfig) {
    setVaultConfig(nextVault);
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(nextVault));
    } catch {
      // ignore storage errors
    }
  }

  function handleSaveVaultWinner(e: React.FormEvent, restartFiveDays = false) {
    e.preventDefault();
    const chosenId = vaultWinnerId || listings[0]?.id || '';
    if (!chosenId) {
      setError('No catalog listings available to put in The Vault yet.');
      return;
    }
    const now = Date.now();
    const shouldStartFreshWindow =
      restartFiveDays || !vaultConfig.startedAt || !vaultConfig.expiresAt || !vaultConfig.isActive;
    const startedAt = shouldStartFreshWindow ? new Date(now).toISOString() : vaultConfig.startedAt;
    const expiresAt = shouldStartFreshWindow
      ? new Date(now + FIVE_DAYS_MS).toISOString()
      : vaultConfig.expiresAt;

    const runnerUpIds = listings
      .filter((item) => item.id !== chosenId)
      .slice(0, 3)
      .map((item) => item.id);

    const nextVault: VaultConfig = {
      monthLabel: vaultMonth.trim() || DEFAULT_VAULT.monthLabel,
      editionTitle: vaultEdition.trim() || DEFAULT_VAULT.editionTitle,
      stockNote: vaultStockNote.trim() || DEFAULT_VAULT.stockNote,
      winnerId: chosenId,
      runnerUpIds,
      startedAt,
      expiresAt,
      isActive: true,
    };
    persistVault(nextVault);
    const chosenItem = listings.find((item) => item.id === chosenId);
    setFeedback(
      `${shouldStartFreshWindow ? 'Started 5-day Vault drop for' : 'Updated'} "${chosenItem?.name ?? 'Selected item'}" (${nextVault.monthLabel}).`
    );
  }

  function handleRemoveFromVault() {
    const nextVault: VaultConfig = {
      ...vaultConfig,
      isActive: false,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    persistVault(nextVault);
    setFeedback('Vault winner removed from public display.');
  }

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
  const selectedWinner = listings.find((item) => item.id === vaultWinnerId) ?? listings[0];
  const isVaultCurrentlyLive =
    Boolean(vaultConfig.isActive) &&
    Boolean(vaultConfig.expiresAt) &&
    new Date(vaultConfig.expiresAt).getTime() > nowMs;

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
            { id: 'vault', label: 'The Vault Control', icon: Crown, badge: isVaultCurrentlyLive ? '5d Live' : 'Off' },
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
              onClick={() => navigate('/vault')}
              style={{
                padding: '8px 14px',
                borderRadius: '7px',
                border: '1px solid #2c4734',
                background: '#eef2ec',
                color: '#2c4734',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              Preview /vault <ArrowUpRight size={13} />
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
                value: loading ? '...' : String(analytics?.totalListings ?? listings.length),
                sub: 'Live catalog items',
              },
              {
                label: 'Registered Users',
                value: loading ? '...' : String(analytics?.totalUsers ?? '—'),
                sub: 'Buyers, sellers & admins',
              },
              {
                label: 'The Vault Window',
                value: isVaultCurrentlyLive ? formatRemaining(vaultConfig.expiresAt, nowMs) : 'Off Display',
                sub: isVaultCurrentlyLive ? 'Auto-hides after 5 days' : 'Pick & launch winner below',
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
                <div style={{ fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 500, color: '#141414', marginTop: '6px' }}>
                  {card.value}
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e6e4de', fontSize: '11.5px', color: '#2c4734', fontWeight: 500 }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Full Admin Vault Curation & 5-Day Drop Controls */}
          {(activeTab === 'overview' || activeTab === 'vault') && (
            <div style={{ background: '#ffffff', border: '1px solid #e6e4de', borderRadius: '12px', padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
                    ADMIN VAULT CONTROL · 5-DAY AUTO-EXPIRY
                  </p>
                  <h2 style={{ margin: '4px 0 0', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 400 }}>
                    Pick &amp; edit the <em>Vault winner.</em>
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: isVaultCurrentlyLive ? '#eef2ec' : '#f3f0e8',
                      color: isVaultCurrentlyLive ? '#2c4734' : '#6e6d68',
                    }}
                  >
                    {isVaultCurrentlyLive ? `Live · ${formatRemaining(vaultConfig.expiresAt, nowMs)}` : 'Hidden from users'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/vault')}
                    style={{
                      padding: '7px 13px',
                      borderRadius: '999px',
                      border: '1px solid #d4d0c5',
                      background: '#FAF9F6',
                      color: '#2c4734',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    View User /vault <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>

              {listings.length === 0 ? (
                <p style={{ color: '#6e6d68', fontSize: '13px' }}>No catalog items found yet. Publish a listing first to feature it in The Vault.</p>
              ) : (
                <form onSubmit={(e) => handleSaveVaultWinner(e, false)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', alignItems: 'end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <span>Winning Product</span>
                    <select
                      value={vaultWinnerId}
                      onChange={(e) => setVaultWinnerId(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4d0c5', background: '#FAF9F6', fontSize: '12.5px' }}
                    >
                      {listings.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — UGX {Number(item.price).toLocaleString()} ({item.shopName})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <span>Month Label</span>
                    <input
                      value={vaultMonth}
                      onChange={(e) => setVaultMonth(e.target.value)}
                      placeholder="November 2026"
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4d0c5', background: '#FAF9F6', fontSize: '12.5px' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <span>Edition Title</span>
                    <input
                      value={vaultEdition}
                      onChange={(e) => setVaultEdition(e.target.value)}
                      placeholder="Monthly Admin Crown Drop"
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4d0c5', background: '#FAF9F6', fontSize: '12.5px' }}
                    />
                  </label>

                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                    <span>Drop / Stock Note</span>
                    <input
                      value={vaultStockNote}
                      onChange={(e) => setVaultStockNote(e.target.value)}
                      placeholder="5-day limited drop"
                      style={{ padding: '9px 12px', borderRadius: '8px', border: '1px solid #d4d0c5', background: '#FAF9F6', fontSize: '12.5px' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', gridColumn: '1 / -1', marginTop: '4px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: '1px solid #141414',
                        background: '#141414',
                        color: '#ffffff',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <Crown size={14} /> Save Winner (5-Day Drop)
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSaveVaultWinner(e, true)}
                      style={{
                        padding: '10px 15px',
                        borderRadius: '8px',
                        border: '1px solid #2c4734',
                        background: '#eef2ec',
                        color: '#2c4734',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} /> Restart 5-Day Timer
                    </button>

                    <button
                      type="button"
                      onClick={handleRemoveFromVault}
                      style={{
                        padding: '10px 15px',
                        borderRadius: '8px',
                        border: '1px solid #e4c2c2',
                        background: '#fdf6f6',
                        color: '#8b2626',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      <EyeOff size={14} /> Pull Off Display
                    </button>
                  </div>
                </form>
              )}

              {selectedWinner && (
                <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: '#FAF9F6', border: '1px solid #e6e4de', fontSize: '12px', color: '#3b3a36', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span><strong>Selected item:</strong> {selectedWinner.name} ({selectedWinner.shopName}) · UGX {Number(selectedWinner.price).toLocaleString()}</span>
                  <span><strong>Status:</strong> {isVaultCurrentlyLive ? `Visible to users (${formatRemaining(vaultConfig.expiresAt, nowMs)})` : 'Not visible to users'}</span>
                </div>
              )}
            </div>
          )}

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
