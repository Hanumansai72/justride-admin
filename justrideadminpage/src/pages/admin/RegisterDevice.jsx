import TopBar from '../../components/common/TopBar';
import React, { useState } from 'react';
import { devicesApi } from '../../api/services';
import './RegisterDevice.css';

export default function RegisterDevice({ onNavigate, onLogout }) {
  const [deviceName, setDeviceName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [bleAddress, setBleAddress] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [deviceVersion, setDeviceVersion] = useState('1.0');
  const [firmwareVersion, setFirmwareVersion] = useState('1.0.0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto format BLE address as user types (AA:BB:CC:DD:EE:FF)
  const handleBleChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (val.length > 12) val = val.slice(0, 12);
    const formatted = val.match(/.{1,2}/g)?.join(':') || val;
    setBleAddress(formatted);
  };

  const handleGenerateId = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    setDeviceId(`JR-NODE-${randomHex}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!bleAddress && !deviceId && !serialNumber) {
      setErrorMsg('Please specify at least a BLE Address, Device ID, or Serial Number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        devicename: deviceName.trim() || 'JustRide Telemetry Unit',
        device_id: deviceId.trim() || undefined,
        BLE_ADDRESS: bleAddress.trim() || undefined,
        serialnumber: serialNumber.trim() || undefined,
        device_version: deviceVersion.trim() || '1.0',
        firmware_version: firmwareVersion.trim() || '1.0.0',
      };

      const res = await devicesApi.registerDevice(payload);
      if (res?.success) {
        setSuccessMsg(`Device [${res.data?.device_id || deviceId || 'New Device'}] successfully registered!`);
        setTimeout(() => {
          if (onNavigate) onNavigate('devices');
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to register device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-device-page">
      {/* Universal Side Navigation */}

      {/* Main Content Area */}
      <div className="register-device-main">
        {/* Top Header */}
        <TopBar title="Register device" onBack={() => onNavigate?.('devices')} backLabel="Back to devices" onNavigate={onNavigate} />

        {/* Form Container Canvas */}
        <main className="register-device-content">
          <div className="register-device-card">
            <div className="card-header">
              <div className="header-icon-box">
                <span className="material-symbols-outlined">motorcycle</span>
              </div>
              <div>
                <h3 className="card-title">Device Hardware Specifications</h3>
                <p className="card-subtitle">
                  Enroll new telemetry hardware, Bluetooth Low Energy BLE beacon, or ECU tracker to the JustRide cloud network.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="alert-box error">
                <span className="material-symbols-outlined">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="alert-box success">
                <span className="material-symbols-outlined">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="device-form">
              <div className="form-grid">
                {/* Device Name */}
                <div className="form-group full-width">
                  <label htmlFor="deviceName">Device Model / Display Name</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">devices</span>
                    <input
                      id="deviceName"
                      type="text"
                      placeholder="e.g. JustRide Pro Tracker X1"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      required
                    />
                  </div>
                  <span className="field-hint">Human-readable label shown to riders and fleet managers.</span>
                </div>

                {/* Device ID */}
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="deviceId">Unique Device ID</label>
                    <button type="button" className="btn-inline-action" onClick={handleGenerateId}>
                      <span className="material-symbols-outlined icon-14">autorenew</span>
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">qr_code</span>
                    <input
                      id="deviceId"
                      type="text"
                      placeholder="e.g. JR-NODE-89A12B"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                    />
                  </div>
                  <span className="field-hint">Unique fleet identifier (e.g. QR code or internal asset tag).</span>
                </div>

                {/* BLE Address */}
                <div className="form-group">
                  <label htmlFor="bleAddress">Bluetooth MAC (BLE Address)</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">bluetooth</span>
                    <input
                      id="bleAddress"
                      type="text"
                      placeholder="AA:BB:CC:11:22:33"
                      value={bleAddress}
                      onChange={handleBleChange}
                      maxLength={17}
                    />
                  </div>
                  <span className="field-hint">12-character hex Bluetooth Low Energy MAC address.</span>
                </div>

                {/* Serial Number */}
                <div className="form-group">
                  <label htmlFor="serialNumber">Hardware Serial Number</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">tag</span>
                    <input
                      id="serialNumber"
                      type="text"
                      placeholder="e.g. SN-2026-990142"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                    />
                  </div>
                </div>

                {/* Hardware Revision */}
                <div className="form-group">
                  <label htmlFor="deviceVersion">Hardware Revision</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">memory</span>
                    <input
                      id="deviceVersion"
                      type="text"
                      placeholder="e.g. 1.0 or 2.1"
                      value={deviceVersion}
                      onChange={(e) => setDeviceVersion(e.target.value)}
                    />
                  </div>
                </div>

                {/* Initial Firmware Version */}
                <div className="form-group full-width">
                  <label htmlFor="firmwareVersion">Factory Firmware Version</label>
                  <div className="input-wrap">
                    <span className="material-symbols-outlined input-icon">system_update</span>
                    <input
                      id="firmwareVersion"
                      type="text"
                      placeholder="e.g. 1.0.0"
                      value={firmwareVersion}
                      onChange={(e) => setFirmwareVersion(e.target.value)}
                    />
                  </div>
                  <span className="field-hint">Initial OTA image installed on micro-controller.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => onNavigate && onNavigate('devices')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined spin-icon">sync</span>
                      <span>Provisioning Device...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      <span>Register Device</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
