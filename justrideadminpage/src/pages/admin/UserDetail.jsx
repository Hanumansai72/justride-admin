import UserAvatar from '../../components/common/UserAvatar';
import TopBar from '../../components/common/TopBar';
import RequestError from '../../components/common/RequestError';
import SubscriptionModal from '../../components/common/SubscriptionModal';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [showSubModal, setShowSubModal] = useState(false);
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);
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

  const handleQuickSubscription = async (days) => {
    if (!user?._id) return;
    setIsUpdatingSub(true);
    try {
      const res = await usersApi.updateSubscription(user._id, days);
      if (res?.success) {
        const nextDate = res.data?.premiumUntil ?? null;
        setUser((prev) => ({ ...prev, premium_until: nextDate }));
        alert(days === 0 ? 'Subscription revoked (user is now on Free tier).' : `Granted ${days} days of Premium subscription.`);
      } else {
        throw new Error(res?.message || 'Failed to update subscription.');
      }
    } catch (err) {
      alert(`Subscription update failed: ${err.message}`);
    } finally {
      setIsUpdatingSub(false);
    }
  };

  const now = new Date();
  const currentPremiumUntil = user?.premium_until ? new Date(user.premium_until) : null;
  const isPremium = currentPremiumUntil && currentPremiumUntil > now;
  const daysRemaining = isPremium
    ? Math.max(0, Math.ceil((currentPremiumUntil - now) / (1000 * 60 * 60 * 24)))
    : 0;

  const pairedDevice = user?.paired_device;

  return (
    <div className="user-detail-container">
      {/* SideNavBar */}

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
                  <h1 className="user-main-title">{user?.name || 'Name unavailable'}</h1>
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
                      <UserAvatar src={user?.avatar} name={user?.name} email={user?.email} />
                    </div>
                    <div>
                      <h4 className="identity-name">{user?.name || 'Name unavailable'}</h4>
                      <p className="identity-role">{user?.role || 'USER'} Rider</p>
                    </div>
                  </div>

                  <div className="identity-details-list">
                    <div className="detail-row">
                      <span className="detail-key">Email</span>
                      <span className="detail-val">{user?.email || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Phone</span>
                      <span className="detail-val">{user?.phonenumber || 'Not provided'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Member Since</span>
                      <span className="detail-val">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Oct 12, 2023'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-key">Account Status</span>
                      <span className="detail-val" style={{ color: userStatus === 'Active' ? 'var(--color-primary)' : 'var(--color-danger-light)' }}>
                        {userStatus}
                      </span>
                    </div>
                    <div className="detail-row no-border">
                      <span className="detail-key">Plan</span>
                      <span className="detail-val" style={{ color: isPremium ? 'var(--color-primary)' : 'var(--text-muted)', fontWeight: isPremium ? '600' : 'normal' }}>
                        {isPremium ? `⭐ Premium (${daysRemaining}d)` : 'Free Tier'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Subscription, Device, Locations, Administration */}
                <div className="right-column-stack">
                  {/* Subscription & Membership Plan Card */}
                  <div className="bento-card subscription-card">
                    <div className="ambient-glow" style={{ background: isPremium ? 'radial-gradient(circle, rgba(var(--rgb-primary), 0.15) 0%, transparent 70%)' : 'none' }} />
                    <div className="subscription-card-header">
                      <h3 className="card-heading">
                        <span className="material-symbols-outlined icon-primary">workspace_premium</span>
                        <span>Subscription & Membership</span>
                      </h3>
                      <button
                        type="button"
                        className="btn-neutral-action"
                        onClick={() => setShowSubModal(true)}
                        style={{ padding: '6px 14px', fontSize: '13px' }}
                      >
                        <span className="material-symbols-outlined icon-16">tune</span>
                        <span>Manage Subscription</span>
                      </button>
                    </div>

                    <div className="subscription-content-flex">
                      <div className="subscription-main-info">
                        <div className="sub-status-pill-large">
                          {isPremium ? (
                            <>
                              <span className="sub-pill premium">⭐ PREMIUM ACTIVE</span>
                              <span className="sub-expiry-txt">
                                Valid until <strong>{currentPremiumUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</strong> ({daysRemaining} days remaining)
                              </span>
                            </>
                          ) : currentPremiumUntil ? (
                            <>
                              <span className="sub-pill expired">EXPIRED</span>
                              <span className="sub-expiry-txt">Expired on {currentPremiumUntil.toLocaleDateString()}</span>
                            </>
                          ) : (
                            <>
                              <span className="sub-pill free">FREE TIER</span>
                              <span className="sub-expiry-txt">Standard access without active premium benefits</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="quick-sub-actions">
                        <span className="quick-sub-label">Quick Grant:</span>
                        <div className="quick-sub-buttons">
                          <button
                            type="button"
                            className="btn-sub-preset"
                            disabled={isUpdatingSub}
                            onClick={() => handleQuickSubscription(30)}
                            title="Grant 30 Days Premium"
                          >
                            +30 Days (1M)
                          </button>
                          <button
                            type="button"
                            className="btn-sub-preset"
                            disabled={isUpdatingSub}
                            onClick={() => handleQuickSubscription(90)}
                            title="Grant 90 Days Premium"
                          >
                            +90 Days (3M)
                          </button>
                          <button
                            type="button"
                            className="btn-sub-preset"
                            disabled={isUpdatingSub}
                            onClick={() => handleQuickSubscription(365)}
                            title="Grant 1 Year Premium"
                          >
                            +1 Year (365D)
                          </button>
                          {isPremium && (
                            <button
                              type="button"
                              className="btn-sub-preset revoke"
                              disabled={isUpdatingSub}
                              onClick={() => handleQuickSubscription(0)}
                              title="Revoke active subscription"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

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
                          <span className="material-symbols-outlined" aria-hidden="true">motorcycle</span>
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

      {showSubModal && user && (
        <SubscriptionModal
          user={user}
          onClose={() => setShowSubModal(false)}
          onSaved={(newDate) => {
            setUser((prev) => ({ ...prev, premium_until: newDate }));
          }}
        />
      )}
    </div>
  );
}
