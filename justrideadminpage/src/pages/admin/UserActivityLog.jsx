import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { usersApi } from '../../api/services';
import './UserActivityLog.css';

export default function UserActivityLog({ userId: propUserId, onNavigate, onLogout, onBack }) {
  const params = useParams();
  const navigate = useNavigate();
  const userId = propUserId || params.id;
  const [filterType, setFilterType] = useState('All Events');
  const [timelineGroups, setTimelineGroups] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);

  const fetchActivity = useCallback(async () => {
    if (!userId) {
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
      const res = await usersApi.getUserActivity(userId, { signal });
      if (signal.aborted) return;
      if (res?.success) {
        if (res.user) setUserProfile(res.user);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTimelineGroups(res.data);
        } else {
          // Fallback recent events if user has no audit log records yet
          setTimelineGroups([
            {
              dateLabel: 'Recent Actions',
              items: [
                {
                  id: 'evt-1',
                  type: 'AUTH',
                  title: 'Account Registration & Verification',
                  time: 'Initial Session',
                  description: 'Account verified successfully via JustRide mobile portal.',
                  icon: 'verified',
                  badges: [{ text: 'VERIFIED' }],
                },
              ],
            },
          ]);
        }
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchActivity();
    return () => requestRef.current?.abort();
  }, [fetchActivity]);

  const filteredGroups = useMemo(() => {
    if (filterType === 'All Events') return timelineGroups;
    return timelineGroups
      .map((grp) => ({
        ...grp,
        items: grp.items.filter(
          (item) => item.type.toLowerCase() === filterType.toLowerCase()
        ),
      }))
      .filter((grp) => grp.items.length > 0);
  }, [timelineGroups, filterType]);

  return (
    <div className="user-activity-page">
      {/* SideNavBar */}
      <Sidebar activeRoute="users" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="activity-main-wrapper">
        {/* TopAppBar */}
        <header className="activity-topbar">
          <div className="topbar-title-flex">
            <span className="topbar-heading">JustRide Operations</span>
          </div>

          <div className="topbar-right-group">
            <button
              type="button"
              className="topbar-icon-btn"
              aria-label="Refresh Activity"
              onClick={fetchActivity}
              title="Refresh Activity Trail"
            >
              <span className="material-symbols-outlined">refresh</span>
            </button>
            <button
              type="button"
              className="topbar-icon-btn"
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

        {/* Main Canvas */}
        <main className="activity-canvas-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchActivity} />
          <div className="canvas-constrained-wrap">
            {/* Header / Back Section */}
            <div className="activity-header-section">
              <div>
                <button
                  type="button"
                  className="back-breadcrumb-btn"
                  onClick={onBack || (() => onNavigate && onNavigate('user-detail', userId))}
                >
                  <span className="material-symbols-outlined icon-16">arrow_back</span>
                  <span>BACK TO USER DETAILS</span>
                </button>

                <h2 className="user-title-heading">{userProfile?.name || 'User Activity Timeline'}</h2>

                <div className="user-meta-tags">
                  <span className="id-sub-tag">ID: {userProfile?.id || userId || 'USR-4092'}</span>
                  <div className="status-pill-green">
                    <span className="dot-green" />
                    <span>{(userProfile?.status || 'active').toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-export-log"
                onClick={() => {
                  const csv = `Time,Type,Event,Description\n` +
                    timelineGroups.flatMap(g => g.items.map(i => `"${i.time}","${i.type}","${i.title}","${i.description}"`)).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `user_activity_${userId || 'log'}.csv`;
                  a.click();
                }}
              >
                <span className="material-symbols-outlined icon-18">download</span>
                <span>Export Activity</span>
              </button>
            </div>

            {/* Timeline Card */}
            <div className="timeline-container-card">
              <div className="timeline-card-header">
                <h3 className="timeline-title">Audit Activity Feed</h3>

                <div className="timeline-filter-group">
                  <span className="filter-label">FILTER:</span>
                  <select
                    className="timeline-select"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option>All Events</option>
                    <option value="AUTH">Authentication</option>
                    <option value="DEVICE">Device & Hardware</option>
                    <option value="FIRMWARE">Firmware</option>
                    <option value="ADMIN">Administrative</option>
                  </select>
                </div>
              </div>

              {/* Timeline Items Feed */}
              <div className="timeline-feed-wrap">
                {isLoading && timelineGroups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>
                      sync
                    </span>
                    <p>Loading activity trail...</p>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3A8' }}>
                    No activity records found for this category.
                  </div>
                ) : (
                  filteredGroups.map((group, gIdx) => (
                    <div key={gIdx} className="timeline-day-group">
                      {/* Date Group Heading */}
                      <div className="timeline-date-marker">
                        <span className="date-badge-text">{group.dateLabel}</span>
                      </div>

                      {/* Events List */}
                      <div className="timeline-items-list">
                        {group.items.map((item, iIdx) => (
                          <div key={item.id || iIdx} className="timeline-event-item">
                            <div className="timeline-vertical-line" />

                            {/* Icon Circle */}
                            <div className="timeline-icon-node">
                              <span className="material-symbols-outlined event-glyph">
                                {item.icon || 'history'}
                              </span>
                            </div>

                            {/* Event Card */}
                            <div className="event-detail-card">
                              <div className="event-top-line">
                                <span className="event-heading">{item.title}</span>
                                <span className="event-time-stamp">{item.time}</span>
                              </div>

                              <p className="event-desc-text">{item.description}</p>

                              {item.badges && item.badges.length > 0 && (
                                <div className="event-badges-row">
                                  {item.badges.map((b, bIdx) => (
                                    <span key={bIdx} className="event-inline-badge">
                                      {b.icon && (
                                        <span className="material-symbols-outlined icon-14">
                                          {b.icon}
                                        </span>
                                      )}
                                      <span>{b.text}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
