import TopBar from '../../components/common/TopBar';
import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../../components/common/Sidebar';
import { supportApi } from '../../api/services';
import './TicketDetail.css';

export default function TicketDetail({ ticketId: propTicketId, onBack, onNavigate, onLogout }) {
  const params = useParams();
  const ticketId = propTicketId || params.id;
  const [replyText, setReplyText] = useState('');
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const requestRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) {
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
      const res = await supportApi.getTicketById(ticketId, { signal });
      if (signal.aborted) return;
      if (res?.success && res?.data) {
        setTicket(res.data);
      }
    } catch (err) {
      if (signal.aborted) return;
      setLoadError(err.message || 'Could not load this page. Please try again.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
    return () => requestRef.current?.abort();
  }, [fetchTicket]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticket?._id) return;
    setIsSending(true);
    try {
      const res = await supportApi.updateTicket(ticket._id, {
        message: replyText.trim(),
        status: 'in_progress',
      });
      if (res?.success) {
        setReplyText('');
        fetchTicket();
      }
    } catch (err) {
      alert(`Failed to post message: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleBlockDevice = async () => {
    if (!ticket?._id) return;
    const reason = window.prompt('Provide reason to block customer device:', 'Support diagnostic security lock');
    if (reason) {
      setIsActing(true);
      try {
        const res = await supportApi.blockDeviceFromTicket(ticket._id, reason);
        if (res?.success) {
          alert(`Device blocked. System note added to ticket.`);
          fetchTicket();
        }
      } catch (err) {
        alert(`Failed to block device: ${err.message}`);
      } finally {
        setIsActing(false);
      }
    }
  };

  const handleForceUnlink = async () => {
    if (!ticket?._id) return;
    if (window.confirm('Force unlink customer device? This will reset pairing credentials.')) {
      setIsActing(true);
      try {
        const res = await supportApi.forceUnlinkDeviceFromTicket(ticket._id);
        if (res?.success) {
          alert('Device force unlinked and ticket marked resolved.');
          fetchTicket();
        }
      } catch (err) {
        alert(`Failed to unlink device: ${err.message}`);
      } finally {
        setIsActing(false);
      }
    }
  };

  const handleResolveTicket = async () => {
    if (!ticket?._id) return;
    setIsActing(true);
    try {
      const res = await supportApi.updateTicket(ticket._id, { status: 'resolved' });
      if (res?.success) {
        alert('Ticket marked as resolved.');
        fetchTicket();
      }
    } catch (err) {
      alert(`Failed to resolve ticket: ${err.message}`);
    } finally {
      setIsActing(false);
    }
  };

  const messagesList = ticket?.messages && ticket.messages.length > 0
    ? ticket.messages.map((m, idx) => ({
        id: m._id || idx,
        sender: m.sender_role === 'ADMIN' ? 'Staff Specialist' : ticket.user_id?.name || 'Customer',
        isCustomer: m.sender_role !== 'ADMIN',
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        content: m.body,
        attachments: (m.attachments || []).filter(url => { try { const parsed = new URL(url); return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com'; } catch { return false; } }),
        verified: m.sender_role === 'ADMIN',
      }))
    : [
        {
          id: 1,
          sender: ticket?.user_id?.name || 'Customer',
          isCustomer: true,
          time: 'Initial Ticket',
          content: ticket?.description || ticket?.subject || 'Need customer support assistance with hardware unit.',
        },
      ];

  const customer = ticket?.user_id || { name: 'Customer', email: 'Not supplied' };
  const device = ticket?.device_id || { devicename: 'No linked device supplied', BLE_ADDRESS: 'Not supplied', firmware_version: 'Not supplied' };

  return (
    <div className="ticket-page-container">
      {/* Side Nav Bar */}
      <Sidebar activeRoute="support" onNavigate={onNavigate} onLogout={onLogout} />

      {/* Main Content Area */}
      <div className="ticket-main-viewport">
        {/* Top App Bar */}
        <TopBar title="Support ticket" onRefresh={fetchTicket} refreshing={isLoading} onBack={onBack || (() => onNavigate?.('support'))} backLabel="Back to support" onNavigate={onNavigate} />

        {/* Content Canvas */}
        <main className="ticket-canvas-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchTicket} />
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
              <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', fontSize: '32px' }}>
                sync
              </span>
              <p>Loading ticket thread &amp; diagnostics...</p>
            </div>
          ) : (
            <>
              {/* Header Title Section */}
              <div className="ticket-title-section">
                <div className="jr-detail-meta">
                  <span>Ticket {ticket?.ticket_number || ticketId}</span>
                  <span className="status-badge">{(ticket?.priority || 'Medium').toUpperCase()}</span>
                  <span className="status-badge">{(ticket?.status || 'Open').replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                <h2 className="issue-title">{ticket?.subject || 'Customer Support Request'}</h2>
                <p className="issue-meta">
                  Opened by {customer.name} • {ticket?.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Today'}
                  {ticket?.category && <> · {ticket.category.replaceAll('_', ' ')}</>}
                  {ticket?.help_article_id && <> · Help article: {ticket.help_article_id}</>}
                </p>
              </div>

              {/* 2-Column Grid */}
              <div className="ticket-grid-layout">
                {/* Left Column: Thread & Reply Box (65%) */}
                <div className="thread-column">
                  {ticket?.diagnostics && <section className="ticket-diagnostic-report"><h3>Customer-shared diagnostic report</h3><p>Shared with consent on {new Date(ticket.diagnostics.consented_at).toLocaleString()}. Values are supplied by the customer app.</p><dl>{Object.entries(ticket.diagnostics).filter(([key]) => key !== 'consented_at').map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{String(value)}</dd></div>)}</dl></section>}
                  {/* Message Thread Box */}
                  <div className="thread-container">
                    {messagesList.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`message-row ${msg.isCustomer ? 'customer-msg' : 'staff-msg'} ${
                          index > 0 ? 'border-t-dark' : ''
                        }`}
                      >
                        <div className="message-flex">
                          {msg.isCustomer ? (
                            <div className="customer-avatar-badge">
                              <span>{customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}</span>
                            </div>
                          ) : (
                            <div className="staff-avatar-badge">
                              <span className="material-symbols-outlined icon-18">support_agent</span>
                            </div>
                          )}

                          <div className="message-body">
                            <div className="message-meta-row">
                              <span className="sender-name">
                                {msg.sender}
                                {msg.verified && (
                                  <span
                                    className="material-symbols-outlined verified-icon"
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    verified
                                  </span>
                                )}
                              </span>
                              <span className="message-time">{msg.time}</span>
                            </div>
                            <p className="message-text">{msg.content}</p>
                            {msg.attachments?.map((url, attachmentIndex) => <a className="ticket-screenshot" key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Customer screenshot ${attachmentIndex + 1}`} loading="lazy" /><span>Open screenshot {attachmentIndex + 1}</span></a>)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Box */}
                  <div className="reply-container">
                    <textarea
                      className="reply-textarea"
                      placeholder="Type response to customer..."
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <div className="reply-footer">
                      <button
                        type="button"
                        disabled={isSending || !replyText.trim()}
                        className="send-reply-btn btn-glow"
                        style={{ opacity: isSending ? 0.7 : 1 }}
                        onClick={handleSendReply}
                      >
                        <span>{isSending ? 'Sending...' : 'Send Staff Reply'}</span>
                        <span className="material-symbols-outlined send-icon">send</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Info Cards (35%) */}
                <div className="info-column">
                  {/* Customer Info Card */}
                  <div className="info-card">
                    <div className="customer-card-header">
                      <div className="customer-card-avatar">
                        {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <h3 className="card-person-name">{customer.name}</h3>
                        <p className="card-person-email">{customer.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Device Card */}
                  <div className="info-card">
                    <div className="device-card-header">
                      <h3 className="card-device-title">
                        <span className="material-symbols-outlined text-muted">motorcycle</span>
                        <span>{device.devicename || device.device_id || 'Hardware Unit'}</span>
                      </h3>
                      <span className="device-offline-pill">
                        <span className="badge-dot-green" />
                        <span>{ticket?.device_id ? 'Device on ticket' : 'No device supplied'}</span>
                      </span>
                    </div>

                    <div className="device-specs-list">
                      <div className="spec-item">
                        <span className="spec-label">BLE Address</span>
                        <span className="spec-value font-mono">{device.BLE_ADDRESS || 'Not supplied'}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">Firmware</span>
                        <span className="spec-value font-mono">{device.firmware_version || 'Not supplied'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Card */}
                  <div className="info-card actions-card">
                    <h3 className="actions-header-title">Customer Care Actions</h3>
                    <button
                      type="button"
                      disabled={isActing || !ticket?.device_id}
                      className="action-btn-danger"
                      onClick={handleBlockDevice}
                    >
                      <span className="material-symbols-outlined text-18">block</span>
                      <span>Block Device</span>
                    </button>
                    <button
                      type="button"
                      disabled={isActing || !ticket?.device_id}
                      className="action-btn-warning"
                      onClick={handleForceUnlink}
                    >
                      <span className="material-symbols-outlined text-18">link_off</span>
                      <span>Force Unlink Device</span>
                    </button>

                    <div className="actions-divider" />

                    <button
                      type="button"
                      disabled={isActing || ticket?.status === 'resolved'}
                      className="action-btn-success"
                      onClick={handleResolveTicket}
                    >
                      <span className="material-symbols-outlined text-18">check_circle</span>
                      <span>{ticket?.status === 'resolved' ? 'Ticket Resolved' : 'Mark as Resolved'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
