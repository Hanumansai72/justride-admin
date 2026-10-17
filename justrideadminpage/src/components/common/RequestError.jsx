import React from 'react';

export default function RequestError({ message, onRetry, loading = false }) {
  if (!message) return null;
  return <div role="alert" style={{ padding: '12px 16px', marginBottom: 16, color: 'var(--color-danger-light)', background: 'var(--bg-danger)', borderRadius: 8 }}>
    <span>{message}</span>{onRetry && <button type="button" disabled={loading} onClick={() => onRetry()}
      style={{ marginLeft: 16, padding: '4px 12px', border: '1px solid currentColor', borderRadius: 4, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>Retry</button>}
  </div>;
}
