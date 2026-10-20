import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Save, ShieldCheck, MapPin, TrendingUp, Megaphone, CheckCircle2, Globe, Users, Store, CreditCard, Layers, AlertTriangle, Check, X, Search } from 'lucide-react';
import { EmptyState, Loading, Notice, PageTitle, StatusBadge } from '../components/ui';
import { seedCountries, seedPlans } from '../data/seed';
import { useAppContext } from '../context/AppContext';
import { subscriptionsEnabled } from '../config/features';
import { adminService } from '../services/adminService';
import { countryService } from '../services/countryService';
import { shopService } from '../services/shopService';
import { errorMessage } from '../services/http';
import type { AccountRole, AdminSettings, Country, MarketplaceReport, SafetyReport, SubscriptionPlan, SubscriptionRecord, AdminMapNode, PromotionAd, PlatformAnalytics, Shop } from '../types';

const awaitingPlan: SubscriptionPlan = { id: 'awaiting-confirmation', name: 'New plan', payerTypes: 'awaiting confirmation', priceLabel: 'Awaiting confirmation', renewalPeriod: 'Awaiting confirmation' };

export function AdminPage() {
  const { refreshAccessRules, session } = useAppContext();
  const [settings, setSettings] = useState<AdminSettings>({ plans: seedPlans, countries: seedCountries, subscriptionAccess: { requiredRoles: ['buyer'] } });
  const [planId, setPlanId] = useState(seedPlans[0].id);
  const [planName, setPlanName] = useState(seedPlans[0].name ?? 'Basic Seller');
  const [payerTypes, setPayerTypes] = useState<Array<'buyer' | 'seller' | 'both'>>(['seller']);
  const [price, setPrice] = useState('10000');
  const [currency, setCurrency] = useState('UGX');
  const [renewal, setRenewal] = useState('Monthly');
  const [requiredRoles, setRequiredRoles] = useState<AccountRole[]>(['buyer']);
  const [countryCode, setCountryCode] = useState('UG');
  const [instructions, setInstructions] = useState(seedCountries[0].paymentInstructions ?? '');
  const [countries, setCountries] = useState<Country[]>(seedCountries);
  const [newCountry, setNewCountry] = useState({ code: '', name: '', currency: '', cities: '' });
  const [queue, setQueue] = useState<SubscriptionRecord[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [sellerReport, setSellerReport] = useState<MarketplaceReport[]>([]);
  const [listingReport, setListingReport] = useState<MarketplaceReport[]>([]);

  const [mapNodes, setMapNodes] = useState<AdminMapNode[]>([]);
  const [promotions, setPromotions] = useState<PromotionAd[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [newPromoTitle, setNewPromoTitle] = useState('');
  const [newPromoType, setNewPromoType] = useState('featured');
  const [newPromoBudget, setNewPromoBudget] = useState('UGX 250,000');
  const [newPromoExpiry, setNewPromoExpiry] = useState('2026-12-31');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [settingsConnected, setSettingsConnected] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'shops' | 'catalog' | 'reports'>('overview');

  const planOptions = [...seedPlans, ...settings.plans].filter((plan, index, items) => items.findIndex((item) => item.id === plan.id) === index);
  const selectedPlan = planOptions.find((plan) => plan.id === planId) ?? planOptions[0] ?? awaitingPlan;

  function loadPlanDraft(plan: SubscriptionPlan) {
    setPlanId(plan.id);
    setPlanName(plan.name ?? plan.id);
    setPayerTypes(plan.payerTypes === 'awaiting confirmation' ? [] : plan.payerTypes as Array<'buyer' | 'seller' | 'both'>);
    const local = plan.countryPrices?.[countryCode];
    setPrice(local ? String(local.amount) : countryCode === 'UG' && plan.currency === 'UGX' && plan.amount ? String(plan.amount) : '');
    setCurrency(local?.currency ?? (countryCode === 'UG' ? plan.currency ?? 'UGX' : countries.find((item) => item.code === countryCode)?.currency ?? ''));
    setRenewal(plan.renewalPeriod === 'Awaiting confirmation' ? '' : plan.renewalPeriod);
  }

  async function loadAdmin() {
    setLoading(true); setError('');
    const [settingsResult, payments, sellers, listings, reportQueue, mapResult, promoResult, analyticsResult, shopsResult] = await Promise.allSettled([
      adminService.settings(),
      subscriptionsEnabled ? adminService.paymentQueue() : Promise.resolve([] as SubscriptionRecord[]),
      adminService.sellersReport(),
      adminService.listingsReport(),
      adminService.reportsQueue(),
      adminService.mapNodes(),
      adminService.promotions(),
      adminService.analytics(),
      shopService.list()
    ]);
    if (settingsResult.status === 'fulfilled') {
      const result = settingsResult.value;
      const editorPlans = result.plans.length ? result.plans : seedPlans;
      setSettings(result);
      setCountries(result.countries);
      setRequiredRoles(result.subscriptionAccess.requiredRoles);
      setSettingsConnected(true);
      const country = result.countries.find((item) => item.code === countryCode) ?? result.countries.find((item) => item.code === 'UG') ?? result.countries[0];
      if (country) { setCountryCode(country.code); setInstructions(country.paymentInstructions ?? ''); }
      const plan = editorPlans.find((item) => item.id === planId) ?? editorPlans[0];
      if (plan) loadPlanDraft(plan);
    } else { setSettingsConnected(false); setError(errorMessage(settingsResult.reason)); }
    if (payments.status === 'fulfilled') setQueue(payments.value);
    if (sellers.status === 'fulfilled') setSellerReport(sellers.value);
    if (listings.status === 'fulfilled') setListingReport(listings.value);
    if (reportQueue.status === 'fulfilled') setReports(reportQueue.value);
    if (mapResult.status === 'fulfilled') setMapNodes(mapResult.value);
    if (promoResult.status === 'fulfilled') setPromotions(promoResult.value);
    if (analyticsResult.status === 'fulfilled') setAnalytics(analyticsResult.value);
    if (shopsResult.status === 'fulfilled') setAllShops(shopsResult.value);
    setLoading(false);
  }
  useEffect(() => { void loadAdmin(); }, []);

  function choosePlan(id: string) {
    const plan = settings.plans.find((item) => item.id === id);
    if (plan) loadPlanDraft(plan);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!payerTypes.length) { setError('Choose at least one plan payer type.'); return; }
    setBusy(true); setError(''); setMessage('');
    const localPrices = { ...selectedPlan.countryPrices, [countryCode]: price.trim() && Number(price) > 0 ? { amount: Number(price), currency: currency.trim().toUpperCase() } : null };
    const updatedPlan: SubscriptionPlan = {
      ...selectedPlan,
      id: planId,
      name: planName.trim(),
      payerTypes,
      targetRoles: payerTypes.includes('both') ? ['buyer', 'seller'] : payerTypes.filter((item): item is 'buyer' | 'seller' => item !== 'both'),
      priceLabel: countryCode === 'UG' && price ? `UGX ${Number(price).toLocaleString()} / ${renewal || 'Awaiting confirmation'}` : selectedPlan.priceLabel,
      amount: countryCode === 'UG' && price ? Number(price) : selectedPlan.amount,
      currency: countryCode === 'UG' ? 'UGX' : selectedPlan.currency,
      renewalPeriod: renewal.trim() || 'Awaiting confirmation',
      countryPrices: localPrices,
      isSeed: false,
    };
    const configuredPlans = settings.plans.filter((plan) => plan.id !== planId).map((plan) => { const backendPlan = { ...plan }; delete backendPlan.isSeed; return backendPlan; });
    const backendPlan = { ...updatedPlan };
    delete backendPlan.isSeed;
    const nextSettings: AdminSettings = { plans: [...configuredPlans, backendPlan], countries, subscriptionAccess: { requiredRoles } };
    try {
      const result = await adminService.updateSettings(nextSettings);
      setSettings(result); setCountries(result.countries); setRequiredRoles(result.subscriptionAccess.requiredRoles); setSettingsConnected(true);
      await refreshAccessRules();
      setMessage('Plans, access rules and country settings were saved by the admin service.');
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }

  async function toggleShopVerification(shop: Shop) {
    setBusy(true); setError(''); setMessage('');
    const nextState = !shop.isVerified;
    try {
      await adminService.verifyShop(shop.id, nextState);
      setAllShops((current) => current.map((item) => item.id === shop.id ? { ...item, isVerified: nextState } : item));
      setMessage(`Shop "${shop.name}" verification status updated to ${nextState ? 'Verified (Blue Tick ✓)' : 'Unverified'}.`);
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }

  async function review(record: SubscriptionRecord, decision: 'approved' | 'declined') {
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await adminService.reviewPayment(record.id, { decision });
      if (updated.status !== decision) throw new Error('The review service did not confirm the selected status.');
      setQueue((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Submission ${updated.id} was ${decision} by the admin review service (MTN MoMo 0773927881 / Kabesha Bankenga).`);
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }

  async function reviewSafetyReport(report: SafetyReport, status: Extract<SafetyReport['status'], 'reviewing' | 'resolved' | 'dismissed'>) {
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await adminService.reviewReport(report.id, status);
      setReports((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(`Safety report marked ${status}.`);
    } catch (caught) { setError(errorMessage(caught)); }
    finally { setBusy(false); }
  }

  const pending = queue.filter((item) => item.status === 'pending_verification' || item.status === 'pending');
  const reviewed = queue.filter((item) => !pending.some((pendingRecord) => pendingRecord.id === item.id));

  return <div className="tabor-admin-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '90vh', background: '#f8f7fc', fontFamily: 'var(--sans)' }}>
    {/* Sidebar Navigation */}
    <aside style={{ background: '#fff', borderRight: '1px solid #eaeaef', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.5rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#315039', color: '#c7df77', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>Fh</div>
        <div>
          <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: 700, color: '#20251f' }}>FashionHub</h3>
          <small style={{ fontSize: '0.75rem', color: '#73776e' }}>Admin Command Center</small>
        </div>
      </div>

      <div style={{ padding: '0 0.5rem' }}>
        <div style={{ background: '#f2f1f8', borderRadius: '8px', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#73776e', fontSize: '0.85rem' }}>
          <Search size={15} />
          <span>Search records...</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a0a49c', textTransform: 'uppercase', paddingLeft: '0.75rem', margin: '0.5rem 0 0.25rem' }}>Main</p>
        <button onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '8px', border: 0, background: activeTab === 'overview' ? '#315039' : 'transparent', color: activeTab === 'overview' ? '#fff' : '#4a4f48', fontWeight: activeTab === 'overview' ? 600 : 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <TrendingUp size={16} /> Overview & Analytics
        </button>
        <button onClick={() => setActiveTab('subscriptions')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '8px', border: 0, background: activeTab === 'subscriptions' ? '#315039' : 'transparent', color: activeTab === 'subscriptions' ? '#fff' : '#4a4f48', fontWeight: activeTab === 'subscriptions' ? 600 : 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <CreditCard size={16} /> MTN MoMo Subscriptions ({pending.length})
        </button>
        <button onClick={() => setActiveTab('shops')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '8px', border: 0, background: activeTab === 'shops' ? '#315039' : 'transparent', color: activeTab === 'shops' ? '#fff' : '#4a4f48', fontWeight: activeTab === 'shops' ? 600 : 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <Store size={16} /> Arcade Shops & Blue Tick
        </button>

        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a0a49c', textTransform: 'uppercase', paddingLeft: '0.75rem', margin: '1rem 0 0.25rem' }}>Management</p>
        <button onClick={() => setActiveTab('catalog')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '8px', border: 0, background: activeTab === 'catalog' ? '#315039' : 'transparent', color: activeTab === 'catalog' ? '#fff' : '#4a4f48', fontWeight: activeTab === 'catalog' ? 600 : 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <Layers size={16} /> Plan & Country Pricing
        </button>
        <button onClick={() => setActiveTab('reports')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.85rem', borderRadius: '8px', border: 0, background: activeTab === 'reports' ? '#315039' : 'transparent', color: activeTab === 'reports' ? '#fff' : '#4a4f48', fontWeight: activeTab === 'reports' ? 600 : 500, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <AlertTriangle size={16} /> Trust & Safety Reports
        </button>
      </nav>

      <div style={{ marginTop: 'auto', background: '#f2f1f8', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#315039', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {session?.user.name ? session.user.name.slice(0, 1) : 'A'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <strong style={{ display: 'block', fontSize: '0.85rem', color: '#20251f', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{session?.user.name ?? 'Admin'}</strong>
          <small style={{ fontSize: '0.75rem', color: '#73776e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', display: 'block' }}>{session?.user.email ?? 'admin@fashionhub.ug'}</small>
        </div>
      </div>
    </aside>

    {/* Main Content Area */}
    <main style={{ padding: '2rem', overflowY: 'auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--serif)', margin: 0, color: '#20251f' }}>Good morning, {session?.user.name ?? 'Admin'}</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#73776e', fontSize: '0.9rem' }}>Marketplace live control center · UGX Currency & MTN MoMo (0773927881 / Kabesha Bankenga)</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ background: '#e3ece4', color: '#315039', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>Secure Admin Session</span>
        </div>
      </div>

      {loading && <Loading label="Loading admin telemetry and analytics…" />}
      {error && <Notice tone="error" title="Admin service unavailable">{error}<button className="text-button" onClick={() => void loadAdmin()}>Retry</button></Notice>}
      {message && <Notice tone="success">{message}</Notice>}

      {!loading && (
        <>
          {/* Top Metric Cards */}
          {analytics && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eaeaef' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#73776e', margin: '0 0 0.5rem' }}>TOTAL PLATFORM USERS</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--serif)', color: '#20251f' }}>{analytics.totalUsers.toLocaleString()}</h3>
                <span style={{ color: '#315039', fontSize: '0.85rem', fontWeight: 600, background: '#e3ece4', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>+12% this mo</span>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eaeaef' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#73776e', margin: '0 0 0.5rem' }}>ACTIVE SHOPS & BOUTIQUES</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--serif)', color: '#20251f' }}>{analytics.totalShops.toLocaleString()}</h3>
                <span style={{ color: '#315039', fontSize: '0.85rem', fontWeight: 600, background: '#e3ece4', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>Live</span>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eaeaef' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#73776e', margin: '0 0 0.5rem' }}>VERIFIED (BLUE TICK ✓)</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--serif)', color: '#1d9bf0' }}>{analytics.verifiedShops.toLocaleString()}</h3>
                <span style={{ color: '#1d9bf0', fontSize: '0.85rem', fontWeight: 600, background: 'rgba(29,155,240,0.1)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>Trusted</span>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eaeaef' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#73776e', margin: '0 0 0.5rem' }}>MONTHLY VOLUME (GMV)</p>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.8rem', margin: 0, fontFamily: 'var(--serif)', color: '#315039' }}>UGX {(analytics.monthlyVolumeUgx / 1000000).toFixed(1)}M</h3>
                <span style={{ color: '#315039', fontSize: '0.85rem', fontWeight: 600, background: '#e3ece4', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>Healthy</span>
              </div>
            </div>
          </div>}

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              {/* Geographical Map Preview */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, fontFamily: 'var(--serif)' }}>Global Store Distribution & Nodes</h3>
                  <span className="status-badge status-approved"><MapPin size={13} /> {mapNodes.length} Active Nodes</span>
                </div>
                <div style={{ background: '#0a0f0d', borderRadius: '12px', padding: '1rem', height: '280px', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%', display: 'block' }}>
                    <g stroke="rgba(255,255,255,0.06)" strokeWidth="1">
                      <line x1="0" y1="250" x2="1000" y2="250" strokeDasharray="4 4" />
                      <line x1="500" y1="0" x2="500" y2="500" strokeDasharray="4 4" />
                    </g>
                    <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)">
                      <path d="M 480,260 Q 510,240 530,280 Q 540,320 520,360 Q 490,380 470,330 Z" />
                      <path d="M 540,140 Q 650,130 720,200 Q 680,260 560,220 Z" />
                      <path d="M 280,280 Q 340,270 320,380 Q 280,400 260,320 Z" />
                    </g>
                    {mapNodes.map((node) => {
                      const cx = (node.lng + 180) * (1000 / 360);
                      const cy = (90 - node.lat) * (500 / 180);
                      return <g key={node.id}>
                        <circle cx={cx} cy={cy} r="8" fill={node.isVerified ? '#1d9bf0' : '#c7df77'} />
                        <text x={cx} y={cy - 10} fill="#fff" fontSize="10" textAnchor="middle">{node.name}</text>
                      </g>;
                    })}
                  </svg>
                </div>
              </div>

              {/* Quick Actions & Spotlight */}
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, fontFamily: 'var(--serif)' }}>Quick Administrative Actions</h3>
                <p style={{ fontSize: '0.85rem', color: '#73776e', margin: 0 }}>Review pending MTN MoMo subscription proofs for <strong>0773927881</strong> (Kabesha Bankenga) or verify boutique shops instantly.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button className="button button-dark" onClick={() => setActiveTab('subscriptions')}>
                    Review Subscriptions ({pending.length} pending)
                  </button>
                  <button className="button button-outline" onClick={() => setActiveTab('shops')}>
                    Manage Arcade Shops & Blue Ticks
                  </button>
                  <button className="button button-outline" onClick={() => setActiveTab('reports')}>
                    View Safety Reports ({reports.filter(r => r.status === 'pending').length})
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--serif)', margin: 0 }}>MTN Mobile Money Subscriptions (0773927881)</h3>
                  <p style={{ color: '#73776e', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Recipient Name: <strong>Kabesha Bankenga</strong> · Fee: UGX 10,000 / month</p>
                </div>
                <span className="status-badge status-approved">{pending.length} Pending Approvals</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pending.length ? pending.map((record) => (
                  <div key={record.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8f7fc', borderRadius: '12px', border: '1px solid #eaeaef' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <StatusBadge status={record.status}>{record.status.replaceAll('_', ' ')}</StatusBadge>
                        <strong style={{ fontSize: '1rem' }}>{record.planName ?? record.planId}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#73776e' }}>
                        Transaction Ref: <strong>{record.transactionReference}</strong> · Country: {record.countryCode} · Submitted: {new Date(record.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="button button-outline" style={{ background: '#fff', color: '#a94f47', borderColor: '#a94f47' }} disabled={busy} onClick={() => void review(record, 'declined')}>
                        <X size={14} /> Decline
                      </button>
                      <button className="button button-dark" style={{ background: '#315039' }} disabled={busy} onClick={() => void review(record, 'approved')}>
                        <Check size={14} /> Approve & Activate (+30 Days)
                      </button>
                    </div>
                  </div>
                )) : <EmptyState title="No pending subscriptions">All MTN MoMo payments have been verified and approved.</EmptyState>}
              </div>
            </div>
          )}

          {activeTab === 'shops' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--serif)', margin: 0 }}>Arcade Shops & Blue Tick Verification</h3>
                <p style={{ color: '#73776e', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Manage verified maker trust badges across Gazaland, Mukwano, and Nabukeera arcades.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {allShops.map((shop) => (
                  <div key={shop.id} style={{ padding: '1.25rem', background: '#f8f7fc', borderRadius: '12px', border: '1px solid #eaeaef', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{shop.name}</h4>
                        {shop.isVerified && <span style={{ color: '#1d9bf0', fontWeight: 'bold' }} title="Verified Downtown Shop">✓</span>}
                      </div>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#73776e' }}>{shop.city}, {shop.countryCode} · {shop.sellType}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#4a4f48', fontStyle: 'italic' }}>"{shop.tagline || shop.story.slice(0, 70)}..."</p>
                    </div>
                    <button className={`button ${shop.isVerified ? 'button-outline' : 'button-dark'}`} style={{ width: '100%', justifyContent: 'center' }} disabled={busy} onClick={() => void toggleShopVerification(shop)}>
                      {shop.isVerified ? 'Revoke Blue Tick' : 'Grant Blue Tick ✓'}
                    </button>
                  </div>
                ))}
                {!allShops.length && <EmptyState title="No shops found">No storefronts available for verification.</EmptyState>}
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--serif)', margin: '0 0 0.5rem' }}>Subscription Plan Pricing</h3>
                <p style={{ color: '#73776e', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Configure seller and buyer membership tiers.</p>
                <form className="form-stack" onSubmit={saveSettings}>
                  <label className="field"><span>Plan to configure</span><select value={planId} onChange={(event) => choosePlan(event.target.value)}>{planOptions.map((plan) => <option value={plan.id} key={plan.id}>{plan.name ?? plan.id}</option>)}</select></label>
                  <label className="field"><span>Display name</span><input value={planName} onChange={(event) => setPlanName(event.target.value)} required /></label>
                  <label className="field"><span>Price (UGX)</span><input type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
                  <button className="button button-dark" disabled={busy}><Save size={14} /> Save Plan Configuration</button>
                </form>
              </div>

              <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--serif)', margin: '0 0 0.5rem' }}>Supported Countries & Currencies</h3>
                <p style={{ color: '#73776e', fontSize: '0.85rem', margin: '0 0 1.5rem' }}>Active operating regions across East Africa.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {countries.map((item) => (
                    <div key={item.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f8f7fc', borderRadius: '8px', border: '1px solid #eaeaef' }}>
                      <strong>{item.name} ({item.code})</strong>
                      <span style={{ color: '#315039', fontWeight: 600 }}>{item.currency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #eaeaef', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--serif)', margin: 0 }}>Trust & Safety Reports</h3>
                <p style={{ color: '#73776e', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Review flagged listings or user misconduct reports.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reports.length ? reports.map((report) => (
                  <div key={report.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8f7fc', borderRadius: '12px', border: '1px solid #eaeaef' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <StatusBadge status={report.status}>{report.status}</StatusBadge>
                        <strong style={{ fontSize: '1rem' }}>{report.reason.replaceAll('_', ' ')}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#73776e' }}>{report.details || 'No additional details.'} · {new Date(report.createdAt).toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="button button-outline" disabled={busy || report.status === 'resolved'} onClick={() => void reviewSafetyReport(report, 'resolved')}>Resolve</button>
                      <button className="button button-outline" disabled={busy || report.status === 'dismissed'} onClick={() => void reviewSafetyReport(report, 'dismissed')}>Dismiss</button>
                    </div>
                  </div>
                )) : <EmptyState title="No safety reports">All user reports have been cleared.</EmptyState>}
              </div>
            </div>
          )}
        </>
      )}
    </main>
  </div>;
}
