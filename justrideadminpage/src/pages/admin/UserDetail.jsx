import TopBar from '../../components/common/TopBar';
import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { usersApi } from '../../api/services';
import './UserDetail.css';

export default function UserDetail({ userId: propUserId, onNavigate, onLogout }) {
  const params = useParams();
  const navigate = useNavigate();
  const userId = propUserId || params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [user, setUser] = useState(null);

  const fetchUserDetails = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const signal = controller.signal;
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await usersApi.getUserById(userId, { signal });
      if (signal.aborted) return;
      if (res?.success && res?.data) {
        setUser(res.data);
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetails();
    return () => requestRef.current?.abort();
  }, [fetchUserDetails]);

  const userStatus = user?.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : 'Active';

  const toggleSuspend = async () => {
    if (!user?._id) return;
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setIsUpdating(true);

    try {
      const res = await usersApi.updateStatus(
        user._id,
        nextStatus,
        `Account ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'} by administrator.`
      );
      if (res?.success) {
        setUser((prev) => ({ ...prev, status: nextStatus }));
        alert(`User account ${user.name} is now ${nextStatus}.`);
      }
    } catch (err) {
      alert(`Failed to update user status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const pairedDevice = user?.paired_device;

  return (
    <div className="user-detail-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="users" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main View Area */}
      <div className="user-main-wrapper">
        {/* TopNavBar */}
        <TopBar title="User details" onRefresh={fetchUserDetails} refreshing={isLoading} onBack={() => onNavigate?.('users')} backLabel="Back to users" onNavigate={onNavigate} />

        {/* Content Canvas */}
        <main className="user-content-canvas">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchUserDetails} />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '32px' }}>
                sync
              </span>
              <p>Loading user profile details...</p>
            </div>
          ) : (
            <div className="canvas-wrapper">
              {/* Header Section */}
              <div className="user-header-row">
                <div>
                  <div className="tag-badges-row">
                    <span className="id-tag">{user?._id || userId || 'USR-89241'}</span>
                    <div
                      className={`status-pill ${
                        userStatus === 'Active' ? 'status-active' : 'status-suspended'
                      }`}
                    >
                      <span className="material-symbols-outlined icon-14">
                        {userStatus === 'Active' ? 'check_circle' : 'block'}
                      </span>
                      <span>{userStatus}</span>
                    </div>
                  </div>
                  <h1 className="user-main-title">{user?.name || 'Marcus Aurelius'}</h1>
                </div>

                <div className="user-header-actions">
                  <button
                    type="button"
                    className="btn-neutral-action"
                    onClick={() => onNavigate && onNavigate('user-activity', user?._id || userId)}
                  >
                    <span className="material-symbols-outlined icon-18">history</span>
                    <span>Activity Timeline</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-action btn-glow"
                    onClick={() => onNavigate && onNavigate('users')}
                  >
                    <span className="material-symbols-outlined icon-18">arrow_back</span>
                    <span>All Users</span>
                  </button>
                </div>
              </div>

              {/* Bento Grid Layout (4 cols : 8 cols) */}
              <div className="user-bento-grid">
                {/* Left Column: Identity Profile */}
                <div className="bento-card identity-card">
                  <h3 className="card-heading">
                    <span className="material-symbols-outlined icon-primary">person</span>
                    <span>Identity</span>
                  </h3>

                  <div className="identity-avatar-row">
                    <div className="identity-avatar-ring">
                      <img
                        src={
                          user?.avatar ||
                          'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80'
                        }
                        alt={user?.name || 'User'}
                      />
                    </div>
                    <div>
                      <h4 className="identity-name">{user?.name || 'Marcus Aurelius'}</h4>
                      <p className="identity-role">{user?.role || 'USER'} Rider</p>
                    </div>
                  </div>

                  <div className="identity-details-list">
                    <div className="detail-row">
                      <span className="detail-key">Email</span>
                      <span className="detail-val">{user?.email || 'marcus.a@example.com'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Phone</span>
                      <span className="detail-val">{user?.phonenumber || '+1 (555) 019-8372'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Member Since</span>
                      <span className="detail-val">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Oct 12, 2023'}
                      </span>
                    </div>
                    <div className="detail-row no-border">
                      <span className="detail-key">Account Status</span>
                      <span className="detail-val" style={{ color: userStatus === 'Active' ? 'var(--color-primary)' : 'var(--color-danger-light)' }}>
                        {userStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Device, Locations, Danger Zone */}
                <div className="right-column-stack">
                  {/* Paired Device Card */}
                  <div className="bento-card paired-device-card">
                    <div className="ambient-glow" />
                    <h3 className="card-heading">
                      <span className="material-symbols-outlined icon-primary">motorcycle</span>
                      <span>Paired IoT Unit</span>
                    </h3>

                    {pairedDevice ? (
                      <div className="device-content-flex">
                        <div className="device-photo-wrap">
                          <img
                            src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80"
                            alt={pairedDevice.devicename || 'JustRide Device'}
                          />
                        </div>

                        <div className="device-info-grid">
                          <div className="info-cell">
                            <span className="cell-label">Model</span>
                            <span className="cell-value-lg">{pairedDevice.devicename || 'JustRide Telemetry Unit'}</span>
                          </div>

                          <div className="info-cell">
                            <span className="cell-label">Status</span>
                            <span className="inline-status-pill">
                              <span className="status-live-dot" />
                              <span>{pairedDevice.is_blocked ? 'Blocked' : 'Online'}</span>
                            </span>
                          </div>

                          <div className="info-cell">
                            <span className="cell-label">Device ID / BLE</span>
                            <span className="cell-value font-mono text-muted">
                              {pairedDevice.device_id || pairedDevice.BLE_ADDRESS}
                            </span>
                          </div>

                          <div className="info-cell">
                            <span className="cell-label">Firmware</span>
                            <span className="cell-value">{pairedDevice.firmware_version || 'v2.4.1-stable'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px' }}>
                          link_off
                        </span>
                        <p style={{ margin: 0, fontSize: '13px' }}>No active hardware telemetry module paired to this account.</p>
                      </div>
                    )}
                  </div>

                  {/* Sub 2-Column: Saved Locations + Administration */}
                  <div className="bottom-subgrid">
                    {/* Saved Locations */}
                    <div className="bento-card locations-card">
                      <h3 className="card-heading">
                        <span className="material-symbols-outlined icon-primary">location_on</span>
                        <span>Saved Locations</span>
                      </h3>

                      <div className="locations-list">
                        <div className="location-item-box">
                          <div className="location-icon-box">
                            <span className="material-symbols-outlined">home</span>
                          </div>
                          <div className="location-text-wrap">
                            <p className="location-label">Home Address</p>
                            <p className="location-address">123 Rider Way, Metro District</p>
                          </div>
                        </div>

                        <div className="location-item-box">
                          <div className="location-icon-box">
                            <span className="material-symbols-outlined">work</span>
                          </div>
                          <div className="location-text-wrap">
                            <p className="location-label">Workplace</p>
                            <p className="location-address">Tech Innovation Park, Tower B</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Actions / Administration */}
                    <div className="bento-card admin-actions-card">
                      <h3 className="card-heading text-error">
                        <span className="material-symbols-outlined">warning</span>
                        <span>Administration Control</span>
                      </h3>
                      <p className="admin-desc">
                        Manage security lockouts and account permissions.
                      </p>

                      <div className="admin-buttons-stack">
                        <button
                          type="button"
                          className="admin-btn neutral"
                          onClick={() => onNavigate && onNavigate('user-activity', user?._id || userId)}
                        >
                          <span>View Audit History</span>
                          <span className="material-symbols-outlined icon-16">history</span>
                        </button>

                        <button
                          type="button"
                          className={`admin-btn ${userStatus === 'Active' ? 'warning' : 'neutral'}`}
                          disabled={isUpdating}
                          onClick={toggleSuspend}
                        >
                          <span>
                            {isUpdating ? 'Updating...' : userStatus === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                          </span>
                          <span className="material-symbols-outlined icon-16">
                            {userStatus === 'Active' ? 'block' : 'lock_open'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
