import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';
import './ResponsiveAdmin.css';

const items = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { id: 'support', label: 'Support', icon: 'support_agent', path: '/support' },
  { id: 'devices', label: 'Devices', icon: 'motorcycle', path: '/devices' },
  { id: 'firmware', label: 'Firmware', icon: 'system_update_alt', path: '/firmware' },
  { id: 'app-releases', label: 'App APKs', icon: 'android', path: '/app-releases' },
  { id: 'users', label: 'Users', icon: 'group', path: '/users' },
  { id: 'interested-users', label: 'Interested Users', icon: 'person_add', path: '/interested-users' },
  { id: 'helpers', label: 'Helpers', icon: 'build', path: '/helpers' },
  { id: 'audit-logs', label: 'Audit Logs', icon: 'admin_panel_settings', path: '/audit-logs' },
  { id: 'notifications', label: 'Alerts', icon: 'notifications', path: '/notifications' },
];
const mobileIds = ['dashboard', 'users', 'devices', 'support'];
const iconPaths = {
  dashboard: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  support_agent: 'M4 14v-3a8 8 0 0 1 16 0v3 M4 11H2v7h4v-7z M20 11h2v7h-4v-7z M20 18v2h-8',
  motorcycle: 'M8 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M24 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M4 16l5-8h7l4 8 M7 12h7l3-6h-4 M14 16H8',
  system_update_alt: 'M4 3H2v18h20V3h-2 M12 2v13 M7 10l5 5 5-5',
  android: 'M5 10h14v10H5z M5 10a7 7 0 0 1 14 0 M7 2l2 3 M17 2l-2 3 M2 11v7 M22 11v7 M8 20v3 M16 20v3',
  group: 'M15 21v-2a5 5 0 0 0-10 0v2 M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M17 5a4 4 0 0 1 0 7 M19 15a5 5 0 0 1 3 4v2',
  person_add: 'M14 21v-2a5 5 0 0 0-10 0v2 M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M19 7v8 M15 11h8',
  build: 'M14 6a6 6 0 0 0-7-3l4 4-4 4-4-4a6 6 0 0 0 7 7l7 7 4-4-7-7a6 6 0 0 0 0-4z',
  admin_panel_settings: 'M12 2l9 4v6c0 5-5 9-9 10-4-1-9-5-9-10V6z M8 12l3 3 5-6',
  notifications: 'M6 8a6 6 0 0 1 12 0v8l2 3H4l2-3z M10 22h4',
  logout: 'M9 3H3v18h6 M9 12h13 M17 7l5 5-5 5',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  menu_open: 'M3 6h12 M3 12h9 M3 18h12 M21 8l-4 4 4 4',
  close: 'M6 6l12 12 M18 6L6 18',
};
const icon = (name) => <svg className="nav-icon" aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[name]} /></svg>;

export default function Sidebar({ activeRoute = 'dashboard', onNavigate, onLogout }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const moreDialog = useRef(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('justride-sidebar-collapsed') === 'true'; }
    catch { return false; }
  });
  const [moreOpen, setMoreOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = () => { if (desktop.matches) { moreDialog.current?.close(); setMoreOpen(false); } };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  const active = (item) => pathname === item.path || pathname.startsWith(item.path + '/') || activeRoute === item.id;
  const toggleSidebar = () => {
    setCollapsed((value) => {
      try { localStorage.setItem('justride-sidebar-collapsed', String(!value)); } catch { /* Storage may be disabled. */ }
      return !value;
    });
  };
  const closeMore = () => { moreDialog.current?.close(); setMoreOpen(false); };
  const go = (item) => {
    closeMore();
    if (onNavigate) onNavigate(item.id);
    else navigate(item.path);
  };
  const navButton = (item, mobile = false) => (
    <button key={item.id} type="button" className={`${mobile ? 'mobile-nav-link' : 'nav-link-btn'} ${active(item) ? 'active' : ''}`}
      aria-current={active(item) ? 'page' : undefined} onClick={() => go(item)}>
      {icon(item.icon)}<span>{item.label}</span>
    </button>
  );
  const logout = () => { closeMore(); onLogout?.(); };

  return <>
    <aside id="admin-sidebar" aria-label="Admin navigation" className={`app-sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} inert={collapsed}>
      <div className="sidebar-brand-row">
        <button className="sidebar-header" type="button" onClick={() => go(items[0])} aria-label="JustRide dashboard">
          <div className="sidebar-brand-icon"><img src="/favicon.svg" alt="" width="24" height="24" /></div>
          <div><span className="brand-text-title">Just<span>Ride</span></span></div>
        </button>
        <button type="button" className="sidebar-toggle" aria-label="Close sidebar" aria-expanded="true" aria-controls="admin-sidebar" onClick={toggleSidebar}>{icon('menu_open')}</button>
      </div>
      <nav className="sidebar-nav-section" aria-label="Main">{items.slice(0, 5).map((item) => navButton(item))}</nav>
      <nav className="sidebar-footer-section" aria-label="Administration">
        {items.slice(5).map((item) => navButton(item))}
        <button type="button" className="nav-link-btn logout-btn" onClick={logout}>{icon('logout')}<span>Logout</span></button>
      </nav>
    </aside>
    {collapsed && <button type="button" className="sidebar-open-button" aria-label="Open sidebar" aria-expanded="false" aria-controls="admin-sidebar" onClick={toggleSidebar}>{icon('menu')}</button>}
    <nav className="mobile-bottom-nav" aria-label="Mobile admin navigation">
      {mobileIds.map((id) => navButton(items.find((item) => item.id === id), true))}
      <button type="button" className={`mobile-nav-link ${items.some((item) => !mobileIds.includes(item.id) && active(item)) ? 'active' : ''}`}
        aria-label="More navigation" aria-haspopup="dialog" aria-expanded={moreOpen} aria-controls="admin-more-navigation"
        onClick={() => { moreDialog.current.showModal(); setMoreOpen(true); }}>
        {icon('menu')}<span>More</span>
      </button>
    </nav>
    <dialog ref={moreDialog} id="admin-more-navigation" className="mobile-more-dialog" aria-labelledby="admin-more-title"
      onClose={() => setMoreOpen(false)} onClick={(event) => { if (event.target === moreDialog.current) closeMore(); }}>
      <div className="mobile-more-heading"><h2 id="admin-more-title">More</h2><button type="button" className="sidebar-toggle" aria-label="Close navigation" onClick={closeMore}>{icon('close')}</button></div>
      <nav aria-label="More admin pages">{items.filter((item) => !mobileIds.includes(item.id)).map((item) => navButton(item))}</nav>
      <button type="button" className="nav-link-btn logout-btn" onClick={logout}>{icon('logout')}<span>Logout</span></button>
    </dialog>
  </>;
}
