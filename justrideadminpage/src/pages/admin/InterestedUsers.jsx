import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/common/DataTable';
import { interestApi } from '../../api/services';
import './InterestedUsers.css';

const columns = [
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
  { header: 'Confirmation email', render: (row) => row.confirmationEmailStatus === 'sent' ? 'Sent' : row.confirmationEmailStatus === 'failed' ? `Failed (${row.confirmationEmailCode || 'delivery error'})` : 'Pending / not recorded' },
  { header: 'City', accessor: 'city' },
  { header: 'Purchase interest', render: (row) => row.purchaseIntent || '—' },
  { header: 'Expectations / notes', render: (row) => <span className="interested-users__notes">{row.notes || '—'}</span> },
  { header: 'Submitted', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—' },
];

export default function InterestedUsers({ onNavigate, onLogout }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function reload(nextPage = page) {
    setLoading(true);
    setError('');
    setPage(nextPage);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    let active = true;
    interestApi.getUsers(page).then((response) => {
      if (!response.success || !Array.isArray(response.data?.items)) throw new Error('Could not load interested users.');
      if (active) setResult(response.data);
    }).catch((cause) => {
      if (active) setError(cause.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [page, revision]);

  const pages = Math.max(1, Math.ceil(result.total / result.limit));
  return <AdminLayout activeRoute="interested-users" pageTitle="Interested Users" onNavigate={onNavigate} onLogout={onLogout}>
    <section className="interested-users" aria-labelledby="interested-users-title">
      <div className="interested-users__header"><div><h1 id="interested-users-title">Interested Users</h1><p>Early interest submissions from the JustRide homepage, newest first.</p></div><button type="button" onClick={() => reload()} disabled={loading}>Refresh</button></div>
      {!loading && !error && <p className="interested-users__count">{result.total} interested {result.total === 1 ? 'rider' : 'riders'}</p>}
      {loading ? <p role="status">Loading interested users…</p> : error ? <p role="alert" className="interested-users__error">{error}</p> : <>
        <DataTable columns={columns} data={result.items.map((row) => ({ ...row, id: row._id }))} pagination={false} />
        <div className="interested-users__pagination"><span>Page {page} of {pages}</span><button type="button" disabled={page <= 1} onClick={() => reload(page - 1)}>Previous</button><button type="button" disabled={page >= pages} onClick={() => reload(page + 1)}>Next</button></div>
      </>}
    </section>
  </AdminLayout>;
}
