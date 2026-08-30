import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { auditApi } from '../../api/services';
import './AuditLogs.css';

export default function AuditLogs({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('Last 24 Hours');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [selectedLog, setSelectedLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [stats, setStats] = useState({
    total24h: '14,208',
    securityAlerts: '3',
    adminChanges: '42',
    userActions: '12.1k',
  });

  // Fetch Audit Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await auditApi.getStats();
      if (res?.success && res.data) {
        setStats({
          total24h: Number(res.data.total_24h || 0).toLocaleString(),
          securityAlerts: Number(res.data.security_alerts || 0).toLocaleString(),
          adminChanges: Number(res.data.admin_changes || 0).toLocaleString(),
          userActions: Number(res.data.user_actions || 0).toLocaleString(),
        });
      }
    } catch (e) {
      console.warn('Could not fetch audit stats:', e.message);
    }
  }, []);

  // Fetch Audit Logs with filters
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchQuery.trim() || undefined,
        time_range: timeFilter !== 'Custom Range' ? timeFilter : undefined,
        severity: severityFilter !== 'All Severities' ? severityFilter : undefined,
        module: moduleFilter !== 'All Modules' ? moduleFilter : undefined,
      };

      const res = await auditApi.getLogs(params);
      if (res?.success && Array.isArray(res.data)) {
        setLogs(res.data);
        if (res.pagination) {
          setTotalCount(res.pagination.total || res.data.length);
          setTotalPages(res.pagination.pages || 1);
        }
      }
    } catch (err) {
      console.warn('Could not fetch real audit logs from backend:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, timeFilter, severityFilter, moduleFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchLogs]);

  const kpis = [
    {
      title: 'TOTAL EVENTS (24H)',
      value: stats.total24h,
      trend: 'Live stream',
      trendColor: 'text-green',
      icon: 'data_usage',
      iconColor: 'text-primary',
    },
    {
      title: 'SECURITY ALERTS',
      value: stats.securityAlerts,
      trend: Number(stats.securityAlerts) > 0 ? 'Requires Review' : 'Healthy',
      trendColor: Number(stats.securityAlerts) > 0 ? 'text-red' : 'text-green',
      icon: 'security_update_warning',
      iconColor: 'text-red',
    },
    {
      title: 'ADMIN ACTIONS',
      value: stats.adminChanges,
      trend: 'Authorized',
      trendColor: 'text-muted',
      icon: 'manage_accounts',
      iconColor: 'text-secondary',
    },
    {
      title: 'USER ACTIVITY',
      value: stats.userActions,
      trend: 'Stable',
      trendColor: 'text-muted',
      icon: 'person_play',
      iconColor: 'text-amber',
    },
  ];

  return (
    <div className="audit-logs-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="audit-logs" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Wrapper */}
      <div className="audit-main-wrapper">
        {/* TopAppBar */}
        <header className="audit-topbar">
          <div className="topbar-title-block">
            <h2 className="topbar-main-heading">Audit Logs &amp; Security Compliance</h2>
            <span className="topbar-sub-desc">
              Immutable global record of system activity and administrative operations.
            </span>
          </div>

          <div className="topbar-right-actions">
            <button
              type="button"
              className="topbar-btn"
              aria-label="Refresh logs"
              onClick={() => {
                fetchStats();
                fetchLogs();
              }}
              title="Refresh Audit Trail"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button
              type="button"
              className="topbar-btn"
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
        <main className="audit-canvas-body">
          {/* Top KPI Bento Grid */}
          <div className="audit-kpi-grid">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="kpi-card">
                <div className="kpi-top-row">
                  <span className="kpi-caption">{kpi.title}</span>
                  <span className={`material-symbols-outlined icon-20 ${kpi.iconColor}`}>
                    {kpi.icon}
                  </span>
                </div>
                <div className="kpi-val-row">
                  <span className="kpi-num">{kpi.value}</span>
                  <span className={`kpi-trend ${kpi.trendColor}`}>{kpi.trend}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filters Container */}
          <div className="audit-filter-bar">
            <div className="search-box-wrap">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search Action, Entity ID, IP address, Message..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="audit-search-input"
              />
            </div>

            <div className="filters-cluster">
              <select
                className="custom-dropdown"
                value={timeFilter}
                onChange={(e) => {
                  setTimeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>

              <select
                className="custom-dropdown"
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All Severities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>

              <select
                className="custom-dropdown"
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>All Modules</option>
                <option value="users">Users / Auth</option>
                <option value="devices">Devices</option>
                <option value="support">Support</option>
                <option value="firmware">Firmware</option>
                <option value="security">Security</option>
              </select>

              <button
                type="button"
                className="btn-export-csv"
                onClick={() => {
                  const headers = 'ID,Timestamp,Severity,Actor,EventType,Target,Description,IP\n';
                  const rows = logs
                    .map((l) => `"${l.id}","${l.timestamp}","${l.severity}","${l.actor}","${l.eventType}","${l.targetEntity}","${l.description}","${l.location}"`)
                    .join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                }}
              >
                <span className="material-symbols-outlined icon-18">download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Main Table + Optional Side Inspection Drawer */}
          <div className="table-drawer-flex-container">
            {/* Main Data Table */}
            <div className="audit-table-card">
              <div className="table-scroll-area">
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th style={{ width: '140px' }}>TIMESTAMP</th>
                      <th style={{ width: '120px' }}>SEVERITY</th>
                      <th style={{ width: '180px' }}>ACTOR</th>
                      <th style={{ width: '170px' }}>EVENT TYPE</th>
                      <th style={{ width: '150px' }}>TARGET ENTITY</th>
                      <th>ACTION DESCRIPTION</th>
                      <th style={{ width: '140px' }}>IP / LOCATION</th>
                      <th style={{ width: '60px' }} className="text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                            sync
                          </span>
                          <p>Streaming security audit records...</p>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                          No audit events found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        const isSelected = selectedLog?.id === log.id;
                        return (
                          <tr
                            key={log.id}
                            className={`audit-tr ${isSelected ? 'tr-selected' : ''}`}
                            onClick={() => setSelectedLog(log)}
                          >
                            <td className="font-mono text-muted text-sm">{log.timestamp}</td>

                            {/* Severity Pill */}
                            <td>
                              {log.severity === 'Critical' && (
                                <span className="sev-pill sev-critical">
                                  <span className="material-symbols-outlined icon-14">warning</span>
                                  Critical
                                </span>
                              )}
                              {log.severity === 'High' && (
                                <span className="sev-pill sev-high">
                                  <span className="material-symbols-outlined icon-14">error</span>
                                  High
                                </span>
                              )}
                              {log.severity === 'Medium' && (
                                <span className="sev-pill sev-medium">
                                  <span className="material-symbols-outlined icon-14">shield</span>
                                  Medium
                                </span>
                              )}
                              {log.severity === 'Low' && (
                                <span className="sev-pill sev-low">
                                  <span className="material-symbols-outlined icon-14">
                                    check_circle
                                  </span>
                                  Low
                                </span>
                              )}
                            </td>

                            {/* Actor */}
                            <td>
                              <div className="actor-cell-flex">
                                <div className="actor-badge-avatar">
                                  {log.actorType === 'admin' ? 'AD' : log.actorType === 'helper' ? 'HL' : log.actorType === 'user' ? 'UR' : 'SYS'}
                                </div>
                                <span className="actor-name truncate">{log.actor}</span>
                              </div>
                            </td>

                            {/* Event Type */}
                            <td className="font-mono text-sm text-white">{log.eventType}</td>

                            {/* Target Entity */}
                            <td className="text-secondary font-mono text-sm">{log.targetEntity}</td>

                            {/* Action Description */}
                            <td className="text-muted truncate" style={{ maxWidth: '300px' }}>
                              {log.description}
                            </td>

                            {/* IP Location */}
                            <td className="text-muted text-sm">
                              <div>{log.location}</div>
                              <div className="city-sub">{log.city}</div>
                            </td>

                            {/* Arrow Action */}
                            <td className="text-center">
                              <button
                                type="button"
                                className="inspect-btn"
                                title="Inspect Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLog(log);
                                }}
                              >
                                <span className="material-symbols-outlined icon-18">
                                  open_in_new
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="audit-table-footer">
                <span className="showing-text">
                  Showing {logs.length ? (currentPage - 1) * limit + 1 : 0} to{' '}
                  {Math.min(currentPage * limit, totalCount || logs.length)} of {totalCount || logs.length} events
                </span>
                <div className="pagination-ctrls">
                  <button
                    type="button"
                    className="p-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <span className="material-symbols-outlined icon-18">chevron_left</span>
                  </button>
                  <button type="button" className="p-btn active">
                    {currentPage}
                  </button>
                  <button
                    type="button"
                    className="p-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <span className="material-symbols-outlined icon-18">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Side Inspection Panel (When Log Selected) */}
            {selectedLog && (
              <aside className="audit-detail-drawer">
                <div className="drawer-header">
                  <div className="drawer-top-badge">
                    <span
                      className={`action-badge ${
                        selectedLog.destructive ? 'badge-destructive' : 'badge-routine'
                      }`}
                    >
                      {selectedLog.destructive ? 'Security / Sensitive Event' : 'System Event'}
                    </span>
                    <button
                      type="button"
                      className="close-drawer-btn"
                      onClick={() => setSelectedLog(null)}
                    >
                      <span className="material-symbols-outlined icon-20">close</span>
                    </button>
                  </div>
                  <h3 className="drawer-action-title">{selectedLog.actionTitle}</h3>
                  <p className="drawer-log-id font-mono">Log ID: #{selectedLog.id}</p>
                </div>

                <div className="drawer-scroll-body">
                  {/* Meta Info Grid */}
                  <div className="drawer-meta-grid">
                    <div>
                      <span className="drawer-label">Actor</span>
                      <span className="drawer-val">
                        {selectedLog.actor} ({selectedLog.actorId})
                      </span>
                    </div>
                    <div>
                      <span className="drawer-label">Timestamp</span>
                      <span className="drawer-val">{selectedLog.utcTimestamp}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="drawer-label">Audit Narrative / Description</span>
                      <p className="reason-code-box">{selectedLog.description}</p>
                    </div>
                  </div>

                  {/* Additional Context CTA */}
                  <div className="drawer-footer-cta">
                    <button
                      type="button"
                      className="btn-ack-review btn-glow"
                      onClick={() => {
                        alert(`Acknowledged review for audit record ${selectedLog.id}`);
                        setSelectedLog(null);
                      }}
                    >
                      Acknowledge Record Review
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
