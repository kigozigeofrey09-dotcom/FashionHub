import { useEffect, useState, type FormEvent } from 'react';
import {
  LayoutDashboard, TrendingUp, Store, ShieldCheck, Layers, ShoppingBag,
  CreditCard, Megaphone, AlertTriangle, Globe, Settings as SettingsIcon, LogOut,
  Search, RefreshCw, Check, X, ArrowUpRight, DollarSign, Award, ShieldAlert,
  Mail, Users, Clock, Calendar, BarChart2, PieChart, Menu, Bell, Power, Info, MessageSquare, Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart as RePieChart, Pie, Cell } from 'recharts';
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
      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
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
    { month: 'Oct 11', Revenue: 4, Users: 15 },
    { month: 'Oct 12', Revenue: 10, Users: 35 },
    { month: 'Oct 13', Revenue: 7, Users: 28 },
    { month: 'Oct 14', Revenue: 12, Users: 65 },
    { month: 'Oct 15', Revenue: 20, Users: 95 },
  ];

  const userActivityData = [
    { date: 'Oct 10', new: 70, returning: 35 },
    { date: 'Oct 11', new: 40, returning: 20 },
    { date: 'Oct 12', new: 85, returning: 40 },
    { date: 'Oct 13', new: 60, returning: 30 },
    { date: 'Oct 14', new: 90, returning: 45 },
    { date: 'Oct 15', new: 95, returning: 50 },
    { date: 'Oct 16', new: 75, returning: 38 },
  ];

  const donutData = [
    { name: 'Returned', value: 2513, color: '#0ea5e9' },
    { name: 'Remaining', value: 1200, color: '#f97316' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans antialiased text-slate-800">

      {/* Sidebar Wrapper */}
      <aside className="w-64 bg-[#1d2531] text-slate-300 flex flex-col flex-shrink-0 shadow-2xl z-30">
        <div className="flex-1 overflow-y-auto">
          {/* Branded Orange Header ("ATLANT") */}
          <div className="h-16 bg-[#e04b4a] text-white flex items-center justify-center font-black tracking-widest text-xl uppercase shadow-md">
            ATLANT
          </div>

          {/* Top Profile Block */}
          <div className="p-5 bg-[#18202b] border-b border-[#293548] flex flex-col items-center text-center relative">
            <div className="relative mb-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
                alt="John Doe"
                className="w-20 h-20 rounded-full object-cover border-2 border-white/20 shadow-lg"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#18202b] rounded-full"></span>
            </div>
            <h3 className="font-bold text-white text-sm">John Doe</h3>
            <span className="text-[11px] text-slate-400 mt-0.5">Web Developer/Designer</span>
            <div className="flex items-center gap-2 mt-3">
              <button className="w-7 h-7 rounded bg-[#242f3e] hover:bg-[#2d3a4d] text-slate-300 flex items-center justify-center text-xs" title="Info"><Info size={13} /></button>
              <button className="w-7 h-7 rounded bg-[#242f3e] hover:bg-[#2d3a4d] text-slate-300 flex items-center justify-center text-xs" title="Messages"><MessageSquare size={13} /></button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <p className="text-[10px] font-bold text-slate-500 uppercase px-3 pt-2 tracking-wider">Navigation</p>

            <div className="space-y-0.5">
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded transition-all ${activeTab === 'overview' ? 'bg-[#242f3e] text-white border-l-4 border-[#e04b4a]' : 'text-slate-400 hover:text-white hover:bg-[#242f3e]'}`}>
                <span className="flex items-center gap-3"><LayoutDashboard size={15} /> Dashboards</span>
                <span className="text-[10px] text-slate-400 font-bold">▼</span>
              </button>
              {activeTab === 'overview' && (
                <div className="pl-8 py-1 space-y-1 bg-[#18202b]/50">
                  <button onClick={() => setActiveTab('overview')} className="w-full text-left py-1 text-[#e04b4a] font-bold text-xs">Dashboard 1</button>
                  <button onClick={() => setActiveTab('analytics')} className="w-full text-left py-1 text-slate-400 hover:text-white text-xs">Dashboard 2</button>
                  <button onClick={() => setActiveTab('sellers')} className="w-full text-left py-1 text-slate-400 hover:text-white text-xs">Dashboard 3</button>
                </div>
              )}
            </div>

            <button onClick={() => setActiveTab('reports')} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded text-slate-400 hover:text-white hover:bg-[#242f3e]">
              <span className="flex items-center gap-3"><Layers size={15} /> Pages</span>
              <span className="text-[10px] text-slate-500 font-bold">►</span>
            </button>
            <button onClick={() => setActiveTab('countries')} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded text-slate-400 hover:text-white hover:bg-[#242f3e]">
              <span className="flex items-center gap-3"><ShoppingBag size={15} /> Layouts</span>
              <span className="text-[10px] text-slate-500 font-bold">►</span>
            </button>

            <p className="text-[10px] font-bold text-slate-500 uppercase px-3 pt-4 tracking-wider">Components</p>
            <button onClick={() => setActiveTab('settings')} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded text-slate-400 hover:text-white hover:bg-[#242f3e]">
              <span className="flex items-center gap-3"><Settings size={15} /> UI Kits</span>
              <span className="text-[10px] text-slate-500 font-bold">►</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#293548] bg-[#18202b] flex-shrink-0">
          <button onClick={() => signOut()} className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all">
            <Power size={14} /> Secure Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header Bar */}
        <header className="h-16 bg-[#242f3e] text-white flex items-center justify-between px-6 shadow-md flex-shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-[#1d2531]">
              <Menu size={18} />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 bg-[#1d2531] border border-[#2d3b4e] rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e04b4a] w-56 shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="cursor-pointer text-base" title="English">🇬🇧</div>

            {/* Notification badge 3 */}
            <div className="relative cursor-pointer">
              <div className="w-8 h-8 rounded bg-[#1d2531] flex items-center justify-center text-slate-300 hover:text-white">
                <Bell size={16} />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-black text-[10px] font-black rounded-full flex items-center justify-center">3</span>
            </div>

            {/* Message badge 4 */}
            <div className="relative cursor-pointer">
              <div className="w-8 h-8 rounded bg-[#1d2531] flex items-center justify-center text-slate-300 hover:text-white">
                <Mail size={16} />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">4</span>
            </div>

            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 cursor-pointer">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Profile" className="w-full h-full object-cover" />
            </div>

            <button onClick={() => signOut()} className="w-8 h-8 rounded bg-[#1d2531] hover:bg-rose-950 text-slate-300 hover:text-rose-400 flex items-center justify-center transition-all" title="Logout">
              <Power size={16} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100">

          {/* Breadcrumbs */}
          <div className="text-xs text-slate-500 font-medium">
            Home <span className="mx-1">/</span> <span className="text-slate-800 font-bold capitalize">{activeTab}</span>
          </div>

          {message && <Notice tone="success">{message}</Notice>}
          {error && <Notice tone="error">{error}</Notice>}
          {loading && <Loading label="Loading ATLANT telemetry..." />}

          {!loading && activeTab === 'overview' && (
            <>
              {/* 4-Column Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: New Visitors */}
                <div className="bg-white border border-[#d6dee6] rounded-md p-5 shadow-sm hover:shadow transition-shadow relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">NEW Visitors</span>
                      <h3 className="text-3xl font-black text-slate-800 mt-1">{analytics?.totalUsers?.toLocaleString() || '1,977'}</h3>
                    </div>
                    <button className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">×</button>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    <span className="w-2 h-2 rounded-full bg-[#e04b4a]"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  </div>
                </div>

                {/* Card 2: New Messages */}
                <div className="bg-white border border-[#d6dee6] rounded-md p-5 shadow-sm hover:shadow transition-shadow relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                        <Mail size={22} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">48</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">NEW MESSAGES</span>
                        <span className="text-[10px] text-slate-400">In your mailbox</span>
                      </div>
                    </div>
                    <button className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">×</button>
                  </div>
                </div>

                {/* Card 3: Registered Users */}
                <div className="bg-white border border-[#d6dee6] rounded-md p-5 shadow-sm hover:shadow transition-shadow relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                        <Users size={22} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800">{analytics?.totalShops || '375'}</h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">REGISTRED USERS</span>
                        <span className="text-[10px] text-slate-400">On your website</span>
                      </div>
                    </div>
                    <button className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs">×</button>
                  </div>
                </div>

                {/* Card 4: Live Clock Widget (Solid Red #e04b4a) */}
                <div className="bg-[#e04b4a] text-white rounded-md p-5 shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{timeString || '13:09:00'}</h3>
                      <span className="text-[11px] text-white/90 block mt-0.5">{dateString || 'Saturday, December 9, 2023'}</span>
                    </div>
                    <button className="w-5 h-5 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center text-xs">×</button>
                  </div>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20 text-white/90 text-sm">
                    <Clock size={15} />
                    <Bell size={15} />
                    <Calendar size={15} />
                  </div>
                </div>
              </div>

              {/* Middle Flex/Grid Split (Sales & World Map + Projects Table) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column (Sales & Map - 8 cols) */}
                <div className="lg:col-span-8 bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase">SALES</h3>
                      <p className="text-[11px] text-slate-400">Sales activity by period you selected</p>
                    </div>
                    <div className="text-xs bg-slate-100 px-3 py-1 rounded border border-slate-200 text-slate-600 font-medium">
                      November 10, 2023 - December 9, 2023
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {/* Progress Bars */}
                    <div className="space-y-4">
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
                          <span className="text-rose-600 font-bold">Returned Products</span> <span>25/500</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: '5%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span className="text-amber-600 font-bold">Progress Today</span> <span>75/150</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* World Map Container */}
                    <div className="bg-[#1d2531] rounded-md p-4 relative h-48 flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner">
                      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:14px_14px]"></div>
                      <div className="text-center z-10 space-y-2">
                        <div className="inline-block px-3 py-1 bg-sky-500/20 text-sky-400 text-[10px] font-bold rounded-full border border-sky-500/30 animate-pulse">
                          🌍 Interactive Global Telemetry
                        </div>
                        <p className="text-[11px] text-slate-300">East Africa · Europe · North America · Asia</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Data update in end of each hour. You can update it manually by pressing update button.</span>
                    <button onClick={loadData} className="px-3 py-1 bg-[#e04b4a] hover:bg-[#cc3c3b] text-white rounded font-bold transition-all shadow-sm">Update</button>
                  </div>
                </div>

                {/* Right Column (Projects Table - 4 cols) */}
                <div className="lg:col-span-4 bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
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
                          <th className="pb-2 text-left">PROJECT</th>
                          <th className="pb-2 text-left">STATUS</th>
                          <th className="pb-2 text-right">ACTIVITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Atlant</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">Developing</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-red-100 ml-auto rounded"><div className="w-3/4 h-full bg-red-600 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Gemini</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded text-[10px] font-bold">Updating</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-yellow-100 ml-auto rounded"><div className="w-1/2 h-full bg-yellow-500 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Taurus</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded text-[10px] font-bold">Updating</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-yellow-100 ml-auto rounded"><div className="w-2/3 h-full bg-yellow-500 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Leo</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold">Support</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-green-100 ml-auto rounded"><div className="w-5/6 h-full bg-green-600 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Virgo</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold">Support</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-green-100 ml-auto rounded"><div className="w-4/5 h-full bg-green-600 rounded"></div></div></td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-semibold text-slate-700">Aquarius</td>
                          <td className="py-2.5"><span className="px-2 py-0.5 bg-green-100 text-green-600 rounded text-[10px] font-bold">Support</span></td>
                          <td className="py-2.5 text-right"><div className="w-16 h-1.5 bg-green-100 ml-auto rounded"><div className="w-full h-full bg-green-600 rounded"></div></div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Chart Row (3 Columns) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart 1: Sales & Event */}
                <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase">SALES & EVENT</h3>
                      <p className="text-[11px] text-slate-400">Event "Purchase Button"</p>
                    </div>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip />
                        <Area type="monotone" dataKey="Users" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} strokeWidth={2} />
                        <Area type="monotone" dataKey="Revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Users Activity */}
                <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase">USERS ACTIVITY</h3>
                      <p className="text-[11px] text-slate-400">Users vs returning</p>
                    </div>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="new" fill="#334155" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="returning" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Visitors Gauge */}
                <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 uppercase">VISITORS</h3>
                      <p className="text-[11px] text-slate-400">Visitors (last month)</p>
                    </div>
                  </div>
                  <div className="h-48 w-full relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={donutData}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returned</span>
                      <span className="text-xl font-black text-slate-800">2,513</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FashionHub Local Operations Panel */}
              <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 uppercase mb-4">FashionHub Operations Feed</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button onClick={() => setActiveTab('subscriptions')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-all shadow-sm">
                    <span className="text-xs font-bold text-amber-600 block mb-1">MTN MoMo Queue</span>
                    <span className="text-xs text-slate-600">{pendingPayments.length} pending payment proofs</span>
                  </button>
                  <button onClick={() => setActiveTab('sellers')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-all shadow-sm">
                    <span className="text-xs font-bold text-sky-600 block mb-1">Storefront Verification</span>
                    <span className="text-xs text-slate-600">{allShops.filter(s => !s.isVerified).length} awaiting Blue Tick</span>
                  </button>
                  <button onClick={() => setActiveTab('reports')} className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-left transition-all shadow-sm">
                    <span className="text-xs font-bold text-rose-600 block mb-1">Safety Moderation</span>
                    <span className="text-xs text-slate-600">{openReports.length} open reports</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {!loading && activeTab === 'analytics' && (
            <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm space-y-6">
              <h3 className="font-bold text-sm text-slate-800 uppercase">Marketplace Revenue & Order Trends (UGX)</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `${(v/1000000).toFixed(0)}M`} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Revenue" stroke="#e04b4a" fill="#e04b4a" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!loading && activeTab === 'sellers' && (
            <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
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
            <div className="bg-white border border-[#d6dee6] rounded-md p-6 shadow-sm">
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
            <div className="bg-white border border-[#d6dee6] rounded-md p-8 text-center text-slate-500 text-xs shadow-sm">
              {activeTab === 'reports' && <p>Review reported listings and customer disputes in the moderation queue.</p>}
              {activeTab === 'countries' && <p>Configure regional currencies and payment instructions for East Africa.</p>}
              {activeTab === 'settings' && <p>FashionHub enterprise tier settings are fully synchronized with Supabase.</p>}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
