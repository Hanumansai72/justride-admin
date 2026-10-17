import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { helpersApi } from '../../api/services';
import './SupportStaff.css';

export default function SupportStaff({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [actionStaffId, setActionStaffId] = useState(null);

  const [stats, setStats] = useState({
    active: '0',
    onLeave: '0',
    suspended: '0',
    resolved: '0',
    resolvedTrend: 'Live workload',
  });

  const fetchStaff = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const signal = controller.signal;
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await helpersApi.getHelpers({ search: searchQuery.trim() || undefined }, { signal });
      if (signal.aborted) return;
      if (res?.success && Array.isArray(res.data)) {
        let activeCount = 0;
        let onLeaveCount = 0;
        let suspendedCount = 0;
        let totalResolved = 0;

        const mapped = res.data.map((h) => {
          const statusUpper = (h.status || 'active').toUpperCase();
          if (statusUpper === 'ACTIVE') activeCount++;
          else if (statusUpper === 'ON_LEAVE') onLeaveCount++;
          else if (statusUpper === 'SUSPENDED' || statusUpper === 'TERMINATED') suspendedCount++;

          const resolved = h.resolved_tickets_count || 0;
          totalResolved += resolved;

          return {
            id: h.employee_id || `#JR-${h._id.slice(-4)}`,
            rawId: h._id,
            name: h.name || 'Helper Staff',
            email: h.email,
            username: h.username || h.employee_id?.toLowerCase() || 'staff',
            role: h.role === 'LEAD_SUPPORT' ? 'Lead Support' : h.role === 'SENIOR_HELPER' ? 'Senior Specialist' : 'Customer Care',
            status: statusUpper === 'ON_LEAVE' ? 'ON LEAVE' : statusUpper,
            resolved,
            lastActivity: h.last_login_at ? new Date(h.last_login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never',
            avatar: h.avatar || null,
            initials: h.name ? h.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST',
          };
        });

        setStaffList(mapped);
        setStats({
          active: String(activeCount),
          onLeave: String(onLeaveCount),
          suspended: String(suspendedCount),
          resolved: Number(totalResolved).toLocaleString(),
          resolvedTrend: `${mapped.length} staff members total`,
        });
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchStaff();
    return () => requestRef.current?.abort();
  }, [fetchStaff]);

  const handleTerminate = async (staffMember) => {
    if (window.confirm(`Are you sure you want to suspend / terminate staff member ${staffMember.name} (${staffMember.id})?`)) {
      setActionStaffId(staffMember.rawId);
      try {
        const res = await helpersApi.updateStatus(staffMember.rawId, 'terminated', 'Terminated from administrative console');
        if (res?.success) {
          setStaffList((prev) =>
            prev.map((s) => (s.rawId === staffMember.rawId ? { ...s, status: 'TERMINATED' } : s))
          );
        }
      } catch (err) {
        alert(`Failed to update staff status: ${err.message}`);
      } finally {
        setActionStaffId(null);
      }
    }
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      return (
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [staffList, searchQuery]);

  return (
    <div className="staff-mgmt-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="helpers" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="staff-main-area">
        {/* TopNavBar */}
        <header className="staff-topbar">
          <div className="topbar-left-group">
            <h2 className="topbar-heading">Support Staff & Helpers</h2>
            <span className="admin-badge-tag">ADMIN ACCESS ONLY</span>
          </div>

          <div className="topbar-right-group">
            <div className="topbar-actions">
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Refresh list"
                onClick={fetchStaff}
                title="Refresh Staff List"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button
                type="button"
                className="icon-action-btn"
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
          </div>
        </header>

        {/* Main Canvas */}
        <main className="staff-canvas-body">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchStaff} />
          <div className="canvas-wrapper">
            {/* Top Section: Stats Cards & Action */}
            <div className="staff-top-section">
              <div className="stats-row-grid">
                {/* Active */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Active Staff</span>
                    <span className="material-symbols-outlined icon-20 text-primary">
                      person_check
                    </span>
                  </div>
                  <div className="stat-value">{stats.active}</div>
                </div>

                {/* On Leave */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">On Leave</span>
                    <span className="material-symbols-outlined icon-20 text-amber">
                      directions_run
                    </span>
                  </div>
                  <div className="stat-value">{stats.onLeave}</div>
                </div>

                {/* Suspended */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Suspended</span>
                    <span className="material-symbols-outlined icon-20 text-red">
                      block
                    </span>
                  </div>
                  <div className="stat-value">{stats.suspended}</div>
                </div>

                {/* Tickets Resolved */}
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Tickets Resolved</span>
                    <span className="material-symbols-outlined icon-20 text-secondary">
                      task_alt
                    </span>
                  </div>
                  <div className="stat-value">{stats.resolved}</div>
                  <div className="stat-trend text-primary">{stats.resolvedTrend}</div>
                </div>
              </div>

              {/* Add Helper CTA */}
              <button
                type="button"
                className="btn-add-helper btn-glow"
                onClick={() => onNavigate && onNavigate('provision-staff')}
              >
                <span className="material-symbols-outlined icon-20">person_add</span>
                <span>Provision Staff</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="staff-table-card">
              {/* Toolbar */}
              <div className="table-toolbar">
                <div className="search-wrap">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                    type="text"
                    placeholder="Search staff by Employee ID, name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="staff-search-input"
                  />
                </div>
              </div>

              {/* Data Table */}
              <div className="table-scroll-wrap">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>EMPLOYEE ID</th>
                      <th>NAME</th>
                      <th>USERNAME</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                      <th className="text-right">RESOLVED</th>
                      <th>LAST ACTIVITY</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && staffList.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                            sync
                          </span>
                          <p>Loading staff directory...</p>
                        </td>
                      </tr>
                    ) : filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No staff employees found. Click "Provision Staff" above to add new customer care personnel.
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map((row) => {
                        const isTerminated = row.status === 'TERMINATED' || row.status === 'SUSPENDED';
                        const isActionLoading = actionStaffId === row.rawId;
                        return (
                          <tr
                            key={row.id}
                            className={`staff-tr ${isTerminated ? 'tr-terminated' : ''}`}
                            onClick={() => onNavigate && onNavigate('helper-detail', row.rawId)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="font-mono text-white font-semibold">{row.id}</td>

                            {/* Name + Avatar */}
                            <td>
                              <div className="staff-name-cell">
                                <div className="avatar-circle-wrap">
                                  {row.avatar ? (
                                    <img
                                      src={row.avatar}
                                      alt={row.name}
                                      className={isTerminated ? 'grayscale' : ''}
                                    />
                                  ) : (
                                    <div className="avatar-initials-box">{row.initials}</div>
                                  )}
                                </div>
                                <div>
                                  <div className="staff-name-title">{row.name}</div>
                                  <div className="staff-email-sub">{row.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Username */}
                            <td className="text-muted">{row.username}</td>

                            {/* Role */}
                            <td className="text-white">{row.role}</td>

                            {/* Status */}
                            <td>
                              {row.status === 'ACTIVE' && (
                                <span className="status-badge badge-active">ACTIVE</span>
                              )}
                              {row.status === 'ON LEAVE' && (
                                <span className="status-badge badge-leave">ON LEAVE</span>
                              )}
                              {isTerminated && (
                                <span className="status-badge badge-terminated">
                                  {row.status}
                                </span>
                              )}
                            </td>

                            {/* Resolved */}
                            <td className="text-right font-mono font-medium text-white">
                              {row.resolved}
                            </td>

                            {/* Last Activity */}
                            <td className="text-muted">{row.lastActivity}</td>

                            {/* Actions */}
                            <td className="text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="row-action-btns">
                                <button
                                  type="button"
                                  className="action-btn"
                                  title="View Staff Profile"
                                  onClick={() => onNavigate && onNavigate('helper-detail', row.rawId)}
                                >
                                  <span className="material-symbols-outlined icon-20">
                                    visibility
                                  </span>
                                </button>

                                {!isTerminated && (
                                  <button
                                    type="button"
                                    className="action-btn hover-red"
                                    title="Suspend / Terminate"
                                    disabled={isActionLoading}
                                    onClick={() => handleTerminate(row)}
                                  >
                                    <span className="material-symbols-outlined icon-20">
                                      {isActionLoading ? 'sync' : 'person_off'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="table-footer-bar">
                <div className="footer-count-text">
                  Showing <span className="text-white">1-{filteredStaff.length}</span> of{' '}
                  <span className="text-white">{filteredStaff.length}</span> staff members
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
