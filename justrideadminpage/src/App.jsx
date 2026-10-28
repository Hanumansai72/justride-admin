import React, { Suspense, lazy, useEffect, useRef } from 'react';
import Sidebar from './components/common/Sidebar';
import { CircleLoader, ContentSkeleton, PageLoadBoundary } from './components/common/LoadingState';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { authApi } from './api/services';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));

const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'));

// Admin Modules
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const InterestedUsers = lazy(() => import('./pages/admin/InterestedUsers'));
const CreateUser = lazy(() => import('./pages/admin/CreateUser'));
const UserDetail = lazy(() => import('./pages/admin/UserDetail'));
const UserActivityLog = lazy(() => import('./pages/admin/UserActivityLog'));
const SupportStaff = lazy(() => import('./pages/admin/SupportStaff'));
const HelperStaffDetail = lazy(() => import('./pages/admin/HelperStaffDetail'));
const DeviceInventory = lazy(() => import('./pages/admin/DeviceInventory'));
const DeviceDetail = lazy(() => import('./pages/admin/DeviceDetail'));
const RegisterDevice = lazy(() => import('./pages/admin/RegisterDevice'));
const FirmwareManagement = lazy(() => import('./pages/admin/FirmwareManagement'));
const NewFirmwareRelease = lazy(() => import('./pages/admin/NewFirmwareRelease'));
const AppReleasesManagement = lazy(() => import('./pages/admin/AppReleasesManagement'));
const NewAppRelease = lazy(() => import('./pages/admin/NewAppRelease'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AuditLogDetail = lazy(() => import('./pages/admin/AuditLogDetail'));
const NotificationsAlerts = lazy(() => import('./pages/admin/NotificationsAlerts'));
const ProvisionStaff = lazy(() => import('./pages/admin/ProvisionStaff'));

// Staff Modules
const SupportManagement = lazy(() => import('./pages/staff/SupportManagement'));
const TicketDetail = lazy(() => import('./pages/staff/TicketDetail'));

// Protected Route Guard Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <CircleLoader fullScreen />;

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
  const { user, role, logout, isLoading, sessionUnavailable, retrySession, authError } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const lastPage = useRef(null);

  useEffect(() => {
    if (!user) { lastPage.current = null; return; }
    if (isLoading || sessionUnavailable || pathname === '/login' || pathname === '/') return;
    const key = `${user.id || user._id}:${pathname}`;
    if (lastPage.current === key) return;
    lastPage.current = key;
    authApi.recordActivity('PAGE_VIEW', pathname).catch(() => console.warn('[Audit] Page activity could not be recorded.'));
  }, [user, pathname, isLoading, sessionUnavailable]);

  // Route Navigator helper for backward compatibility with existing component callbacks
  const handleNavigate = (routeKey, entityId = null) => {
    const key = routeKey.toLowerCase();

    if (key === 'dashboard') navigate('/dashboard');
    else if (key === 'users') navigate('/users');
    else if (key === 'create-user' || key === 'add-user' || key === 'new-user') navigate('/users/new');
    else if (key === 'user-detail') navigate(entityId ? `/users/${entityId}` : '/users');
    else if (key === 'user-activity' || key === 'audit log') navigate(entityId ? `/users/${entityId}/activity` : '/users');
    else if (key === 'devices') navigate('/devices');
    else if (key === 'register-device' || key === 'provision-device' || key === 'new-device') navigate('/devices/new');
    else if (key === 'device-detail') navigate(entityId ? `/devices/${entityId}` : '/devices');
    else if (key === 'pairing') navigate('/devices');
    else if (key === 'firmware') navigate('/firmware');
    else if (key === 'new-firmware' || key === 'create-release') navigate('/firmware/new');
    else if (key === 'app-releases' || key === 'apk-releases') navigate('/app-releases');
    else if (key === 'new-app-release' || key === 'upload-apk') navigate('/app-releases/new');
    else if (key === 'helpers') navigate('/helpers');
    else if (key === 'provision-staff' || key === 'add-helper' || key === 'new-helper') navigate('/helpers/new');
    else if (key === 'helper-detail') navigate(entityId ? `/helpers/${entityId}` : '/helpers');
    else if (key === 'audit-logs' || key === 'staff logs') navigate('/audit-logs');
    else if (key === 'audit-session') navigate(`/audit-logs?session=${encodeURIComponent(entityId)}`);
    else if (key === 'audit-detail' || key === 'audit-log-detail') navigate(entityId ? `/audit-logs/${entityId}` : '/audit-logs');
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

  if (isLoading && !user) return <CircleLoader fullScreen />;

  if (sessionUnavailable) {
    return <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', gap: 16, padding: 24, background: 'var(--bg-layer-0)', color: 'var(--text-body)' }}>
      <h1>Unable to verify your session</h1>
      <p>{authError || 'The service is temporarily unavailable. Please try again.'}</p>
      <button type="button" onClick={() => retrySession()}>Try again</button>
    </div>;
  }

  return (
    <div className="justride-application-root">
      {user && pathname !== '/login' && <Sidebar onNavigate={handleNavigate} onLogout={handleLogout} />}
      <PageLoadBoundary key={user ? 'signed-in' : 'signed-out'}>
      <Suspense fallback={user ? <ContentSkeleton route /> : <CircleLoader fullScreen />}>
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

        <Route path="/profile" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminProfile onNavigate={handleNavigate} onLogout={handleLogout} /></ProtectedRoute>} />

        {/* Users Management */}
        <Route path="/interested-users" element={<ProtectedRoute allowedRoles={['ADMIN', 'HELPER']}><InterestedUsers onNavigate={handleNavigate} onLogout={handleLogout} /></ProtectedRoute>} />
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
          path="/devices/new"
          element={
            <ProtectedRoute>
              <RegisterDevice onNavigate={handleNavigate} onLogout={handleLogout} />
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

        {/* Mobile App APK Releases */}
        <Route
          path="/app-releases"
          element={
            <ProtectedRoute>
              <AppReleasesManagement onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app-releases/new"
          element={
            <ProtectedRoute>
              <NewAppRelease onNavigate={handleNavigate} onLogout={handleLogout} />
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
        <Route
          path="/audit-logs/:id"
          element={
            <ProtectedRoute>
              <AuditLogDetail onNavigate={handleNavigate} onLogout={handleLogout} />
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
      </Suspense>
      </PageLoadBoundary>
    </div>
  );
}
