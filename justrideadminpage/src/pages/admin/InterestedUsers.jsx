import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import DataTable from '../../components/common/DataTable';
import { interestApi } from '../../api/services';
import './InterestedUsers.css';

function emailStatus(row) {
  if (row.confirmationEmailCode === 'CONSENT_REQUIRED') return 'Not sent — consent required';
  if (row.confirmationEmailStatus === 'queued') return 'Queued';
  if (row.confirmationEmailStatus === 'sending') return 'Sending / awaiting confirmation';
  if (row.confirmationEmailStatus === 'sent') return 'Sent';
  if (row.confirmationEmailStatus === 'failed') return `Failed (${row.confirmationEmailCode || 'delivery error'})`;
  return 'Pending / not recorded';
}

const columns = [
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
  { header: 'Email consent', render: (row) => row.emailConsent === true ? 'Confirmed' : 'Not confirmed' },
  { header: 'Consent recorded', render: (row) => row.emailConsentAt ? new Date(row.emailConsentAt).toLocaleString() : '—' },
  { header: 'Confirmation email', render: emailStatus },
  { header: 'City', accessor: 'city' },
  { header: 'Purchase interest', render: (row) => row.purchaseIntent || '—' },
  { header: 'Preferred price range', render: (row) => row.priceRange ? `₹${row.priceRange.replace('-', '–₹')}` : '—' },
  { header: 'Expectations / notes', render: (row) => <span className="interested-users__notes">{row.notes || '—'}</span> },
  { header: 'Submitted', render: (row) => row.createdAt ? new Date(row.createdAt).toLocaleString() : '—' },
];

export default function InterestedUsers({ onNavigate, onLogout }) {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({ items: [], total: 0, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function reload(nextPage = page) {
    setLoading(true);
    setError('');
    setPage(nextPage);
    setRevision((value) => value + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    interestApi.getUsers(page, { signal: controller.signal }).then((response) => {
      if (!response.success || !Array.isArray(response.data?.items)) throw new Error('Could not load interested users.');
      if (!controller.signal.aborted) setResult(response.data);
    }).catch((cause) => {
      if (!controller.signal.aborted) setError(cause.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [page, revision]);

  const pages = Math.max(1, Math.ceil(result.total / result.limit));
  return <AdminLayout activeRoute="interested-users" pageTitle="Interested Users" onNavigate={onNavigate} onLogout={onLogout}>
    <section className="interested-users" aria-labelledby="interested-users-title">
      <div className="interested-users__header"><div><h1 id="interested-users-title">Interested Users</h1><p>Early interest submissions from the JustRide homepage, newest first.</p></div><div className="interested-users__actions"><button type="button" onClick={() => reload(1)} disabled={loading}>Refresh</button></div></div>
      {!loading && !error && <p className="interested-users__count">{result.total} interested {result.total === 1 ? 'rider' : 'riders'}</p>}
      {loading ? <p role="status">Loading interested users…</p> : error ? <p role="alert" className="interested-users__error">{error}</p> : <>
        <DataTable columns={columns} data={result.items.map((row) => ({ ...row, id: row._id }))} pagination={false} />
        <div className="interested-users__pagination"><span>Page {page} of {pages}</span><button type="button" disabled={page <= 1} onClick={() => reload(page - 1)}>Previous</button><button type="button" disabled={page >= pages} onClick={() => reload(page + 1)}>Next</button></div>
      </>}
    </section>
  </AdminLayout>;
}
