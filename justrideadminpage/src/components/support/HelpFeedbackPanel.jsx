import React, { useEffect, useState } from 'react';
import { supportApi } from '../../api/services';
import RequestError from '../common/RequestError';
import './HelpFeedbackPanel.css';

export default function HelpFeedbackPanel() {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    supportApi.getHelpFeedback({ page }, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return;
      if (!result?.success) throw new Error('Could not load Help Center feedback.');
      setItems(result.data); setPagination(result.pagination);
    }).catch(err => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, revision]);
  return <section className="help-feedback-panel">
    <div className="help-feedback-heading"><div><h3>Help Center feedback</h3><p>Articles with the most “Not helpful” responses appear first. One current vote per account and article.</p></div><button type="button" className="btn-view-ticket" onClick={() => setRevision(value => value + 1)} disabled={loading}>Refresh</button></div>
    <RequestError message={error} loading={loading} onRetry={() => setRevision(value => value + 1)} />
    {loading ? <p role="status">Loading feedback…</p> : !error && <>
      {!items.length ? <p>No article feedback yet.</p> : <div className="help-feedback-table"><table><thead><tr><th>Help article</th><th>Helpful</th><th>Not helpful</th><th>Last response</th></tr></thead><tbody>{items.map(item => <tr key={item._id}><td>{item.question}</td><td>{item.helpful}</td><td>{item.not_helpful}</td><td>{new Date(item.updatedAt).toLocaleString()}</td></tr>)}</tbody></table></div>}
      <div className="help-feedback-pagination"><span>{pagination.total} articles with feedback · Page {page}</span><div><button className="btn-view-ticket" type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><button className="btn-view-ticket" type="button" disabled={page >= pagination.pages} onClick={() => setPage(value => value + 1)}>Next</button></div></div>
    </>}
  </section>;
}
