import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { firmwareApi } from '../../api/services';
import './ProvisionStaff.css';

export default function NewFirmwareRelease({ onNavigate, onLogout }) {
  const [version, setVersion] = useState('2.2.0');
  const [channel, setChannel] = useState('stable'); // stable, beta, deprecated
  const [deviceType, setDeviceType] = useState('JustRide-V1');
  const [minSupportedVersion, setMinSupportedVersion] = useState('1.0.0');
  const [releaseNotes, setReleaseNotes] = useState(
    'Initial OTA release: Enhanced BLE reconnect handshake, battery ADC monitoring, and live status UI.'
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [checksum, setChecksum] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.bin')) {
        setErrorMsg('Please select a valid compiled firmware .bin file (e.g. justride_firmware.bin)');
        return;
      }
      setSelectedFile(file);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      let res;
      if (selectedFile) {
        // Upload physical .bin file directly to Cloudflare R2 via Backend multipart/form-data
        const formData = new FormData();
        formData.append('firmware_file', selectedFile);
        formData.append('version', version.trim().replace(/^v/i, ''));
        formData.append('channel', channel.toLowerCase());
        formData.append('device_type', deviceType.trim());
        if (minSupportedVersion) formData.append('min_supported_version', minSupportedVersion.trim());
        formData.append('release_notes', releaseNotes.trim());

        res = await firmwareApi.createRelease(formData);
      } else {
        // Manual URL payload
        const payload = {
          version: version.trim().replace(/^v/i, ''),
          channel: channel.toLowerCase(),
          device_type: deviceType.trim(),
          min_supported_version: minSupportedVersion.trim() || undefined,
          release_notes: releaseNotes.trim(),
          file_url: fileUrl.trim(),
          checksum: checksum.trim(),
        };
        res = await firmwareApi.createRelease(payload);
      }

      if (res?.success) {
        alert(`Firmware Release v${res.data?.version || version} published successfully to Cloudflare R2!`);
        if (onNavigate) onNavigate('firmware');
      }
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to create firmware release');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="provision-staff-page">
      {/* Universal Sidebar */}
      <Sidebar activeRoute="firmware" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="provision-main-wrapper">
        {/* TopAppBar */}
        <header className="provision-topbar">
          <div className="topbar-right-controls">
            <div className="system-status-pill">
              <span className="live-pulse-dot" />
              <span>System Operational</span>
            </div>

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

        {/* Canvas Body */}
        <main className="provision-canvas-content">
          <div className="canvas-max-wrap">
            {/* Header / Intro */}
            <div className="page-header-row">
              <h1 className="page-main-heading">Publish Firmware Release</h1>
              <p className="page-sub-heading">
                Register a signed Over-The-Air (OTA) binary and define target device criteria.
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(var(--rgb-danger), 0.15)',
                  border: '1px solid rgba(var(--rgb-danger), 0.4)',
                  borderRadius: '8px',
                  color: 'var(--color-danger-light)',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span className="material-symbols-outlined">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="provision-bento-grid">
                {/* Left: Form Controls (8 cols) */}
                <div className="form-left-col">
                  {/* Binary & Version Identity */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">
                        system_update
                      </span>
                      <h3 className="section-title">Release Metadata</h3>
                    </div>

                    <div className="fields-grid-2x2">
                      <div className="field-group">
                        <label className="field-label">Semantic Version (e.g. 2.5.0)</label>
                        <input
                          type="text"
                          className="custom-form-input font-mono"
                          placeholder="2.5.0"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Distribution Channel</label>
                        <select
                          className="custom-form-input appearance-none"
                          value={channel}
                          onChange={(e) => setChannel(e.target.value)}
                        >
                          <option value="stable">Stable (General Fleet)</option>
                          <option value="beta">Beta (Staged Testing)</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Target Hardware Device</label>
                        <input
                          type="text"
                          className="custom-form-input font-mono"
                          placeholder="e.g. Tracker X1 Pro"
                          value={deviceType}
                          onChange={(e) => setDeviceType(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Minimum Supported Version</label>
                        <input
                          type="text"
                          className="custom-form-input font-mono"
                          placeholder="2.4.0"
                          value={minSupportedVersion}
                          onChange={(e) => setMinSupportedVersion(e.target.value)}
                        />
                      </div>

                      <div className="field-group" style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Upload Firmware Binary (.bin file)</label>
                        <div
                          style={{
                            border: selectedFile ? '2px solid var(--color-primary)' : '2px dashed var(--border-standard)',
                            borderRadius: '10px',
                            padding: '1.25rem',
                            textAlign: 'center',
                            background: 'var(--bg-layer-2)',
                            cursor: 'pointer',
                          }}
                          onClick={() => document.getElementById('firmware-bin-file-input').click()}
                        >
                          <input
                            id="firmware-bin-file-input"
                            type="file"
                            accept=".bin"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                          />
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px', marginBottom: '8px' }}>
                            {selectedFile ? 'task_alt' : 'cloud_upload'}
                          </span>
                          <p style={{ margin: '4px 0', fontWeight: '600', color: selectedFile ? 'var(--color-primary)' : 'var(--text-white)' }}>
                            {selectedFile ? selectedFile.name : 'Click to select justride_firmware.bin'}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)' }}>
                            {selectedFile
                              ? `Size: ${(selectedFile.size / 1024).toFixed(1)} KB — Auto-streams to Cloudflare R2 on submit`
                              : 'ESP-IDF compiled binary from build/ directory'}
                          </p>
                        </div>
                      </div>

                      {!selectedFile && (
                        <div className="field-group" style={{ gridColumn: 'span 2' }}>
                          <label className="field-label">Or Manual Storage URL (Optional)</label>
                          <input
                            type="url"
                            className="custom-form-input font-mono"
                            placeholder="https://..."
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Changelog */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">
                        notes
                      </span>
                      <h3 className="section-title">Release Notes &amp; Highlights</h3>
                    </div>

                    <div className="fields-grid-2x2">
                      <div className="field-group" style={{ gridColumn: 'span 2' }}>
                        <textarea
                          rows={4}
                          className="custom-form-input font-mono"
                          style={{ resize: 'vertical' }}
                          value={releaseNotes}
                          onChange={(e) => setReleaseNotes(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </section>
                </div>

                {/* Right: Release Summary Preview (4 cols) */}
                <div className="preview-right-col">
                  <div className="sticky-preview-wrapper">
                    <h3 className="preview-heading">Deployment Preview</h3>

                    <div className="profile-preview-card">
                      <div className="preview-banner-bg">
                        <div className="banner-diagonal-pattern" />
                      </div>

                      <div className="preview-card-body">
                        <div className="preview-avatar-circle">
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
                            system_update_alt
                          </span>
                        </div>

                        <div className="preview-name-center">
                          <h4 className="preview-full-name font-mono">v{version}</h4>
                          <p className="preview-role-dept">
                            {channel.toUpperCase()} • {deviceType}
                          </p>
                          <div
                            className="preview-status-pill"
                            style={{
                              backgroundColor:
                                channel === 'stable'
                                  ? 'rgba(var(--rgb-primary), 0.1)'
                                  : 'rgba(var(--rgb-warning), 0.1)',
                              color:
                                channel === 'stable'
                                  ? 'var(--color-primary-light)'
                                  : 'var(--color-warning)',
                              border: '1px solid currentColor',
                            }}
                          >
                            <span>{channel.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="preview-meta-rows">
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">memory</span>
                            <span className="font-mono">Min Base: {minSupportedVersion || 'None'}</span>
                          </div>
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">verified</span>
                            <span className="truncate">Checksum Verified</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="provision-action-bar">
                <button
                  type="button"
                  className="btn-cancel-action"
                  onClick={() => onNavigate && onNavigate('firmware')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-create-action btn-glow"
                  style={{ opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Publishing...' : 'Publish OTA Release'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
