import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { firmwareApi } from '../../api/services';
import './FirmwareManagement.css';

export default function FirmwareManagement({ onNavigate, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
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
      };

      const res = await firmwareApi.getReleases(params);
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((r) => ({
          id: r._id,
          version: `v${r.version.replace(/^v/, '')}`,
          hwRev: r.device_type || 'Universal HW',
          channel: (r.channel || 'stable').toUpperCase(),
          channelType: r.channel === 'stable' ? 'stable' : r.channel === 'beta' ? 'beta' : 'neutral',
          status: r.is_active ? 'Active' : 'Deprecated',
          statusType: r.is_active ? 'active' : 'deprecated',
          releaseDate: r.release_date ? new Date(r.release_date).toLocaleDateString() : 'Recent',
          devicesUsing: r.channel === 'stable' ? 'Fleet-wide' : 'Staged rollout',
          mandatory: !!r.min_supported_version,
          isFeatured: !!r.is_featured,
          hasEdit: true,
        }));

        setReleases(mapped);
        if (res.pagination) {
          setTotalCount(res.pagination.total || mapped.length);
          setTotalPages(res.pagination.pages || 1);
        }
      }
    } catch (err) {
      console.warn('Could not fetch releases from backend:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, channelFilter]);

  useEffect(() => {
    fetchReleases();
  }, [fetchReleases]);

  const handleSetFeatured = async (release) => {
    try {
      const res = await firmwareApi.featureRelease(release.id);
      if (res?.success) {
        alert(`Firmware release ${release.version} is now set as the active Featured firmware on the Website & Mobile OTA!`);
        fetchReleases();
      }
    } catch (err) {
      alert(`Failed to set featured firmware: ${err.message}`);
    }
  };

  const handleDelete = async (release) => {
    if (window.confirm(`Are you sure you want to deprecate / delete firmware release ${release.version}?`)) {
      try {
        const res = await firmwareApi.deleteRelease(release.id);
        if (res?.success) {
          alert(res.message || 'Firmware release updated');
          fetchReleases();
        }
      } catch (err) {
        alert(`Failed to deprecate release: ${err.message}`);
      }
    }
  };

  const metrics = [
    {
      title: 'STABLE CHANNEL',
      value: releases.find(r => r.channel === 'STABLE')?.version || (isLoading ? '...' : 'None Deployed'),
      subtext: 'Recommended for fleet',
      icon: 'verified',
      iconBg: 'text-primary',
      trendColor: 'text-primary',
      trendIcon: 'check_circle',
    },
    {
      title: 'BETA TESTING',
      value: releases.find(r => r.channel === 'BETA')?.version || (isLoading ? '...' : 'None Deployed'),
      subtext: 'Active telemetry testing',
      icon: 'science',
      iconBg: 'text-warning',
      trendColor: 'text-warning',
      trendIcon: 'warning',
    },
    {
      title: 'TOTAL RELEASES',
      value: String(totalCount || releases.length),
      subtext: 'OTA Catalog builds',
      icon: 'system_update',
      iconBg: 'text-secondary',
      trendColor: 'text-muted',
      trendIcon: '',
    },
  ];

  const filteredReleases = useMemo(() => {
    return releases.filter((r) => {
      const matchSearch =
        r.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.hwRev.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [releases, searchQuery]);

  return (
    <div className="firmware-page-container">
      {/* SideNavBar */}
      <Sidebar activeRoute="firmware" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content View */}
      <div className="firmware-main-wrapper">
        {/* TopNavBar */}
        <header className="firmware-topbar">
          <div className="topbar-actions">
            <div className="topbar-icon-actions">
              <button
                type="button"
                className="icon-action-btn"
                aria-label="Refresh list"
                onClick={fetchReleases}
                title="Refresh Releases"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <button
                type="button"
                className="icon-action-btn"
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

        {/* Content Canvas */}
        <main className="firmware-content-canvas">
          <div className="canvas-max-wrap">
            {/* Header / Title */}
            <div className="page-header-row">
              <div>
                <h2 className="page-heading">Firmware &amp; OTA Updates</h2>
                <p className="page-subheading">
                  Manage Over-The-Air firmware deployments, track staged channels, and roll out binaries.
                </p>
              </div>

              <button
                type="button"
                className="btn-create-release btn-glow"
                onClick={() => onNavigate && onNavigate('new-firmware')}
              >
                <span className="material-symbols-outlined icon-20">publish</span>
                <span>Publish Release</span>
              </button>
            </div>

            {/* Top Summary Metrics Bento */}
            <div className="firmware-bento-grid">
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
                      placeholder="Search version (e.g. v2.1.4)..."
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
                      <option value="">All Channels</option>
                      <option value="stable">Stable</option>
                      <option value="beta">Beta</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="table-scroll-container">
                <table className="firmware-table">
                  <thead>
                    <tr>
                      <th style={{ width: '140px' }}>VERSION</th>
                      <th>DEVICE TARGET</th>
                      <th>CHANNEL</th>
                      <th>STATUS</th>
                      <th>RELEASE DATE</th>
                      <th className="text-right">STAGE</th>
                      <th className="text-center" style={{ width: '100px' }}>MANDATORY</th>
                      <th className="text-right" style={{ width: '100px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                          <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                            sync
                          </span>
                          <p>Loading OTA releases catalogue...</p>
                        </td>
                      </tr>
                    ) : filteredReleases.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                          No firmware releases found. Click "Publish Release" to publish your first OTA binary.
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
                                    fontWeight: '800',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(75, 226, 119, 0.2)',
                                    color: '#4be277',
                                    border: '1px solid rgba(75, 226, 119, 0.4)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Active on Website
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-muted">{row.hwRev}</td>
                          <td>
                            <span className={`channel-pill pill-${row.channelType}`}>
                              {row.channel}
                            </span>
                          </td>
                          <td>
                            <div className="status-flex-item">
                              <span className={`dot-indicator dot-${row.statusType}`} />
                              <span>{row.status}</span>
                            </div>
                          </td>
                          <td className="text-muted">{row.releaseDate}</td>
                          <td className="text-right font-medium text-white">
                            {row.devicesUsing}
                          </td>
                          <td className="text-center">
                            {row.mandatory ? (
                              <span className="material-symbols-outlined check-green icon-18">
                                check
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-muted icon-18">
                                remove
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="row-action-btns">
                              {!row.isFeatured ? (
                                <button
                                  type="button"
                                  className="action-link-btn"
                                  title="Set as Active Featured Firmware on Website & Mobile OTA"
                                  onClick={() => handleSetFeatured(row)}
                                  style={{ color: '#bccbb9' }}
                                >
                                  <span className="material-symbols-outlined icon-18">
                                    star_border
                                  </span>
                                </button>
                              ) : (
                                <span
                                  title="Currently Featured on Website & OTA"
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '0 4px' }}
                                >
                                  <span className="material-symbols-outlined icon-18" style={{ color: '#f59e0b' }}>
                                    star
                                  </span>
                                </span>
                              )}
                              <button
                                type="button"
                                className="action-link-btn hover-red"
                                title="Deprecate Release"
                                onClick={() => handleDelete(row)}
                              >
                                <span className="material-symbols-outlined icon-18">delete</span>
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
                <span className="pagination-text">Showing 1 to {filteredReleases.length} of {totalCount || filteredReleases.length} releases</span>
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
