import TopBar from '../../components/common/TopBar';
import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auditApi, authApi } from '../../api/services';
import './AuditLogs.css';

export default function AuditLogs({ onNavigate, onLogout }) {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('session') || '');
  const [scope, setScope] = useState('admin');
  const [timeFilter, setTimeFilter] = useState('Last 24 Hours');
  const [severityFilter, setSeverityFilter] = useState('All Severities');
  const [moduleFilter, setModuleFilter] = useState('All Modules');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statsError, setStatsError] = useState('');
  const requestRef = useRef(null);
  const statsRequestRef = useRef(null);

  const [stats, setStats] = useState({
    total24h: '—',
    securityAlerts: '—',
    adminChanges: '—',
    userActions: '—',
    staffSessions: '—',
  });

  // Fetch Audit Stats
  const fetchStats = useCallback(async () => {
    statsRequestRef.current?.abort();
    const controller = new AbortController();
    statsRequestRef.current = controller;
    setStatsError('');
    try {
      const res = await auditApi.getStats({ scope }, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (res?.success && res.data) {
        setStats({
          total24h: Number(res.data.total_24h || 0).toLocaleString(),
          securityAlerts: Number(res.data.security_alerts || 0).toLocaleString(),
          adminChanges: Number(res.data.admin_changes || 0).toLocaleString(),
          userActions: Number(res.data.user_actions || 0).toLocaleString(),
          staffSessions: Number(res.data.staff_sessions || 0).toLocaleString(),
        });
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setStatsError(e.message || 'Could not load audit statistics.');
    }
  }, [scope]);

  // Fetch Audit Logs with filters
  const fetchLogs = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const signal = controller.signal;
    setIsLoading(true);
    setLoadError('');
    try {
      const params = {
        scope,
        page: currentPage,
        limit,
        search: searchQuery.trim() || undefined,
        time_range: timeFilter !== 'Custom Range' ? timeFilter : undefined,
        severity: severityFilter !== 'All Severities' ? severityFilter : undefined,
        module: moduleFilter !== 'All Modules' ? moduleFilter : undefined,
      };

      const res = await auditApi.getLogs(params, { signal });
      if (signal.aborted) return;
      if (res?.success && Array.isArray(res.data)) {
        setLogs(res.data);
        if (res.pagination) {
          setTotalCount(res.pagination.total || res.data.length);
          setTotalPages(res.pagination.pages || 1);
        }
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [scope, currentPage, limit, searchQuery, timeFilter, severityFilter, moduleFilter]);

  useEffect(() => {
    fetchStats();
    return () => statsRequestRef.current?.abort();
  }, [fetchStats]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchLogs();
    }, requestRef.current ? 250 : 0);
    return () => { clearTimeout(handler); requestRef.current?.abort(); };
  }, [fetchLogs]);

  const kpis = [
    {
      title: 'TOTAL EVENTS (24H)',
      value: stats.total24h,
      trend: 'Recorded events',
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
      title: scope === 'admin' ? 'SIGN-INS / SIGN-OUTS (24H)' : 'USER ACTIVITY',
      value: scope === 'admin' ? stats.staffSessions : stats.userActions,
      trend: 'Stable',
      trendColor: 'text-muted',
      icon: 'person_play',
      iconColor: 'text-amber',
    },
  ];

  return (
    <div className="audit-logs-container">
      {/* SideNavBar */}

      {/* Main Wrapper */}
      <div className="audit-main-wrapper">
        {/* TopAppBar */}
        <TopBar title="Audit logs" onRefresh={() => { fetchStats(); fetchLogs(); }} onNavigate={onNavigate} />

        {/* Content Canvas */}
        <main className="audit-canvas-body">
          <RequestError message={loadError || statsError} loading={isLoading} onRetry={() => { fetchLogs(); fetchStats(); }} />
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
                placeholder="Search staff name, email, session ID, action, or IP…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="audit-search-input"
              />
            </div>

            <div className="filters-cluster">
              <select className="custom-dropdown" aria-label="Activity scope" value={scope}
                onChange={(e) => { setScope(e.target.value); setCurrentPage(1); }}>
                <option value="admin">Admin portal activity</option>
                <option value="all">All activity</option>
              </select>
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
                <option>All Time</option>
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
                <option value="admin">Administration</option>
                <option value="users">Users / Auth</option>
                <option value="devices">Devices</option>
                <option value="support">Support</option>
                <option value="firmware">Firmware</option>
                <option value="app-releases">App releases</option>
                <option value="security">Security</option>
              </select>

              <button
                type="button"
                className="btn-export-csv"
                onClick={() => {
                  const cell = (value) => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
                  const headers = 'ID,Timestamp,Status,Severity,Actor,Email,Role,Session,EventType,Target,Description,IP\n';
                  const rows = logs
                    .map((l) => [l.id, l.utcTimestamp, l.status, l.severity, l.actor, l.actorEmail, l.actorRole, l.sessionId, l.eventType, l.targetEntity, l.description, l.location].map(cell).join(','))
                    .join('\n');
                  const blob = new Blob([headers + rows], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                  authApi.recordActivity('AUDIT_EXPORT', '/audit-logs').catch(() => console.warn('[Audit] Export activity could not be recorded.'));
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
                    {isLoading && logs.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                            sync
                          </span>
                          <p>Loading audit records...</p>
                        </td>
                      </tr>
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No audit events found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => {
                        return (
                          <tr
                            key={log.id}
                            className="audit-tr"
                            onClick={() => onNavigate && onNavigate('audit-detail', log.id)}
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
                                <span className="actor-name truncate" title={log.actorEmail || log.actor}>
                                  {log.actor}<small style={{ display: 'block' }}>{log.actorRole}{log.actorEmail ? ` · ${log.actorEmail}` : ''}</small>
                                </span>
                              </div>
                            </td>

                            {/* Event Type */}
                            <td className="font-mono text-sm text-white">{log.eventType}<small style={{ display: 'block' }}>{log.status}</small></td>

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
                                title="Inspect Full Event Record Page"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onNavigate) onNavigate('audit-detail', log.id);
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

          </div>
        </main>
      </div>
    </div>
  );
}
