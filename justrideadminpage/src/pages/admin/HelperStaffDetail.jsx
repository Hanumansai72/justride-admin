import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { helpersApi } from '../../api/services';
import './HelperStaffDetail.css';

export default function HelperStaffDetail({ helperId: propHelperId, onNavigate, onLogout }) {
  const params = useParams();
  const navigate = useNavigate();
  const helperId = propHelperId || params.id;
  const [helper, setHelper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchHelper = useCallback(async () => {
    if (!helperId) {
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
      const res = await helpersApi.getHelperById(helperId, { signal });
      if (signal.aborted) return;
      if (res?.success && res?.data) {
        setHelper(res.data);
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [helperId]);

  useEffect(() => {
    fetchHelper();
    return () => requestRef.current?.abort();
  }, [fetchHelper]);

  const staffStatus = (helper?.status || 'active').toUpperCase();

  const handleToggleSuspend = async () => {
    if (!helper?._id) return;
    const nextStatus = helper.status === 'active' ? 'suspended' : 'active';
    setIsUpdating(true);
    try {
      const res = await helpersApi.updateStatus(helper._id, nextStatus, 'Administrative status change');
      if (res?.success) {
        setHelper((prev) => ({ ...prev, status: nextStatus }));
        alert(`Staff account ${helper.name} is now ${nextStatus}.`);
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTerminate = async () => {
    if (!helper?._id) return;
    if (window.confirm(`Are you sure you want to permanently terminate access for ${helper.name} (${helper.employee_id})?`)) {
      setIsUpdating(true);
      try {
        const res = await helpersApi.updateStatus(helper._id, 'terminated', 'Account terminated by administrator');
        if (res?.success) {
          setHelper((prev) => ({ ...prev, status: 'terminated' }));
          alert(`Account for ${helper.name} has been terminated.`);
        }
      } catch (err) {
        alert(`Failed to terminate account: ${err.message}`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <div className="helper-detail-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="helpers" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="helper-main-wrapper">
        {/* TopAppBar */}
        <header className="helper-topbar">
          <div className="topbar-breadcrumbs">
            <button
              type="button"
              className="breadcrumb-root-btn"
              onClick={() => onNavigate && onNavigate('helpers')}
            >
              Helpers
            </button>
            <span className="material-symbols-outlined breadcrumb-sep">chevron_right</span>
            <span className="breadcrumb-current">{helper?.name || 'Staff Member'}</span>

            <div className={`status-pill pill-${staffStatus.toLowerCase()}`}>
              <span className="status-live-dot" />
              <span>{staffStatus}</span>
            </div>
          </div>

          <div className="topbar-actions-row">
            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Refresh"
              onClick={fetchHelper}
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Notifications"
              onClick={() => onNavigate && onNavigate('notifications')}
            >
              <span className="material-symbols-outlined">notifications</span>
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
        </header>

        {/* Content Canvas */}
        <main className="helper-canvas-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchHelper} />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '32px' }}>
                sync
              </span>
              <p>Loading staff credentials and ticket metrics...</p>
            </div>
          ) : (
            <div className="canvas-constrained-wrap">
              {/* Header Section */}
              <div className="helper-header-row">
                <div>
                  <h2 className="helper-main-name">{helper?.name || 'Staff Member'}</h2>
                  <div className="helper-meta-sub">
                    <span className="emp-badge">{helper?.employee_id || helperId || 'EMP-8021'}</span>
                    <span className="bullet-dot">•</span>
                    <span>{helper?.role || 'Customer Care Specialist'}</span>
                  </div>
                </div>

                <div className="helper-top-cta-group">
                  <button
                    type="button"
                    className="btn-neutral-outline"
                    onClick={() => onNavigate && onNavigate('audit-logs')}
                  >
                    <span className="material-symbols-outlined icon-18">history</span>
                    <span>System Audit Trail</span>
                  </button>
                  <button
                    type="button"
                    className="btn-primary-action btn-glow"
                    onClick={() => onNavigate && onNavigate('helpers')}
                  >
                    <span className="material-symbols-outlined icon-18">arrow_back</span>
                    <span>All Helpers</span>
                  </button>
                </div>
              </div>

              {/* Bento Grid Layout */}
              <div className="helper-bento-grid">
                {/* Left: Identity Profile Card (4 cols) */}
                <div className="bento-card identity-profile-card">
                  <div className="ambient-radial-glow" />
                  <h3 className="card-title">
                    <span className="material-symbols-outlined text-primary">badge</span>
                    <span>Corporate Identity</span>
                  </h3>

                  <div className="profile-fields-list">
                    <div className="field-block">
                      <span className="field-label">Username</span>
                      <p className="field-val font-mono">{helper?.username || 'staff_user'}</p>
                    </div>

                    <div className="field-block">
                      <span className="field-label">Corporate Email</span>
                      <p className="field-val">{helper?.email}</p>
                    </div>

                    <div className="field-block">
                      <span className="field-label">Phone</span>
                      <p className="field-val">{helper?.phonenumber || 'Not Provided'}</p>
                    </div>

                    <div className="field-block">
                      <span className="field-label">Role Classification</span>
                      <p className="field-val">{helper?.role}</p>
                    </div>

                    <div className="profile-footer-stats">
                      <div>
                        <span className="field-label">Created Date</span>
                        <p className="field-val-sub">
                          {helper?.createdAt ? new Date(helper.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="field-label">Last Login</span>
                        <p className="field-val-sub live-activity">
                          <span className="live-pulse-dot" />
                          <span>{helper?.last_login_at ? new Date(helper.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Workload & Controls (8 cols) */}
                <div className="workload-right-column">
                  {/* 3-Column Metrics Row */}
                  <div className="metrics-triad-grid">
                    {/* Open Tickets */}
                    <div className="bento-card stat-metric-box">
                      <div className="metric-header-line">
                        <span className="metric-caption">Assigned Tickets</span>
                        <span className="material-symbols-outlined text-amber icon-20">
                          assignment_late
                        </span>
                      </div>
                      <div className="metric-val-flex">
                        <span className="metric-huge-num">{helper?.assigned_tickets_count || 0}</span>
                        <span className="trend-down-pill">active</span>
                      </div>
                    </div>

                    {/* Resolved */}
                    <div className="bento-card stat-metric-box positive-gradient">
                      <div className="metric-header-line">
                        <span className="metric-caption">Resolved Total</span>
                        <span className="material-symbols-outlined text-primary icon-20">
                          task_alt
                        </span>
                      </div>
                      <div className="metric-val-flex">
                        <span className="metric-huge-num">{helper?.resolved_tickets_count || 0}</span>
                        <span className="rate-badge">Tickets Solved</span>
                      </div>
                    </div>
                  </div>

                  {/* Administrative Controls */}
                  <div className="bento-card admin-controls-card">
                    <h3 className="card-title">Administrative Personnel Controls</h3>
                    <p className="admin-explainer-text">
                      Manage permissions, temporary leaves, and security lockouts for this staff account.
                    </p>

                    <div className="action-buttons-pair">
                      <button
                        type="button"
                        className="control-action-btn suspend-btn"
                        disabled={isUpdating}
                        onClick={handleToggleSuspend}
                      >
                        <div>
                          <span className="control-btn-title">
                            {staffStatus === 'ACTIVE' ? 'Suspend Staff Account' : 'Reactivate Staff Account'}
                          </span>
                          <span className="control-btn-sub">
                            {staffStatus === 'ACTIVE'
                              ? 'Temporarily revoke portal access'
                              : 'Restore customer support access'}
                          </span>
                        </div>
                        <span className="material-symbols-outlined icon-20 text-amber">
                          {staffStatus === 'ACTIVE' ? 'block' : 'lock_open'}
                        </span>
                      </button>

                      <button
                        type="button"
                        className="control-action-btn terminate-btn"
                        disabled={isUpdating}
                        onClick={handleTerminate}
                      >
                        <div>
                          <span className="control-btn-title text-red">Terminate Access</span>
                          <span className="control-btn-sub text-red-muted">
                            Permanently deactivate employee
                          </span>
                        </div>
                        <span className="material-symbols-outlined icon-20 text-red">
                          person_off
                        </span>
                      </button>
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
