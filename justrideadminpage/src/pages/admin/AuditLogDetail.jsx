import TopBar from '../../components/common/TopBar';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { auditApi, authApi } from '../../api/services';
import './AuditLogDetail.css';

export default function AuditLogDetail({ onNavigate, onLogout }) {
  const { id } = useParams();
  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchLogDetail = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await auditApi.getLogById(id);
        if (res?.success && res.data) {
          setLog(res.data);
        } else {
          setError('Audit log record not found');
        }
      } catch (err) {
        setError(err.data?.message || err.message || 'Failed to fetch audit log record');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchLogDetail();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(typeof text === 'object' ? JSON.stringify(text, null, 2) : String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="audit-detail-page">
      {/* Universal Sidebar */}

      {/* Main Content Area */}
      <div className="audit-detail-main">
        {/* Top Header */}
        <TopBar title="Audit event" onBack={() => onNavigate?.('audit-logs')} backLabel="Back to audit logs" onNavigate={onNavigate} />

        {/* Content Container */}
        <main className="audit-detail-content">
          {isLoading ? (
            <div className="loading-state">
              <span className="material-symbols-outlined spin-icon">sync</span>
              <p>Decrypting & verifying security event ledger...</p>
            </div>
          ) : error || !log ? (
            <div className="error-state">
              <span className="material-symbols-outlined icon-48">error</span>
              <h3>Unable to Load Audit Event</h3>
              <p>{error || 'Record does not exist or has been archived.'}</p>
              <button
                type="button"
                className="btn-back-home"
                onClick={() => onNavigate && onNavigate('audit-logs')}
              >
                Return to Audit Table
              </button>
            </div>
          ) : (
            <div className="audit-detail-grid">
              {/* Left Column: Primary Inspection Card */}
              <div className="audit-main-card">
                {/* Event Header Banner */}
                <div className="event-banner">
                  <div className="event-banner-top">
                    <span className={`severity-badge sev-${log.severity.toLowerCase()}`}>
                      <span className="material-symbols-outlined icon-16">
                        {log.severity === 'Critical' ? 'warning' : log.severity === 'High' ? 'error' : log.severity === 'Medium' ? 'shield' : 'check_circle'}
                      </span>
                      <span>{log.severity} Severity Event</span>
                    </span>
                    <span className="event-id-tag">ID: {log.id}</span>
                  </div>

                  <h1 className="event-action-title">{log.actionTitle || log.eventType}</h1>
                  <p className="event-description-text">{log.description}</p>

                  <div className="event-metadata-ribbon">
                    <div className="meta-pill">
                      <span className="material-symbols-outlined icon-16">calendar_today</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="material-symbols-outlined icon-16">public</span>
                      <span>{log.location}</span>
                    </div>
                    <div className="meta-pill">
                      <span className="material-symbols-outlined icon-16">category</span>
                      <span>Category: {log.module}</span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="detail-tabs-bar">
                  <button
                    type="button"
                    className={`detail-tab ${activeTab === 'Overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Overview')}
                  >
                    Event Narrative & Context
                  </button>
                  <button
                    type="button"
                    className={`detail-tab ${activeTab === 'RawJSON' ? 'active' : ''}`}
                    onClick={() => setActiveTab('RawJSON')}
                  >
                    Raw Cryptographic JSON Record
                  </button>
                </div>

                {/* Tab Body */}
                <div className="detail-tab-body">
                  {activeTab === 'Overview' ? (
                    <div className="overview-section">
                      {/* Security Parameters Grid */}
                      <div className="params-bento-grid">
                        <div className="param-item">
                          <span className="param-label">Target Resource Type</span>
                          <span className="param-value text-accent font-mono">{log.resourceType || 'System'}</span>
                        </div>
                        <div className="param-item">
                          <span className="param-label">Target Entity Identifier</span>
                          <span className="param-value font-mono">{log.targetEntity}</span>
                        </div>
                        <div className="param-item">
                          <span className="param-label">Execution Status</span>
                          <span className={`status-tag status-${log.status?.toLowerCase() || 'success'}`}>
                            {log.status || 'SUCCESS'}
                          </span>
                        </div>
                        <div className="param-item">
                          <span className="param-label">Client Geo Location / Network</span>
                          <span className="param-value">{log.city}</span>
                        </div>
                      </div>

                      {/* Narrative Reason Block */}
                      <div className="narrative-block">
                        <div className="narrative-header">
                          <span className="material-symbols-outlined icon-18 text-accent">description</span>
                          <h4>Audit Reason & Operations Note</h4>
                        </div>
                        <p className="narrative-content">{log.reasonCode}</p>
                      </div>

                      {/* State Changes / Diff View */}
                      {log.diff && Object.keys(log.diff).length > 0 && (
                        <div className="diff-block">
                          <div className="diff-header">
                            <span className="material-symbols-outlined icon-18">compare_arrows</span>
                            <h4>Resource State Transition (Before / After Diff)</h4>
                          </div>
                          <pre className="code-diff-preview font-mono">
                            {JSON.stringify(log.diff, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* User Agent / Client Footprint */}
                      {log.userAgent && (
                        <div className="useragent-box">
                          <span className="param-label">Originating Client User-Agent Header</span>
                          <div className="useragent-text font-mono">{log.userAgent}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="raw-json-section">
                      <div className="json-header">
                        <span>Immutable Database Document Payload</span>
                        <button
                          type="button"
                          className="copy-json-btn"
                          onClick={() => copyToClipboard(log.rawRecord || log)}
                        >
                          <span className="material-symbols-outlined icon-16">
                            {copied ? 'check' : 'content_copy'}
                          </span>
                          <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
                        </button>
                      </div>
                      <pre className="raw-json-block font-mono">
                        {JSON.stringify(log.rawRecord || log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Actor & Security Signatures */}
              <div className="audit-side-panel">
                {/* Actor Identity Card */}
                <div className="side-card">
                  <h4 className="side-card-title">Operator / Actor Identity</h4>
                  <div className="actor-profile-box">
                    <div className="actor-avatar-circle">
                      {log.actor.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="actor-full-name">{log.actor}</h5>
                      <span className="actor-role-chip">{log.actorRole}</span>
                    </div>
                  </div>

                  <div className="actor-details-list">
                    <div className="actor-detail-row">
                      <span className="text-muted">Actor ID</span>
                      <span className="font-mono text-sm">{log.actorId}</span>
                    </div>
                    {log.actorEmail && (
                      <div className="actor-detail-row">
                        <span className="text-muted">Corporate Email</span>
                        <span className="text-sm">{log.actorEmail}</span>
                      </div>
                    )}
                    <div className="actor-detail-row">
                      <span className="text-muted">Auth Context</span>
                      <span className="text-sm">{log.sessionId ? 'Verified staff session' : 'Not recorded'}</span>
                    </div>
                    {log.employeeId && <div className="actor-detail-row"><span className="text-muted">Employee ID</span><span>{log.employeeId}</span></div>}
                  </div>

                  {log.actorId !== 'SYS-001' && (
                    <button
                      type="button"
                      className="btn-actor-profile"
                      onClick={() => onNavigate && onNavigate('user-activity', log.actorId)}
                    >
                      <span className="material-symbols-outlined icon-16">history</span>
                      <span>View Actor Activity Trail</span>
                    </button>
                  )}
                  {log.sessionId && <button type="button" className="btn-actor-profile"
                    title={log.sessionId} onClick={() => onNavigate && onNavigate('audit-session', log.sessionId)}>
                    <span className="material-symbols-outlined icon-16">history</span><span>View this session's events</span>
                  </button>}
                </div>

                {/* Compliance & Security Card */}
                <div className="side-card compliance-card">
                  <div className="compliance-icon-row">
                    <span className="material-symbols-outlined text-accent icon-24">verified_user</span>
                    <h4>Audit Record</h4>
                  </div>
                  <p className="compliance-text">
                    This event is recorded by the JustRide backend. Access is restricted to authorized staff.
                  </p>

                  <div className="compliance-badges">
                    <span className="comp-badge">STAFF IDENTITY</span>
                    <span className="comp-badge">TIMESTAMP</span>
                    <span className="comp-badge">OUTCOME</span>
                  </div>

                  <button
                    type="button"
                    className="btn-export-single-log"
                    onClick={() => {
                      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(log, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute('href', dataStr);
                      downloadAnchor.setAttribute('download', `audit_event_${log.id}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      authApi.recordActivity('AUDIT_DETAIL_EXPORT', `/audit-logs/${log.id}`).catch(() => console.warn('[Audit] Export activity could not be recorded.'));
                    }}
                  >
                    <span className="material-symbols-outlined icon-16">download</span>
                    <span>Download Forensic Artifact</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
