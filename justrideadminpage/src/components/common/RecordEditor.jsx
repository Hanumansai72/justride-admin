import React, { useEffect, useRef, useState } from 'react';
import { usersApi, devicesApi, firmwareApi, appReleasesApi } from '../../api/services';
import './RecordEditor.css';

const models = ['JustRide Hustle', 'JustRide Aventura'];
const definitions = {
  user: [['name', 'Name'], ['email', 'Email', 'email'], ['phonenumber', 'Phone number', 'tel']],
  device: [['device_type', 'Device model', models], ['device_version', 'Hardware version'], ['serialnumber', 'Serial number']],
  apk: [['release_notes', 'Release notes', 'textarea'], ['channel', 'Channel', ['stable', 'beta', 'alpha']], ['min_supported_version', 'Minimum supported version'], ['is_active', 'Active', 'checkbox'], ['is_mandatory', 'Mandatory update', 'checkbox']],
  firmware: [['release_notes', 'Release notes', 'textarea'], ['device_type', 'Device model', ['', ...models]], ['channel', 'Channel', ['stable', 'beta', 'deprecated']], ['min_supported_version', 'Minimum supported version'], ['is_active', 'Active', 'checkbox']],
};
const labels = { user: 'user', device: 'device', apk: 'APK release', firmware: 'firmware release' };

export default function RecordEditor({ kind, record, onClose, onSaved }) {
  const dialog = useRef(null);
  const [values, setValues] = useState(() => Object.fromEntries(definitions[kind].map(([key, , type]) => [key, type === 'checkbox' ? !!record[key] : record[key] || ''])));
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const release = kind === 'apk' || kind === 'firmware';
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close(); }, []);
  const save = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = {};
      for (const [key, , type] of definitions[kind]) {
        const value = type === 'checkbox' ? values[key] : values[key].trim();
        const previous = type === 'checkbox' ? !!record[key] : record[key] || '';
        if (value !== previous) payload[key] = value;
      }
      if (kind === 'device' && !models.includes(values.device_type)) throw new Error('Choose JustRide Hustle or JustRide Aventura.');
      if (file) {
        const firmware = kind === 'firmware', extension = firmware ? '.bin' : '.apk';
        if (!file.name.toLowerCase().endsWith(extension) || !file.size || file.size > (firmware ? 16 : 250) * 1024 * 1024) throw new Error(`Select a valid ${extension} file under ${firmware ? 16 : 250} MB.`);
        const checksum = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())), byte => byte.toString(16).padStart(2, '0')).join('');
        const api = firmware ? firmwareApi : appReleasesApi;
        const contentType = firmware ? 'application/octet-stream' : 'application/vnd.android.package-archive';
        const signed = await api.getUploadUrl({ filename: file.name, content_type: contentType });
        if (!signed.success || !signed.data?.uploadUrl) throw new Error('Unable to prepare file upload.');
        const uploaded = await fetch(signed.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: file });
        if (!uploaded.ok) throw new Error('File upload failed. Your existing release is unchanged.');
        payload.file_url = signed.data.publicUrl;
        payload[firmware ? 'checksum' : 'checksum_sha256'] = checksum;
        if (!firmware) payload.file_size_bytes = file.size;
      }
      if (!Object.keys(payload).length) { onClose(); return; }
      const api = kind === 'user' ? usersApi.updateUser : kind === 'device' ? devicesApi.updateDevice : kind === 'apk' ? appReleasesApi.updateRelease : firmwareApi.updateRelease;
      const result = await api(record._id || record.id, payload);
      if (!result.success) throw new Error(result.message || 'Could not save changes.');
      onSaved(); onClose();
    } catch (err) { setError(err.message || 'Could not save changes.'); }
    finally { setBusy(false); }
  };
  return <dialog ref={dialog} className="jr-record-editor" aria-labelledby="record-editor-title" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <form onSubmit={save}>
      <div className="jr-editor-heading"><h2 id="record-editor-title">Edit {labels[kind]}</h2><button type="button" className="btn-secondary" aria-label="Close editor" disabled={busy} onClick={onClose}>Close</button></div>
      {release && <p>Version {record.version}{kind === 'apk' ? ` · Build ${record.build_number}` : ''}. Publish a new version/build for users who already installed this release.</p>}
      {kind === 'device' && <p>BLE address: {record.BLE_ADDRESS || 'Not provided'}<br />Device ID: {record.device_id || 'Not provided'}</p>}
      {error && <p role="alert" className="jr-editor-error">{error}</p>}
      {definitions[kind].map(([key, label, type]) => <label key={key} className={type === 'checkbox' ? 'jr-editor-check' : ''}>
        {type === 'checkbox' ? <><input type="checkbox" checked={values[key]} disabled={busy} onChange={e => setValues({ ...values, [key]: e.target.checked })} />{label}</> : <>{label}{Array.isArray(type) ? <select value={values[key]} disabled={busy} required={kind === 'device'} onChange={e => setValues({ ...values, [key]: e.target.value })}>
          {kind === 'device' && !values[key] && <option value="">Choose model</option>}
          {values[key] && !type.includes(values[key]) && <option value={values[key]}>{values[key]}</option>}
          {type.map(value => <option key={value} value={value}>{value || 'All device models'}</option>)}</select>
          : type === 'textarea' ? <textarea value={values[key]} maxLength={5000} disabled={busy} onChange={e => setValues({ ...values, [key]: e.target.value })} />
          : <input type={type || 'text'} value={values[key]} required={kind === 'user' && key !== 'phonenumber'} maxLength={key === 'email' ? 254 : 100} disabled={busy} onChange={e => setValues({ ...values, [key]: e.target.value })} />}</>}
      </label>)}
      {release && <label>Replace {kind === 'apk' ? 'APK' : 'firmware'} file (optional)<input type="file" accept={kind === 'apk' ? '.apk' : '.bin'} disabled={busy} onChange={event => setFile(event.target.files?.[0] || null)} /><small>The current file stays available until the replacement uploads and saves successfully.</small></label>}
      <div className="jr-editor-actions"><button type="button" className="btn-secondary" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  </dialog>;
}
