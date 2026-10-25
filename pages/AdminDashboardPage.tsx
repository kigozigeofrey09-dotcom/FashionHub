import React, { useState } from 'react';
import { 
  LayoutDashboard, FileText, Layers, Cpu, Box, FileCode, 
  BarChart2, Table, Lock, Bell, Search, Globe, ChevronDown, 
  TrendingUp, ArrowUpRight, Store, ShieldCheck, Zap
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const adminEmail = "kigozigeofrey09@gmail.com";

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b0f19] text-slate-200 flex font-sans overflow-hidden select-none">
      
      {/* 1. Left Sidebar (Star Admin Style) */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800/80 flex flex-col flex-shrink-0">
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-[#111827]">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-600/30">
            D
          </div>
          <span className="font-bold text-base text-white tracking-wide">DayBook Admin</span>
        </div>

        {/* User Profile Mini Card */}
        <div className="p-4 border-b border-slate-800/50 flex items-center gap-3 bg-[#161e31]/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            KG
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{adminEmail}</p>
            <p className="text-[10px] text-blue-400 font-medium">Super Admin</p>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-xs font-medium text-slate-400">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">Main Menu</div>
          
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          <button 
            onClick={() => setActiveTab('fashionhub')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${activeTab === 'fashionhub' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <Store className="w-4 h-4" />
              <span>FashionHub Shops</span>
            </div>
            <span className="text-[10px] bg-blue-900/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-700/50">128</span>
          </button>

          <button 
            onClick={() => setActiveTab('visit')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${activeTab === 'visit' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4" />
              <span>Visit Agencies</span>
            </div>
            <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50">412</span>
          </button>

          <button 
            onClick={() => setActiveTab('ads')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition ${activeTab === 'ads' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4" />
              <span>Ad Campaigns</span>
            </div>
          </button>

          <div className="pt-4 px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">UI Elements & Tools</div>
          
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 transition">
            <div className="flex items-center gap-3"><Box className="w-4 h-4" /><span>Widgets</span></div>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 transition">
            <div className="flex items-center gap-3"><BarChart2 className="w-4 h-4" /><span>Charts</span></div>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 transition">
            <div className="flex items-center gap-3"><Table className="w-4 h-4" /><span>Tables</span></div>
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800/60 hover:text-slate-200 transition">
            <div className="flex items-center gap-3"><Lock className="w-4 h-4" /><span>Security RLS</span></div>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col bg-[#0b0f19] overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-[#111827] border-b border-slate-800/80 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="font-semibold text-white">Dashboard</span>
            <span>/</span>
            <span>ui elements</span>
            <span>/</span>
            <span className="text-blue-400 font-medium">super analytics</span>
          </div>

          <div className="flex items-center gap-5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search analytics..." 
                className="bg-[#0b0f19] border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-600 w-64"
              />
            </div>

            <button className="text-slate-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            </button>

            <button 
              onClick={() => window.location.href = '/'}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              Exit Admin
            </button>
          </div>
        </header>

        {/* Dashboard Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* Filter Bar Row */}
          <div className="flex items-center justify-between bg-[#111827] border border-slate-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-blue-600 text-white rounded-lg">DayBook Analytics (Live)</span>
              <span className="text-xs text-slate-400 px-3">Flutterwave Gateway: Active</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md font-medium">Sales</button>
              <button className="px-3 py-1.5 bg-[#0b0f19] text-slate-400 hover:text-white rounded-md border border-slate-800">Orders</button>
              <button className="px-3 py-1.5 bg-[#0b0f19] text-slate-400 hover:text-white rounded-md border border-slate-800">Ad Revenue</button>
            </div>
          </div>

          {/* Top 4 Stat Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">Total Platform Revenue</p>
              <h3 className="text-2xl font-bold text-white mt-2">UGX 3,450,000</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">+14.2% <TrendingUp className="w-3 h-3" /></span>
                <span className="text-slate-500">vs last month</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">FashionHub Shops</p>
              <h3 className="text-2xl font-bold text-white mt-2">128 Active</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-blue-400 font-semibold">+8 new shops</span>
                <span className="text-slate-500">Kampala region</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">Visit Visa Leads</p>
              <h3 className="text-2xl font-bold text-white mt-2">412 Claims</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-purple-400 font-semibold">+32 today</span>
                <span className="text-slate-500">Corridors active</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">Super Admin Access</p>
              <h3 className="text-lg font-bold text-emerald-400 mt-2 truncate">Authorized</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> RLS Bypassed</span>
                <span className="text-slate-500">Secure</span>
              </div>
            </div>
          </div>

          {/* Charts Section matching manly_2.webp */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Sales & Area Chart */}
            <div className="lg:col-span-2 bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="font-bold text-white text-sm">Sales Statistics Overview</h4>
                    <p className="text-xs text-slate-400">Combined revenue metrics from FashionHub and Visit</p>
                  </div>
                  <div className="flex gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Sales</span>
                  </div>
                </div>

                {/* Simulated Wave Chart Area */}
                <div className="h-56 w-full bg-[#0b0f19] rounded-lg p-4 flex items-end justify-between gap-3 border border-slate-800/60 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none"></div>
                  {[35, 60, 45, 80, 95, 70, 110, 95, 130, 150, 140, 175].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end z-10">
                      <div 
                        style={{ height: `${val}px` }} 
                        className="w-full bg-gradient-to-t from-blue-600 via-indigo-500 to-purple-500 rounded-t-sm shadow-md hover:brightness-125 transition-all"
                      ></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-6 pt-4 border-t border-slate-800/80">
                <span>Data syncing from Feb 2026</span>
                <span className="text-emerald-400 font-medium">Peak Performance Verified</span>
              </div>
            </div>

            {/* Right Side Radar / Distribution Widget */}
            <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Net Profit Margin</h4>
                <p className="text-xs text-slate-400 mb-6">Subscription & Ad Fee Distribution</p>

                {/* Simulated Radar Shape Graphic */}
                <div className="h-44 w-full bg-[#0b0f19] rounded-lg border border-slate-800/60 flex items-center justify-center relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-600/40 to-purple-600/40 border border-blue-400/50 flex items-center justify-center shadow-lg shadow-blue-500/20 rotate-12">
                    <div className="w-16 h-16 rounded-full bg-blue-600/20 border border-purple-400/60 flex items-center justify-center text-[10px] font-bold text-blue-300">
                      62% Ads
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-blue-500"></span> FashionHub Ads</div>
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded bg-purple-500"></span> Visit Subs</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400">Status</span>
                <span className="text-xs text-emerald-400 font-semibold">Fully Optimized</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
