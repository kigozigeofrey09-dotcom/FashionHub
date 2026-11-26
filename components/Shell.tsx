import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  Compass,
  Layers,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { subscriptionsEnabled } from '../config/features';
import { notificationService } from '../services/notificationService';
import { TerrabokLogo } from '../components/TerrabokLogo';

const links = [
  { to: '/', label: 'Discover', end: true },
  { to: '/style-swipe', label: 'Style Swipe' },
  { to: '/drip-ai', label: 'Drip AI Stylist' },
  { to: '/vault', label: 'The Vault' },
  { to: '/seller/setup', label: 'Sell on TerraBok' },
];

const ebayDepartments = [
  { to: '/', label: 'All Fashion' },
  { to: '/style-swipe', label: 'Daily Drops' },
  { to: '/drip-ai', label: 'AI Curator' },
  { to: '/vault', label: 'Verified Vault' },
  { to: '/seller/setup', label: 'Open a Shop' },
];

export function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const { session, signOut } = useAppContext();
  const isTeammateOpsUser = (session?.user?.email || '').trim().toLowerCase() === 'semmyarsene0@gmail.com';
  const navigate = useNavigate();

  useEffect(() => {
    const savedTheme = localStorage.getItem('fh_theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setUnread(0);
      return;
    }
    let active = true;
    const refreshUnread = () =>
      void notificationService
        .unreadCount()
        .then((result) => {
          if (active) setUnread(result.unread);
        })
        .catch(() => {
          if (active) setUnread(0);
        });
    refreshUnread();
    const timer = window.setInterval(refreshUnread, 30_000);
    window.addEventListener('focus', refreshUnread);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshUnread);
    };
  }, [session]);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('fh_theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('fh_theme', 'light');
    }
  }

  return (
    <div className="tb-ebay-shell">
      <div className="tb-utility-strip" role="region" aria-label="Marketplace assurance">
        <div className="tb-utility-inner">
          <span className="tb-utility-item">
            <ShieldCheck size={14} />
            <span>Buyer Protection &amp; Verified Shops</span>
          </span>
          <span className="tb-utility-item">
            <Store size={14} />
            <span>Direct Bids, Offers &amp; Instant Buy</span>
          </span>
          <span className="tb-utility-item tb-utility-right">
            <Link to="/seller/setup">Sell an item</Link>
            <span>·</span>
            <Link to="/support">Help &amp; Support</Link>
          </span>
        </div>
      </div>

      <header className="site-header tb-ebay-header">
        <div className="tb-header-main">
          <Link className="brand" to="/" aria-label="Terrabok home">
            <TerrabokLogo compact />
          </Link>

          <button
            className="mobile-menu"
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            {subscriptionsEnabled && (
              <NavLink to="/subscriptions" onClick={() => setMenuOpen(false)}>
                Subscriptions
              </NavLink>
            )}
            {session && (
              <NavLink to="/notifications" onClick={() => setMenuOpen(false)}>
                Notifications
              </NavLink>
            )}
            {session?.user.role === 'seller' && (
              <NavLink to="/seller/dashboard" onClick={() => setMenuOpen(false)}>
                Seller studio
              </NavLink>
            )}
            {(session?.user.role === 'admin' || isTeammateOpsUser) && (
              <>
                {isTeammateOpsUser && (
                  <NavLink to="/teammate/dashboard" onClick={() => setMenuOpen(false)}>
                    Teammate Ops
                  </NavLink>
                )}
                <NavLink to="/admin" onClick={() => setMenuOpen(false)}>
                  Admin
                </NavLink>
              </>
            )}
          </nav>

          <div className="header-actions">
            {(session?.user.role === 'admin' || session?.user.email?.toLowerCase() === 'kigozigeofrey09@gmail.com') && (
              <Link
                className="button button-dark"
                to="/admin"
                style={{ background: '#315039', color: '#c7df77', fontSize: '10px', padding: '0 12px' }}
              >
                Admin Center
              </Link>
            )}

            <button
              type="button"
              className="icon-button"
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
              title="Toggle dark mode"
              style={{ borderRadius: '50%' }}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {session && (
              <Link
                className="notification-link"
                to="/notifications"
                aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              >
                <Bell size={17} />
                {unread > 0 && <span>{unread > 9 ? '9+' : unread}</span>}
              </Link>
            )}

            {session ? (
              <>
                <Link className="account-link" to="/account">
                  {session.user.name} <ArrowUpRight size={14} />
                </Link>
                <span className="role-pill">{session.user.role}</span>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={async () => {
                    await signOut().catch(() => undefined);
                    setMenuOpen(false);
                    navigate('/auth/sign-in', { replace: true });
                  }}
                  aria-label="Sign out"
                >
                  <LogOut size={14} />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <Link className="button button-dark" to="/auth/sign-in" style={{ minHeight: '36px', padding: '0 14px' }}>
                Sign in <ArrowUpRight size={14} />
              </Link>
            )}
          </div>
        </div>

        <nav className="tb-department-bar" aria-label="Marketplace departments">
          {ebayDepartments.map((dept) => (
            <NavLink
              key={dept.to + dept.label}
              to={dept.to}
              end={dept.to === '/'}
              className="tb-dept-link"
            >
              {dept.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="app-main tb-ebay-main">
        <Outlet />
      </main>

      <nav className="tb-mobile-bottom-nav" aria-label="Bottom navigation">
        <NavLink to="/" end>
          <Compass size={18} />
          <span>Discover</span>
        </NavLink>
        <NavLink to="/style-swipe">
          <Layers size={18} />
          <span>Swipe</span>
        </NavLink>
        <NavLink to="/drip-ai">
          <Sparkles size={18} />
          <span>Drip AI</span>
        </NavLink>
        <NavLink to="/vault">
          <Store size={18} />
          <span>Vault</span>
        </NavLink>
        <NavLink to={session ? '/account' : '/auth/sign-in'}>
          <User size={18} />
          <span>{session ? 'Account' : 'Sign in'}</span>
        </NavLink>
      </nav>

      <footer className="site-footer tb-ebay-footer">
        <Link className="brand brand-footer" to="/">
          <TerrabokLogo compact />
        </Link>
        <nav aria-label="Footer links">
          {subscriptionsEnabled && <Link to="/subscriptions">Subscriptions</Link>}
          <Link to="/notifications">Notifications</Link>
          <Link to="/support">FAQ &amp; support</Link>
          <Link to="/policies">Policies</Link>
        </nav>
        <span>TerraBok · independent fashion marketplace</span>
      </footer>
    </div>
  );
}