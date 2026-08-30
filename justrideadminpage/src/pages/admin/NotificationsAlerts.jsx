import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { notificationsApi } from '../../api/services';
import './NotificationsAlerts.css';

export default function NotificationsAlerts({ onNavigate, onLogout }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await notificationsApi.getNotifications();
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((n) => {
          const typeUpper = (n.type || 'SYSTEM').toUpperCase();
          let category = 'STAFF';
          let badgeType = 'info';
          let icon = 'info';

          if (typeUpper.includes('CRITICAL') || typeUpper.includes('ALERT') || typeUpper.includes('BLOCK')) {
            category = 'CRITICAL';
            badgeType = 'critical';
            icon = 'error';
          } else if (typeUpper.includes('WARN') || typeUpper.includes('BATTERY') || typeUpper.includes('DISCONNECT')) {
            category = 'WARNING';
            badgeType = 'warning';
            icon = 'warning';
          } else if (typeUpper.includes('SUCCESS') || typeUpper.includes('FIRMWARE') || typeUpper.includes('RESOLVED')) {
            category = 'SUCCESS';
            badgeType = 'success';
            icon = 'check_circle';
          }

          return {
            id: n._id,
            title: n.title || 'Operational Notification',
            time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            category,
            badgeText: n.type || 'SYSTEM ALERT',
            badgeType,
            icon,
            description: n.message || 'Administrative event logged in platform.',
            read: n.is_read || false,
            deviceTag: n.data?.device_id || null,
            targetRoute: n.data?.ticket_number ? 'support' : 'audit-logs',
          };
        });

        setAlerts(mapped);
      }
    } catch (err) {
      console.warn('Could not fetch notifications from backend, using default alerts:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (err) {
      alert(`Failed to mark read: ${err.message}`);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
    } catch (err) {
      console.warn('Mark read error:', err.message);
    }
  };

  const summary = {
    critical: alerts.filter((a) => a.category === 'CRITICAL').length,
    warning: alerts.filter((a) => a.category === 'WARNING').length,
    unread: alerts.filter((a) => !a.read).length,
    total: alerts.length,
  };

  const filteredAlerts = useMemo(() => {
    if (filterCategory === 'ALL') return alerts;
    return alerts.filter((a) => a.category === filterCategory);
  }, [alerts, filterCategory]);

  return (
    <div className="notifications-page-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="notifications" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Area */}
      <div className="notif-main-wrapper">
        {/* TopNavBar */}
        <header className="notif-topbar">
          <div className="topbar-right-ctrls">
            <div className="system-pill">
              <span className="live-pulse-dot" />
              <span>System Operational</span>
            </div>

            <div className="topbar-icon-actions">
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Refresh Alerts"
                onClick={fetchAlerts}
                title="Refresh Notifications"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <div
                className="user-profile-avatar-h"
                onClick={() => onNavigate && onNavigate('helpers')}
                style={{ cursor: 'pointer' }}
                title="Staff Accounts"
              >
                <span>H</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="notif-content-canvas">
          <div className="canvas-wrapper">
            {/* Header & Primary Controls */}
            <div className="notif-header-row">
              <div>
                <h2 className="notif-page-heading">Notifications &amp; Alerts</h2>
                <p className="notif-page-sub">
                  Live operational events, telemetry alerts, and ticket assignments.
                </p>
              </div>

              <div className="header-actions-group">
                <button
                  type="button"
                  className="btn-action-outline"
                  onClick={() =>
                    setFilterCategory((prev) => (prev === 'ALL' ? 'CRITICAL' : 'ALL'))
                  }
                >
                  <span className="material-symbols-outlined icon-18">filter_list</span>
                  <span>{filterCategory === 'ALL' ? 'Filter Critical' : `Filter: ${filterCategory}`}</span>
                </button>

                <button
                  type="button"
                  className="btn-mark-read btn-glow"
                  onClick={markAllAsRead}
                >
                  Mark all as read
                </button>
              </div>
            </div>

            {/* Density Layout (8 cols : 4 cols) */}
            <div className="notif-bento-grid">
              {/* Main Alert Feed (8 cols) */}
              <div className="feed-left-col">
                <div className="feed-header-row">
                  <h3 className="feed-title">Recent Activity</h3>
                  <span className="feed-time-span">LIVE STREAM</span>
                </div>

                <div className="alerts-card-list">
                  {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                      <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                        sync
                      </span>
                      <p>Loading notification feed...</p>
                    </div>
                  ) : filteredAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                      No notifications matching the selected filter.
                    </div>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`alert-item-row ${
                          alert.badgeType === 'critical' ? 'critical-border' : ''
                        } ${alert.read ? 'read-faded' : ''}`}
                        onClick={() => !alert.read && markSingleRead(alert.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Icon */}
                        <div className={`alert-icon-circle badge-${alert.badgeType}`}>
                          <span className="material-symbols-outlined icon-20">
                            {alert.icon}
                          </span>
                        </div>

                        {/* Content Body */}
                        <div className="alert-content-body">
                          <div className="alert-top-title-row">
                            <h4 className="alert-title">{alert.title}</h4>
                            <span className="alert-time-text">{alert.time}</span>
                          </div>

                          <p className="alert-desc-text">{alert.description}</p>

                          <div className="alert-chips-row">
                            <span className={`alert-type-chip badge-${alert.badgeType}`}>
                              {alert.badgeText}
                            </span>

                            {alert.deviceTag && (
                              <span className="device-chip-badge">
                                <span className="material-symbols-outlined icon-14">
                                  motorcycle
                                </span>
                                <span>{alert.deviceTag}</span>
                              </span>
                            )}

                            <button
                              type="button"
                              className="view-logs-link-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onNavigate) onNavigate(alert.targetRoute || 'audit-logs');
                              }}
                            >
                              <span className="material-symbols-outlined icon-14">
                                open_in_new
                              </span>
                              <span>Inspect Source</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar Stats & Volume (4 cols) */}
              <div className="widgets-right-col">
                {/* Summary Widget */}
                <div className="widget-card summary-widget">
                  <h3 className="widget-title">Alert Summary</h3>
                  <div className="summary-2x2-grid">
                    <div
                      className="metric-box box-critical cursor-pointer"
                      onClick={() => setFilterCategory('CRITICAL')}
                    >
                      <span className="metric-large-num text-error">{summary.critical}</span>
                      <span className="metric-cap-label">CRITICAL</span>
                    </div>

                    <div
                      className="metric-box box-warning cursor-pointer"
                      onClick={() => setFilterCategory('WARNING')}
                    >
                      <span className="metric-large-num text-amber">{summary.warning}</span>
                      <span className="metric-cap-label">WARNING</span>
                    </div>

                    <div
                      className="metric-box box-unread cursor-pointer"
                      onClick={() => setFilterCategory('ALL')}
                    >
                      <span className="metric-large-num text-white">{summary.unread}</span>
                      <span className="metric-cap-label">UNREAD</span>
                    </div>

                    <div
                      className="metric-box box-total cursor-pointer"
                      onClick={() => setFilterCategory('ALL')}
                    >
                      <span className="metric-large-num text-muted">{summary.total}</span>
                      <span className="metric-cap-label">TOTAL NOTIFS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
