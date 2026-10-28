import React from 'react';
import './LoadingState.css';

export function CircleLoader({ fullScreen = false, label = 'Loading…' }) {
  return <div className={`jr-circle-loading ${fullScreen ? 'jr-circle-loading-full' : ''}`} role="status" aria-label={label}>
    <span className="jr-loading-ring" aria-hidden="true" />
    <span className="jr-loading-label">{label}</span>
  </div>;
}

export function ContentSkeleton({ route = false }) {
  return <div className={`jr-page-skeleton ${route ? 'jr-route-skeleton' : ''}`} role="status" aria-label="Loading page content" aria-busy="true">
    <div className="jr-skeleton-heading"><span className="jr-skeleton-block" /><span className="jr-loading-ring" aria-hidden="true" /></div>
    <div className="jr-skeleton-metrics" aria-hidden="true">{[0, 1, 2].map(i => <div key={i}><span className="jr-skeleton-block" /><span className="jr-skeleton-block" /></div>)}</div>
    <div className="jr-skeleton-table" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(i => <div key={i}>{[0, 1, 2, 3].map(j => <span className="jr-skeleton-block" key={j} />)}</div>)}</div>
    <span className="jr-sr-only">Loading page content…</span>
  </div>;
}

export class PageLoadBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="jr-route-skeleton" role="alert"><p>This page could not be loaded.</p><button type="button" onClick={() => window.location.reload()}>Reload page</button></div>;
    return this.props.children;
  }
}
