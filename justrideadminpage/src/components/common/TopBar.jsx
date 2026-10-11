import React from 'react';
import './TopBar.css';

export default function TopBar({
  title = 'Operations',
  role = 'admin',
  onRoleChange,
  activeTab = 'Operations',
  onTabChange,
  onNavigate,
  userProfile = {
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
  },
}) {
  return (
    <header className="app-topbar">
      {/* Left Title & Role Badges */}
      <div className="topbar-left-cluster">
        <h2 className="topbar-title">{title}</h2>
        <span
          className={`topbar-role-badge ${
            role === 'admin' ? 'badge-admin-tag' : 'badge-staff-tag'
          }`}
        >
          {role === 'admin' ? 'Admin Portal' : 'Staff / Helper'}
        </span>

        {/* Home / Operations Tabs */}
        
      </div>

      {/* Right Controls */}
      <div className="topbar-right-cluster">
        {/* Quick Role Switcher demo */}
        {onRoleChange && (
          <div className="role-switcher-wrap">
            <button
              type="button"
              className={`role-switch-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => onRoleChange('admin')}
            >
              Admin
            </button>
            <button
              type="button"
              className={`role-switch-btn ${role === 'staff' ? 'active' : ''}`}
              onClick={() => onRoleChange('staff')}
            >
              Staff
            </button>
          </div>
        )}

        <div className="topbar-icon-actions">
          <button type="button" className="topbar-icon-btn" aria-label="Notifications" onClick={() => onNavigate && onNavigate('notifications')}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button type="button" className="topbar-icon-btn" aria-label="Settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="user-avatar-circle user-avatar-h" title="User Profile (H)">
            <span>H</span>
          </div>
        </div>
      </div>
    </header>
  );
}
