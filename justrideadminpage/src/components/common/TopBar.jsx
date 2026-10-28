import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from './NotificationBell';
import './TopBar.css';

const paths = {
  refresh: 'M20 7v5h-5 M20 12a8 8 0 1 0-2.3 5.7 M20 7l-2.3-2.3',
  notifications: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  back: 'M19 12H5 M12 5l-7 7 7 7',
};
const icon = (name) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;

export default function TopBar({ title = 'Operations', onNavigate, onRefresh, refreshing = false, onBack, backLabel = 'Back' }) {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const go = (page) => onNavigate ? onNavigate(page) : navigate('/' + page);
  const initials = (user?.name || user?.email || 'JustRide').trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return <header className="app-topbar jr-topbar" aria-label="Page navigation">
    <div className="jr-topbar-heading">
      {onBack && <button type="button" className="jr-topbar-button" onClick={onBack} aria-label={backLabel} title={backLabel}>{icon('back')}</button>}
      <h1 className="jr-topbar-title" title={title}>{title}</h1>
    </div>
    <div className="jr-topbar-actions">
      {onRefresh && <button type="button" className="jr-topbar-button" onClick={onRefresh} disabled={refreshing} aria-label="Refresh page" title="Refresh page"><span>{icon('refresh')}</span></button>}
      <NotificationBell />
      {role === 'ADMIN' ? <button type="button" className="jr-topbar-avatar" onClick={() => go('profile')} aria-label="Admin profile" title={user?.name || 'Admin profile'}>{initials}</button> : <span className="jr-topbar-avatar" title={user?.name || 'Staff'}>{initials}</span>}
    </div>
  </header>;
}
