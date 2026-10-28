import TopBar from '../../components/common/TopBar';
import RequestError from '../../components/common/RequestError';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
  const conversationRef = useRef(null);
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

  useEffect(() => {
    const conversation = conversationRef.current;
    if (conversation) conversation.scrollTop = conversation.scrollHeight;
  }, [ticket?._id, ticket?.messages?.length]);

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
        sender: m.sender_id?.name || (m.sender_role === 'ADMIN' ? 'Support team' : ticket.user_id?.name || 'Customer'),
        isCustomer: m.sender_role !== 'ADMIN',
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        content: m.body,
        attachments: (m.attachments || []).filter(url => { try { const parsed = new URL(url); return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com'; } catch { return false; } }),
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

      {/* Main Content Area */}
      <div className="ticket-main-viewport">
        {/* Top App Bar */}
        <TopBar title="Support ticket" onRefresh={fetchTicket} refreshing={isLoading} onBack={onBack || (() => onNavigate?.('support'))} backLabel="Back to support" onNavigate={onNavigate} />

        {/* Content Canvas */}
        <main className="ticket-canvas-content">
          <RequestError message={loadError} loading={isLoading} onRetry={fetchTicket} />
          {isLoading && !ticket ? (
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
                  <span className="status-badge ticket-priority">{(ticket?.priority || 'Medium').toUpperCase()}</span>
                  <span className="status-badge ticket-status">{(ticket?.status || 'Open').replace(/_/g, ' ').toUpperCase()}</span>
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

                  <section className="ticket-chat" aria-labelledby="ticket-chat-title">
                    <div className="ticket-chat-header">
                      <h3 id="ticket-chat-title">Conversation</h3>
                      <span>{ticket?.ticket_number}</span>
                    </div>
                    <div className="ticket-chat-messages" ref={conversationRef} role="log" aria-label="Conversation messages" aria-live="polite" aria-relevant="additions">
                      {messagesList.map((msg) => (
                        <div key={msg.id} className={`ticket-chat-message ${msg.isCustomer ? 'from-customer' : 'from-support'}`}>
                          <div className="ticket-chat-bubble">
                            <span className="ticket-chat-sender">{msg.sender}<span>{msg.isCustomer ? 'Customer' : 'Support'}</span></span>
                            <p>{msg.content}</p>
                            {msg.attachments?.map((url, attachmentIndex) => <a className="ticket-screenshot" key={url} href={url} target="_blank" rel="noopener noreferrer"><img src={url} alt={`Customer screenshot ${attachmentIndex + 1}`} loading="lazy" /><span>Open screenshot {attachmentIndex + 1}</span></a>)}
                            <span className="ticket-chat-time">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form className="ticket-chat-composer" onSubmit={(event) => { event.preventDefault(); handleSendReply(); }}>
                      <label htmlFor="ticket-reply">Message to customer</label>
                      <div className="ticket-chat-input-row">
                        <textarea id="ticket-reply" placeholder="Write a reply..." rows={2} value={replyText} onChange={(event) => setReplyText(event.target.value)} disabled={isSending} />
                        <button type="submit" disabled={isSending || !replyText.trim()}>
                          <span>{isSending ? 'Sending...' : 'Send reply'}</span>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7Z M22 2 11 13" /></svg>
                        </button>
                      </div>
                    </form>
                  </section>
                </div>

                {/* Right Column: Info Cards (35%) */}
                <div className="info-column">
                  {ticket?.diagnostics && <details className="ticket-diagnostic-report"><summary>Customer-shared diagnostics</summary><p>Shared with consent on {new Date(ticket.diagnostics.consented_at).toLocaleString()}. Values are supplied by the customer app.</p><dl>{Object.entries(ticket.diagnostics).filter(([key]) => key !== 'consented_at').map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{String(value)}</dd></div>)}</dl></details>}
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

                  {ticket?.device_id ? <>
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

                  </> : <div className="ticket-no-device"><span>Device</span><p>No device linked to this ticket.</p></div>}

                  {/* Quick Actions Card */}
                  <div className="info-card actions-card">
                    <h3 className="actions-header-title">Customer Care Actions</h3>
                    {ticket?.device_id && <>
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
                    </>}



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
