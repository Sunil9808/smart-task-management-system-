import { useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  CalendarDays,
  CalendarClock,
  UserRound,
  LogOut,
  Menu,
  X,
  ArrowUpRight,
  Sprout,
} from 'lucide-react';
import { Brand } from '../components/Common';
import { useAuth, useToast } from '../hooks/useApp';
import { errorMessage } from '../services/api';
const links = [
  ['/', 'Overview', LayoutDashboard],
  ['/tasks', 'All tasks', ListTodo],
  ['/today', 'Today', CalendarDays],
  ['/upcoming', 'Upcoming', CalendarClock],
];
export function AppLayout() {
  const { user, logout } = useAuth(),
    notify = useToast(),
    [open, setOpen] = useState(false),
    [loggingOut, setLoggingOut] = useState(false),
    location = useLocation();
  async function signOut() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      notify(errorMessage(err), 'error');
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-only"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="workspace-avatar">P</span>
          <div>
            Personal workspace<small>Your space to make progress</small>
          </div>
        </div>
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
              <Icon size={19} />
              {label}
              {to === '/today' && <span className="nav-today-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <Sprout size={25} />
          <h3>Small steps. Big things.</h3>
          <p>A little progress every day goes a long way.</p>
          <Link to="/tasks?new=1" onClick={() => setOpen(false)}>
            Make your next move <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/profile" onClick={() => setOpen(false)}>
            <UserRound size={19} />
            My profile
          </NavLink>
          <button onClick={signOut} disabled={loggingOut}>
            <LogOut size={19} />
            {loggingOut ? 'Signing out…' : 'Sign out'}
          </button>
          <div className="sidebar-user">
            <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{user.name}</strong>
              <small>Personal account</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-only"
              aria-label="Open navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>
              {location.pathname === '/profile'
                ? 'My profile'
                : links.find(([to]) => to === location.pathname)?.[1] || 'Tasks'}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <Link to="/profile" className="avatar" aria-label="View profile">
              {user.name.slice(0, 1).toUpperCase()}
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>A little more organized. A little more you.</span>
          <span>Made for your everyday.</span>
        </footer>
      </div>
    </div>
  );
}
