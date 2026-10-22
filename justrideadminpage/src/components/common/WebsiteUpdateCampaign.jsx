import React, { useCallback, useEffect, useRef, useState } from 'react';
import { interestApi } from '../../api/services';
import './WebsiteUpdateCampaign.css';

export default function WebsiteUpdateCampaign() {
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [includeContacted, setIncludeContacted] = useState(false);
  const [permissionNote, setPermissionNote] = useState('');
  const load = useCallback(async signal => {
    const response = await interestApi.getWebsiteUpdate({ signal });
    if (!signal?.aborted) setCampaign(response.data);
  }, []);

  useEffect(() => {
    if (!open) { if (dialog.current.open) dialog.current.close(); return; }
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setError(''); setApproved(false);
    const controller = new AbortController();
    const refresh = () => load(controller.signal).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    refresh();
    const timer = setInterval(refresh, 15000);
    return () => { clearInterval(timer); controller.abort(); document.body.style.overflow = previous; };
  }, [open, load]);

  async function act(action) {
    setBusy(true); setError(''); setFeedback('');
    try {
      const response = action === 'test' ? await interestApi.testWebsiteUpdate() : await interestApi.approveWebsiteUpdate(audienceCount, { includeContacted, permissionNote });
      setFeedback(response.message);
      setApproved(false);
    } catch (cause) { setError(cause.message); }
    finally {
      try { await load(); } catch (cause) { setError(cause.message); }
      setBusy(false);
    }
  }

  const counts = campaign?.counts;
  const audienceCount = includeContacted ? campaign?.contactedCount : campaign?.eligibleCount;
  const canApprove = campaign?.state === 'draft' && campaign?.testedCurrentContent && audienceCount > 0 && (!includeContacted || permissionNote.trim().length >= 12);
  return <>
    <button type="button" className="website-update-trigger" onClick={() => setOpen(true)}>Send website update</button>
    <dialog className="website-update-dialog" ref={dialog} aria-labelledby="website-update-title" onClose={() => setOpen(false)}>
      <header className="website-update-heading"><div><h2 id="website-update-title">Website update email</h2><p>Preview, test, then approve one campaign for the interested audience.</p></div><button type="button" aria-label="Close email campaign" onClick={() => setOpen(false)}>×</button></header>
      {error && <p role="alert" className="website-update-error">{error}</p>}
      {feedback && <p role="status" className="website-update-feedback">{feedback}</p>}
      {!campaign ? <p role="status">{error ? 'Deploy the matching backend campaign update, then reopen this preview.' : 'Loading campaign preview…'}</p> : <>
        <div className="website-update-meta"><span><strong>{campaign.state !== 'draft' ? campaign.total : audienceCount}</strong> selected members</span><span>State: <strong>{campaign.state}</strong></span></div>
        <p className="website-update-subject"><span>Subject</span> {campaign.subject}</p>
        <iframe className="website-update-preview" title="Website update email preview" sandbox="" srcDoc={campaign.previewHtml} />
        <section className="website-update-step" aria-labelledby="website-update-test-title"><h3 id="website-update-test-title">Send a test first</h3><p>Test recipient: <strong>{campaign.testRecipient}</strong></p><p>Test status: {campaign.testStatus.replaceAll('_', ' ')}{campaign.testCode ? ` (${campaign.testCode})` : ''}{campaign.testSentAt ? ` · ${new Date(campaign.testSentAt).toLocaleString()}` : ''}</p><button type="button" disabled={busy || campaign.testStatus === 'sending' || campaign.state !== 'draft'} onClick={() => act('test')}>{busy ? 'Please wait…' : 'Send test email'}</button><p className="website-update-note">Sent means accepted by the mail server. Check the inbox and spam folder before approving. A pending test may already have been accepted; refresh its status before retrying.</p></section>
        {campaign.state === 'draft' ? <section className="website-update-step" aria-labelledby="website-update-approval-title"><h3 id="website-update-approval-title">Approve the full mailing</h3><p>Each eligible member receives one individual email. Sending is paced within the shared 36-emails-per-hour allowance.</p><label className="website-update-approval"><input type="checkbox" checked={includeContacted} disabled={busy} onChange={event => { setIncludeContacted(event.target.checked); setApproved(false); }} /><span>Include registered contacts whose permission I confirmed directly. Recorded unsubscribes remain excluded.</span></label>{includeContacted && <label className="website-update-permission">Direct permission record<textarea value={permissionNote} maxLength={500} rows={2} placeholder="Record how you confirmed permission for these contacts." onChange={event => { setPermissionNote(event.target.value); setApproved(false); }} /></label>}<label className="website-update-approval"><input type="checkbox" checked={approved} disabled={!canApprove || busy} onChange={event => setApproved(event.target.checked)} /><span>I checked the test and approve sending this update to {audienceCount} selected members.</span></label><button type="button" className="website-update-send" disabled={!canApprove || !approved || busy} onClick={() => act('approve')}>Approve and queue {audienceCount} emails</button>{!campaign.testedCurrentContent && <p className="website-update-note">A successful test of the current email is required before approval.</p>}</section> : <section className="website-update-step" aria-labelledby="website-update-progress-title"><h3 id="website-update-progress-title">Campaign progress</h3><div className="website-update-progress">{Object.entries(counts).map(([name, count]) => <div key={name}><strong>{count}</strong><span>{name === 'sending' ? 'Awaiting confirmation' : name}</span></div>)}</div><p className="website-update-note">Updates continue through the backend worker or configured scheduler. This view refreshes every 15 seconds. Failed or unconfirmed messages require review before any resend.</p></section>}
      </>}
    </dialog>
  </>;
}
