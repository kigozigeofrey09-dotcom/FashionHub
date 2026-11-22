import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Globe2, Users, CreditCard,
  Search, Bell, TrendingUp, ShieldCheck, Zap, MapPin, CheckCircle2, XCircle
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const adminEmail = 'kigozigeofrey09@gmail.com';

  const liveUsers = [
    { id: 1, name: 'Urban Wear Boutique', type: 'FashionHub Seller', location: 'Kampala (Owino / Gazaland)', status: 'Online' },
    { id: 2, name: 'Global Visa Consults', type: 'Visit Agency', location: 'Nairobi Corridor', status: 'Active Lead' },
    { id: 3, name: 'Kampala Style Hub', type: 'Buyer / Shopper', location: 'Nakawa, Kampala', status: 'Browsing' },
    { id: 4, name: 'London Visa Express', type: 'Visit Partner', location: 'Entebbe Road', status: 'Verified' },
  ];

  const filteredUsers = liveUsers.filter((item) =>
    !searchTerm.trim() ||
    `${item.name} ${item.type} ${item.location} ${item.status}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase())
  );

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
            KG
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#141414', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminEmail}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '10.5px', color: '#2c4734', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Master Access
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px' }}>
          <div style={{ padding: '4px 10px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
            Core Navigation
          </div>

          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard, badge: '' },
            { id: 'fashionhub', label: 'FashionHub Shops', icon: Store, badge: '128' },
            { id: 'visit', label: 'Visit Visa Agencies', icon: Globe2, badge: '412' },
            { id: 'ads', label: 'Ad Management Suite', icon: Zap, badge: '' },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
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
                {item.badge && (
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

          <div style={{ padding: '16px 10px 8px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
            System Telemetry
          </div>

          {[
            { id: 'map', label: 'Live User Map Radar', icon: MapPin },
            { id: 'transactions', label: 'Payment & Order Logs', icon: CreditCard },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
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
                <Icon size={15} />
                <span>{item.label}</span>
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
              Admin Studio
            </span>
            <span>/</span>
            <span style={{ color: '#2c4734', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '10.5px', fontWeight: 700 }}>
              {activeTab}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#6e6d68' }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search shops, listings, leads..."
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
              aria-label="Notifications"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '1px solid #e6e4de',
                background: '#ffffff',
                color: '#141414',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Bell size={15} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin')}
              style={{
                padding: '8px 14px',
                borderRadius: '7px',
                border: '1px solid #141414',
                background: '#141414',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Admin Center
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
              Exit to Storefront
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Platform Volume', value: 'UGX 3,450,000', delta: '+14.2% vs last cycle', note: 'Active ads & subs' },
              { label: 'FashionHub Shops', value: '128 Active', delta: '+8 new boutiques', note: 'Kampala & Uganda' },
              { label: 'Active Members', value: '2,840', delta: '94.6% retention', note: 'Buyers & makers' },
              { label: 'Live Presence', value: `${filteredUsers.length} tracked`, delta: 'Real-time activity', note: 'East Africa' },
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
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e6e4de', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: '#2c4734', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={12} /> {card.delta}
                  </span>
                  <span style={{ color: '#6e6d68' }}>{card.note}</span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e6e4de',
              borderRadius: '12px',
              padding: '22px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '10.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6e6d68' }}>
                  DIRECTORY &amp; ACTIVITY
                </p>
                <h2 style={{ margin: '4px 0 0', fontFamily: "var(--serif, 'Cormorant Garamond', Georgia, serif)", fontSize: '28px', fontWeight: 400 }}>
                  Active studios &amp; <em>leads.</em>
                </h2>
              </div>
              <span style={{ fontSize: '12px', color: '#6e6d68', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} /> {filteredUsers.length} records
              </span>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
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
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#141414' }}>{user.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#6e6d68' }}>
                      {user.type} · {user.location}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: '#eef2ec',
                        color: '#2c4734',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={12} /> {user.status}
                    </span>
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
                      Manage
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#6e6d68', fontSize: '12.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <XCircle size={15} /> No matching entries for &ldquo;{searchTerm}&rdquo;.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
