import React from 'react';
import TopBar from '../../components/common/TopBar';

export default function StaffLayout({
  children,
  activeRoute,
  onNavigate,
  onLogout,
  onRoleChange,
  pageTitle = 'Support Desk',
}) {
  return (
    <div style={{ display: 'flex', width: '100vw', minHeight: '100vh', backgroundColor: 'var(--bg-layer-0)', color: 'var(--text-body)', overflowX: 'hidden' }}>
      {/* Reusable Staff Sidebar */}
      <Sidebar
        role="staff"
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onNewTicket={() => onNavigate('support')}
      />

      {/* Main Content Pane */}
      <div style={{ marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Reusable TopBar */}
        <TopBar
          title={pageTitle}
          role="staff"
          onRoleChange={onRoleChange}
          onTabChange={(tab) => console.log('Tab switched:', tab)}
        />

        {/* Page Canvas Slot */}
        <div style={{ marginTop: '72px', flex: 1, padding: '2rem', backgroundColor: 'var(--bg-layer-0)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
