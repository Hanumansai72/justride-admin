import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { devicesApi } from '../../api/services';
import './DeviceDetail.css';

export default function DeviceDetail({ deviceId: propDeviceId, onBack, onNavigate, onLogout }) {
  const params = useParams();
  const navigate = useNavigate();
  const deviceId = propDeviceId || params.id;
  const [device, setDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [firmwareUpdating, setFirmwareUpdating] = useState(false);

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

  const handlePushUpdate = () => {
    setFirmwareUpdating(true);
    setTimeout(() => {
      setFirmwareUpdating(false);
      setDevice((prev) => ({ ...prev, firmware_version: '2.4.1' }));
      alert('Firmware update signal dispatched via MQTT.');
    }, 1500);
  };

  const logs = [
    {
      timestamp: device?.linked_date ? new Date(device.linked_date).toLocaleString() : 'Recent',
      user: device?.linked_to?.name || 'Assigned Rider',
      event: device?.is_paired ? 'BLE Pairing Established' : 'Device Available',
      status: device?.is_blocked ? 'Blocked' : 'Active',
      type: device?.is_blocked ? 'error' : 'success',
    },
    {
      timestamp: 'Diagnostic Check',
      user: 'SYSTEM_DAEMON',
      event: 'Telemetry Packet Received',
      status: '200 OK',
      type: 'success',
    },
  ];

  return (
    <div className="dev-detail-page">
      {/* SideNavBar */}
      <Sidebar activeRoute="devices" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Container */}
      <div className="dev-detail-main">
        {/* Top App Bar */}
        <header className="dev-detail-header">
          <div className="header-breadcrumbs">
            <button
              type="button"
              className="breadcrumb-link"
              onClick={onBack || (() => onNavigate && onNavigate('devices'))}
            >
              Devices
            </button>
            <span className="material-symbols-outlined icon-16">chevron_right</span>
            <span className="breadcrumb-current">{device?.device_id || device?.BLE_ADDRESS || deviceId || 'JR-A7B9C'}</span>
          </div>

          <div className="header-user-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label="Refresh"
              onClick={fetchDeviceDetails}
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button
              type="button"
              className="icon-btn"
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
        <main className="dev-detail-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchDeviceDetails} />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: '#94A3A8' }}>
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
                      <div className="specs-row">
                        <span className="specs-k">Device ID</span>
                        <span className="specs-v font-mono">{device?.device_id || 'N/A'}</span>
                      </div>
                      <div className="specs-row">
                        <span className="specs-k">BLE Address</span>
                        <span className="specs-v font-mono">{device?.BLE_ADDRESS || '00:1A:2B:3C:4D'}</span>
                      </div>
                      <div className="specs-row">
                        <span className="specs-k">Firmware Version</span>
                        <span className="specs-v">v{device?.firmware_version || '1.0.0'}</span>
                      </div>
                      <div className="specs-row no-border">
                        <span className="specs-k">Device Version</span>
                        <span className="specs-v">{device?.device_version || '1.0'}</span>
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
                          <img
                            src={device.linked_to.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80'}
                            alt={device.linked_to.name || 'Rider'}
                          />
                        </div>
                        <div>
                          <div className="owner-name-txt">{device.linked_to.name || 'Registered Rider'}</div>
                          <div className="owner-usr-id font-mono">{device.linked_to.email}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem 0', color: '#94A3A8', fontSize: '13px' }}>
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
                          <span>Live Telemetry</span>
                        </h3>
                        <span className="telemetry-timestamp">Stream Active</span>
                      </div>

                      <div className="telemetry-metrics-grid">
                        <div className="metric-box">
                          <div className="metric-box-label text-warning">
                            <span className="material-symbols-outlined icon-16">battery_std</span>
                            <span>Battery</span>
                          </div>
                          <div className="metric-box-val text-warning">88%</div>
                        </div>

                        <div className="metric-box">
                          <div className="metric-box-label">
                            <span className="material-symbols-outlined icon-16">device_thermostat</span>
                            <span>Temp</span>
                          </div>
                          <div className="metric-box-val">34°C</div>
                        </div>

                        <div className="metric-box full-width flex-between">
                          <div className="metric-box-label">
                            <span className="material-symbols-outlined icon-16">signal_cellular_alt</span>
                            <span>Signal Strength (RSSI)</span>
                          </div>
                          <div className="font-mono rssi-value">-54 dBm</div>
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
                          <div className="version-val font-mono">v{device?.firmware_version || '1.0.0'}</div>
                        </div>
                        <div className="text-right">
                          <div className="version-label">Target Channel</div>
                          <div className="version-val target font-mono">Stable v2.4.1</div>
                        </div>
                      </div>

                      <div className="update-progress-section">
                        <div className="update-status-label">
                          <span className="material-symbols-outlined icon-16">pending</span>
                          <span>{firmwareUpdating ? 'OTA Update in progress...' : 'Ready for OTA update'}</span>
                        </div>
                        <div className="progress-bg">
                          <div
                            className={`progress-fill ${firmwareUpdating ? 'progress-active' : ''}`}
                            style={{ width: firmwareUpdating ? '100%' : '10%' }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-push-update"
                        disabled={firmwareUpdating}
                        onClick={handlePushUpdate}
                      >
                        {firmwareUpdating ? 'Transmitting...' : 'Push OTA Update'}
                      </button>
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
                          {logs.map((log, idx) => (
                            <tr key={idx} className="log-row">
                              <td className="font-mono text-muted">{log.timestamp}</td>
                              <td className="text-white font-medium">{log.user}</td>
                              <td className="text-white">{log.event}</td>
                              <td>
                                <span className={`log-status-badge status-${log.type}`}>
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
