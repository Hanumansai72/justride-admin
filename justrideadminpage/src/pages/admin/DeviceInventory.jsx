import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { devicesApi } from '../../api/services';
import './DeviceInventory.css';

export default function DeviceInventory({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Status: All');
  const [pairingFilter, setPairingFilter] = useState('Pairing: All');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [stats, setStats] = useState({
    total: '0',
    paired: '0',
    available: '0',
    offline: '0',
    blocked: '0',
  });

  const fetchDevices = useCallback(async () => {
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
      };

      if (statusFilter === 'Active') params.status = 'active';
      else if (statusFilter === 'Available') params.status = 'available';
      else if (statusFilter === 'Blocked') params.status = 'blocked';

      if (pairingFilter === 'Paired') params.is_paired = true;
      else if (pairingFilter === 'Unpaired') params.is_paired = false;

      const res = await devicesApi.getDevices(params, { signal });
      if (signal.aborted) return;
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((d) => ({
          id: d.device_id || d.BLE_ADDRESS || 'DEV-NODE',
          rawId: d._id,
          serial: d.BLE_ADDRESS ? `BLE: ${d.BLE_ADDRESS}` : `DEV: ${d.device_id}`,
          name: d.devicename || 'JustRide Telemetry Unit',
          owner: d.linked_to
            ? {
                name: d.linked_to.name || d.linked_to.email,
                initials: d.linked_to.name ? d.linked_to.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'UR',
              }
            : null,
          status: d.is_blocked ? 'BLOCKED' : d.is_paired ? 'ACTIVE' : 'AVAILABLE',
          pairing: d.is_paired ? 'Paired' : 'Unpaired',
          firmware: d.firmware_version || '1.0.0',
        }));

        setDevices(mapped);
        const total = res.pagination?.total ?? mapped.length;
        const pairedCount = mapped.filter((d) => d.pairing === 'Paired').length;
        const availableCount = mapped.filter((d) => d.status === 'AVAILABLE').length;
        const blockedCount = mapped.filter((d) => d.status === 'BLOCKED').length;
        const offlineCount = mapped.filter((d) => d.status === 'OFFLINE').length;

        if (res.pagination) {
          setTotalDevices(res.pagination.total || mapped.length);
          setTotalPages(res.pagination.pages || 1);
        }

        setStats({
          total: Number(total).toLocaleString(),
          paired: Number(pairedCount).toLocaleString(),
          available: Number(availableCount).toLocaleString(),
          offline: Number(offlineCount).toLocaleString(),
          blocked: Number(blockedCount).toLocaleString(),
        });
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [currentPage, limit, searchQuery, statusFilter, pairingFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDevices();
    }, requestRef.current ? 250 : 0);
    return () => { clearTimeout(handler); requestRef.current?.abort(); };
  }, [fetchDevices]);

  const handleAction = async (type, device, e) => {
    if (e) e.stopPropagation();
    if (type === 'view') {
      if (onNavigate) onNavigate('device-detail', device.rawId || device.id);
      return;
    }

    setActionLoadingId(device.rawId);
    try {
      if (type === 'unlink') {
        if (window.confirm(`Force unlink device ${device.id}? This will disconnect the linked rider immediately.`)) {
          const res = await devicesApi.forceUnlink(device.rawId, 'Manual admin unpair');
          if (res?.success) {
            setDevices((prev) =>
              prev.map((d) =>
                d.rawId === device.rawId
                  ? { ...d, owner: null, status: 'AVAILABLE', pairing: 'Unpaired' }
                  : d
              )
            );
          }
        }
      } else if (type === 'block') {
        const reason = window.prompt(`Enter reason for blocking device ${device.id}:`, 'Reported lost/stolen');
        if (reason) {
          const res = await devicesApi.blockDevice(device.rawId, reason);
          if (res?.success) {
            setDevices((prev) =>
              prev.map((d) => (d.rawId === device.rawId ? { ...d, status: 'BLOCKED' } : d))
            );
          }
        }
      } else if (type === 'unblock') {
        const res = await devicesApi.unblockDevice(device.rawId);
        if (res?.success) {
          setDevices((prev) =>
            prev.map((d) => (d.rawId === device.rawId ? { ...d, status: d.pairing === 'Paired' ? 'ACTIVE' : 'AVAILABLE' } : d))
          );
        }
      }
    } catch (err) {
      alert(`Device action failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="devices-page-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="devices" onNavigate={onNavigate} onLogout={onLogout} />

      {/* TopAppBar */}
      <header className="devices-topbar">
        <div className="topbar-title-wrap">
          <h2 className="topbar-heading">Devices Inventory & Fleet Control</h2>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="action-icon-btn"
            aria-label="Refresh Devices"
            onClick={fetchDevices}
            title="Refresh Fleet"
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
            className="profile-thumb"
            onClick={() => onNavigate && onNavigate('helpers')}
            style={{ cursor: 'pointer' }}
            title="Staff Accounts"
          >
            <span style={{ color: 'var(--text-white)', fontWeight: 500, fontSize: '12px' }}>H</span>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="devices-main-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchDevices} />
        {/* Summary Stats (Bento Grid) */}
        <div className="stats-bento-grid">
          {/* Total Devices Card */}
          <div className="stat-card total-card">
            <div className="hover-glow" />
            <p className="card-caption">Total Devices</p>
            <div className="total-val-row">
              <h3 className="card-big-number">{stats.total}</h3>
              <span className="trend-badge-up">
                <span className="material-symbols-outlined icon-14">trending_up</span>
                Live fleet
              </span>
            </div>
          </div>

          {/* Breakdown Bento Grid */}
          <div className="stat-card breakdown-grid-card">
            {/* Paired */}
            <div className="breakdown-col">
              <p className="card-caption">Paired</p>
              <p className="breakdown-number">{stats.paired}</p>
              <div className="progress-track">
                <div className="progress-fill bar-paired" style={{ width: '80%' }} />
              </div>
            </div>

            {/* Available */}
            <div className="breakdown-col divider-left">
              <p className="card-caption">Available</p>
              <p className="breakdown-number">{stats.available}</p>
              <div className="progress-track">
                <div className="progress-fill bar-available" style={{ width: '15%' }} />
              </div>
            </div>

            {/* Offline */}
            <div className="breakdown-col divider-left">
              <p className="card-caption">Offline</p>
              <p className="breakdown-number text-amber">{stats.offline}</p>
              <div className="progress-track">
                <div className="progress-fill bar-offline" style={{ width: '4%' }} />
              </div>
            </div>

            {/* Blocked */}
            <div className="breakdown-col divider-left">
              <p className="card-caption">Blocked</p>
              <p className="breakdown-number text-red">{stats.blocked}</p>
              <div className="progress-track">
                <div className="progress-fill bar-blocked" style={{ width: '1%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Area (Search & Dropdowns) */}
        <div className="table-controls-bar">
          <div className="search-wrap">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search Device ID, BLE Address, Name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="devices-search-input"
            />
          </div>

          <div className="controls-right">
            <div className="select-container">
              <select
                className="custom-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>Status: All</option>
                <option>Active</option>
                <option>Available</option>
                <option>Blocked</option>
              </select>
              <span className="material-symbols-outlined chevron-icon">arrow_drop_down</span>
            </div>

            <div className="select-container">
              <select
                className="custom-select"
                value={pairingFilter}
                onChange={(e) => {
                  setPairingFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>Pairing: All</option>
                <option>Paired</option>
                <option>Unpaired</option>
              </select>
              <span className="material-symbols-outlined chevron-icon">arrow_drop_down</span>
            </div>

            <button
              type="button"
              className="btn-provision"
              onClick={() => onNavigate && onNavigate('register-device')}
            >
              <span className="material-symbols-outlined icon-18">add</span>
              <span>Register Device</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="devices-table-wrap">
          <table className="devices-table">
            <thead>
              <tr>
                <th>DEVICE ID / BLE</th>
                <th>DEVICE NAME</th>
                <th>OWNER</th>
                <th>STATUS</th>
                <th className="text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && devices.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                      sync
                    </span>
                    <p>Loading device fleet...</p>
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No devices found matching current filters.
                  </td>
                </tr>
              ) : (
                devices.map((d) => {
                  const isActionLoading = actionLoadingId === d.rawId;
                  return (
                    <tr
                      key={d.id}
                      className="device-table-row"
                      onClick={() => handleAction('view', d)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="font-semibold text-white">{d.id}</div>
                        <div className="serial-subtext font-mono">{d.serial}</div>
                      </td>
                      <td className="text-white">
                        <div>{d.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FW: v{d.firmware}</div>
                      </td>
                      <td>
                        {d.owner ? (
                          <div className="owner-badge-wrap">
                            <div className="owner-initials">{d.owner.initials}</div>
                            <span>{d.owner.name}</span>
                          </div>
                        ) : (
                          <span className="unassigned-text">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {d.status === 'ACTIVE' && (
                          <span className="status-pill-active">
                            <span className="active-dot pulse" />
                            ACTIVE
                          </span>
                        )}
                        {d.status === 'AVAILABLE' && (
                          <span className="status-pill-available">AVAILABLE</span>
                        )}
                        {d.status === 'BLOCKED' && (
                          <span className="status-pill-blocked">BLOCKED</span>
                        )}
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="row-action-buttons">
                          <button
                            type="button"
                            className="row-btn hover-white"
                            title="View Details"
                            onClick={() => handleAction('view', d)}
                          >
                            <span className="material-symbols-outlined icon-20">visibility</span>
                          </button>

                          {d.status === 'ACTIVE' && (
                            <button
                              type="button"
                              className="row-btn hover-amber"
                              title="Force Unlink"
                              disabled={isActionLoading}
                              onClick={(e) => handleAction('unlink', d, e)}
                            >
                              <span className="material-symbols-outlined icon-20">
                                {isActionLoading ? 'sync' : 'link_off'}
                              </span>
                            </button>
                          )}

                          {d.status !== 'BLOCKED' ? (
                            <button
                              type="button"
                              className="row-btn hover-red"
                              title="Block Device"
                              disabled={isActionLoading}
                              onClick={(e) => handleAction('block', d, e)}
                            >
                              <span className="material-symbols-outlined icon-20">
                                {isActionLoading ? 'sync' : 'block'}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="row-btn hover-green"
                              title="Unblock Device"
                              disabled={isActionLoading}
                              onClick={(e) => handleAction('unblock', d, e)}
                            >
                              <span className="material-symbols-outlined icon-20">
                                {isActionLoading ? 'sync' : 'lock_open'}
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

          {/* Table Pagination Footer */}
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {devices.length ? (currentPage - 1) * limit + 1 : 0} to{' '}
              {Math.min(currentPage * limit, totalDevices || devices.length)} of {totalDevices || devices.length} devices
            </span>
            <div className="pagination-btns">
              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <span className="material-symbols-outlined icon-20">chevron_left</span>
              </button>

              <button
                type="button"
                className="page-num-btn active"
              >
                {currentPage}
              </button>

              <button
                type="button"
                className="page-nav-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <span className="material-symbols-outlined icon-20">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
