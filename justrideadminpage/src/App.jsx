import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';

// Admin Modules
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import CreateUser from './pages/admin/CreateUser';
import UserDetail from './pages/admin/UserDetail';
import UserActivityLog from './pages/admin/UserActivityLog';
import SupportStaff from './pages/admin/SupportStaff';
import HelperStaffDetail from './pages/admin/HelperStaffDetail';
import DeviceInventory from './pages/admin/DeviceInventory';
import DeviceDetail from './pages/admin/DeviceDetail';
import FirmwareManagement from './pages/admin/FirmwareManagement';
import NewFirmwareRelease from './pages/admin/NewFirmwareRelease';
import AuditLogs from './pages/admin/AuditLogs';
import NotificationsAlerts from './pages/admin/NotificationsAlerts';
import ProvisionStaff from './pages/admin/ProvisionStaff';

// Staff Modules
import SupportManagement from './pages/staff/SupportManagement';
import TicketDetail from './pages/staff/TicketDetail';

// Protected Route Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0F0D',
          color: '#4be277',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}
        >
          sync
        </span>
        <p style={{ color: '#d6e5ea', fontFamily: 'monospace' }}>
          Verifying session credentials...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If not authorized for this specific section, route to appropriate landing page
    return <Navigate to={role === 'ADMIN' ? '/dashboard' : '/support'} replace />;
  }

  return children;
}

export default function App() {
  const { user, role, setRole, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  // Route Navigator helper for backward compatibility with existing component callbacks
  const handleNavigate = (routeKey, entityId = null) => {
    const key = routeKey.toLowerCase();

    if (key === 'dashboard') navigate('/dashboard');
    else if (key === 'users') navigate('/users');
    else if (key === 'create-user' || key === 'add-user' || key === 'new-user') navigate('/users/new');
    else if (key === 'user-detail') navigate(entityId ? `/users/${entityId}` : '/users');
    else if (key === 'user-activity' || key === 'audit log') navigate(entityId ? `/users/${entityId}/activity` : '/users');
    else if (key === 'devices') navigate('/devices');
    else if (key === 'device-detail') navigate(entityId ? `/devices/${entityId}` : '/devices');
    else if (key === 'pairing') navigate('/devices');
    else if (key === 'firmware') navigate('/firmware');
    else if (key === 'new-firmware' || key === 'create-release') navigate('/firmware/new');
    else if (key === 'helpers') navigate('/helpers');
    else if (key === 'provision-staff' || key === 'add-helper' || key === 'new-helper') navigate('/helpers/new');
    else if (key === 'helper-detail') navigate(entityId ? `/helpers/${entityId}` : '/helpers');
    else if (key === 'audit-logs' || key === 'staff logs') navigate('/audit-logs');
    else if (key === 'notifications' || key === 'alerts') navigate('/notifications');
    else if (key === 'support') navigate('/support');
    else if (key === 'ticket-detail') navigate(entityId ? `/support/${entityId}` : '/support');
    else {
      navigate(`/${key}`);
    }
  };

  const handleLoginSuccess = ({ role: chosenRole }) => {
    navigate(chosenRole === 'ADMIN' ? '/dashboard' : '/support');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0F0D',
          color: '#4be277',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}
        >
          sync
        </span>
        <p style={{ color: '#d6e5ea', fontFamily: 'monospace' }}>
          Loading JustRide Operations Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="justride-application-root">
      {/* Floating Demo Role Switcher to toggle between Admin and Staff sessions */}
      {user && (
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: 9999,
            backgroundColor: '#151A17',
            border: '1px solid #27312B',
            borderRadius: '24px',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94A3A8', fontWeight: '600', paddingLeft: '6px' }}>
            User: <strong style={{ color: '#fff' }}>{user.name || user.email}</strong> • Role:{' '}
            <strong style={{ color: role === 'ADMIN' ? '#4be277' : '#7bd0ff' }}>{role}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              const nextRole = role === 'ADMIN' ? 'HELPER' : 'ADMIN';
              setRole(nextRole);
              navigate(nextRole === 'ADMIN' ? '/dashboard' : '/support');
            }}
            style={{
              background: role === 'ADMIN' ? '#22C55E' : '#7bd0ff',
              color: '#0B0F0D',
              border: 'none',
              borderRadius: '16px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Switch to {role === 'ADMIN' ? 'Helper' : 'Admin'} Mode
          </button>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              color: '#ffb4ab',
              border: 'none',
              fontSize: '11px',
              cursor: 'pointer',
              padding: '4px 6px',
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* React Router Routes */}
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={role === 'ADMIN' ? '/dashboard' : '/support'} replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to={role === 'ADMIN' ? '/dashboard' : '/support'} replace />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Users Management */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersManagement onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute>
              <CreateUser onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <UserDetail onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id/activity"
          element={
            <ProtectedRoute>
              <UserActivityLog onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Staff & Helpers Management */}
        <Route
          path="/helpers"
          element={
            <ProtectedRoute>
              <SupportStaff onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/helpers/new"
          element={
            <ProtectedRoute>
              <ProvisionStaff onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/helpers/:id"
          element={
            <ProtectedRoute>
              <HelperStaffDetail onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Device Fleet Management */}
        <Route
          path="/devices"
          element={
            <ProtectedRoute>
              <DeviceInventory onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/devices/:id"
          element={
            <ProtectedRoute>
              <DeviceDetail onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Firmware Releases */}
        <Route
          path="/firmware"
          element={
            <ProtectedRoute>
              <FirmwareManagement onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/firmware/new"
          element={
            <ProtectedRoute>
              <NewFirmwareRelease onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogs onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Notifications & Alerts */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsAlerts onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Support Tickets Queue */}
        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <SupportManagement onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/support/:id"
          element={
            <ProtectedRoute>
              <TicketDetail onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute>
              <TicketDetail onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all Wildcard Route */}
        <Route
          path="*"
          element={<Navigate to={user ? (role === 'ADMIN' ? '/dashboard' : '/support') : '/login'} replace />}
        />
      </Routes>
    </div>
  );
}
