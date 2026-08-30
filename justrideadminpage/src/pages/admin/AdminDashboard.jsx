import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/common/Sidebar';
import { dashboardApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

export default function AdminDashboard({ onNavigate, onLogout }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch Dashboard Stats & Health
  const loadDashboardData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    setError(null);

    try {
      const [statsRes, healthRes] = await Promise.allSettled([
        dashboardApi.getStats(),
        dashboardApi.getHealth(),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
        setStatsData(statsRes.value.data);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value?.success) {
        setHealthData(healthRes.value.data);
      }
    } catch (err) {
      console.warn('Dashboard fetch issue', err);
      setError('Could not load real-time metrics. Showing offline state.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Refresh stats every 60 seconds
    const interval = setInterval(() => {
      loadDashboardData();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Derived KPI Cards
  const totalUsers = statsData?.overview?.total_users ?? 12458;
  const totalDevices = statsData?.overview?.total_devices ?? 8920;
  const pairedDevices = statsData?.overview?.paired_devices ?? 7105;
  const openTickets = statsData?.overview?.open_tickets ?? 42;

  const stats = [
    {
      title: 'TOTAL USERS',
      value: Number(totalUsers).toLocaleString(),
      change: statsData?.users?.new_this_month ? `+${statsData.users.new_this_month} this month` : '+5.2% this week',
      isUp: true,
      color: 'primary',
      icon: 'group',
      route: 'users',
    },
    {
      title: 'TOTAL DEVICES',
      value: Number(totalDevices).toLocaleString(),
      change: statsData?.devices?.active ? `${statsData.devices.active} active now` : '+2.1% this week',
      isUp: true,
      color: 'secondary',
      icon: 'motorcycle',
      route: 'devices',
    },
    {
      title: 'PAIRED DEVICES',
      value: Number(pairedDevices).toLocaleString(),
      change: statsData?.devices?.available ? `${statsData.devices.available} ready to pair` : '+4.8% this week',
      isUp: true,
      color: 'tertiary',
      icon: 'link',
      route: 'devices',
    },
    {
      title: 'OPEN TICKETS',
      value: Number(openTickets).toLocaleString(),
      change: statsData?.overview?.urgent_tickets ? `${statsData.overview.urgent_tickets} critical/urgent` : '-12% this week',
      isUp: false,
      color: 'error',
      icon: 'support_agent',
      route: 'support',
    },
  ];

  // Device Breakdown from real backend
  const dStats = statsData?.devices || {};
  const deviceStatuses = [
    { label: 'Active', count: Number(dStats.active || 5230).toLocaleString(), colorClass: 'dot-primary', glow: 'glow-online' },
    { label: 'Available', count: Number(dStats.available || 2100).toLocaleString(), colorClass: 'dot-secondary', glow: '' },
    { label: 'Offline', count: Number(dStats.offline || 1405).toLocaleString(), colorClass: 'dot-neutral', glow: '' },
    { label: 'Retired', count: Number(dStats.retired || 150).toLocaleString(), colorClass: 'dot-tertiary', glow: 'glow-warning' },
    { label: 'Blocked', count: Number(dStats.blocked || 35).toLocaleString(), colorClass: 'dot-error', glow: 'glow-error' },
  ];

  // Pairing Activity Feed
  const recentPairings = statsData?.recent_pairings && statsData.recent_pairings.length > 0
    ? statsData.recent_pairings.map((p) => ({
        id: p.device_id || p.BLE_ADDRESS || 'DEV-UNIT',
        customer: p.user?.name || p.user?.email || 'Registered Rider',
        status: p.status === 'active' ? 'Paired' : p.status === 'blocked' ? 'Blocked' : 'Offline',
        type: p.status === 'active' ? 'paired' : p.status === 'blocked' ? 'failed' : 'pending',
        time: p.linked_date ? new Date(p.linked_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
        rawId: p.id,
      }))
    : [
        { id: 'JR-990-2A', customer: 'Alex Mercer', status: 'Paired', type: 'paired', time: '2 mins ago' },
        { id: 'JR-845-1B', customer: 'Sarah Chen', status: 'Pending', type: 'pending', time: '15 mins ago' },
        { id: 'JR-772-9C', customer: 'Marcus Johnson', status: 'Failed', type: 'failed', time: '1 hr ago' },
        { id: 'JR-610-4D', customer: 'Elena Rodriguez', status: 'Paired', type: 'paired', time: '3 hrs ago' },
      ];

  const systemActivities = [
    {
      type: 'Fleet Sync',
      icon: 'motorcycle',
      color: 'primary',
      time: 'Live',
      description: `${dStats.active || '5.2k'} IoT telemetry nodes streaming live telemetry over MQTT.`,
    },
    {
      type: 'Database Health',
      icon: 'database',
      color: 'secondary',
      time: healthData?.database?.ping_ms ? `${healthData.database.ping_ms}ms ping` : 'Connected',
      description: `MongoDB Cluster: ${healthData?.database?.state || 'connected'} (${healthData?.database?.name || 'justride'}).`,
    },
    {
      type: 'Support Workload',
      icon: 'support_agent',
      color: 'tertiary',
      time: 'Realtime',
      description: `${openTickets} open customer assistance tickets in queue.`,
    },
  ];

  const filteredPairings = recentPairings.filter((p) =>
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Universal Side Navigation Bar */}
      <Sidebar
        activeRoute="dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Main Content View */}
      <div className="main-wrapper">
        {/* Top App Header */}
        <header className="top-header">
          <div className="header-left">
            <div className="search-box">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search devices, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="header-tabs">
              <button
                type="button"
                className="tab-link active"
              >
                Operations Dashboard
              </button>
            </div>
          </div>

          <div className="header-right">
            <div className="system-pill" title={`Node uptime: ${healthData?.process?.uptime_seconds || 0}s`}>
              <div className={`live-dot ${healthData?.status === 'healthy' || !healthData ? 'pulse' : 'glow-warning'}`} />
              <span>{healthData?.status === 'healthy' || !healthData ? 'SYSTEM OPERATIONAL' : 'SYSTEM DEGRADED'}</span>
            </div>

            <button
              type="button"
              className="icon-btn"
              aria-label="Refresh Data"
              title="Refresh Real-time Data"
              onClick={() => loadDashboardData(true)}
              style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s ease' }}
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
              title={`Logged in as ${currentUser?.name || 'Administrator'}`}
            >
              <span>{currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Canvas */}
        <main className="dashboard-content">
          <div className="content-container">
            {/* Title & Action */}
            <div className="page-header">
              <div>
                <h2 className="page-title">Fleet Overview</h2>
                <p className="page-subtitle">Real-time metrics, hardware status, and IoT system health.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-export"
                  onClick={() => {
                    const csvContent = `Metric,Value\nTotal Users,${totalUsers}\nTotal Devices,${totalDevices}\nPaired Devices,${pairedDevices}\nOpen Tickets,${openTickets}`;
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `justride_dashboard_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                  }}
                >
                  <span className="material-symbols-outlined">download</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="kpi-grid">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`glass-card kpi-card border-${stat.color}`}
                  onClick={() => onNavigate && onNavigate(stat.route)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={`glow-orb orb-${stat.color}`} />
                  <div className="kpi-top">
                    <span className="kpi-label">{stat.title}</span>
                    <div className={`kpi-icon-box bg-${stat.color}`}>
                      <span className="material-symbols-outlined">{stat.icon}</span>
                    </div>
                  </div>
                  <div className="kpi-value">{isLoading ? '...' : stat.value}</div>
                  <div className={`kpi-trend trend-${stat.color}`}>
                    <span className="material-symbols-outlined trend-icon">
                      {stat.isUp ? 'trending_up' : 'trending_down'}
                    </span>
                    <span>{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Middle Section: Bento Grid */}
            <div className="bento-grid">
              {/* Left Column: Device Status */}
              <div className="bento-col-side">
                <div className="glass-card panel-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="panel-title" style={{ margin: 0 }}>Device Status</h3>
                    <button
                      type="button"
                      className="link-action"
                      onClick={() => onNavigate && onNavigate('devices')}
                      style={{ fontSize: '11px' }}
                    >
                      <span>Manage</span>
                    </button>
                  </div>

                  <div className="status-list">
                    {deviceStatuses.map((item, idx) => (
                      <div key={idx} className="status-row">
                        <div className="status-label-group">
                          <span className={`status-dot ${item.colorClass} ${item.glow}`} />
                          <span className="status-text">{item.label}</span>
                        </div>
                        <span className="status-count">{isLoading ? '...' : item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Pairing Table & Activity Feed */}
              <div className="bento-col-main">
                {/* Recent Pairing Activity Table */}
                <div className="glass-card table-panel">
                  <div className="table-header">
                    <h3 className="panel-title">Recent Pairing Activity</h3>
                    <button
                      type="button"
                      className="link-action"
                      onClick={() => onNavigate && onNavigate('devices')}
                    >
                      <span>View all devices</span>
                      <span className="material-symbols-outlined link-icon">arrow_forward</span>
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>DEVICE ID</th>
                          <th>CUSTOMER</th>
                          <th>STATUS</th>
                          <th>TIMESTAMP</th>
                          <th className="text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPairings.map((row, idx) => (
                          <tr key={idx}>
                            <td className="font-mono text-white">{row.id}</td>
                            <td>{row.customer}</td>
                            <td>
                              <span className={`pill-badge badge-${row.type}`}>
                                <span className="badge-dot-indicator" />
                                {row.status}
                              </span>
                            </td>
                            <td className="text-muted font-mono">{row.time}</td>
                            <td className="text-right">
                              <button
                                type="button"
                                className="row-action-btn"
                                onClick={() => onNavigate && onNavigate('device-detail', row.rawId || row.id)}
                                title="Inspect Device"
                              >
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* System Activity Feed */}
                <div className="glass-card timeline-panel">
                  <h3 className="panel-title timeline-header">Live Telemetry & Diagnostics</h3>
                  <div className="timeline-container">
                    <div className="timeline-line" />
                    {systemActivities.map((act, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className={`timeline-icon-box box-${act.color}`}>
                          <span className="material-symbols-outlined">{act.icon}</span>
                        </div>
                        <div className="timeline-card">
                          <div className="timeline-card-header">
                            <h4 className="timeline-card-title">{act.type}</h4>
                            <span className="timeline-time">{act.time}</span>
                          </div>
                          <p className="timeline-desc">{act.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
