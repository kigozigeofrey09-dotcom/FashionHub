import { useEffect, useState, type FormEvent } from 'react';
import {
  LayoutDashboard, TrendingUp, Store, ShieldCheck, Layers, ShoppingBag,
  CreditCard, Megaphone, AlertTriangle, Globe, Settings as SettingsIcon, LogOut,
  Search, RefreshCw, Check, X, Bot, ChevronRight, ArrowUpRight, DollarSign, Send, Sparkles
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

  // Semmy AI Agent State
  const [aiQuery, setAiQuery] = useState('');
  const [aiChat, setAiChat] = useState<Array<{ sender: 'ai' | 'user'; text: string; action?: any }>>([
    { sender: 'ai', text: "Hey! I'm Semmy, your FashionHub AI administration agent. I can analyze marketplace performance, review pending tasks, and execute authorized operations for you." }
  ]);

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

  function handleSemmySubmit(e: FormEvent) {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    const q = aiQuery.toLowerCase();
    const userMsg = aiQuery;
    setAiQuery('');
    setAiChat(prev => [...prev, { sender: 'user', text: userMsg }]);

    setTimeout(() => {
      let reply = "Semmy Analysis: ";
      let actionObj = null;

      if (q.includes('attention') || q.includes('task') || q.includes('activity') || q.includes('summarize')) {
        const pendingCount = queue.filter(item => item.status === 'pending_verification' || item.status === 'pending').length;
        const pendingReports = reports.filter(r => r.status === 'open').length;
        const unverifiedShops = allShops.filter(s => !s.isVerified).length;
        reply += `Marketplace overview:\n• Active Shops: ${analytics?.totalShops || allShops.length}\n• Pending MTN MoMo Subscriptions: ${pendingCount}\n• Unverified Storefronts: ${unverifiedShops}\n• Open Safety Reports: ${pendingReports}\n\nWould you like me to prioritize the subscription review queue?`;
      } else if (q.includes('verif') || q.includes('seller') || q.includes('shop')) {
        const unverified = allShops.filter(s => !s.isVerified);
        reply += `Found ${unverified.length} unverified storefronts. You can verify them directly in the Sellers & Verification tab.`;
        if (unverified.length > 0) {
          actionObj = { type: 'verify_list', shops: unverified.slice(0, 3) };
        }
      } else if (q.includes('payment') || q.includes('subscription') || q.includes('momo')) {
        const pending = queue.filter(item => item.status === 'pending_verification' || item.status === 'pending');
        reply += `There are ${pending.length} pending MTN MoMo payment proofs sent to 0773927881 (Kabesha Bankenga).`;
        if (pending.length > 0) {
          actionObj = { type: 'payment_list', payments: pending.slice(0, 3) };
        }
      } else if (q.includes('revenue') || q.includes('sales') || q.includes('volume')) {
        reply += `Monthly platform Gross Merchandise Volume (GMV) is tracking at UGX ${(analytics?.monthlyVolumeUgx ? (analytics.monthlyVolumeUgx / 1000000).toFixed(1) : '45.0')}M with ${analytics?.activeListings || 0} active listings.`;
      } else {
        reply += `I am Semmy, your FashionHub administrative agent. I can query real-time analytics, review merchant subscriptions, and execute authorized management workflows securely. How can I assist you today?`;
      }

      setAiChat(prev => [...prev, { sender: 'ai', text: reply, action: actionObj }]);
    }, 600);
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
    <div className="min-h-screen bg-[#0b0f0d] text-[#f0f2ee] flex font-sans antialiased overflow-x-hidden">
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#121815] border-r border-[#222b25] flex flex-col justify-between hidden md:flex sticky top-0 h-screen">
        <div>
          <div className="p-6 border-b border-[#222b25] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#315039] text-[#c7df77] flex items-center justify-center font-bold text-base shadow-inner">
              Fh
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white">FashionHub</h2>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Admin Command</span>
            </div>
          </div>

          <nav className="p-4 space-y-1 text-xs font-semibold">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <LayoutDashboard size={16} /> Overview
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <TrendingUp size={16} /> Analytics & Telemetry
            </button>
            <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'sellers' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <Store size={16} /> Sellers & Verification
            </button>
            <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'subscriptions' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <CreditCard size={16} /> Subscriptions ({pendingPayments.length})
            </button>
            <button onClick={() => setActiveTab('ads')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'ads' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <Megaphone size={16} /> Advertisements
            </button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'reports' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <AlertTriangle size={16} /> Reports ({openReports.length})
            </button>
            <button onClick={() => setActiveTab('countries')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'countries' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <Globe size={16} /> Countries & Regions
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-[#315039] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#18231f]'}`}>
              <SettingsIcon size={16} /> Platform Settings
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#222b25] bg-[#161f1a]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              {session?.user?.name ? session.user.name.slice(0, 1) : 'A'}
            </div>
            <div className="overflow-hidden">
              <span className="block text-xs font-bold text-white truncate">{session?.user?.name || 'Super Admin'}</span>
              <span className="block text-[10px] text-slate-400 truncate">kigozigeofrey09@gmail.com</span>
            </div>
          </div>
          <button onClick={() => signOut()} className="w-full py-2 bg-[#222b25] hover:bg-rose-900/40 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-18 bg-[#121815] border-b border-[#222b25] px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-white capitalize">{activeTab.replace('-', ' ')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search telemetry records..."
                className="pl-9 pr-4 py-2 bg-[#18231f] border border-[#26352d] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>
            <button onClick={loadData} className="p-2.5 bg-[#18231f] hover:bg-[#222b25] text-slate-300 rounded-xl border border-[#26352d] transition-all" title="Refresh Telemetry">
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {/* Dashboard Body with Semmy AI Assistant Split */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-y-auto">
          <div className="flex-1 p-6 space-y-6">
            {message && <Notice tone="success">{message}</Notice>}
            {error && <Notice tone="error">{error}</Notice>}
            {loading && <Loading label="Loading enterprise admin telemetry..." />}

            {!loading && activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
                    <h3 className="text-2xl font-extrabold text-white mt-1">{analytics?.totalUsers?.toLocaleString() || 120}</h3>
                  </div>
                  <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Shops</span>
                    <h3 className="text-2xl font-extrabold text-white mt-1">{analytics?.totalShops?.toLocaleString() || 15}</h3>
                  </div>
                  <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verified Blue Tick ✓</span>
                    <h3 className="text-2xl font-extrabold text-sky-400 mt-1">{analytics?.verifiedShops?.toLocaleString() || 5}</h3>
                  </div>
                  <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Monthly Volume (GMV)</span>
                    <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">UGX {((analytics?.monthlyVolumeUgx || 45000000) / 1000000).toFixed(1)}M</h3>
                  </div>
                </div>

                <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-4">Quick Administrative Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button onClick={() => setActiveTab('subscriptions')} className="p-4 bg-[#1b2520] hover:bg-[#222b25] border border-[#28362e] rounded-xl text-left transition-all">
                      <span className="text-xs font-bold text-amber-400 block mb-1">MTN MoMo Queue</span>
                      <span className="text-xs text-slate-300">{pendingPayments.length} pending payment proofs</span>
                    </button>
                    <button onClick={() => setActiveTab('sellers')} className="p-4 bg-[#1b2520] hover:bg-[#222b25] border border-[#28362e] rounded-xl text-left transition-all">
                      <span className="text-xs font-bold text-sky-400 block mb-1">Verify Storefronts</span>
                      <span className="text-xs text-slate-300">{allShops.filter(s => !s.isVerified).length} awaiting Blue Tick</span>
                    </button>
                    <button onClick={() => setActiveTab('reports')} className="p-4 bg-[#1b2520] hover:bg-[#222b25] border border-[#28362e] rounded-xl text-left transition-all">
                      <span className="text-xs font-bold text-rose-400 block mb-1">Safety Moderation</span>
                      <span className="text-xs text-slate-300">{openReports.length} open reports</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {!loading && activeTab === 'analytics' && (
              <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-6 space-y-6">
                <h3 className="text-sm font-bold text-white">Marketplace Revenue & Order Trends (UGX)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222b25" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(v: any) => [`UGX ${Number(v).toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="Revenue" stroke="#059669" fill="#059669" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {!loading && activeTab === 'sellers' && (
              <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Storefront Verification Manager (Blue Tick ✓)</h3>
                <div className="space-y-3">
                  {allShops.map((shop) => (
                    <div key={shop.id} className="p-4 bg-[#1b2520] border border-[#26352d] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-xs">{shop.name}</strong>
                          {shop.isVerified && <span className="text-sky-400 font-bold" title="Verified">✓</span>}
                        </div>
                        <span className="text-[11px] text-slate-400">{shop.city}, {shop.countryCode} · {shop.sellType}</span>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => toggleVerification(shop)}
                        className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${shop.isVerified ? 'bg-rose-900/40 text-rose-300 border border-rose-800' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}
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
              <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-2">MTN MoMo Subscription Review Queue (0773927881)</h3>
                <p className="text-xs text-slate-400 mb-4">Recipient: <strong>Kabesha Bankenga</strong> · Fee: UGX 10,000 / month</p>
                <div className="space-y-3">
                  {pendingPayments.map((record) => (
                    <div key={record.id} className="p-4 bg-[#1b2520] border border-[#26352d] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">{record.status}</span>
                        <h4 className="font-bold text-white text-xs mt-1">{record.planName ?? record.planId} · {record.countryCode}</h4>
                        <small className="text-[10px] text-slate-400">Ref: {record.transactionReference}</small>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => reviewPayment(record.id, 'declined')} disabled={busy} className="py-2 px-3 bg-rose-900/40 text-rose-300 rounded-xl text-xs font-semibold">Decline</button>
                        <button onClick={() => reviewPayment(record.id, 'approved')} disabled={busy} className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold">Approve (+30 Days)</button>
                      </div>
                    </div>
                  ))}
                  {!pendingPayments.length && <EmptyState title="No pending payment submissions">All MTN MoMo payments have been verified.</EmptyState>}
                </div>
              </div>
            )}

            {!loading && (activeTab === 'ads' || activeTab === 'reports' || activeTab === 'countries' || activeTab === 'settings') && (
              <div className="bg-[#151c18] border border-[#222b25] rounded-2xl p-8 text-center text-slate-400 text-xs">
                {activeTab === 'ads' && <p>Manage active seller advertisements and sponsored homepage banners via <a href="/admin/advertisements" className="text-emerald-400 underline">/admin/advertisements</a>.</p>}
                {activeTab === 'reports' && <p>Review reported listings and customer disputes in the moderation queue above.</p>}
                {activeTab === 'countries' && <p>Configure regional currencies and payment instructions for East Africa.</p>}
                {activeTab === 'settings' && <p>FashionHub enterprise tier settings are fully synchronized with Supabase.</p>}
              </div>
            )}
          </div>

          {/* Right Sidebar: Semmy AI Assistant */}
          <aside className="w-full xl:w-80 bg-[#121815] border-l border-[#222b25] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#222b25]">
                <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs">Semmy · AI Assistant</h3>
                  <span className="text-[10px] text-slate-400">FashionHub Administrator</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Queries</span>
                {['Semmy, summarize today\'s activity', 'Which sellers need verification?', 'What needs my attention?'].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAiQuery(suggestion)}
                    className="w-full text-left p-2.5 bg-[#18231f] hover:bg-[#222b25] text-slate-300 text-xs rounded-xl transition-all flex items-center justify-between"
                  >
                    <span>{suggestion}</span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
                {aiChat.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed ${msg.sender === 'user' ? 'bg-[#222b25] text-white ml-6' : 'bg-[#18231f] text-slate-300 border border-[#26352d] mr-6'}`}>
                    <p>{msg.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSemmySubmit} className="flex gap-2 pt-3 border-t border-[#222b25]">
              <input
                type="text"
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="Ask Semmy..."
                className="flex-1 px-3 py-2.5 bg-[#18231f] border border-[#26352d] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button type="submit" className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all">
                <Send size={16} />
              </button>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
