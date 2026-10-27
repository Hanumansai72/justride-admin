import React from 'react';
import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';

export default function AdminLayout({
  children,
  activeRoute,
  onNavigate,
  onLogout,
  pageTitle = 'Dashboard',
}) {
  return (
    <div className="admin-layout">
      {/* Reusable Admin Sidebar */}
      <Sidebar
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main Content Pane */}
      <div className="admin-layout-main">
        {/* Reusable TopBar */}
        <TopBar
          title={pageTitle}
          onNavigate={onNavigate}
        />

        {/* Page Canvas Slot */}
        <div className="admin-layout-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}
