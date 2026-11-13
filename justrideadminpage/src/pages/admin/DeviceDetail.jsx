import TopBar from '../../components/common/TopBar';
import UserAvatar from '../../components/common/UserAvatar';
import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { devicesApi, usersApi } from '../../api/services';
import './DeviceDetail.css';

export default function DeviceDetail({ deviceId: propDeviceId, onBack, onNavigate, onLogout }) {
  const params = useParams();
  const deviceId = propDeviceId || params.id;
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [setupFile, setSetupFile] = useState(null);
  const [setupMessage, setSetupMessage] = useState('');
  const [setupError, setSetupError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [assignMessage, setAssignMessage] = useState('');
  const [assignError, setAssignError] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    setSetupFile(null);
    setSetupMessage('');
    setSetupError('');
    setUsers([]);
    setSelectedUser('');
    setAssignError('');
    setAssignMessage('');
  }, [deviceId]);

  const searchUsers = async (event) => {
    event.preventDefault();
    setSearchingUsers(true);
    setAssignError('');
    setSelectedUser('');
    try {
      const response = await usersApi.getUsers({ search: userSearch.trim(), status: 'active' });
      if (!response?.success) throw new Error(response?.message || 'Could not find users.');
      setUsers(response.data || []);
      if (!response.data?.length) setAssignError('No active users found. Try their name or email.');
    } catch (error) { setAssignError(error.message); }
    finally { setSearchingUsers(false); }
  };

  const assignDevice = async () => {
    if (!selectedUser || isUpdating || !device?._id) return;
    setIsUpdating(true);
    setAssignError('');
    setAssignMessage('');
    try {
      const response = await devicesApi.assignDevice(device._id, selectedUser);
      if (!response?.success) throw new Error(response?.message || 'Assignment failed.');
      setAssignMessage('Device linked to the selected user. No setup code is needed.');
      setSelectedUser('');
      await fetchDeviceDetails();
    } catch (error) { setAssignError(error.message); }
    finally { setIsUpdating(false); }
  };

  const downloadSetup = (payload) => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)],
      { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'device-registration.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDeviceSetup = async () => {
    if (!device?._id || isUpdating) return;
    if (!window.confirm('Generate a new setup file for this display? This replaces its previous setup credential. Provision the new file to this same display over USB.')) return;
    setIsUpdating(true);
    setSetupError('');
    setSetupMessage('');
    setSetupFile(null);
    try {
      const res = await devicesApi.issueSetupCode(device._id);
      if (!res?.success || !/^[A-F0-9]{32}$/.test(res.setup_code || '')) {
        throw new Error(res?.message || 'Could not generate the device setup file.');
      }
      const payload = {
        device_id: device.device_id,
        BLE_ADDRESS: device.BLE_ADDRESS,
        setup_code: res.setup_code,
      };
      setSetupFile(payload);
      downloadSetup(payload);
      setSetupMessage('Setup file generated. Use it to provision this display over USB. Keep the file private.');
    } catch (err) {
      setSetupError(err.message || 'Could not generate the setup file. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchDeviceDetails = useCallback(async () => {
    if (!deviceId) {
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
      const res = await devicesApi.getDeviceById(deviceId, { signal });
      if (signal.aborted) return;
      if (res?.success && res?.data) {
        setDevice(res.data);
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDeviceDetails();
    return () => requestRef.current?.abort();
  }, [fetchDeviceDetails]);

  const deviceStatus = device?.is_blocked
    ? 'BLOCKED'
    : device?.is_paired
    ? 'ACTIVE'
    : 'AVAILABLE';

  const handleBlockToggle = async (block) => {
    if (!device?._id) return;
    setIsUpdating(true);
    try {
      if (block) {
        const reason = window.prompt(`Reason for blocking device ${device.device_id || device.BLE_ADDRESS}:`, 'Security lock requested by admin');
        if (reason) {
          const res = await devicesApi.blockDevice(device._id, reason);
          if (res?.success) {
            setDevice((prev) => ({ ...prev, is_blocked: true }));
          }
        }
      } else {
        const res = await devicesApi.unblockDevice(device._id);
        if (res?.success) {
          setDevice((prev) => ({ ...prev, is_blocked: false }));
        }
      }
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForceUnlink = async () => {
    if (!device?._id) return;
    if (window.confirm(`Are you sure you want to force-unlink device ${device.device_id || device.BLE_ADDRESS}?`)) {
      setIsUpdating(true);
      try {
        const res = await devicesApi.forceUnlink(device._id, 'Force unlinked by administrator');
        if (res?.success) {
          setDevice((prev) => ({ ...prev, is_paired: false, linked_to: null }));
          alert('Device successfully unlinked and pairing credentials reset.');
        }
      } catch (err) {
        alert(`Failed to unlink device: ${err.message}`);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const version = (value) => value ? `v${String(value).replace(/^v/i, '')}` : 'Not reported';
  const logs = device?.activity || [];

  return (
    <div className="dev-detail-page">
      {/* SideNavBar */}

      {/* Main Container */}
      <div className="dev-detail-main">
        {/* Top App Bar */}
        <TopBar title="Device details" onRefresh={fetchDeviceDetails} refreshing={isLoading} onBack={onBack || (() => onNavigate?.('devices'))} backLabel="Back to devices" onNavigate={onNavigate} />

        {/* Content Canvas */}
        <main className="dev-detail-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchDeviceDetails} />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '32px' }}>
                sync
              </span>
              <p>Loading device telemetry & hardware status...</p>
            </div>
          ) : (
            <div className="detail-canvas-inner">
              {/* Header / Actions Row */}
              <div className="detail-top-title-row">
                <h2 className="device-headline">
                  <span>{device?.devicename || 'JustRide Telemetry Unit'} - {device?.device_id || device?.BLE_ADDRESS}</span>
                  <span
                    className={`status-pill ${
                      deviceStatus === 'ACTIVE'
                        ? 'status-active'
                        : deviceStatus === 'BLOCKED'
                        ? 'status-blocked'
                        : 'status-available'
                    }`}
                  >
                    {deviceStatus}
                  </span>
                </h2>

                <div className="device-action-buttons">
                  <button
                    type="button"
                    className="btn-action-neutral"
                    disabled={deviceStatus === 'BLOCKED' || isUpdating}
                    onClick={() => handleBlockToggle(true)}
                  >
                    Block Device
                  </button>
                  <button
                    type="button"
                    className="btn-action-neutral"
                    disabled={deviceStatus !== 'BLOCKED' || isUpdating}
                    onClick={() => handleBlockToggle(false)}
                  >
                    Unblock Device
                  </button>
                  <button
                    type="button"
                    className="btn-action-danger"
                    disabled={!device?.is_paired || isUpdating}
                    onClick={handleForceUnlink}
                  >
                    Force Unlink
                  </button>
                </div>
              </div>

              {/* Bento Grid Layout */}
              <section className="bento-box" aria-label="Assign device" style={{ marginBottom: '20px' }}>
                <h3 className="bento-title">Assign to a registered user</h3>
                {device?.is_paired ? <p>This device is already linked. Unlink it before assigning it to someone else.</p> : <>
                  <p>Search by name or email, select a user, and link this device directly.</p>
                  <form onSubmit={searchUsers}>
                    <label htmlFor="assignment-search">User name or email</label>
                    <input id="assignment-search" value={userSearch} onChange={event => setUserSearch(event.target.value)} required disabled={isUpdating || searchingUsers} />
                    <button className="btn-action-neutral" disabled={isUpdating || searchingUsers}>{searchingUsers ? 'Searching…' : 'Find user'}</button>
                  </form>
                  {users.length > 0 && <>
                    <label htmlFor="assignment-user">Registered user</label>
                    <select id="assignment-user" value={selectedUser} onChange={event => setSelectedUser(event.target.value)} disabled={isUpdating || searchingUsers}>
                      <option value="">Select a user</option>
                      {users.map(user => <option key={user._id} value={user._id} disabled={!!user.paired_device}>{user.name} — {user.email}{user.paired_device ? ' (already has a device)' : ''}</option>)}
                    </select>
                    <button type="button" className="btn-action-neutral" onClick={assignDevice} disabled={!selectedUser || isUpdating || searchingUsers || !device?.is_active || device?.is_blocked || device?.is_retired}>Assign device</button>
                  </>}
                </>}
                {assignMessage && <p role="status">{assignMessage}</p>}
                {assignError && <p role="alert">{assignError}</p>}
              </section>
              <section className="bento-box" aria-label="Device setup" style={{ marginBottom: '20px' }}>
                <h3 className="bento-title">Device setup</h3>
                <p style={{ color: 'var(--text-muted)', margin: '12px 0' }}>
                  Download the private file used for one-time USB provisioning. Riders link the display through Bluetooth without entering a setup code.
                </p>
                <button type="button" className="btn-action-neutral"
                  disabled={!device?._id || device.is_paired || !device.is_active || device.is_blocked || device.is_retired || isUpdating}
                  onClick={handleDeviceSetup}>
                  {isUpdating ? 'Please wait…' : 'Generate setup file'}
                </button>
                {setupFile && <button type="button" className="btn-action-neutral" style={{ marginLeft: '12px' }}
                  onClick={() => downloadSetup(setupFile)}>Download again</button>}
                {device?.is_paired && <p style={{ color: 'var(--text-muted)' }}>Unlink this device before generating a new setup file.</p>}
                {setupMessage && <p role="status">{setupMessage}</p>}
                {setupError && <p role="alert">{setupError}</p>}
              </section>
              <div className="device-bento-grid">
                {/* Left Column: Specs & Assignment */}
                <div className="grid-col-left">
                  {/* Device Specs Card */}
                  <div className="bento-box specs-card">
                    <div className="specs-hover-glow" />
                    <h3 className="bento-title">
                      <span className="material-symbols-outlined icon-20">memory</span>
                      <span>Hardware Specifications</span>
                    </h3>

                    <div className="specs-list">
                      <div className="specs-row"><span className="specs-k">Last Seen</span><time className="specs-v" dateTime={device?.last_seen_at || undefined}>{device?.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Not reported'}</time></div>
                      <div className="specs-row">
                        <span className="specs-k">Device ID</span>
                        <span className="specs-v font-mono">{device?.device_id || 'N/A'}</span>
                      </div>
                      <div className="specs-row">
                        <span className="specs-k">BLE Address</span>
                        <span className="specs-v font-mono">{device?.BLE_ADDRESS || 'Not reported'}</span>
                      </div>
                      <div className="specs-row">
                        <span className="specs-k">Firmware Version</span>
                        <span className="specs-v">{version(device?.firmware_version)}</span>
                      </div>
                      <div className="specs-row no-border">
                        <span className="specs-k">Device Version</span>
                        <span className="specs-v">{device?.device_version || 'Not reported'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Owner Card */}
                  <div className="bento-box owner-card">
                    <h3 className="bento-title">
                      <span className="material-symbols-outlined icon-20">person</span>
                      <span>Assigned Rider</span>
                    </h3>

                    {device?.linked_to ? (
                      <div
                        className="owner-profile-row"
                        onClick={() => onNavigate && onNavigate('user-detail', device.linked_to._id || device.linked_to.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="owner-avatar-wrap">
                          <UserAvatar src={device.linked_to.avatar} name={device.linked_to.name} email={device.linked_to.email} />
                        </div>
                        <div>
                          <div className="owner-name-txt">{device.linked_to.name || 'Registered Rider'}</div>
                          <div className="owner-usr-id font-mono">{device.linked_to.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No user account currently paired with this device.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Telemetry, Firmware & Pairing Log */}
                <div className="grid-col-right">
                  {/* Top Row: Telemetry + Firmware */}
                  <div className="telemetry-firmware-row">
                    {/* Telemetry Card */}
                    <div className="bento-box telemetry-card">
                      <div className="bento-title-flex">
                        <h3 className="bento-title">
                          <span className="material-symbols-outlined icon-20">vital_signs</span>
                          <span>Device Telemetry</span>
                        </h3>
                        <span className="telemetry-timestamp">No telemetry reported</span>
                      </div>

                      <div className="telemetry-metrics-grid">
                        <div className="metric-box">
                          <div className="metric-box-label text-warning">
                            <span className="material-symbols-outlined icon-16">battery_std</span>
                            <span>Battery</span>
                          </div>
                          <div className="metric-box-val text-warning">Unavailable</div>
                        </div>

                        <div className="metric-box">
                          <div className="metric-box-label">
                            <span className="material-symbols-outlined icon-16">device_thermostat</span>
                            <span>Temp</span>
                          </div>
                          <div className="metric-box-val">Unavailable</div>
                        </div>

                        <div className="metric-box full-width flex-between">
                          <div className="metric-box-label">
                            <span className="material-symbols-outlined icon-16">signal_cellular_alt</span>
                            <span>Signal Strength (RSSI)</span>
                          </div>
                          <div className="font-mono rssi-value">Unavailable</div>
                        </div>
                      </div>
                    </div>

                    {/* Firmware Status Card */}
                    <div className="bento-box firmware-card">
                      <h3 className="bento-title">
                        <span className="material-symbols-outlined icon-20">system_update_alt</span>
                        <span>Firmware Status</span>
                      </h3>

                      <div className="firmware-versions-row">
                        <div>
                          <div className="version-label">Current Version</div>
                          <div className="version-val font-mono">{version(device?.firmware_version)}</div>
                        </div>
                        <div className="text-right">
                          <div className="version-label">Latest Available</div>
                          <div className="version-val target font-mono">{version(device?.latest_firmware)}</div>
                        </div>
                      </div>

                      <p className="update-status-label">{device?.firmware_update_available ? 'An update is available in the rider app.' : 'No pending update reported.'}</p>
                      <p className="version-label">Firmware updates are installed from the rider app.</p>
                    </div>
                  </div>

                  {/* Pairing Log Table Card */}
                  <div className="bento-box pairing-log-card">
                    <div className="bento-title-flex">
                      <h3 className="bento-title">
                        <span className="material-symbols-outlined icon-20">history</span>
                        <span>Recent Activity &amp; Pairing Trail</span>
                      </h3>
                    </div>

                    <div className="pairing-log-table-wrap">
                      <table className="pairing-log-table">
                        <thead>
                          <tr>
                            <th>TIMESTAMP</th>
                            <th>ACTOR</th>
                            <th>EVENT</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.length === 0 && <tr><td colSpan="4">No recorded device activity.</td></tr>}
                          {logs.map((log, idx) => (
                            <tr key={idx} className="log-row">
                              <td className="font-mono text-muted">{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Not recorded'}</td>
                              <td className="text-white font-medium">{log.user_id?.name || log.user_id?.email || 'System'}</td>
                              <td className="text-white">{log.action?.replaceAll('_', ' ')}</td>
                              <td>
                                <span className={`log-status-badge status-${log.status === 'SUCCESS' ? 'success' : 'error'}`}>
                                  <span className="status-dot" />
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
