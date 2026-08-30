import React from 'react';
import './StatusBadge.css';

export default function StatusBadge({ status = 'active', label }) {
  const normalized = status.toLowerCase();
  let badgeClass = 'badge-neutral';

  if (['active', 'operational', 'stable', 'online'].includes(normalized)) {
    badgeClass = 'badge-active';
  } else if (['warning', 'suspended', 'leave', 'beta', 'rolling'].includes(normalized)) {
    badgeClass = 'badge-warning';
  } else if (['critical', 'error', 'banned', 'terminated', 'eol'].includes(normalized)) {
    badgeClass = 'badge-critical';
  }

  return (
    <span className={`custom-status-badge ${badgeClass}`}>
      <span className="badge-dot" />
      <span>{label || status.toUpperCase()}</span>
    </span>
  );
}
