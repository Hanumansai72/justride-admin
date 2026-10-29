import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/services';
import AdminLayout from '../../layouts/AdminLayout';
import './AdminProfile.css';
import '../../components/common/LoadingState.css';

const sessionBrowser = agent => {
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Browser';
  const device = /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Windows/.test(agent) ? 'Windows' : /Macintosh/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : '';
  return device ? `${browser} on ${device}` : browser;
};
const sessionTime = value => value ? new Date(value).toLocaleString() : 'Unavailable';

export default function AdminProfile({ onNavigate, onLogout }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [revoking, setRevoking] = useState('');
  const loadSessions = useCallback(async (signal) => {
    setSessionsLoading(true); setSessionsError('');
    try {
      const result = await authApi.getSessions({ signal });
      if (!signal?.aborted) setSessions(result.data || []);
    } catch (err) { if (!signal?.aborted) setSessionsError(err.message); }
    finally { if (!signal?.aborted) setSessionsLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    loadSessions(controller.signal);
    return () => controller.abort();
  }, [loadSessions]);
  const revokeSession = async session => {
    if (!window.confirm(session.current ? 'Sign out of this admin session?' : `Sign out ${sessionBrowser(session.user_agent)}?`)) return;
    setRevoking(session.id); setSessionsError(''); setSessionMessage('');
    try {
      await authApi.revokeSession(session.id);
      if (session.current) { await onLogout(); return; }
      setSessions(items => items.filter(item => item.id !== session.id));
      setSessionMessage('Session signed out.');
    } catch (err) { setSessionsError(err.message); }
    finally { setRevoking(''); }
  };
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    if (!currentPassword) { setError('Enter your current password first.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await authApi.requestPasswordOtp(currentPassword);
      if (!result?.success) throw new Error(result?.message || 'Could not send the code.');
      setSent(true); setOtp(''); setCooldown(60); setMessage(result.message);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const changePassword = async event => {
    event.preventDefault(); setError(''); setMessage('');
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    setBusy(true);
    try {
      const result = await authApi.changePassword({ currentPassword, newPassword, otp });
      if (!result?.success) throw new Error(result?.message || 'Password change failed.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setOtp('');
      setDone(true); setMessage(result.message);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <AdminLayout pageTitle="Admin profile" onNavigate={onNavigate}>
    <div className="admin-profile-page">
      <div className="jr-page-heading"><h2>Admin profile</h2></div>
      <div className="admin-profile-grid">
        <section className="admin-profile-card" aria-label="Account details">
          <h3>Account details</h3>
          <dl>{[['Name', user?.name], ['Email', user?.email], ['Username', user?.username], ['Role', user?.role]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>
        </section>
        <section className="admin-profile-card" aria-label="Change password">
          <h3>Change password</h3>
          <p>A verification code will be sent only to <strong>hanumansai72@gmail.com</strong>.</p>
          {error && <p className="admin-profile-error" role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          {done ? <button type="button" className="btn-primary" onClick={onLogout}>Sign in again</button> : <form onSubmit={changePassword}>
            <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required disabled={busy} maxLength={128} /></label>
            <button type="button" className="btn-secondary" onClick={requestCode} disabled={busy || cooldown > 0}>{busy ? 'Please wait...' : cooldown > 0 ? `Resend code in ${cooldown}s` : sent ? 'Resend verification code' : 'Send verification code'}</button>
            {sent && <>
              <label>Email verification code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required disabled={busy} /></label>
              <label>New password<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword} onChange={e => setNewPassword(e.target.value)} required disabled={busy} /></label>
              <label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required disabled={busy} /></label>
              <p className="admin-profile-hint">Use at least 8 characters. Changing your password signs out all existing admin sessions.</p>
              <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Updating...' : 'Change password'}</button>
            </>}
          </form>}
        </section>
      </div>
      <section className="admin-profile-card admin-sessions" aria-labelledby="admin-sessions-title">
        <div className="admin-sessions-heading">
          <div><h3 id="admin-sessions-title">Active admin sessions</h3><p>Review signed-in browsers and sign out any session you don’t recognise.</p></div>
          <button type="button" className="btn-secondary" disabled={sessionsLoading || !!revoking} onClick={() => loadSessions()}>Refresh</button>
        </div>
        {sessionsError && <p className="admin-profile-error" role="alert">{sessionsError}</p>}
        {sessionMessage && <p role="status">{sessionMessage}</p>}
        <div aria-busy={sessionsLoading}>
          {sessionsLoading ? <div className="admin-session-skeleton" role="status" aria-label="Loading active admin sessions">{[1, 2].map(id => <div key={id} className="jr-skeleton-block" />)}</div>
            : sessions.length ? <ul className="admin-session-list">{sessions.map(session => <li key={session.id}>
              <div className="admin-session-details">
                <div className="admin-session-title"><strong>{sessionBrowser(session.user_agent)}</strong>{session.current && <span className="admin-session-current">This session</span>}</div>
                <dl><div><dt>IP address</dt><dd>{session.ip}</dd></div><div><dt>Location</dt><dd>{session.location}</dd></div><div><dt>Signed in</dt><dd>{sessionTime(session.signed_in_at)}</dd></div></dl>
              </div>
              <button type="button" className="btn-secondary" disabled={!!revoking} onClick={() => revokeSession(session)} aria-label={`Sign out ${sessionBrowser(session.user_agent)}${session.current ? ', this session' : ''}`}>{revoking === session.id ? 'Signing out...' : 'Sign out'}</button>
            </li>)}</ul> : <p>No active sessions found. Refresh to check again.</p>}
        </div>
      </section>
    </div>
  </AdminLayout>;
}
