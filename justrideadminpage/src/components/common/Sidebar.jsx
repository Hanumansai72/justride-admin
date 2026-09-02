import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar({
  activeRoute = 'dashboard',
  onNavigate,
  onLogout,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { id: 'support', label: 'Support', icon: 'support_agent', path: '/support' },
    { id: 'devices', label: 'Devices', icon: 'motorcycle', path: '/devices' },
    { id: 'firmware', label: 'Firmware', icon: 'system_update_alt', path: '/firmware' },
    { id: 'app-releases', label: 'App APKs', icon: 'android', path: '/app-releases' },
  ];

  const bottomNavItems = [
    { id: 'users', label: 'Users', icon: 'group', path: '/users' },
    { id: 'helpers', label: 'Helpers', icon: 'build', path: '/helpers' },
    { id: 'audit-logs', label: 'Audit Logs', icon: 'admin_panel_settings', path: '/audit-logs' },
    { id: 'notifications', label: 'Alerts', icon: 'notifications', path: '/notifications' },
  ];

  const handleLinkClick = (item) => {
    if (onNavigate) {
      onNavigate(item.id);
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
        <div className="sidebar-brand-icon">
          <span
            className="material-symbols-outlined brand-motorcycle-icon"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            motorcycle
          </span>
        </div>
        <div>
          <h1 className="brand-text-title">JustRide</h1>
          <p className="brand-text-role">IoT Operations</p>
        </div>
      </div>



      {/* Main Navigation Links */}
      <nav className="sidebar-nav-section">
        {mainNavItems.map((item) => {
          const isActive =
            currentPath === item.path ||
            currentPath.startsWith(item.path + '/') ||
            activeRoute.toLowerCase() === item.id.toLowerCase();

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleLinkClick(item)}
            >
              <span
                className="material-symbols-outlined nav-icon"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Navigation Section */}
      <div className="sidebar-footer-section">
        {bottomNavItems.map((item) => {
          const isActive =
            currentPath === item.path ||
            currentPath.startsWith(item.path + '/') ||
            activeRoute.toLowerCase() === item.id.toLowerCase();

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleLinkClick(item)}
            >
              <span
                className="material-symbols-outlined nav-icon"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}

        <button
          type="button"
          className="nav-link-btn logout-btn"
          onClick={onLogout}
        >
          <span className="material-symbols-outlined nav-icon">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
