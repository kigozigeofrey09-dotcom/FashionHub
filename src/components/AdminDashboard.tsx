import React, { useState } from 'react';
import { 
  BarChart3, Store, Globe2, Megaphone, Users, CreditCard, Settings, 
  Search, Bell, ArrowUpRight, TrendingUp, ShieldAlert, CheckCircle2, XCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Hardcoded check for Super Admin
  const adminEmail = "kigozigeofrey09@gmail.com";

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
            D
          </div>
          <span className="font-bold text-lg tracking-wide text-white">DayBook <span className="text-xs text-blue-400 font-normal px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800">Super Admin</span></span>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search shops, listings, agencies..." 
              className="bg-[#0f172a] border border-slate-700 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500 w-64"
            />
          </div>

          <button className="relative text-slate-400 hover:text-white transition">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 border-l border-slate-800 pl-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              KG
            </div>
            <div className="text-xs">
              <p className="font-medium text-slate-200">{adminEmail}</p>
              <p className="text-slate-400">Master Authority</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#1e293b]/50 border-r border-slate-800 p-4 flex flex-col gap-1">
          <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <BarChart3 className="w-4 h-4" /> Dashboard Overview
          </button>

          <div className="px-3 py-2 mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Platform Modules
          </div>
          <button 
            onClick={() => setActiveTab('fashionhub')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'fashionhub' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Store className="w-4 h-4" /> FashionHub Shops
          </button>

          <button 
            onClick={() => setActiveTab('visit')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'visit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Globe2 className="w-4 h-4" /> Visit Agencies
          </button>

          <button 
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'ads' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Megaphone className="w-4 h-4" /> Ad Campaigns
          </button>

          <div className="px-3 py-2 mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            System
          </div>
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>

          <button 
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === 'transactions' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <CreditCard className="w-4 h-4" /> Flutterwave Logs
          </button>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Super Admin Metrics</h1>
              <p className="text-sm text-slate-400 mt-1">Real-time platform activity for FashionHub and Visit</p>
            </div>
            <div className="flex gap-2 bg-[#1e293b] p-1 rounded-lg border border-slate-800 text-xs">
              <button className="px-3 py-1.5 rounded bg-blue-600 text-white font-medium">Live Feed</button>
              <button className="px-3 py-1.5 rounded text-slate-400 hover:text-white">Daily</button>
              <button className="px-3 py-1.5 rounded text-slate-400 hover:text-white">Monthly</button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-medium text-slate-400">Total Revenue</p>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">UGX 3,450,000</h3>
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                +14.2% <span className="text-slate-500">from last month</span>
              </p>
            </div>

            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-medium text-slate-400">FashionHub Sellers</p>
                <Store className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">128 Shops</h3>
              <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                +8 new <span className="text-slate-500">this week</span>
              </p>
            </div>

            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-medium text-slate-400">Active Listings</p>
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">1,540</h3>
              <p className="text-xs text-purple-400 mt-2 flex items-center gap-1">
                98% <span className="text-slate-500">verified items</span>
              </p>
            </div>

            <div className="bg-[#1e293b] border border-slate-800 p-5 rounded-xl">
              <div className="flex justify-between items-start">
                <p className="text-xs font-medium text-slate-400">Visit Agency Leads</p>
                <Globe2 className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-2">412 Claims</h3>
              <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                +32 corridor leads <span className="text-slate-500">today</span>
              </p>
            </div>
          </div>

          {/* Charts & Analytics Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#1e293b] border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Sales & Messaging Activity</h3>
                  <span className="text-xs text-slate-400">FashionHub + Visit</span>
                </div>
                {/* Simulated Chart Line */}
                <div className="h-48 w-full bg-[#0f172a] rounded-lg p-4 flex items-end justify-between gap-2 border border-slate-800/60">
                  {[40, 65, 30, 85, 95, 75, 110, 90, 120, 140, 130, 160].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div 
                        style={{ height: `${height}px` }} 
                        className="w-full bg-gradient-to-t from-blue-600 to-purple-500 rounded-t-sm opacity-80 hover:opacity-100 transition"
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800">
                <span>Jan - Oct 2026</span>
                <span className="text-emerald-400 font-medium">Peak Volume: 160 Interactions/day</span>
              </div>
            </div>

            {/* Revenue Distribution Card */}
            <div className="bg-[#1e293b] border border-slate-800 p-6 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">FashionHub Ads & Banners</span>
                      <span className="text-blue-400 font-semibold">62%</span>
                    </div>
                    <div className="w-full h-2 bg-[#0f172a] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[62%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Visit Agency Subscriptions</span>
                      <span className="text-purple-400 font-semibold">28%</span>
                    </div>
                    <div className="w-full h-2 bg-[#0f172a] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 w-[28%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Featured Shop Slots</span>
                      <span className="text-amber-400 font-semibold">10%</span>
                    </div>
                    <div className="w-full h-2 bg-[#0f172a] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 w-[10%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-blue-950/40 border border-blue-800/50 rounded-lg flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <p className="text-xs text-blue-200">Flutterwave webhook live and collecting payments directly.</p>
              </div>
            </div>
          </div>

          {/* Pending Approvals Table */}
          <div className="bg-[#1e293b] border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-white">Pending Ad Requests</h3>
              <span className="text-xs text-slate-400">Requires Admin Approval</span>
            </div>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0f172a] text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Seller / Agency</th>
                  <th className="px-6 py-3">Campaign Type</th>
                  <th className="px-6 py-3">Amount Paid</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/40">
                  <td className="px-6 py-4 font-medium text-white">Urban Wear Boutique</td>
                  <td className="px-6 py-4">Homepage Hero Banner</td>
                  <td className="px-6 py-4 text-emerald-400">UGX 90,000</td>
                  <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs rounded-full bg-amber-950 text-amber-400 border border-amber-800">Pending</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 transition">Approve</button>
                    <button className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700 transition">Reject</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
