import { useEffect, useState } from 'react';
import { appReleasesApi, firmwareApi, releasePushApi } from '../../api/services';
import './ReleasePushComposer.css';

export default function ReleasePushComposer() {
  const [kind, setKind] = useState('firmware');
  const [status, setStatus] = useState(null);
  const [releases, setReleases] = useState([]);
  const [releaseId, setReleaseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState('');

  function changeKind(value) {
    setKind(value); setLoading(true); setError(''); setReport(''); setReleaseId(''); setReleases([]);
  }

  useEffect(() => {
    const controller = new AbortController();
    const api = kind === 'firmware' ? firmwareApi : appReleasesApi;
    Promise.all([
      releasePushApi.status({ signal: controller.signal }),
      api.getReleases({ page: 1, limit: 10, is_active: true, ...(kind === 'apk' && { platform: 'android' }) }, { signal: controller.signal }),
    ]).then(([health, list]) => {
      if (controller.signal.aborted) return;
      if (!health?.success || !list?.success) throw new Error('Could not load release notifications.');
      setStatus(health.data); setReleases(list.data || []);
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.message || 'Could not load release notifications.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind]);

  async function send() {
    if (!window.confirm('Send this release notification to eligible users?')) return;
    setSending(true); setError(''); setReport('');
    try {
      const response = await releasePushApi.send({ kind, release_id: releaseId });
      if (!response?.success) throw new Error(response?.message || 'Could not send notifications.');
      const { sent = 0, push = {} } = response.data;
      setReport(`${sent} inbox notifications saved. Firebase accepted ${push.accepted || 0} of ${push.registered || 0} phone notifications; ${push.failed || 0} failed.`);
    } catch (err) { setError(err.message || 'Could not send notifications.'); }
    finally { setSending(false); }
  }

  return <section className="release-push" aria-labelledby="release-push-title">
    <div className="release-push-heading">
      <div><h2 id="release-push-title">Release push notifications</h2>
        <p>Notify riders about firmware and Android app updates.</p></div>
      {status && <span className="release-push-status">{status.configured ? `${status.installations} phones enabled` : 'Push not configured'}</span>}
    </div>
    <div className="release-push-fields">
      <label>Update type<select value={kind} disabled={sending} onChange={e => changeKind(e.target.value)}>
        <option value="firmware">Device firmware</option><option value="apk">Android APK</option>
      </select></label>
      <label>Active release<select value={releaseId} disabled={loading || sending} onChange={e => setReleaseId(e.target.value)}>
        <option value="">{loading ? 'Loading releases…' : 'Select a release'}</option>
        {releases.map(release => <option key={release._id} value={release._id}>v{release.version} · {release.channel}{release.build_number ? ` · Build ${release.build_number}` : ''}</option>)}
      </select></label>
      <button type="button" onClick={send} disabled={loading || sending || !status?.configured || !releaseId}>{sending ? 'Sending…' : 'Send push notification'}</button>
    </div>
    <p className="release-push-note">{status?.configured === false
      ? 'Firebase setup is required before phone notifications can be sent. Existing in-app notifications remain available.'
      : 'Publishing or featuring a release also sends notifications. Firmware updates target device owners; APK updates target active app users.'}</p>
    {error && <p role="alert" className="release-push-error">{error}</p>}
    {report && <p role="status">{report} Acceptance does not confirm delivery.</p>}
  </section>;
}
