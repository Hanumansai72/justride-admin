import React from 'react';
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
