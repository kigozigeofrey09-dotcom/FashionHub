import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Globe2, Megaphone, Users, CreditCard, 
  Search, Bell, TrendingUp, ShieldCheck, Zap, MapPin, Activity, CheckCircle2, XCircle
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('Kampala Central');
  const adminEmail = "kigozigeofrey09@gmail.com";

  // Simulated live user pins on the map
  const liveUsers = [
    { id: 1, name: "Urban Wear Boutique", type: "FashionHub Seller", location: "Kampala (Owino / Gazaland)", lat: 0.3152, lng: 32.5816, status: "Online" },
    { id: 2, name: "Global Visa Consults", type: "Visit Agency", location: "Nairobi Corridor", lat: -1.2921, lng: 36.8219, status: "Active Lead" },
    { id: 3, name: "Kampala Style Hub", type: "Buyer / Shopper", location: "Nakawa, Kampala", lat: 0.3380, lng: 32.6071, status: "Browsing" },
    { id: 4, name: "London Visa Express", type: "Visit Partner", location: "Entebbe Road", lat: 0.0511, lng: 32.4630, status: "Verified" }
  ];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0b0f19] text-slate-200 flex font-sans overflow-hidden select-none">
      
      {/* Classic Dark Sidebar */}
      <aside className="w-64 bg-[#111827] border-r border-slate-800/80 flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-[#111827]">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-600/30">
            D
          </div>
          <span className="font-bold text-base text-white tracking-wide">DayBook Super Admin</span>
        </div>

        <div className="p-4 border-b border-slate-800/50 flex items-center gap-3 bg-[#161e31]/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            KG
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{adminEmail}</p>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Master Access
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 text-xs font-medium text-slate-400">
          <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">Core Navigation</div>
          
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
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
              <Globe2 className="w-4 h-4" />
              <span>Visit Visa Agencies</span>
            </div>
            <span className="text-[10px] bg-purple-900/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50">412</span>
          </button>

          <button 
            onClick={() => setActiveTab('ads')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'ads' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <Zap className="w-4 h-4" />
            <span>Ad Management Suite</span>
          </button>

          <div className="pt-4 px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">System Telemetry</div>
          <button 
            onClick={() => setActiveTab('map')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'map' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <MapPin className="w-4 h-4" />
            <span>Live User Map Radar</span>
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/60 hover:text-slate-200'}`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Flutterwave Logs</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-[#0b0f19] overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-[#111827] border-b border-slate-800/80 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-white text-sm">Super Admin Portal</span>
            <span>/</span>
            <span className="text-blue-400 uppercase tracking-wider font-medium">{activeTab}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search shops, listings, leads..." 
                className="bg-[#0b0f19] border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-600 w-64"
              />
            </div>

            <button className="text-slate-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
              >
                ⚡ Admin Center
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Exit to Storefront
              </button>
            </div>
            </button>
          </div>
        </header>

        {/* Dashboard Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">Platform Revenue (Flutterwave)</p>
              <h3 className="text-2xl font-bold text-white mt-2">UGX 3,450,000</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">+14.2% <TrendingUp className="w-3 h-3" /></span>
                <span className="text-slate-500">Active ads & subs</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">FashionHub Shops</p>
              <h3 className="text-2xl font-bold text-white mt-2">128 Active</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-blue-400 font-semibold">+8 new boutiques</span>
                <span className="text-slate-500">Kampala region</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">Visit Visa Corridor Leads</p>
              <h3 className="text-2xl font-bold text-white mt-2">412 Claims</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-purple-400 font-semibold">+32 today</span>
                <span className="text-slate-500">Global agencies</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-slate-800/80 p-5 rounded-xl shadow-lg">
              <p className="text-xs text-slate-400 font-medium">Super Admin Security</p>
              <h3 className="text-lg font-bold text-emerald-400 mt-2 truncate">Enforced</h3>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <span className="text-emerald-400 font-semibold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> RLS Bypassed</span>
                <span className="text-slate-500">Verified</span>
              </div>
            </div>
          </div>

          {/* Grid Layout: Map Radar & Activity Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Interactive Live User Map Reader (2 Columns) */}
            <div className="lg:col-span-2 bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-400" /> Live User & Agency Radar
                    </h4>
                    <p className="text-xs text-slate-400">Real-time geographic distribution of active FashionHub sellers & Visit leads</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span> Radar Live
                    </span>
                  </div>
                </div>

                {/* Styled Dark Map Simulation Box with Radar Grid */}
                <div className="h-64 w-full bg-[#070a12] rounded-xl border border-slate-800/80 relative overflow-hidden flex items-center justify-center">
                  
                  {/* Radar Scan Rings */}
                  <div className="absolute w-48 h-48 rounded-full border border-blue-500/20 animate-pulse"></div>
                  <div className="absolute w-32 h-32 rounded-full border border-blue-500/30"></div>
                  <div className="absolute w-16 h-16 rounded-full border border-blue-500/40"></div>
                  <div className="absolute w-full h-[1px] bg-blue-500/10"></div>
                  <div className="absolute h-full w-[1px] bg-blue-500/10"></div>

                  {/* Simulated Map Pins */}
                  <div className="absolute top-16 left-24 flex flex-col items-center group cursor-pointer">
                    <span className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500 animate-bounce"></span>
                    <span className="bg-[#111827] border border-slate-700 text-[10px] text-white px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">Kampala Central (Sellers)</span>
                  </div>

                  <div className="absolute bottom-20 right-32 flex flex-col items-center group cursor-pointer">
                    <span className="w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500 animate-pulse"></span>
                    <span className="bg-[#111827] border border-slate-700 text-[10px] text-white px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">Nairobi Corridor (Visit Lead)</span>
                  </div>

                  <div className="absolute top-24 right-20 flex flex-col items-center group cursor-pointer">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500"></span>
                    <span className="bg-[#111827] border border-slate-700 text-[10px] text-white px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">Entebbe Hub</span>
                  </div>

                  {/* Map Footer Overlay */}
                  <div className="absolute bottom-3 left-3 bg-[#111827]/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 flex items-center gap-3 backdrop-blur">
                    <span>Region: <b>East Africa & Global</b></span>
                    <span className="text-slate-500">|</span>
                    <span className="text-emerald-400">4 Active Nodes Connected</span>
                  </div>
                </div>
              </div>

              {/* Live Pins List Table */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] uppercase text-slate-500">
                    <tr>
                      <th className="pb-2">Node Name</th>
                      <th className="pb-2">Platform Role</th>
                      <th className="pb-2">Location</th>
                      <th className="pb-2 text-right">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {liveUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30">
                        <td className="py-2 font-medium text-white">{u.name}</td>
                        <td className="py-2 text-blue-400">{u.type}</td>
                        <td className="py-2 text-slate-400">{u.location}</td>
                        <td className="py-2 text-right text-emerald-400 font-semibold">{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Revenue & Ad Campaign Quick Control */}
            <div className="bg-[#111827] border border-slate-800/80 p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm mb-1">Ad Suite & Monetization</h4>
                <p className="text-xs text-slate-400 mb-6">Restricted to `kigozigeofrey09@gmail.com`</p>

                <div className="space-y-4">
                  <div className="p-3 bg-[#0b0f19] border border-slate-800 rounded-lg">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-medium">Homepage Banner Ad</span>
                      <span className="text-emerald-400">Active</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Urban Wear Boutique � Expires in 4 days</p>
                  </div>

                  <div className="p-3 bg-[#0b0f19] border border-slate-800 rounded-lg">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-slate-300 font-medium">Featured Shop Slot</span>
                      <span className="text-amber-400">Pending Review</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Kampala Thrift Hub � UGX 25,000 paid</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-blue-600/20">
                  Manage All Ad Campaigns
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
