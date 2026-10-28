import UserAvatar from '../../components/common/UserAvatar';
import TopBar from '../../components/common/TopBar';
import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usersApi } from '../../api/services';
import './UsersManagement.css';

export default function UsersManagement({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hasDeviceOnly, setHasDeviceOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [stats, setStats] = useState({
    total: '0',
    totalTrend: 'Live',
    active: '0',
    suspended: '0',
    banned: '0',
    withDevice: '0',
    adoptionRate: 'Live status',
  });

  const fetchUsers = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const signal = controller.signal;
    setIsLoading(true);
    setLoadError('');
    try {
      const params = {
        page: currentPage,
        limit,
        search: searchQuery.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const res = await usersApi.getUsers(params, { signal });
      if (signal.aborted) return;
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((u) => ({
          id: u._id || u.id,
          name: u.name || 'Anonymous Rider',
          email: u.email,
          phone: u.phonenumber || 'Not Provided',
          role: u.role || 'USER',
          status: (u.status || 'active').toUpperCase(),
          pairedDevice: u.paired_device ? (u.paired_device.device_id || u.paired_device.BLE_ADDRESS) : null,
          lastActivity: u.updatedAt ? new Date(u.updatedAt).toLocaleDateString() : 'Recent',
          createdDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A',
          isOnline: u.status === 'active',
          avatar: u.avatar,
        }));

        setUsers(mapped);
        const total = res.pagination?.total ?? mapped.length;
        const activeCount = mapped.filter((u) => u.status === 'ACTIVE').length;
        const suspendedCount = mapped.filter((u) => u.status === 'SUSPENDED').length;
        const bannedCount = mapped.filter((u) => u.status === 'BANNED').length;
        const withDevCount = mapped.filter((u) => !!u.pairedDevice).length;

        if (res.pagination) {
          setTotalCount(res.pagination.total || mapped.length);
          setTotalPages(res.pagination.pages || 1);
        }
        setStats({
          total: Number(total).toLocaleString(),
          totalTrend: 'Live',
          active: Number(activeCount).toLocaleString(),
          suspended: Number(suspendedCount).toLocaleString(),
          banned: Number(bannedCount).toLocaleString(),
          withDevice: Number(withDevCount).toLocaleString(),
          adoptionRate: total > 0 ? `${Math.round((withDevCount / total) * 100)}% adoption` : '0% adoption',
        });
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchUsers();
    }, requestRef.current ? 250 : 0);
    return () => { clearTimeout(handler); requestRef.current?.abort(); };
  }, [fetchUsers]);

  const handleToggleStatus = async (userId, currentStatus, e) => {
    if (e) e.stopPropagation();
    const nextStatus = currentStatus === 'ACTIVE' ? 'suspended' : 'active';
    setActionLoadingId(userId);

    try {
      const res = await usersApi.updateStatus(userId, nextStatus, 'Administrative status toggle from Users Management');
      if (res?.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: nextStatus.toUpperCase() } : u))
        );
      }
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (hasDeviceOnly && !u.pairedDevice) return false;
    return true;
  });

  return (
    <div className="users-management-container">
      {/* SideNavBar */}

      {/* Main Content */}
      <div className="users-main-wrapper">
        {/* TopNavBar */}
        <TopBar title="Users" onRefresh={fetchUsers} refreshing={isLoading} onNavigate={onNavigate} />

        {/* Content Canvas */}
        <main className="users-canvas-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchUsers} />
          <div className="canvas-wrapper">
            {/* Header Section */}
            <div className="page-header-row">
              <div>
                <h2 className="page-heading">Users Management</h2>
                <p className="page-subheading">
                  Administer rider accounts, hardware associations, and security permissions.
                </p>
              </div>

              <button
                type="button"
                className="btn-add-user btn-glow"
                onClick={() => onNavigate && onNavigate('create-user')}
              >
                <span className="material-symbols-outlined icon-20">person_add</span>
                <span>Add User</span>
              </button>
            </div>

            {/* Summary Bento Grid */}
            <div className="users-summary-bento">
              {/* Total Users */}
              <div className="summary-card total-users-card">
                <div className="bg-watermark">
                  <span className="material-symbols-outlined watermark-icon">group</span>
                </div>
                <span className="card-label">Total Users</span>
                <div className="total-val-row">
                  <span className="total-number">{stats.total}</span>
                  <span className="trend-up">{stats.totalTrend}</span>
                </div>
              </div>

              {/* Active */}
              <div className="summary-card stat-status-card">
                <div className="status-icon-circle green">
                  <span className="material-symbols-outlined icon-18">check_circle</span>
                </div>
                <span className="card-label">Active</span>
                <span className="status-count">{stats.active}</span>
              </div>

              {/* Suspended */}
              <div className="summary-card stat-status-card">
                <div className="status-icon-circle amber">
                  <span className="material-symbols-outlined icon-18">pause_circle</span>
                </div>
                <span className="card-label">Suspended</span>
                <span className="status-count">{stats.suspended}</span>
              </div>

              {/* Banned */}
              <div className="summary-card stat-status-card">
                <div className="status-icon-circle red">
                  <span className="material-symbols-outlined icon-18">block</span>
                </div>
                <span className="card-label">Banned</span>
                <span className="status-count">{stats.banned}</span>
              </div>

              {/* With Device */}
              <div className="summary-card with-device-card">
                <div className="bg-watermark">
                  <span className="material-symbols-outlined watermark-icon">motorcycle</span>
                </div>
                <span className="card-label text-primary">With Device</span>
                <div className="device-val-row">
                  <span className="total-number">{stats.withDevice}</span>
                  <div className="adoption-rate">
                    <span className="material-symbols-outlined icon-16">trending_up</span>
                    <span>{stats.adoptionRate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar (Search & Filters) */}
            <div className="users-toolbar-card">
              <div className="search-wrap">
                <span className="material-symbols-outlined search-icon">search</span>
                <input
                  type="text"
                  placeholder="Search Name, Email, Phone, ID..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="users-search-input"
                />
              </div>

              <div className="filters-right-group">
                <select
                  className="toolbar-select"
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Roles</option>
                  <option value="USER">USER</option>
                </select>

                <select
                  className="toolbar-select"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                </select>

                <label className="checkbox-filter-label">
                  <input
                    type="checkbox"
                    checked={hasDeviceOnly}
                    onChange={(e) => setHasDeviceOnly(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span>Has Device</span>
                </label>

                <button
                  type="button"
                  className="btn-export-icon"
                  title="Export Users CSV"
                  onClick={() => {
                    const headers = 'ID,Name,Email,Phone,Role,Status\n';
                    const rows = users.map((u) => `"${u.id}","${u.name}","${u.email}","${u.phone}","${u.role}","${u.status}"`).join('\n');
                    const blob = new Blob([headers + rows], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }}
                >
                  <span className="material-symbols-outlined icon-20">download</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="users-table-card">
              <div className="table-scroll-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>USER</th>
                      <th>CONTACT</th>
                      <th>ROLE</th>
                      <th>STATUS</th>
                      <th>PAIRED DEVICE ID</th>
                      <th>LAST ACTIVITY</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && users.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                              sync
                            </span>
                            <span>Loading user directory...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No users found matching your search and filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSuspended = u.status === 'SUSPENDED' || u.status === 'BANNED';
                        const isActionLoading = actionLoadingId === u.id;
                        return (
                          <tr
                            key={u.id}
                            className={`user-tr ${isSuspended ? 'tr-suspended' : ''}`}
                            onClick={() => onNavigate && onNavigate('user-detail', u.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            {/* User Avatar + Name */}
                            <td>
                              <div className="user-profile-cell">
                                <div
                                  className={`user-avatar-wrap ${
                                    u.role === 'ADMIN' ? 'border-primary' : ''
                                  }`}
                                >
                                  <UserAvatar src={u.avatar} name={u.name} email={u.email} />
                                </div>
                                <div>
                                  <div className="user-name-title">
                                    <span>{u.name}</span>
                                    {u.role === 'ADMIN' && (
                                      <span
                                        className="material-symbols-outlined verified-glyph"
                                        title="System Administrator"
                                      >
                                        verified
                                      </span>
                                    )}
                                  </div>
                                  <div className="user-id-sub">ID: {u.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td>
                              <div className="user-email-text">{u.email}</div>
                              <div className="user-phone-sub">{u.phone}</div>
                            </td>

                            {/* Role */}
                            <td>
                              <span
                                className={`role-badge ${
                                  u.role === 'ADMIN' ? 'role-admin' : 'role-user'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            {/* Status */}
                            <td>
                              {u.status === 'ACTIVE' && (
                                <span className="status-pill active-pill">
                                  <span className="status-dot green" />
                                  ACTIVE
                                </span>
                              )}
                              {u.status === 'SUSPENDED' && (
                                <span className="status-pill suspended-pill">
                                  <span className="status-dot amber" />
                                  SUSPENDED
                                </span>
                              )}
                              {u.status === 'BANNED' && (
                                <span className="status-pill" style={{ background: 'rgba(var(--rgb-danger), 0.15)', color: 'var(--color-danger)' }}>
                                  <span className="status-dot red" />
                                  BANNED
                                </span>
                              )}
                            </td>

                            {/* Paired Device */}
                            <td>
                              {u.pairedDevice ? (
                                <div className="device-id-cell">
                                  <span className="material-symbols-outlined icon-16 text-primary">
                                    memory
                                  </span>
                                  <span className="font-mono">{u.pairedDevice}</span>
                                </div>
                              ) : (
                                <span className="unpaired-text">Unpaired</span>
                              )}
                            </td>

                            {/* Last Activity */}
                            <td>
                              {u.isOnline ? (
                                <div className="online-now-badge">
                                  <span className="live-pulse-dot" />
                                  <span>Active</span>
                                </div>
                              ) : (
                                <div className="text-white">{u.lastActivity}</div>
                              )}
                              <div className="created-date-sub">Joined: {u.createdDate}</div>
                            </td>

                            {/* Actions */}
                            <td className="text-right">
                              <div className="table-actions-group" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="row-action-btn"
                                  title="View User Details"
                                  onClick={() => onNavigate && onNavigate('user-detail', u.id)}
                                >
                                  <span className="material-symbols-outlined icon-20">
                                    visibility
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  className={`row-action-btn ${u.status === 'ACTIVE' ? 'hover-amber' : 'hover-green'}`}
                                  title={u.status === 'ACTIVE' ? 'Suspend User' : 'Reactivate User'}
                                  disabled={isActionLoading}
                                  onClick={(e) => handleToggleStatus(u.id, u.status, e)}
                                >
                                  <span className="material-symbols-outlined icon-20">
                                    {isActionLoading ? 'sync' : u.status === 'ACTIVE' ? 'pause' : 'play_arrow'}
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="table-pagination-footer">
                <div className="showing-entries-text">
                  Showing <span className="text-white font-semibold">{filteredUsers.length ? (currentPage - 1) * limit + 1 : 0}</span> to{' '}
                  <span className="text-white font-semibold">
                    {Math.min(currentPage * limit, totalCount || filteredUsers.length)}
                  </span> of{' '}
                  <span className="text-white font-semibold">{totalCount || filteredUsers.length}</span> users
                </div>

                <div className="pagination-buttons">
                  <button
                    type="button"
                    className="p-nav-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="p-num-btn active"
                  >
                    {currentPage}
                  </button>
                  <button
                    type="button"
                    className="p-nav-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
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
