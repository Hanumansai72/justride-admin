import { useEffect, useState } from 'react';
import api from '../../api/client';
import './InterestedUsers.css';

export default function CommunityModeration() {
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [queue, setQueue] = useState('experiences');

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setResult(null);
    setError('');
    api.get(`/admin/community/${queue === 'flags' ? 'flags' : 'reports'}`, { page }, { signal })
      .then(response => { if (!signal.aborted) setResult(response.data); })
      .catch(err => { if (!signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [page, refresh, queue]);

  async function resolve(report, action) {
    setError('');
    setWorking(true);
    try {
      await api.patch(`/admin/community/${queue === 'flags' ? 'flags' : 'reports'}/` + encodeURIComponent(report.id), { action });
      setConfirmation(null);
      if (page > 1 && result?.items.length === 1) setPage(page - 1);
      else setRefresh(value => value + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  return <section className="interested-users" aria-labelledby="community-title">
    <header className="interested-users__header">
      <div><h1 id="community-title">Community moderation</h1><p>Review experience, ride, assistance, and rider reports.</p></div>
      <div className="interested-users__actions">
        <button type="button" disabled={working} aria-pressed={queue === 'experiences'} onClick={() => { setPage(1); setQueue('experiences'); }}>Experiences</button>
        <button type="button" disabled={working} aria-pressed={queue === 'flags'} onClick={() => { setPage(1); setQueue('flags'); }}>Rides and rider safety</button>
        <button type="button" disabled={working} onClick={() => setRefresh(value => value + 1)}>Refresh</button>
      </div>
    </header>
    {error && <p role="alert" className="interested-users__error">{error}</p>}
    {!result && !error && <p role="status">Loading reports…</p>}
    {result?.items.length === 0 && <p>No pending reports.</p>}
    {queue === 'experiences' && result?.items.map(report => <article key={report.id}>
      <h2>{report.experience?.title || 'Experience unavailable'}</h2>
      <p><strong>Report</strong> {report.reason}</p>
      {report.experience?.story && <details><summary>Read experience</summary><p>{report.experience.story}</p></details>}
      <div className="interested-users__actions">
        <button type="button" disabled={working} onClick={() => resolve(report, 'dismiss')}>Dismiss report</button>
        {report.experience && (confirmation === report.id
          ? <><button type="button" disabled={working} onClick={() => resolve(report, 'remove')}>Confirm removal</button>
            <button type="button" disabled={working} onClick={() => setConfirmation(null)}>Cancel</button></>
          : <button type="button" disabled={working} onClick={() => setConfirmation(report.id)}>Remove experience</button>)}
      </div>
    </article>)}
    {queue === 'flags' && result?.items.map(report => <article key={report.id}>
      <h2>{report.type === 'rider' ? 'Rider report' : report.type === 'ride' ? 'Scheduled ride report' : 'Rider Assist report'}</h2>
      <p><strong>Reason</strong> {report.reason}</p>
      {report.subject && <p>{report.subject.title || report.subject.name || report.subject.type} {report.subject.origin && `· ${report.subject.origin} to ${report.subject.destination}`}</p>}
      {report.subject?.description && <details><summary>Read request details</summary><p>{report.subject.description}</p></details>}
      <div className="interested-users__actions">
        <button type="button" disabled={working} onClick={() => resolve(report, 'dismiss')}>Dismiss report</button>
        {report.type !== 'rider' && (confirmation === `${report.id}:remove`
          ? <><button type="button" disabled={working} onClick={() => resolve(report, 'remove')}>Confirm removal</button>
            <button type="button" disabled={working} onClick={() => setConfirmation(null)}>Cancel</button></>
          : <button type="button" disabled={working} onClick={() => setConfirmation(`${report.id}:remove`)}>Remove {report.type === 'ride' ? 'ride' : 'assistance request'}</button>)}
        {report.type === 'rider' && (confirmation === `${report.id}:restrict`
          ? <><button type="button" disabled={working} onClick={() => resolve(report, 'restrict')}>Confirm account restriction</button>
            <button type="button" disabled={working} onClick={() => setConfirmation(null)}>Cancel</button></>
          : <button type="button" disabled={working} onClick={() => setConfirmation(`${report.id}:restrict`)}>Restrict rider account</button>)}
      </div>
    </article>)}
    {result && <nav aria-label="Report pages" className="interested-users__pagination">
      <button type="button" disabled={working || page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      <span>Page {page}</span>
      <button type="button" disabled={working || !result.nextPage} onClick={() => setPage(result.nextPage)}>Next</button>
    </nav>}
  </section>;
}
