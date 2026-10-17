import React from 'react';
import './Pagination.css';

export default function Pagination({ page, total, onChange, loading = false, limit = 10 }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return <nav className="list-pagination" aria-label="List pagination">
    <span>Page {page} of {pages} · {total} records</span>
    <button type="button" disabled={loading || page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <button type="button" disabled={loading || page >= pages} onClick={() => onChange(page + 1)}>Next</button>
  </nav>;
}
