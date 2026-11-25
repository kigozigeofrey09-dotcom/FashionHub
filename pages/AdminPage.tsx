import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Store, CreditCard, AlertTriangle,
  Search, RefreshCw, Check, X, ArrowUpRight, ShieldCheck, Crown, EyeOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Loading, Notice } from '../components/ui';
import { useAppContext } from '../context/AppContext';
import { subscriptionsEnabled } from '../config/features';
import { adminService } from '../services/adminService';
import { shopService } from '../services/shopService';
import { listingService } from '../services/listingService';
import { errorMessage, supabase } from '../services/http';
import { seedListings } from '../data/seed';
import type { Listing, SafetyReport, SubscriptionRecord, Shop, PlatformAnalytics } from '../types';

const VAULT_STORAGE_KEY = 'fashionhub_monthly_vault_v1';
const VAULT_DROP_ALERT_KEY = 'fashionhub_vault_drop_alert_v1';
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

function readVaultConfig(): VaultConfig {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    return raw ? { ...DEFAULT_VAULT, ...(JSON.parse(raw) as Partial<VaultConfig>) } : DEFAULT_VAULT;
  } catch {
    return DEFAULT_VAULT;
  }
}

function formatTimeLeft(expiresAt: string, nowMs: number): string {
  if (!expiresAt) return 'Not scheduled';
  const diff = new Date(expiresAt).getTime() - nowMs;
  if (diff <= 0) return 'Expired (off display)';
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${days}d ${hours}h ${mins}m left`;
}

function emitVaultDropAlert(payload: {
  dropId: string;
  title: string;
  message: string;
  winnerName: string;
  monthLabel: string;
  expiresAt: string;
  createdAt: string;
}) {
  try {
    localStorage.setItem(VAULT_DROP_ALERT_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('fashionhub-vault-drop', { detail: payload }));
  } catch {
    // ignore storage errors
  }

  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, {
        body: payload.message,
        tag: payload.dropId,
      });
    }
  } catch {
    // ignore notification errors
  }

  void (async () => {
    try {
      await supabase.from('notifications').insert({
        kind: 'vault_drop',
        title: payload.title,
        message: payload.message,
        href: '/vault',
      });
    } catch {
      // ignore if notifications table/RLS blocks insert
    }
  })();
}

export function AdminPage() {
  const { session } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'shops' | 'payments' | 'reports'>('overview');

  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [catalogListings, setCatalogListings] = useState<Listing[]>([]);
  const [queue, setQueue] = useState<SubscriptionRecord[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);

  const initialVault = readVaultConfig();
  const [vaultConfig, setVaultConfig] = useState<VaultConfig>(initialVault);
  const [selectedWinnerId, setSelectedWinnerId] = useState(initialVault.winnerId);
  const [vaultMonth, setVaultMonth] = useState(initialVault.monthLabel);
  const [vaultEdition, setVaultEdition] = useState(initialVault.editionTitle);
  const [vaultStockNote, setVaultStockNote] = useState(initialVault.stockNote);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [anRes, shopsRes, listingsRes, queueRes, repRes] = await Promise.all([
        adminService.analytics(),
        shopService.list(),
        listingService.search(new URLSearchParams()).catch(() => [] as Listing[]),
        subscriptionsEnabled ? adminService.paymentQueue() : Promise.resolve([]),
        adminService.reportsQueue(),
      ]);
      const usableListings = listingsRes.length > 0 ? listingsRes : seedListings;
      setAnalytics(anRes);
      setAllShops(shopsRes);
      setCatalogListings(usableListings);
      setQueue(queueRes);
      setReports(repRes);

      const saved = readVaultConfig();
      setVaultConfig(saved);
      const defaultPick =
        saved.winnerId && usableListings.some((l) => l.id === saved.winnerId)
          ? saved.winnerId
          : usableListings[0]?.id ?? '';
      setSelectedWinnerId((prev) => prev || defaultPick);
      if (saved.monthLabel) setVaultMonth(saved.monthLabel);
      if (saved.editionTitle) setVaultEdition(saved.editionTitle);
      if (saved.stockNote) setVaultStockNote(saved.stockNote);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function saveVaultState(next: VaultConfig) {
    setVaultConfig(next);
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function handleLaunchVaultDrop(e: React.FormEvent) {
    e.preventDefault();
    const chosenId = selectedWinnerId || catalogListings[0]?.id || '';
    if (!chosenId) {
      setError('No product available to put in The Vault.');
      return;
    }
    const now = Date.now();
    const startedAt = new Date(now).toISOString();
    const expiresAt = new Date(now + FIVE_DAYS_MS).toISOString();
    const runnerUpIds = catalogListings
      .filter((item) => item.id !== chosenId)
      .slice(0, 3)
      .map((item) => item.id);

    const nextConfig: VaultConfig = {
      monthLabel: vaultMonth.trim() || DEFAULT_VAULT.monthLabel,
      editionTitle: vaultEdition.trim() || DEFAULT_VAULT.editionTitle,
      stockNote: vaultStockNote.trim() || DEFAULT_VAULT.stockNote,
      winnerId: chosenId,
      runnerUpIds,
      startedAt,
      expiresAt,
      isActive: true,
    };

    saveVaultState(nextConfig);
    const chosenItem = catalogListings.find((item) => item.id === chosenId);
    const winnerTitle = chosenItem?.name || 'Vault Winner';

    emitVaultDropAlert({
      dropId: `${chosenId}:${startedAt}`,
      title: `The Vault is Live — ${nextConfig.monthLabel}`,
      message: `${winnerTitle} is now in The Vault for 5 days.`,
      winnerName: winnerTitle,
      monthLabel: nextConfig.monthLabel,
      expiresAt,
      createdAt: startedAt,
    });

    setMessage(`"${winnerTitle}" is now live in The Vault for 5 days and users have been notified.`);
  }

  function handleHideVaultDrop() {
    const nextConfig: VaultConfig = {
      ...vaultConfig,
      isActive: false,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    };
    saveVaultState(nextConfig);
    setMessage('Removed Vault winner from public display.');
  }

  async function toggleVerification(shop: Shop) {
    setBusyId(shop.id);
    setError('');
    setMessage('');
    try {
      const updated = await adminService.verifyShop(shop.id, !shop.isVerified);
      setAllShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setMessage(`Updated verification for ${updated.name} (${updated.isVerified ? 'Verified' : 'Unverified'}).`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId('');
    }
  }

  async function reviewPayment(id: string, decision: 'approved' | 'declined') {
    setBusyId(id);
    setError('');
    setMessage('');
    try {
      await adminService.reviewPayment(id, { decision });
      setMessage(`Subscription payment ${decision}.`);
      const updatedQueue = await adminService.paymentQueue();
      setQueue(updatedQueue);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId('');
    }
  }

  const term = searchQuery.trim().toLowerCase();
  const filteredShops = allShops.filter(
    (s) =>
      !term ||
      [s.name, s.city, s.countryName, ...(s.categories ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
  );
  const pendingPayments = queue.filter(
    (item) => item.status === 'pending_verification' || item.status === 'pending'
  );
  const filteredPayments = pendingPayments.filter(
    (p) =>
      !term ||
      [p.id, p.shopName, p.planName, p.status, p.referenceCode]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
  );
  const openReports = reports.filter((r) => r.status === 'open');
  const filteredReports = openReports.filter(
    (r) =>
      !term ||
      [r.id, r.reason, r.targetType, r.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
  );

  const isVaultLive =
    Boolean(vaultConfig.isActive) &&
    Boolean(vaultConfig.expiresAt) &&
    new Date(vaultConfig.expiresAt).getTime() > nowMs;

  const navItems: Array<{ id: typeof activeTab; label: string; icon: typeof Store; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'vault', label: 'The Vault', icon: Crown },
    { id: 'shops', label: 'Shops & Verification', icon: Store, count: allShops.length },
    { id: 'payments', label: 'Subscriptions & Payments', icon: CreditCard, count: pendingPayments.length },
    { id: 'reports', label: 'Safety Reports', icon: AlertTriangle, count: openReports.length },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF9F6',
        color: '#141414',
        display: 'flex',
        fontFamily: "var(--sans, 'Plus Jakarta Sans', sans-serif)",
      }}
    >
      {/* Left Sidebar */}
      <aside
        style={{
          width: '248px',
          background: '#FFFFFF',
          borderRight: '1px solid #E6E4DE',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '64px',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid #E6E4DE',
          }}
        >
          <span
            style={{
              fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)",
              fontSize: '25px',
              fontWeight: 600,
              color: '#141414',
              letterSpacing: '-0.02em',
            }}
          >
            fashion<span style={{ fontStyle: 'italic', fontWeight: 400 }}>hub</span>
          </span>
          <span
            style={{
              background: '#2C4734',
              color: '#FFFFFF',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              padding: '3px 7px',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}
          >
            ADMIN
          </span>
        </div>

        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#F3F0E8' : 'transparent',
                  color: isActive ? '#141414' : '#4A4945',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} color={isActive ? '#2C4734' : '#6E6D68'} />
                  <span>{item.label}</span>
                </span>
                {typeof item.count === 'number' && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '1px 7px',
                      borderRadius: '999px',
                      background: isActive ? '#2C4734' : '#F3F0E8',
                      color: isActive ? '#FFFFFF' : '#141414',
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid #E6E4DE', fontSize: '11.5px', color: '#6E6D68' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2C4734', fontWeight: 600 }}>
            <ShieldCheck size={14} /> {session?.user?.name || 'Admin'}
          </div>
          <div style={{ marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.user?.email || 'Authenticated session'}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            height: '64px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E6E4DE',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: '14px', color: '#6E6D68', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Admin Studio</span>
            <span>/</span>
            <strong style={{ color: '#141414', fontWeight: 600, textTransform: 'capitalize' }}>
              {activeTab === 'shops'
                ? 'Shops & Verification'
                : activeTab === 'payments'
                ? 'Subscriptions & Payments'
                : activeTab === 'vault'
                ? 'The Vault'
                : activeTab}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#6E6D68" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #D4D0C5',
                  borderRadius: '8px',
                  padding: '7px 12px 7px 34px',
                  fontSize: '13px',
                  color: '#141414',
                  width: '260px',
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #D4D0C5',
                background: '#FFFFFF',
                color: '#141414',
                fontSize: '12px',
                fontWeight: 500,
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
              onClick={() => navigate('/vault')}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #2C4734',
                background: '#EEF2EC',
                color: '#2C4734',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
              }}
            >
              Open Vault <ArrowUpRight size={13} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #141414',
                background: '#141414',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 500,
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

        <main style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1380px', width: '100%' }}>
          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {loading && <Loading label="Loading marketplace telemetry…" />}

          {/* 4 KPI Cards */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            {[
              {
                label: 'Total Shops',
                value: analytics?.totalShops ?? allShops.length,
                badge: `${allShops.filter((s) => s.isVerified).length} verified`,
              },
              {
                label: 'Active Listings',
                value: analytics?.totalListings ?? 0,
                badge: 'Live catalog',
              },
              {
                label: 'Registered Users',
                value: analytics?.totalUsers ?? 0,
                badge: 'Platform accounts',
              },
              {
                label: 'Pending Reviews',
                value: pendingPayments.length + openReports.length,
                badge: `${pendingPayments.length} payments · ${openReports.length} reports`,
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E6E4DE',
                  borderRadius: '12px',
                  padding: '20px 22px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#3B3A36' }}>{kpi.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '10px' }}>
                  <span
                    style={{
                      fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)",
                      fontSize: '34px',
                      fontWeight: 600,
                      lineHeight: 1,
                      color: '#141414',
                    }}
                  >
                    {loading ? '—' : Number(kpi.value).toLocaleString()}
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#2C4734' }}>{kpi.badge}</span>
                </div>
              </div>
            ))}
          </section>

          {/* The Vault — Monthly Winner Picker (5-Day Auto-Expiry) */}
          {(activeTab === 'overview' || activeTab === 'vault') && (
            <section
              style={{
                background: '#FFFFFF',
                border: '1px solid #E6E4DE',
                borderRadius: '12px',
                padding: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                    The Vault — Monthly Winner
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#6E6D68' }}>
                    Pick the winning product; it stays on /vault for 5 days and notifies users on launch.
                  </p>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: isVaultLive ? '#2C4734' : '#6E6D68' }}>
                  {isVaultLive ? `Live · ${formatTimeLeft(vaultConfig.expiresAt, nowMs)}` : 'Off display'}
                </span>
              </div>

              <form onSubmit={handleLaunchVaultDrop} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#3B3A36' }}>
                  <span>Winning Product</span>
                  <select
                    value={selectedWinnerId}
                    onChange={(e) => setSelectedWinnerId(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #D4D0C5', background: '#FAF9F6', fontSize: '13px', color: '#141414' }}
                  >
                    {catalogListings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — UGX {Number(item.price).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#3B3A36' }}>
                  <span>Month</span>
                  <input
                    value={vaultMonth}
                    onChange={(e) => setVaultMonth(e.target.value)}
                    placeholder="November 2026"
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #D4D0C5', background: '#FAF9F6', fontSize: '13px', color: '#141414' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#3B3A36' }}>
                  <span>Drop Title</span>
                  <input
                    value={vaultEdition}
                    onChange={(e) => setVaultEdition(e.target.value)}
                    placeholder="Monthly Admin Crown Drop"
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #D4D0C5', background: '#FAF9F6', fontSize: '13px', color: '#141414' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#3B3A36' }}>
                  <span>Drop Note</span>
                  <input
                    value={vaultStockNote}
                    onChange={(e) => setVaultStockNote(e.target.value)}
                    placeholder="Limited 5-day vault drop"
                    style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #D4D0C5', background: '#FAF9F6', fontSize: '13px', color: '#141414' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 14px',
                      borderRadius: '8px',
                      border: '1px solid #2C4734',
                      background: '#2C4734',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Crown size={14} /> Launch 5-Day Drop
                  </button>

                  {isVaultLive && (
                    <button
                      type="button"
                      onClick={handleHideVaultDrop}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #D4D0C5',
                        background: '#FFFFFF',
                        color: '#8B2626',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      <EyeOff size={14} /> Pull Off Display
                    </button>
                  )}
                </div>
              </form>
            </section>
          )}

          {/* Main 2-Column Operational Cards (Registered Shops + Subscription Payment Queue) */}
          {(activeTab === 'overview' || activeTab === 'shops' || activeTab === 'payments') && (
            <section style={{ display: 'grid', gridTemplateColumns: activeTab === 'overview' ? 'repeat(auto-fit, minmax(380px, 1fr))' : '1fr', gap: '20px', alignItems: 'start' }}>
              {(activeTab === 'overview' || activeTab === 'shops') && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6E4DE',
                    borderRadius: '12px',
                    padding: '22px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                      Registered Shops
                    </h2>
                    <span style={{ fontSize: '12px', color: '#6E6D68' }}>{filteredShops.length} shown</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E6E4DE', color: '#6E6D68', textAlign: 'left', fontSize: '12px' }}>
                          <th style={{ padding: '10px 8px', fontWeight: 500 }}>Shop Name</th>
                          <th style={{ padding: '10px 8px', fontWeight: 500 }}>Location</th>
                          <th style={{ padding: '10px 8px', fontWeight: 500 }}>Status</th>
                          <th style={{ padding: '10px 8px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShops.map((shop) => (
                          <tr key={shop.id} style={{ borderBottom: '1px solid #F1EFEA' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: '#141414' }}>
                              <div>{shop.name}</div>
                              {shop.isVerified && (
                                <span style={{ fontSize: '11px', color: '#2C4734', fontWeight: 500 }}>✓ Verified</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#4A4945' }}>
                              {shop.city}, {shop.countryCode || shop.countryName}
                            </td>
                            <td style={{ padding: '12px 8px', color: shop.isVerified ? '#2C4734' : '#6E6D68', fontWeight: 500 }}>
                              {shop.isVerified ? 'Verified' : 'Pending'}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                              <button
                                type="button"
                                disabled={busyId === shop.id}
                                onClick={() => void toggleVerification(shop)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: shop.isVerified ? '1px solid #D4D0C5' : '1px solid #2C4734',
                                  background: shop.isVerified ? '#FFFFFF' : '#2C4734',
                                  color: shop.isVerified ? '#141414' : '#FFFFFF',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                }}
                              >
                                {busyId === shop.id ? 'Saving…' : shop.isVerified ? 'Unverify' : 'Verify Shop'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!loading && filteredShops.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '18px 8px', textAlign: 'center', color: '#6E6D68' }}>
                              No shops match your filter.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(activeTab === 'overview' || activeTab === 'payments') && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E6E4DE',
                    borderRadius: '12px',
                    padding: '22px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h2 style={{ margin: 0, fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                      Subscription Payment Queue
                    </h2>
                    <span style={{ fontSize: '12px', color: '#6E6D68' }}>{filteredPayments.length} pending</span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #E6E4DE', color: '#6E6D68', textAlign: 'left', fontSize: '12px' }}>
                          <th style={{ padding: '10px 8px', fontWeight: 500 }}>Shop</th>
                          <th style={{ padding: '10px 8px', fontWeight: 500 }}>Plan</th>
                          <th style={{ padding: '10px 8px', fontWeight: 500 }}>Reference</th>
                          <th style={{ padding: '10px 8px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #F1EFEA' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 600, color: '#141414' }}>
                              {item.shopName || 'Seller Shop'}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#4A4945' }}>
                              {item.planName || 'Monthly Plan'}
                            </td>
                            <td style={{ padding: '12px 8px', color: '#6E6D68', fontSize: '12px' }}>
                              {item.referenceCode || item.id}
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                disabled={busyId === item.id}
                                onClick={() => void reviewPayment(item.id, 'approved')}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #2C4734',
                                  background: '#2C4734',
                                  color: '#FFFFFF',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  marginRight: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Check size={12} /> Approve
                              </button>
                              <button
                                type="button"
                                disabled={busyId === item.id}
                                onClick={() => void reviewPayment(item.id, 'declined')}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #D4D0C5',
                                  background: '#FFFFFF',
                                  color: '#8B2626',
                                  fontSize: '12px',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <X size={12} /> Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!loading && filteredPayments.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ padding: '18px 8px', textAlign: 'center', color: '#6E6D68' }}>
                              No pending subscription payments.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Safety Reports View */}
          {activeTab === 'reports' && (
            <section
              style={{
                background: '#FFFFFF',
                border: '1px solid #E6E4DE',
                borderRadius: '12px',
                padding: '22px',
              }}
            >
              <h2 style={{ margin: '0 0 14px', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '26px', fontWeight: 500 }}>
                Safety Reports
              </h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                {filteredReports.map((rep) => (
                  <div
                    key={rep.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: '#FAF9F6',
                      border: '1px solid #E6E4DE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px' }}>{rep.reason || 'Reported item'}</div>
                      <div style={{ fontSize: '12px', color: '#6E6D68' }}>
                        Target: {rep.targetType} · Status: {rep.status}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#2C4734' }}>{rep.status}</span>
                  </div>
                ))}
                {!loading && filteredReports.length === 0 && (
                  <p style={{ margin: 0, color: '#6E6D68', fontSize: '13px' }}>No open safety reports.</p>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
