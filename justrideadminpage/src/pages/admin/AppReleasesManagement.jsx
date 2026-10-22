import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { appReleasesApi } from '../../api/services';
import './FirmwareManagement.css';

export default function AppReleasesManagement({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [releases, setReleases] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);

  const fetchReleases = useCallback(async () => {
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
        channel: channelFilter || undefined,
        platform: platformFilter || undefined,
      };

      const res = await appReleasesApi.getReleases(params, { signal });
      if (signal.aborted) return;
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
          isFeatured: !!r.is_featured,
          downloadUrl: r.file_url,
          notes: r.release_notes || '—',
        }));

        setReleases(mapped);
        setTotalCount(res.total || mapped.length);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [currentPage, limit, channelFilter, platformFilter]);

  useEffect(() => {
    fetchReleases();
    return () => requestRef.current?.abort();
  }, [fetchReleases]);

  const handleSetFeatured = async (release) => {
    try {
      const res = await appReleasesApi.featureRelease(release.id);
      if (res?.success) {
        alert(`v${release.version} (Build #${release.buildNumber}) is now set as the active release for the Website & App!`);
        fetchReleases();
      }
    } catch (err) {
      alert(`Failed to set featured release: ${err.message}`);
    }
  };

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
        <main className="firmware-content-canvas">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchReleases} />
          <div className="canvas-max-wrap">
            {/* Page Heading & Actions */}
            <div className="page-header-row">
              <div>
                <h2 className="page-heading">Mobile App Releases (APK)</h2>
                <p className="page-subheading">
                  Deploy, host, and distribute Android APK application binaries via zero-egress Cloudflare R2 CDN.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  className="btn-create-release"
                  style={{ backgroundColor: 'var(--bg-layer-3)', color: 'var(--text-muted)', border: '1px solid var(--border-standard)' }}
                  onClick={() => onNavigate && onNavigate('firmware')}
                >
                  <span className="material-symbols-outlined icon-20">
                    system_update_alt
                  </span>
                  <span>ESP32 Firmware</span>
                </button>
                <button
                  type="button"
                  className="btn-create-release btn-glow"
                  onClick={() => onNavigate && onNavigate('new-app-release')}
                >
                  <span className="material-symbols-outlined icon-20">
                    upload_file
                  </span>
                  <span>Publish New APK</span>
                </button>
              </div>
            </div>

            {/* Top Summary Metrics Bento */}
            <div className="firmware-bento-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {metrics.map((m, idx) => (
                <div key={idx} className="bento-metric-card">
                  <div className="watermark-icon">
                    <span className={`material-symbols-outlined big-glyph ${m.iconBg}`}>
                      {m.icon}
                    </span>
                  </div>
                  <p className="metric-caption">{m.title}</p>
                  <h3 className="metric-value">{m.value}</h3>
                  <p className={`metric-sub ${m.trendColor}`}>
                    {m.trendIcon && (
                      <span className="material-symbols-outlined icon-14">{m.trendIcon}</span>
                    )}
                    <span>{m.subtext}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Table Container */}
            <div className="firmware-table-card">
              {/* Filters Bar */}
              <div className="table-filters-header">
                <div className="left-filters-group">
                  <div className="search-box-wrap">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                      type="text"
                      placeholder="Search version, notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-versions-input"
                    />
                  </div>

                  <div className="select-wrap">
                    <select
                      className="custom-select"
                      value={channelFilter}
                      onChange={(e) => setChannelFilter(e.target.value)}
                    >
                      <option value="">All Release Channels</option>
                      <option value="stable">Stable Production</option>
                      <option value="beta">Beta Testing</option>
                      <option value="alpha">Alpha Internal</option>
                    </select>
                  </div>

                  <div className="select-wrap">
                    <select
                      className="custom-select"
                      value={platformFilter}
                      onChange={(e) => setPlatformFilter(e.target.value)}
                    >
                      <option value="">All Platforms</option>
                      <option value="android">Android (.apk)</option>
                      <option value="ios">iOS Package</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  Showing {filteredReleases.length} of {totalCount} builds
                </div>
              </div>

              {/* Data Table */}
              <div className="table-scroll-container">
                <table className="firmware-table">
                  <thead>
                    <tr>
                      <th style={{ width: '160px' }}>VERSION &amp; BUILD</th>
                      <th>PLATFORM</th>
                      <th>CHANNEL</th>
                      <th>SIZE</th>
                      <th>RELEASE DATE</th>
                      <th>POLICY</th>
                      <th>STATUS</th>
                      <th className="text-right" style={{ width: '120px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && releases.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '32px', animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }}
                          >
                            sync
                          </span>
                          <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Loading APK releases from Cloudflare R2...</p>
                        </td>
                      </tr>
                    ) : filteredReleases.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No APK releases found. Click <strong>"Publish New APK"</strong> to upload your first Android package!
                        </td>
                      </tr>
                    ) : (
                      filteredReleases.map((row) => (
                        <tr key={row.id} className="firmware-tr">
                          <td>
                            <div className="font-mono font-medium text-white" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{row.version}</span>
                              {row.isFeatured && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 500,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(var(--rgb-primary), 0.2)',
                                    color: 'var(--color-primary)',
                                    border: '1px solid rgba(var(--rgb-primary), 0.4)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Active on Website
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Build #{row.buildNumber}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                color: 'var(--color-primary)',
                              }}
                            >
                              <span className="material-symbols-outlined icon-18">
                                android
                              </span>
                              {row.platform}
                            </span>
                          </td>
                          <td>
                            <span className={`channel-pill pill-${row.channelType}`}>{row.channel}</span>
                          </td>
                          <td className="font-mono text-muted">
                            {row.fileSizeMb} MB
                          </td>
                          <td className="text-muted">{row.releaseDate}</td>
                          <td>
                            {row.mandatory ? (
                              <span style={{ color: 'var(--color-danger-light)', fontWeight: 500, fontSize: '12px' }}>
                                Mandatory
                              </span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '12px' }}>Optional</span>
                            )}
                          </td>
                          <td>
                            <div className="status-flex-item">
                              <span className={`dot-indicator dot-${row.statusType}`} />
                              <span>{row.status}</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <div className="row-action-btns">
                              {!row.isFeatured ? (
                                <button
                                  type="button"
                                  className="action-link-btn"
                                  title="Set as Active release on Website & Mobile App"
                                  onClick={() => handleSetFeatured(row)}
                                  style={{ color: 'var(--text-muted)' }}
                                >
                                  <span className="material-symbols-outlined icon-18">
                                    star_border
                                  </span>
                                </button>
                              ) : (
                                <span
                                  title="Currently Featured on Website & App"
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '0 4px' }}
                                >
                                  <span className="material-symbols-outlined icon-18" style={{ color: 'var(--color-warning)' }}>
                                    star
                                  </span>
                                </span>
                              )}
                              <a
                                href={row.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="action-link-btn"
                                title="Download APK from Cloudflare R2"
                                style={{ textDecoration: 'none' }}
                              >
                                <span className="material-symbols-outlined icon-18" style={{ color: 'var(--color-primary)' }}>
                                  download
                                </span>
                              </a>
                              <button
                                type="button"
                                className="action-link-btn hover-red"
                                title="Delete Release"
                                onClick={() => handleDelete(row)}
                              >
                                <span className="material-symbols-outlined icon-18" style={{ color: 'var(--color-danger-light)' }}>
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

              {/* Table Footer / Pagination */}
              <div className="table-pagination-footer">
                <span className="pagination-text">Showing {filteredReleases.length ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} releases</span>
                <div className="pagination-group">
                  <button
                    type="button"
                    className="p-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <span className="material-symbols-outlined icon-18">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    className="p-btn num-btn active"
                  >
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

