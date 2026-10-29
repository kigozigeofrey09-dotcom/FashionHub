import { useEffect, useState, type FormEvent } from 'react';
import {
  LayoutDashboard, TrendingUp, Store, ShieldCheck, Layers, ShoppingBag,
  CreditCard, Megaphone, AlertTriangle, Globe, Settings as SettingsIcon, LogOut,
  Search, RefreshCw, Check, X, ArrowUpRight, DollarSign, Award, ShieldAlert,
  Mail, Users, Clock, Calendar, BarChart2, PieChart
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
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

  // Live clock state
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
      setDateString(now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-[#eaedf1] text-[#334155] flex font-sans antialiased overflow-x-hidden selection:bg-red-500 selection:text-white">
      {/* ATLANT Sidebar */}
      <aside className="w-64 bg-[#202938] text-[#cbd5e1] flex flex-col justify-between hidden md:flex sticky top-0 h-screen shadow-xl z-30">
        <div>
          {/* Vibrant Red Brand Header */}
          <div className="h-16 bg-[#e74c3c] text-white flex items-center justify-center px-6 font-black tracking-widest text-lg shadow-md uppercase">
            ATLANT
          </div>

          {/* Admin Profile Box */}
          <div className="p-5 bg-[#1b222d] border-b border-[#2a3649] flex flex-col items-center text-center">
            <div className="relative mb-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
                alt="Admin profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-md"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#1b222d] rounded-full"></span>
            </div>
            <h3 className="font-bold text-white text-sm">{session?.user?.name || 'Super Admin'}</h3>
            <span className="text-[11px] text-slate-400 mt-0.5">FashionHub Administrator</span>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <p className="text-[10px] font-bold text-slate-500 uppercase px-3 pt-2 tracking-wider">Navigation</p>
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'overview' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <span className="flex items-center gap-3"><LayoutDashboard size={16} /> Dashboards</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">Live</span>
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'analytics' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <TrendingUp size={16} /> Telemetry Analytics
            </button>
            <button onClick={() => setActiveTab('sellers')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'sellers' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <span className="flex items-center gap-3"><Store size={16} /> Storefronts</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold">{allShops.length}</span>
            </button>
            <button onClick={() => setActiveTab('subscriptions')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'subscriptions' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <span className="flex items-center gap-3"><CreditCard size={16} /> Subscriptions</span>
              {pendingPayments.length > 0 && <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-bold rounded-full">{pendingPayments.length}</span>}
            </button>
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'reports' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <span className="flex items-center gap-3"><AlertTriangle size={16} /> Reports</span>
              {openReports.length > 0 && <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 text-[10px] font-bold rounded-full">{openReports.length}</span>}
            </button>
            <button onClick={() => setActiveTab('countries')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'countries' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <Globe size={16} /> Countries & Regions
            </button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-[#1b222d] text-white border-l-4 border-[#e74c3c]' : 'text-slate-400 hover:text-white hover:bg-[#283548]'}`}>
              <SettingsIcon size={16} /> Platform Settings
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#2a3649] bg-[#18202b]">
          <button onClick={() => signOut()} className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <LogOut size={14} /> Secure Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#eaedf1]">
        {/* Top Header matching ATLANT */}
        <header className="h-16 bg-[#202938] text-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>Home</span> <span className="text-slate-600">/</span> <span className="text-white capitalize">{activeTab}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search telemetry..."
                className="pl-9 pr-4 py-1.5 bg-[#1b222d] border border-[#2a3649] rounded-md text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e74c3c] w-64 shadow-inner"
              />
            </div>
            <button onClick={loadData} className="p-2 bg-[#1b222d] hover:bg-[#2a3649] text-slate-300 rounded-md border border-[#2a3649] transition-all" title="Sync Telemetry">
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {loading && <Loading label="Loading ATLANT telemetry..." />}

          {!loading && activeTab === 'overview' && (
            <>
              {/* Top Row: 4 Stat Cards matching ATLANT template */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Visitors Card */}
                <div className="bg-white border border-[#dce2e8] rounded-md p-5 shadow-sm relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">NEW Visitors</span>
                      <h3 className="text-3xl font-black text-slate-800 mt-1">{analytics?.totalUsers?.toLocaleString() || '1,977'}</h3>
                    </div>
                    <button className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">×</button>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    <span className="w-2 h-2 rounded-full bg-[#e74c3c]"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  </div>
                </div>

                {/* New Messages Card */}
                <div className="bg-white border border-[#dce2e8] rounded-md p-5 shadow-sm relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                        <Mail size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">48</h3>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">NEW MESSAGES</span>
                        <span className="text-[10px] text-slate-400">In your mailbox</span>
                      </div>
                    </div>
                    <button className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">×</button>
                  </div>
                </div>

                {/* Registered Users Card */}
                <div className="bg-white border border-[#dce2e8] rounded-md p-5 shadow-sm relative overflow-hidden group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">{analytics?.totalShops || '375'}</h3>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">REGISTERED USERS</span>
                        <span className="text-[10px] text-slate-400">On your website</span>
                      </div>
                    </div>
                    <button className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">×</button>
                  </div>
                </div>

                {/* Time / Clock Card (Red ATLANT style) */}
                <div className="bg-[#c0392b] text-white rounded-md p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{timeString || '13:09'}</h3>
                      <span className="text-[11px] text-white/80 block mt-0.5">{dateString || 'Saturday, December 9, 2023'}</span>
                    </div>
                    <button className="w-6 h-6 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center text-xs">×</button>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/15 text-white/80 text-xs">
                    <Clock size={15} />
                    <Calendar size={15} />
                  </div>
                </div>
              </div>

              {/* Middle Row: Sales Activity & World Map simulation + Projects Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 cols: Sales Activity & Progress */}
                <div className="lg:col-span-2 bg-white border border-[#dce2e8] rounded-md p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase">SALES</h3>
                      <p className="text-[11px] text-slate-400">Sales activity by period you selected</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 px-3 py-1 rounded border border-slate-200 text-slate-600 font-medium">November 10, 2023 - December 9, 2023</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>In Queue</span> <span>75%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-700 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>Shipped Products</span> <span>450/500</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-700 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span className="text-rose-600">Returned Products</span> <span>25/500</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span className="text-amber-600">Progress Today</span> <span>75/150</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#202938] text-white rounded-md text-xs flex items-center justify-between">
                    <span>⚠ Data update in end of each hour. You can update it manually by pressing update button.</span>
                    <button onClick={loadData} className="px-3 py-1 bg-[#e74c3c] hover:bg-[#d63031] text-white rounded font-bold transition-all">Update</button>
                  </div>
                </div>

                {/* Right col: Projects Table */}
                <div className="bg-white border border-[#dce2e8] rounded-md p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase">PROJECTS</h3>
                      <p className="text-[11px] text-slate-400">Projects activity</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                          <th className="pb-2 text-left">Project</th>
                          <th className="pb-2 text-left">Status</th>
                          <th className="pb-2 text-right">Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Atlant</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold">Developing</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-rose-200 ml-auto rounded"><div className="w-3/4 h-full bg-rose-500 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Gemini</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">Updating</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-amber-200 ml-auto rounded"><div className="w-1/2 h-full bg-amber-500 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Taurus</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold">Updating</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-amber-200 ml-auto rounded"><div className="w-2/3 h-full bg-amber-500 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Leo</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">Support</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-emerald-200 ml-auto rounded"><div className="w-5/6 h-full bg-emerald-600 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Virgo</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">Support</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-emerald-200 ml-auto rounded"><div className="w-4/5 h-full bg-emerald-600 rounded"></div></div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel for Storefronts & Subscriptions */}
              <div className="bg-white border border-[#dce2e8] rounded-md p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 uppercase mb-4">Priority Operations</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => setActiveTab('subscriptions')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-all">
                    <span className="text-xs font-bold text-amber-600 block mb-1">MTN MoMo Queue</span>
                    <span className="text-xs text-slate-600">{pendingPayments.length} pending payment proofs</span>
                  </button>
                  <button onClick={() => setActiveTab('sellers')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-all">
                    <span className="text-xs font-bold text-sky-600 block mb-1">Storefront Verification</span>
                    <span className="text-xs text-slate-600">{allShops.filter(s => !s.isVerified).length} awaiting Blue Tick</span>
                  </button>
                  <button onClick={() => setActiveTab('reports')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-all">
                    <span className="text-xs font-bold text-rose-600 block mb-1">Safety Moderation</span>
                    <span className="text-xs text-slate-600">{openReports.length} open reports</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && activeTab === 'analytics' && (
            <div className="bg-white border border-[#dce2e8] rounded-md p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-sm text-slate-800 uppercase">Marketplace Revenue & Order Trends (UGX)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                    <Tooltip formatter={(v: any) => [`UGX ${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="Revenue" stroke="#e74c3c" fill="#e74c3c" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!loading && activeTab === 'sellers' && (
            <div className="bg-white border border-[#dce2e8] rounded-md p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 uppercase mb-4">Storefront Verification Manager (Blue Tick ✓)</h3>
              <div className="space-y-3">
                {allShops.map((shop) => (
                  <div key={shop.id} className="p-4 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-800 text-xs">{shop.name}</strong>
                        {shop.isVerified && <span className="text-sky-600 font-bold" title="Verified">✓</span>}
                      </div>
                      <span className="text-[11px] text-slate-500">{shop.city}, {shop.countryCode} · {shop.sellType}</span>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => toggleVerification(shop)}
                      className={`py-1.5 px-4 rounded text-xs font-bold transition-all ${shop.isVerified ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}
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
            <div className="bg-white border border-[#dce2e8] rounded-md p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 uppercase mb-2">MTN MoMo Subscription Review Queue (0773927881)</h3>
              <p className="text-xs text-slate-500 mb-4">Recipient: <strong>Kabesha Bankenga</strong> · Fee: UGX 10,000 / month</p>
              <div className="space-y-3">
                {pendingPayments.map((record) => (
                  <div key={record.id} className="p-4 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">{record.status}</span>
                      <h4 className="font-bold text-slate-800 text-xs mt-1">{record.planName ?? record.planId} · {record.countryCode}</h4>
                      <small className="text-[10px] text-slate-500">Ref: {record.transactionReference}</small>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => reviewPayment(record.id, 'declined')} disabled={busy} className="py-1.5 px-3 bg-rose-100 text-rose-700 rounded text-xs font-semibold">Decline</button>
                      <button onClick={() => reviewPayment(record.id, 'approved')} disabled={busy} className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold">Approve (+30 Days)</button>
                    </div>
                  </div>
                ))}
                {!pendingPayments.length && <EmptyState title="No pending payment submissions">All MTN MoMo payments have been verified.</EmptyState>}
              </div>
            </div>
          )}

          {!loading && (activeTab === 'reports' || activeTab === 'countries' || activeTab === 'settings') && (
            <div className="bg-white border border-[#dce2e8] rounded-md p-8 text-center text-slate-500 text-xs shadow-sm">
              {activeTab === 'reports' && <p>Review reported listings and customer disputes in the moderation queue.</p>}
              {activeTab === 'countries' && <p>Configure regional currencies and payment instructions for East Africa.</p>}
              {activeTab === 'settings' && <p>FashionHub enterprise tier settings are fully synchronized with Supabase.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
