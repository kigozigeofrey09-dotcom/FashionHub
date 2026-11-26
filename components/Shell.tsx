import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { subscriptionsEnabled } from '../config/features';
import { notificationService } from '../services/notificationService';
import { TerrabokLogo } from '../components/TerrabokLogo';

const links = [
  { to: '/', label: 'Discover', end: true },
  { to: '/style-swipe', label: 'Style Swipe' },
  { to: '/drip-ai', label: 'Drip AI Stylist' },
  { to: '/vault', label: 'The Vault' },
  { to: '/seller/setup', label: 'Open a shop' },
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
    <>
      <header className="site-header">
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
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <Link className="brand brand-footer" to="/">
            <TerrabokLogo compact />
          </Link>
        <nav aria-label="Footer links">
          {subscriptionsEnabled && <Link to="/subscriptions">Subscriptions</Link>}
          <Link to="/notifications">Notifications</Link>
          <Link to="/support">FAQ &amp; support</Link>
          <Link to="/policies">Policies</Link>
        </nav>
        <span>Terrabok · independent fashion marketplace</span>
      </footer>
    </>
  );
}








