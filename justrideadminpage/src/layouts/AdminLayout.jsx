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
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: '#0B0F0D', color: '#d6e5ea', overflowX: 'hidden' }}>
      {/* Reusable Admin Sidebar */}
      <Sidebar
        role="admin"
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onNewTicket={() => onNavigate('support')}
      />

      {/* Main Content Pane */}
      <div style={{ marginLeft: '260px', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Reusable TopBar */}
        <TopBar
          title={pageTitle}
          onNavigate={onNavigate}
          role="admin"
          onRoleChange={onRoleChange}
          onTabChange={(tab) => console.log('Tab switched:', tab)}
        />

        {/* Page Canvas Slot */}
        <div style={{ marginTop: '72px', flex: 1, padding: '2rem', backgroundColor: '#0B0F0D' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
