import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { supportApi } from '../../api/services';
import './SupportManagement.css';

export default function SupportManagement({ onNavigate, onLogout }) {
  const [activeTab, setActiveTab] = useState('Operations');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [assignedFilter, setAssignedFilter] = useState('Assigned: All');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15);

  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchQuery.trim() || undefined,
      };

      if (statusFilter !== 'All Statuses') params.status = statusFilter.toLowerCase().replace(' ', '_');
      if (priorityFilter !== 'All Priorities') params.priority = priorityFilter.toLowerCase();
      if (assignedFilter === 'My Tickets') params.assigned_to = 'me';

      const res = await supportApi.getTickets(params);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((t) => ({
          id: t.ticket_number || `#TK-${t._id.slice(-4)}`,
          rawId: t._id,
          customer: t.user_id?.name || t.user_id?.email || 'Registered Rider',
          device: t.device_id?.devicename || t.device_id?.device_id || 'Hardware Unit',
          subject: t.subject || 'Customer Support Request',
          priority: (t.priority || 'medium').charAt(0).toUpperCase() + (t.priority || 'medium').slice(1),
          status: (t.status || 'open').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          assignedTo: {
            name: t.assigned_to?.name || 'Unassigned',
            avatar: null,
          },
          updated: t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        }));

        setTickets(mapped);
        if (res.pagination) {
          setTotalCount(res.pagination.total || mapped.length);
          setTotalPages(res.pagination.pages || 1);
        }
      }
    } catch (err) {
      console.warn('Could not fetch tickets from backend:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, statusFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchTickets]);

  const openCount = tickets.filter((t) => t.status.toLowerCase() === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status.toLowerCase().includes('progress')).length;
  const highPriorityCount = tickets.filter((t) => t.priority.toLowerCase() === 'high' || t.priority.toLowerCase() === 'critical').length;
  const resolvedCount = tickets.filter((t) => t.status.toLowerCase() === 'resolved').length;

  const metrics = [
    {
      title: 'OPEN TICKETS',
      value: isLoading ? '...' : String(openCount),
      icon: 'inbox',
      borderClass: '',
      valueColor: 'text-white',
    },
    {
      title: 'IN PROGRESS',
      value: isLoading ? '...' : String(inProgressCount),
      icon: 'autorenew',
      borderClass: 'border-l-secondary',
      valueColor: 'text-secondary',
    },
    {
      title: 'HIGH / CRITICAL',
      value: isLoading ? '...' : String(highPriorityCount),
      icon: 'warning',
      borderClass: 'border-l-error',
      valueColor: 'text-error',
    },
    {
      title: 'RESOLVED TOTAL',
      value: isLoading ? '...' : String(resolvedCount),
      icon: 'check_circle',
      borderClass: 'border-l-primary',
      valueColor: 'text-primary',
    },
  ];

  return (
    <div className="support-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="support" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="support-main-content">
        {/* Top Header */}
        <header className="support-top-header">
          <div className="header-tabs-group">
            <button
              type="button"
              className={`header-tab ${activeTab === 'Operations' ? 'active' : ''}`}
              onClick={() => setActiveTab('Operations')}
            >
              Ticket Queue
            </button>
          </div>

          <div className="header-actions-group">
            <div className="system-live-pill">
              <span className="live-dot-pulse" />
              <span>System Operational</span>
            </div>

            <div className="header-icon-actions">
              <button
                type="button"
                className="action-icon-btn"
                aria-label="Refresh Queue"
                onClick={fetchTickets}
                title="Refresh Tickets"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button
                type="button"
                className="action-icon-btn"
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

        {/* Canvas Body */}
        <main className="support-canvas">
          <div className="canvas-wrapper">
            {/* Title */}
            <div>
              <h2 className="support-page-title">Support Management &amp; Customer Care</h2>
            </div>

            {/* Metrics Grid */}
            <div className="support-metrics-grid">
              {metrics.map((m, idx) => (
                <div key={idx} className={`support-metric-card ${m.borderClass}`}>
                  <div className="metric-header">
                    <span className="metric-title">{m.title}</span>
                    <span className="material-symbols-outlined metric-icon">{m.icon}</span>
                  </div>
                  <div className={`metric-number ${m.valueColor}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Data Section */}
            <div className="support-data-section">
              {/* Filters Bar */}
              <div className="filters-bar">
                <div className="search-filter-wrap">
                  <span className="material-symbols-outlined search-filter-icon">search</span>
                  <input
                    type="text"
                    placeholder="Search Ticket ID, Customer, or Device..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="filter-search-input"
                  />
                </div>

                <div className="filter-divider" />

                <div className="dropdowns-wrap">
                  <select
                    className="filter-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <select
                    className="filter-select"
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                  <select
                    className="filter-select"
                    value={assignedFilter}
                    onChange={(e) => {
                      setAssignedFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option>Assigned: All</option>
                    <option>My Tickets</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="tickets-table-wrap">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>TICKET ID</th>
                      <th>CUSTOMER / DEVICE</th>
                      <th>SUBJECT</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                      <th>ASSIGNED TO</th>
                      <th>UPDATED</th>
                      <th className="text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                            sync
                          </span>
                          <p>Loading support tickets queue...</p>
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                          No support tickets matching your filters.
                        </td>
                      </tr>
                    ) : (
                      tickets.map((t) => {
                        const priorityClass =
                          t.priority.toLowerCase() === 'high' || t.priority.toLowerCase() === 'critical'
                            ? 'badge-error'
                            : 'badge-neutral';
                        let statusClass = 'badge-warning';
                        if (t.status.toLowerCase().includes('progress')) statusClass = 'badge-info';
                        if (t.status.toLowerCase() === 'resolved') statusClass = 'badge-success';

                        return (
                          <tr
                            key={t.id}
                            className="ticket-row"
                            onClick={() => onNavigate && onNavigate('ticket-detail', t.rawId || t.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="font-mono text-white font-semibold">{t.id}</td>
                            <td>
                              <div className="customer-name">{t.customer}</div>
                              <div className="device-id font-mono">{t.device}</div>
                            </td>
                            <td className="subject-cell">{t.subject}</td>
                            <td>
                              <span className={`pill-tag ${priorityClass}`}>
                                {t.priority.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={`pill-tag ${statusClass}`}>
                                {t.status.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className="text-muted">{t.assignedTo.name}</span>
                            </td>
                            <td className="text-muted font-mono">{t.updated}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                className="btn-view-ticket"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onNavigate) onNavigate('ticket-detail', t.rawId || t.id);
                                }}
                              >
                                View Ticket
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Pagination */}
              <div className="support-table-footer">
                <div>
                  Showing {tickets.length ? (currentPage - 1) * limit + 1 : 0} to{' '}
                  {Math.min(currentPage * limit, totalCount || tickets.length)} of {totalCount || tickets.length} tickets
                </div>
                <div className="pagination-controls">
                  <button
                    type="button"
                    className="page-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <span className="material-symbols-outlined icon-20">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    className="page-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <span className="material-symbols-outlined icon-20">chevron_right</span>
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
