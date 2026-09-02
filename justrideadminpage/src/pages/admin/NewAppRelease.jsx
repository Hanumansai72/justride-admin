import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { appReleasesApi } from '../../api/services';
import './ProvisionStaff.css';

export default function NewAppRelease({ onNavigate, onLogout }) {
  const [version, setVersion] = useState('1.0.0');
  const [buildNumber, setBuildNumber] = useState('1');
  const [platform, setPlatform] = useState('android');
  const [channel, setChannel] = useState('stable'); // stable, beta, alpha
  const [minSupportedVersion, setMinSupportedVersion] = useState('');
  const [isMandatory, setIsMandatory] = useState(false);
  const [releaseNotes, setReleaseNotes] = useState(
    'Initial Android release: Wireless BLE navigation dashboard, battery telemetry, and background sync.'
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.apk') && !file.name.endsWith('.aab')) {
        setErrorMsg('Please select a valid compiled Android .apk or .aab package.');
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
      let finalFileUrl = fileUrl.trim();
      let fileSize = 0;

      if (selectedFile) {
        fileSize = selectedFile.size;

        // Step 1: Request presigned upload URL from backend (takes <100ms, payload <1KB)
        const presignedRes = await appReleasesApi.getUploadUrl({
          filename: selectedFile.name,
          content_type: selectedFile.type || 'application/vnd.android.package-archive',
        });

        if (!presignedRes?.success || !presignedRes?.data?.uploadUrl) {
          throw new Error(presignedRes?.message || 'Failed to acquire Cloudflare R2 upload authorization');
        }

        const { uploadUrl, publicUrl } = presignedRes.data;

        // Step 2: Upload file DIRECTLY from browser to Cloudflare R2 (Bypasses Vercel 4.5MB payload limit completely)
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/vnd.android.package-archive',
          },
          body: selectedFile,
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text().catch(() => '');
          throw new Error(`Direct Cloudflare R2 upload failed (HTTP ${uploadRes.status}): ${errText || uploadRes.statusText}`);
        }

        finalFileUrl = publicUrl;
      }

      if (!finalFileUrl) {
        throw new Error('Please select an APK file or specify a valid file URL.');
      }

      // Step 3: Register release in database with final Cloudflare R2 URL
      const payload = {
        version: version.trim().replace(/^v/i, ''),
        build_number: Number(buildNumber),
        platform,
        channel,
        min_supported_version: minSupportedVersion.trim() || undefined,
        is_mandatory: isMandatory,
        release_notes: releaseNotes.trim(),
        file_url: finalFileUrl,
        file_size_bytes: fileSize || undefined,
      };

      const res = await appReleasesApi.createRelease(payload);

      if (res?.success) {
        alert(`Mobile App Release v${res.data?.version || version} published successfully to Cloudflare R2!`);
        if (onNavigate) onNavigate('app-releases');
      }
    } catch (err) {
      setErrorMsg(err.data?.message || err.message || 'Failed to create app release');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="provision-staff-page">
      {/* Universal Sidebar */}
      <Sidebar activeRoute="app-releases" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="provision-main-wrapper">
        {/* Top Header */}
        <header className="provision-topbar">
          <div className="topbar-right-controls">
            <div className="system-status-pill">
              <span className="live-pulse-dot" />
              <span>Cloudflare R2 Ready</span>
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
              <h1 className="page-main-heading">Publish Mobile App Release (APK)</h1>
              <p className="page-sub-heading">
                Upload and distribute Android application binary packages directly to Cloudflare R2 CDN.
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 84, 73, 0.15)',
                  border: '1px solid rgba(255, 84, 73, 0.4)',
                  borderRadius: '8px',
                  color: '#ff857a',
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
                  {/* Version & Build Section */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">android</span>
                      <h3 className="section-title">Application Version &amp; Channel</h3>
                    </div>

                    <div className="fields-grid-2x2">
                      <div className="field-group">
                        <label className="field-label">Semantic Version</label>
                        <input
                          type="text"
                          className="custom-form-input font-mono"
                          placeholder="1.0.0"
                          value={version}
                          onChange={(e) => setVersion(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Build Number (Integer)</label>
                        <input
                          type="number"
                          className="custom-form-input font-mono"
                          placeholder="1"
                          value={buildNumber}
                          onChange={(e) => setBuildNumber(e.target.value)}
                          required
                        />
                      </div>

                      <div className="field-group">
                        <label className="field-label">Target Platform</label>
                        <select
                          className="custom-form-input appearance-none"
                          value={platform}
                          onChange={(e) => setPlatform(e.target.value)}
                        >
                          <option value="android">Android (.apk / .aab)</option>
                          <option value="ios">iOS Package (.ipa)</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Release Channel</label>
                        <select
                          className="custom-form-input appearance-none"
                          value={channel}
                          onChange={(e) => setChannel(e.target.value)}
                        >
                          <option value="stable">Stable (General Public)</option>
                          <option value="beta">Beta (Pilot Testing)</option>
                          <option value="alpha">Alpha (Internal QA)</option>
                        </select>
                      </div>

                      <div className="field-group">
                        <label className="field-label">Minimum Supported Version (Optional)</label>
                        <input
                          type="text"
                          className="custom-form-input font-mono"
                          placeholder="0.9.0"
                          value={minSupportedVersion}
                          onChange={(e) => setMinSupportedVersion(e.target.value)}
                        />
                      </div>

                      <div className="field-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '28px' }}>
                        <input
                          type="checkbox"
                          id="is-mandatory-toggle"
                          checked={isMandatory}
                          onChange={(e) => setIsMandatory(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer' }}
                        />
                        <label htmlFor="is-mandatory-toggle" style={{ color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
                          Force Mandatory Update (Blocks older versions)
                        </label>
                      </div>

                      {/* File Upload Box */}
                      <div className="field-group" style={{ gridColumn: 'span 2' }}>
                        <label className="field-label">Upload Android APK Package (.apk)</label>
                        <div
                          style={{
                            border: selectedFile ? '2px solid #22c55e' : '2px dashed #27312b',
                            borderRadius: '10px',
                            padding: '1.5rem',
                            textAlign: 'center',
                            background: '#151a17',
                            cursor: 'pointer',
                          }}
                          onClick={() => document.getElementById('apk-file-input').click()}
                        >
                          <input
                            id="apk-file-input"
                            type="file"
                            accept=".apk,.aab"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                          />
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '36px', marginBottom: '8px' }}>
                            {selectedFile ? 'task_alt' : 'cloud_upload'}
                          </span>
                          <p style={{ margin: '4px 0', fontWeight: '600', color: selectedFile ? '#22c55e' : '#fff' }}>
                            {selectedFile ? selectedFile.name : 'Click to select JustRide Android .apk package'}
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#88988e' }}>
                            {selectedFile
                              ? `Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — Automatically streams to Cloudflare R2`
                              : 'Flutter release APK (e.g. build/app/outputs/flutter-apk/app-arm64-v8a-release.apk)'}
                          </p>
                        </div>
                      </div>

                      {!selectedFile && (
                        <div className="field-group" style={{ gridColumn: 'span 2' }}>
                          <label className="field-label">Or Manual Storage URL (Optional)</label>
                          <input
                            type="url"
                            className="custom-form-input font-mono"
                            placeholder="https://pub-....r2.dev/apk/app.apk"
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Release Notes */}
                  <section className="form-card-section">
                    <div className="section-header-row">
                      <span className="material-symbols-outlined text-primary">notes</span>
                      <h3 className="section-title">What's New in this Release</h3>
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

                {/* Right: Deployment Summary Card (4 cols) */}
                <div className="form-right-col">
                  <div className="sticky-preview-wrapper">
                    <h3 className="preview-heading">Release Preview</h3>

                    <div className="profile-preview-card">
                      <div className="preview-banner-bg">
                        <div className="banner-diagonal-pattern" />
                      </div>

                      <div className="preview-card-body">
                        <div className="preview-avatar-circle">
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
                            android
                          </span>
                        </div>

                        <div className="preview-name-center">
                          <h4 className="preview-full-name font-mono">v{version} (Build #{buildNumber})</h4>
                          <p className="preview-role-dept">
                            {channel.toUpperCase()} • {platform.toUpperCase()}
                          </p>
                          <div
                            className="preview-status-pill"
                            style={{
                              backgroundColor:
                                channel === 'stable'
                                  ? 'rgba(74, 222, 128, 0.1)'
                                  : 'rgba(245, 158, 11, 0.1)',
                              color: channel === 'stable' ? '#4be277' : '#f59e0b',
                              marginTop: '6px',
                            }}
                          >
                            <span
                              className="live-pulse-dot"
                              style={{
                                backgroundColor: channel === 'stable' ? '#4be277' : '#f59e0b',
                              }}
                            />
                            <span>{isMandatory ? 'Mandatory Rollout' : 'Optional Update'}</span>
                          </div>
                        </div>

                        <div className="preview-divider" />

                        <div className="preview-meta-rows">
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">cloud</span>
                            <span className="font-mono">Storage: Cloudflare R2</span>
                          </div>
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">attach_file</span>
                            <span className="font-mono">
                              File: {selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Manual URL'}
                            </span>
                          </div>
                          <div className="meta-row">
                            <span className="material-symbols-outlined icon-16">payments</span>
                            <span className="font-mono" style={{ color: '#4be277' }}>
                              Egress: $0.00 (Zero Fee)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="provision-action-bar">
                  <button
                    type="button"
                    className="btn-cancel-action"
                    onClick={() => onNavigate && onNavigate('app-releases')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-create-action btn-glow"
                    style={{ opacity: isSubmitting ? 0.7 : 1 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                      {isSubmitting ? 'sync' : 'publish'}
                    </span>
                    <span>{isSubmitting ? 'Uploading to Cloudflare R2...' : 'Publish APK Release'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

