import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { appReleasesApi } from '../../api/services';
import './FirmwareManagement.css';

export default function AppReleasesManagement({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(15);
  const [releases, setReleases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReleases = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit,
        channel: channelFilter || undefined,
        platform: platformFilter || undefined,
      };

      const res = await appReleasesApi.getReleases(params);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((r) => ({
          id: r._id,
          version: `v${r.version.replace(/^v/, '')}`,
          buildNumber: r.build_number,
          platform: (r.platform || 'android').toUpperCase(),
          channel: (r.channel || 'stable').toUpperCase(),
          channelType: r.channel === 'stable' ? 'stable' : r.channel === 'beta' ? 'beta' : 'neutral',
          status: r.is_active ? 'Active' : 'Archived',
          statusType: r.is_active ? 'active' : 'deprecated',
          releaseDate: r.release_date ? new Date(r.release_date).toLocaleDateString() : 'Recent',
          fileSizeMb: r.file_size_bytes ? (r.file_size_bytes / (1024 * 1024)).toFixed(1) : '—',
          mandatory: !!r.is_mandatory,
          downloadUrl: r.file_url,
          notes: r.release_notes || '—',
        }));

        setReleases(mapped);
        setTotalCount(res.total || mapped.length);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      console.warn('Could not fetch app releases from backend:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, channelFilter, platformFilter]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleDelete = async (release) => {
    if (window.confirm(`Are you sure you want to delete APK release ${release.version} (Build ${release.buildNumber})?`)) {
      try {
        const res = await appReleasesApi.deleteRelease(release.id);
        if (res?.success) {
          alert('App release deleted successfully.');
          fetchReleases();
        }
      } catch (err) {
        alert(`Failed to delete app release: ${err.message}`);
      }
    }
  };

  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      const matchSearch =
        r.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.buildNumber).includes(searchQuery) ||
        r.notes.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [releases, searchQuery]);

  const stableRelease = releases.find((r) => r.channel === 'STABLE');
  const betaRelease = releases.find((r) => r.channel === 'BETA');

  const metrics = [
    {
      title: 'LATEST STABLE APK',
      value: stableRelease ? `${stableRelease.version} (b${stableRelease.buildNumber})` : (isLoading ? '...' : 'None'),
      subtext: 'Direct Cloudflare R2 CDN',
      icon: 'verified',
      iconBg: 'text-primary',
      trendColor: 'text-primary',
      trendIcon: 'check_circle',
    },
    {
      title: 'BETA TESTING CHANNEL',
      value: betaRelease ? `${betaRelease.version} (b${betaRelease.buildNumber})` : (isLoading ? '...' : 'None Active'),
      subtext: 'Internal pilot testing',
      icon: 'science',
      iconBg: 'text-warning',
      trendColor: 'text-warning',
      trendIcon: 'warning',
    },
    {
      title: 'TOTAL APK BUILDS',
      value: String(totalCount || releases.length),
      subtext: 'Hosted on Cloudflare R2',
      icon: 'android',
      iconBg: 'text-secondary',
      trendColor: 'text-muted',
      trendIcon: '',
    },
  ];

  return (
    <div className="firmware-page-container">
      {/* Universal Sidebar */}
      <Sidebar activeRoute="app-releases" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="firmware-main-wrapper">
        {/* Top Header */}
        <header className="firmware-topbar">
          <div className="topbar-search-box">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search APK version, build number, or notes..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="topbar-right-controls">
            <div className="system-status-pill">
              <span className="live-pulse-dot" />
              <span>Cloudflare R2 Connected</span>
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

        {/* Content Canvas */}
        <main className="firmware-canvas-content">
          {/* Page Heading & Actions */}
          <div className="page-heading-row">
            <div>
              <h1 className="page-main-heading">Mobile App Releases (APK)</h1>
              <p className="page-sub-heading">
                Deploy, host, and distribute Android APK application binaries via zero-egress Cloudflare R2 CDN.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="action-btn-secondary"
                onClick={() => onNavigate && onNavigate('firmware')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  system_update_alt
                </span>
                <span>ESP32 Firmware</span>
              </button>
              <button
                type="button"
                className="action-btn-primary"
                onClick={() => onNavigate && onNavigate('new-app-release')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  upload_file
                </span>
                <span>Publish New APK</span>
              </button>
            </div>
          </div>

          {/* Metrics Overview Cards */}
          <section className="metrics-grid-3col">
            {metrics.map((m, idx) => (
              <div key={idx} className="metric-card-item">
                <div className="metric-header-line">
                  <span className="metric-title-label">{m.title}</span>
                  <span className={`material-symbols-outlined metric-badge-icon ${m.iconBg}`}>
                    {m.icon}
                  </span>
                </div>
                <div className="metric-main-val">{m.value}</div>
                <div className="metric-trend-subtext">
                  {m.trendIcon && (
                    <span className={`material-symbols-outlined trend-icon ${m.trendColor}`}>
                      {m.trendIcon}
                    </span>
                  )}
                  <span className={m.trendColor}>{m.subtext}</span>
                </div>
              </div>
            ))}
          </section>

          {/* Filter Bar */}
          <div className="filter-controls-card">
            <div className="filter-inputs-group">
              <select
                className="filter-select-input"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
              >
                <option value="">All Release Channels</option>
                <option value="stable">Stable Production</option>
                <option value="beta">Beta Testing</option>
                <option value="alpha">Alpha Internal</option>
              </select>

              <select
                className="filter-select-input"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="">All Platforms</option>
                <option value="android">Android (.apk)</option>
                <option value="ios">iOS Package</option>
              </select>
            </div>

            <div className="filter-count-label">
              Showing {filteredReleases.length} of {totalCount} builds
            </div>
          </div>

          {/* Releases Table Card */}
          <div className="table-card-container">
            <table className="firmware-table">
              <thead>
                <tr>
                  <th>VERSION &amp; BUILD</th>
                  <th>PLATFORM</th>
                  <th>CHANNEL</th>
                  <th>SIZE</th>
                  <th>RELEASE DATE</th>
                  <th>POLICY</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '32px', animation: 'spin 1s linear infinite', color: '#4be277' }}
                      >
                        sync
                      </span>
                      <p style={{ marginTop: '8px', color: '#bccbb9' }}>Loading APK releases from Cloudflare R2...</p>
                    </td>
                  </tr>
                ) : filteredReleases.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#bccbb9' }}>
                      No APK releases found. Click <strong>"Publish New APK"</strong> to upload your first Android package!
                    </td>
                  </tr>
                ) : (
                  filteredReleases.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff', fontFamily: 'monospace' }}>
                          {row.version}
                        </div>
                        <div style={{ fontSize: '11px', color: '#88988e' }}>Build #{row.buildNumber}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#4be277',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            android
                          </span>
                          {row.platform}
                        </span>
                      </td>
                      <td>
                        <span className={`channel-pill-tag ${row.channelType}`}>{row.channel}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{row.fileSizeMb} MB</span>
                      </td>
                      <td>{row.releaseDate}</td>
                      <td>
                        {row.mandatory ? (
                          <span style={{ color: '#ff857a', fontWeight: '600', fontSize: '12px' }}>
                            Mandatory Update
                          </span>
                        ) : (
                          <span style={{ color: '#bccbb9', fontSize: '12px' }}>Optional</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill-badge ${row.statusType}`}>{row.status}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <a
                            href={row.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="table-action-icon-btn"
                            title="Download APK from Cloudflare R2"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4be277' }}>
                              download
                            </span>
                          </a>
                          <button
                            type="button"
                            className="table-action-icon-btn"
                            title="Delete Release"
                            onClick={() => handleDelete(row)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#ff857a' }}>
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
