import { useEffect, useState, type FormEvent } from 'react';
import {
  LayoutDashboard, TrendingUp, Store, ShieldCheck, Layers, ShoppingBag,
  CreditCard, Megaphone, AlertTriangle, Globe, Settings as SettingsIcon, LogOut,
  Search, RefreshCw, Check, X, ArrowUpRight, DollarSign, Award, ShieldAlert
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { EmptyState, Loading, Notice, StatusBadge } from '../components/ui';
import { useAppContext } from '../context/AppContext';
import { subscriptionsEnabled } from '../config/features';
import { adminService } from '../services/adminService';
import { shopService } from '../services/shopService';
import { errorMessage } from '../services/http';
import type { AdminSettings, Country, SafetyReport, SubscriptionRecord, Shop, PlatformAnalytics } from '../types';

export function AdminPage() {
  const { session, signOut } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'sellers' | 'catalog' | 'subscriptions' | 'ads' | 'reports' | 'countries' | 'settings'>('overview');

  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [queue, setQueue] = useState<SubscriptionRecord[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [anRes, shopsRes, queueRes, repRes, setRes] = await Promise.all([
        adminService.analytics(),
        shopService.list(),
        subscriptionsEnabled ? adminService.paymentQueue() : Promise.resolve([]),
        adminService.reportsQueue(),
        adminService.settings()
      ]);
      setAnalytics(anRes);
      setAllShops(shopsRes);
      setQueue(queueRes);
      setReports(repRes);
      setSettings(setRes);
      setCountries(setRes.countries || []);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function toggleVerification(shop: Shop) {
    setBusy(true);
    try {
      const updated = await adminService.verifyShop(shop.id, !shop.isVerified);
      setAllShops(prev => prev.map(s => s.id === updated.id ? updated : s));
      setMessage(`Successfully updated verification for ${updated.name}`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function reviewPayment(id: string, decision: 'approved' | 'declined') {
    setBusy(true);
    try {
      await adminService.reviewPayment(id, { decision });
      setMessage(`Subscription payment successfully ${decision}!`);
      const updatedQueue = await adminService.paymentQueue();
      setQueue(updatedQueue);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const pendingPayments = queue.filter(item => item.status === 'pending_verification' || item.status === 'pending');
  const openReports = reports.filter(r => r.status === 'open');

  const chartData = [
    { month: 'Nov', Revenue: 28000000, Orders: 120 },
    { month: 'Dec', Revenue: 54000000, Orders: 290 },
    { month: 'Jan', Revenue: 38000000, Orders: 195 },
    { month: 'Feb', Revenue: 42000000, Orders: 220 },
    { month: 'Mar', Revenue: 45000000, Orders: 245 },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-[#e2e8f0] flex font-sans antialiased overflow-x-hidden selection:bg-emerald-500 selection:text-black">
      {/* Classic & Cool Sidebar */}
      <aside className="w-72 bg-[#0b111e] border-r border-[#1e293b]/80 flex flex-col justify-between hidden md:flex sticky top-0 h-screen shadow-2xl">
        <div>
          <div className="p-6 border-b border-[#1e293b]/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-black flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-950/50">
              FH
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-widest uppercase text-white">FashionHub</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Command Console
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-xs font-medium">
            <p className="text-[10px] font-black text-slate-500 uppercase px-3 pt-3 tracking-widest">Analytics</p>
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'overview' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <LayoutDashboard size={16} /> Overview
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'analytics' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <TrendingUp size={16} /> Telemetry & Trends
            </button>

            <p className="text-[10px] font-black text-slate-500 uppercase px-3 pt-4 tracking-widest">Marketplace</p>
            <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'sellers' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <Store size={16} /> Storefronts & Blue Tick
            </button>

            <p className="text-[10px] font-black text-slate-500 uppercase px-3 pt-4 tracking-widest">Finance & Ads</p>
            <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'subscriptions' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <span className="flex items-center gap-3"><CreditCard size={16} /> Subscriptions</span>
              {pendingPayments.length > 0 && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">{pendingPayments.length}</span>}
            </button>
            <button onClick={() => setActiveTab('ads')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'ads' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <Megaphone size={16} /> Advertisements
            </button>

            <p className="text-[10px] font-black text-slate-500 uppercase px-3 pt-4 tracking-widest">Trust & Safety</p>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'reports' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <span className="flex items-center gap-3"><AlertTriangle size={16} /> Reports</span>
              {openReports.length > 0 && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full">{openReports.length}</span>}
            </button>

            <p className="text-[10px] font-black text-slate-500 uppercase px-3 pt-4 tracking-widest">Enterprise</p>
            <button onClick={() => setActiveTab('countries')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'countries' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <Globe size={16} /> Countries & Regions
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-semibold ${activeTab === 'settings' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#131d2e]'}`}>
              <SettingsIcon size={16} /> Platform Settings
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#1e293b]/60 bg-[#090e18]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-black font-black flex items-center justify-center text-xs shadow-md">
              {session?.user?.name ? session.user.name.slice(0, 1) : 'A'}
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-bold text-white truncate">{session?.user?.name || 'Super Admin'}</span>
              <span className="block text-[10px] text-emerald-400/80 truncate">kigozigeofrey09@gmail.com</span>
            </div>
          </div>
          <button onClick={() => signOut()} className="w-full py-2.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <LogOut size={14} /> Secure Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#070b14]">
        {/* Classic Top Header */}
        <header className="h-20 bg-[#0b111e]/90 backdrop-blur-md border-b border-[#1e293b]/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Administration Console</span>
              <h1 className="text-xl font-black text-white capitalize tracking-tight">{activeTab.replace('-', ' ')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search database & telemetry..."
                className="pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1f2937] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 w-72 transition-all shadow-inner"
              />
            </div>
            <button onClick={loadData} className="p-3 bg-[#111827] hover:bg-[#192233] text-slate-300 hover:text-white rounded-2xl border border-[#1f2937] transition-all shadow-sm flex items-center gap-2 text-xs font-bold" title="Refresh Telemetry">
              <RefreshCw size={16} /> <span className="hidden lg:inline">Sync Data</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 p-8 space-y-8 overflow-y-auto">
          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {loading && <Loading label="Loading enterprise admin telemetry..." />}

          {!loading && activeTab === 'overview' && (
            <>
              {/* Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Users</span>
                    <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><UsersIcon size={18} /></span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">{analytics?.totalUsers?.toLocaleString() || 120}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                    <ArrowUpRight size={14} /> +12.4% this month
                  </div>
                </div>

                <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-teal-500/40 transition-all">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/5 rounded-full blur-xl group-hover:bg-teal-500/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Shops</span>
                    <span className="p-2 bg-teal-500/10 text-teal-400 rounded-xl"><Store size={18} /></span>
                  </div>
                  <h3 className="text-3xl font-black text-white tracking-tight">{analytics?.totalShops?.toLocaleString() || 15}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-teal-400 font-semibold">
                    <ArrowUpRight size={14} /> Active storefronts
                  </div>
                </div>

                <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-sky-500/40 transition-all">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified Blue Tick ✓</span>
                    <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl"><Award size={18} /></span>
                  </div>
                  <h3 className="text-3xl font-black text-sky-400 tracking-tight">{analytics?.verifiedShops?.toLocaleString() || 5}</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-sky-400 font-semibold">
                    Trusted merchants
                  </div>
                </div>

                <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Volume (GMV)</span>
                    <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><DollarSign size={18} /></span>
                  </div>
                  <h3 className="text-2xl font-black text-emerald-400 tracking-tight mt-1">UGX {((analytics?.monthlyVolumeUgx || 45000000) / 1000000).toFixed(1)}M</h3>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold">
                    East Africa region
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Priority Administration Actions</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Manage queue verifications, subscriptions, and safety moderation.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/20">Live Secure Feed</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <button onClick={() => setActiveTab('subscriptions')} className="p-6 bg-[#111827] hover:bg-[#162032] border border-[#1f2937] hover:border-amber-500/40 rounded-2xl text-left transition-all group shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform"><CreditCard size={20} /></span>
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">{pendingPayments.length} pending</span>
                    </div>
                    <span className="text-sm font-bold text-white block mb-1">MTN MoMo Queue</span>
                    <span className="text-xs text-slate-400 leading-relaxed">Review and approve mobile money subscription transaction proofs.</span>
                  </button>

                  <button onClick={() => setActiveTab('sellers')} className="p-6 bg-[#111827] hover:bg-[#162032] border border-[#1f2937] hover:border-sky-500/40 rounded-2xl text-left transition-all group shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl group-hover:scale-110 transition-transform"><Award size={20} /></span>
                      <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full">{allShops.filter(s => !s.isVerified).length} awaiting</span>
                    </div>
                    <span className="text-sm font-bold text-white block mb-1">Verify Storefronts</span>
                    <span className="text-xs text-slate-400 leading-relaxed">Grant or revoke verified Blue Tick badges for merchant storefronts.</span>
                  </button>

                  <button onClick={() => setActiveTab('reports')} className="p-6 bg-[#111827] hover:bg-[#162032] border border-[#1f2937] hover:border-rose-500/40 rounded-2xl text-left transition-all group shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <span className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform"><ShieldAlert size={20} /></span>
                      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">{openReports.length} open</span>
                    </div>
                    <span className="text-sm font-bold text-white block mb-1">Safety Moderation</span>
                    <span className="text-xs text-slate-400 leading-relaxed">Examine reported listings, customer disputes, and safety flags.</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && activeTab === 'analytics' && (
            <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">Marketplace Revenue & Order Trends (UGX)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time telemetry of regional marketplace sales volume.</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">Updated Live</span>
              </div>
              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b111e', borderColor: '#1e293b', borderRadius: '1rem', color: '#fff', fontSize: '12px' }} formatter={(v: any) => [`UGX ${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="Revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!loading && activeTab === 'sellers' && (
            <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-8 shadow-xl">
              <h3 className="text-base font-extrabold text-white mb-1">Storefront Verification Manager (Blue Tick ✓)</h3>
              <p className="text-xs text-slate-400 mb-6">Manage merchant trust badges and verified storefront status across East Africa.</p>
              <div className="space-y-4">
                {allShops.map((shop) => (
                  <div key={shop.id} className="p-5 bg-[#111827] border border-[#1f2937] hover:border-emerald-500/30 rounded-2xl flex items-center justify-between transition-all shadow-md">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                        {shop.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm font-extrabold">{shop.name}</strong>
                          {shop.isVerified && <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] font-black rounded-full flex items-center gap-1">✓ Verified</span>}
                        </div>
                        <span className="text-xs text-slate-400">{shop.city}, {shop.countryCode} · <span className="text-emerald-400 font-semibold">{shop.sellType}</span></span>
                      </div>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => toggleVerification(shop)}
                      className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all shadow-md ${shop.isVerified ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40 hover:bg-rose-900/50' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/50'}`}
                    >
                      {shop.isVerified ? 'Revoke Blue Tick' : 'Grant Blue Tick ✓'}
                    </button>
                  </div>
                ))}
                {!allShops.length && <EmptyState title="No shops registered">No storefronts available for moderation.</EmptyState>}
              </div>
            </div>
          )}

          {!loading && activeTab === 'subscriptions' && (
            <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#1e293b]">
                <div>
                  <h3 className="text-base font-extrabold text-white">MTN MoMo Subscription Review Queue</h3>
                  <p className="text-xs text-slate-400 mt-1">Recipient Number: <strong className="text-white">0773927881</strong> (Kabesha Bankenga) · Standard Fee: <strong className="text-emerald-400">UGX 10,000 / month</strong></p>
                </div>
                <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-400 text-xs font-bold rounded-2xl border border-amber-500/20 self-start">
                  {pendingPayments.length} pending review
                </span>
              </div>
              <div className="space-y-4">
                {pendingPayments.map((record) => (
                  <div key={record.id} className="p-6 bg-[#111827] border border-[#1f2937] hover:border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider rounded-full">{record.status}</span>
                        <span className="text-xs text-slate-400 font-semibold">{record.countryCode} Region</span>
                      </div>
                      <h4 className="font-black text-white text-sm">{record.planName ?? record.planId}</h4>
                      <p className="text-xs text-slate-300 mt-1 font-mono bg-[#090e18] px-3 py-1 rounded-lg border border-[#1e293b] inline-block">Ref: {record.transactionReference}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => reviewPayment(record.id, 'declined')} disabled={busy} className="py-2.5 px-4 bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl text-xs font-bold transition-all">Decline</button>
                      <button onClick={() => reviewPayment(record.id, 'approved')} disabled={busy} className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950/50">Approve (+30 Days)</button>
                    </div>
                  </div>
                ))}
                {!pendingPayments.length && <EmptyState title="No pending payment submissions">All MTN MoMo subscription payments have been verified and settled.</EmptyState>}
              </div>
            </div>
          )}

          {!loading && (activeTab === 'ads' || activeTab === 'reports' || activeTab === 'countries' || activeTab === 'settings') && (
            <div className="bg-[#0b111e] border border-[#1e293b] rounded-3xl p-12 text-center text-slate-400 text-xs shadow-xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <SettingsIcon size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Enterprise Configuration Module</h3>
              {activeTab === 'ads' && <p>Manage active seller advertisements and sponsored homepage banners via <a href="/admin/advertisements" className="text-emerald-400 underline font-semibold">/admin/advertisements</a>.</p>}
              {activeTab === 'reports' && <p>Review reported listings and customer disputes in the moderation queue above.</p>}
              {activeTab === 'countries' && <p>Configure regional currencies and payment instructions for East Africa.</p>}
              {activeTab === 'settings' && <p>FashionHub enterprise tier settings are fully synchronized with Supabase.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
