import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function client(fetch) {
  const source = fs.readFileSync(new URL('../src/api/client.js', import.meta.url), 'utf8')
    .replace("import Cookies from 'js-cookie';", '')
    .replace('import.meta.env.DEV', 'false')
    .replace('export const api', 'const api').replace('export default api;', 'globalThis.api = api;');
  let removals = 0;
  const context = { fetch, URL, FormData, console, Cookies: { get: () => 'token', remove: () => removals++ },
    window: { location: { origin: 'https://admin.justride.cc' }, dispatchEvent() {} },
    localStorage: { removeItem() {} } };
  vm.runInNewContext(source, context);
  return { api: context.api, removals: () => removals };
}
const response = (status, data, retry = null) => ({ ok: status === 200, status,
  headers: { get: key => key.toLowerCase() === 'content-type' ? 'application/json' : retry },
  json: async () => data });

test('simultaneous GETs share one request; later refresh stays fresh', async () => {
  let calls = 0;
  const { api } = client(async () => { calls++; await new Promise(resolve => setTimeout(resolve, 5)); return response(200, { success: true }); });
  const first = api.get('/admin/dashboard');
  assert.equal(api.get('/admin/dashboard'), first);
  await first;
  assert.equal(calls, 1);
  await api.get('/admin/dashboard');
  assert.equal(calls, 2);
});
test('429 exposes retry delay without deleting the session or retrying automatically', async () => {
  let calls = 0;
  const { api, removals } = client(async () => { calls++; return response(429, { message: 'Please wait' }, '23'); });
  await assert.rejects(api.get('/early-interest'), error => error.status === 429 && error.retryAfter === 23);
  assert.equal(calls, 1);
  assert.equal(removals(), 0);
  assert.equal(api.pendingGets.size, 0);
});
test('abort signal reaches fetch and bypasses shared requests', async () => {
  const controller = new AbortController();
  let received;
  const { api } = client(async (_, config) => { received = config.signal; return response(200, {}); });
  await api.get('/admin/dashboard', {}, { signal: controller.signal });
  assert.equal(received, controller.signal);
});
