import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/services';
import { notificationTarget } from '../../utils/notificationTarget';
import './NotificationBell.css';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const refresh = useCallback(async (signal) => {
    try {
      const [unread, list] = await Promise.all([
        notificationsApi.getUnreadCount({ signal }),
        open ? notificationsApi.getNotifications({ page: 1, limit: 10 }, { signal }) : null,
      ]);
      if (signal?.aborted) return;
      if (!unread?.success || (open && (!list?.success || !Array.isArray(list.data)))) throw new Error('Could not load notifications.');
      setCount(unread.unread_count || 0);
      if (list) setItems(list.data);
      setError('');
    } catch (cause) {
      if (!signal?.aborted) setError(cause.message || 'Could not load notifications.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    let controller;
    const update = () => {
      if (document.visibilityState === 'hidden') return;
      controller?.abort();
      controller = new AbortController();
      refresh(controller.signal);
    };
    update();
    const timer = setInterval(update, 15000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('notifications:changed', update);
    return () => {
      clearInterval(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('notifications:changed', update);
    };
  }, [refresh]);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const markRead = async (notification) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!notification.is_read) {
        const response = await notificationsApi.markRead(notification._id || notification.id);
        if (!response?.success) throw new Error('Could not mark notification as read.');
        window.dispatchEvent(new Event('notifications:changed'));
      }
      setOpen(false);
      navigate(notificationTarget(notification));
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  const markAll = async () => {
    setBusy(true);
    try {
      const response = await notificationsApi.markAllRead();
      if (!response?.success) throw new Error('Could not mark notifications as read.');
      setCount(0);
      setItems((previous) => previous.map((item) => ({ ...item, is_read: true })));
      window.dispatchEvent(new Event('notifications:changed'));
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  return <div className="jr-notifications" ref={root}>
    <button ref={trigger} type="button" className="jr-topbar-button jr-notification-trigger" aria-label={`Notifications${count ? `, ${count} unread` : ''}`} aria-expanded={open} aria-controls="notification-inbox" onClick={() => { if (!open) setLoading(true); setOpen((value) => !value); }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4" /></svg>
      {count > 0 && <span className="jr-notification-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
    </button>
    {open && <section id="notification-inbox" className="jr-notification-inbox" aria-label="Notifications">
      <div className="jr-inbox-heading"><h2>Notifications</h2><button type="button" disabled={!count || busy} onClick={markAll}>Mark all read</button></div>
      {error && <div className="jr-inbox-error" role="alert">{error}<button type="button" onClick={() => { setLoading(true); refresh(); }}>Retry</button></div>}
      <div className="jr-inbox-list" aria-busy={loading}>
        {loading && !items.length ? <p className="jr-inbox-empty" role="status">Loading notifications…</p> : !items.length && !error ? <p className="jr-inbox-empty">You’re all caught up.</p> : items.map((item) => <button type="button" key={item._id || item.id} className={`jr-inbox-item ${item.is_read ? '' : 'unread'}`} disabled={busy} onClick={() => markRead(item)}>
          <span className="jr-inbox-dot" /><span><strong>{item.title}</strong><span className="jr-inbox-message">{item.message}</span>{item.type === 'ADMIN_SIGN_IN' && item.data?.user_agent && <span className="jr-inbox-message">Browser: {item.data.user_agent}</span>}<time dateTime={item.createdAt}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</time></span>
        </button>)}
      </div>
      <button type="button" className="jr-inbox-all" onClick={() => { setOpen(false); navigate('/notifications'); }}>View all notifications</button>
    </section>}
  </div>;
}
