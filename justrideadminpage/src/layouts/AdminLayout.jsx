import React from 'react';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';

export default function AdminLayout({
  children,
  activeRoute,
  onNavigate,
  onLogout,
  onRoleChange,
  pageTitle = 'Dashboard',
}) {
  return (
    <div className="admin-layout">
      {/* Reusable Admin Sidebar */}
      <Sidebar
        role="admin"
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onNewTicket={() => onNavigate('support')}
      />

      {/* Main Content Pane */}
      <div className="admin-layout-main">
        {/* Reusable TopBar */}
        <TopBar
          title={pageTitle}
          onNavigate={onNavigate}
          role="admin"
          onRoleChange={onRoleChange}
          onTabChange={(tab) => console.log('Tab switched:', tab)}
        />

        {/* Page Canvas Slot */}
        <div className="admin-layout-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}
