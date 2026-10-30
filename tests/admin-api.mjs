// Run against your local dev server: node tests/admin-api.mjs http://127.0.0.1:5174
import assert from 'node:assert/strict';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { validateContent } from '../content-schema.mjs';

const base = process.argv[2] || 'http://127.0.0.1:5174';
const headers = { 'X-Portfolio-Admin': '1' };
let cookie = '';
const request = (path, options = {}) => fetch(`${base}/api/admin/${path}`, { ...options, headers: { ...options.headers, ...(cookie ? { Cookie: cookie } : {}) } });
const original = JSON.parse(await readFile(new URL('../public/content.json', import.meta.url), 'utf8'));
const previousBackupFile = new URL('../.local/content.previous.json', import.meta.url);
const previousBackup = await readFile(previousBackupFile).catch(() => null);
assert.equal(validateContent(original).projects.length, original.projects.length);
const invalid = structuredClone(original); invalid.projects[0].liveUrl = 'javascript:alert(1)';
assert.throws(() => validateContent(invalid), /Invalid liveUrl/);
const duplicate = structuredClone(original); duplicate.projects.push(duplicate.projects[0]);
assert.throws(() => validateContent(duplicate), /unique/);
assert.equal((await request('session')).status, 403, 'session requires custom header');
assert.equal((await request('session', { headers: { ...headers, Origin: 'https://untrusted.example' } })).status, 403, 'cross-origin requests are blocked');
assert.equal((await request('session', { headers })).status, 401, 'session requires login');
assert.equal((await fetch(`${base}/.local/admin-auth.json`)).status, 403, 'credential file is blocked from web access');
assert.equal((await request('login', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'nobody@example.com', password: 'incorrect' }) })).status, 401);
assert.ok(process.env.PORTFOLIO_TEST_PASSWORD, 'Set PORTFOLIO_TEST_PASSWORD to run authenticated API tests.');
const login = await request('login', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'akshaychavan44.ac@gmail.com', password: process.env.PORTFOLIO_TEST_PASSWORD }) });
assert.equal(login.status, 200);
const setCookie = login.headers.get('set-cookie');
assert.match(setCookie, /HttpOnly/); assert.match(setCookie, /SameSite=Strict/);
cookie = setCookie.split(';')[0];
const response = await request('session', { headers }); assert.equal(response.status, 200);
const session = await response.json();
assert.deepEqual(session.content, original, 'editor loads saved content');
const authorized = { ...headers, Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json', 'If-Match': session.revision };
assert.equal((await request('content', { method: 'PUT', headers, body: JSON.stringify(original) })).status, 401);
assert.equal((await request('content', { method: 'PUT', headers: authorized, body: JSON.stringify(invalid) })).status, 400);
assert.equal((await request('content', { method: 'PUT', headers: { ...authorized, 'If-Match': 'stale' }, body: JSON.stringify(original) })).status, 409);
assert.equal((await request('upload', { method: 'POST', headers: { ...authorized, 'Content-Type': 'image/png' }, body: 'not an image' })).status, 400);
const image = await readFile(new URL('../public/images/rewear.png', import.meta.url));
const upload = await request('upload', { method: 'POST', headers: { ...authorized, 'Content-Type': 'image/png' }, body: image });
assert.equal(upload.status, 201);
const uploaded = await upload.json();
assert.match(uploaded.url, /^\/uploads\/[a-f0-9-]+\.png$/);
const uploadedFile = new URL(`../public${uploaded.url}`, import.meta.url);
try { assert.deepEqual(await readFile(uploadedFile), image, 'uploaded image is persisted without changes'); }
finally { await unlink(uploadedFile); }
let modified = false;
try {
  const draft = structuredClone(original); draft.profile.availability += ' [API verification]';
  const save = await request('content', { method: 'PUT', headers: authorized, body: JSON.stringify(draft) });
  assert.equal(save.status, 200); modified = true;
  const updated = await save.json();
  const publicData = await (await fetch(`${base}/content.json`)).json();
  assert.equal(publicData.profile.availability, draft.profile.availability, 'save reaches public portfolio data');
  assert.equal((await request('content', { method: 'PUT', headers: authorized, body: JSON.stringify(original) })).status, 409, 'second tab cannot overwrite newer content');
  const restore = await request('content', { method: 'PUT', headers: { ...authorized, 'If-Match': updated.revision }, body: JSON.stringify(original) });
  assert.equal(restore.status, 200); modified = false;
} finally {
  if (modified) {
    const latest = await (await request('session', { headers })).json();
    const restore = await request('content', { method: 'PUT', headers: { ...authorized, 'If-Match': latest.revision }, body: JSON.stringify(original) });
    assert.equal(restore.status, 200, 'restore original content after test');
  }
  if (previousBackup) await writeFile(previousBackupFile, previousBackup);
  else await unlink(previousBackupFile).catch(() => {});
}
assert.deepEqual(JSON.parse(await readFile(new URL('../public/content.json', import.meta.url), 'utf8')), original);
assert.equal((await request('logout', { method: 'POST', headers: authorized })).status, 200);
assert.equal((await request('session', { headers })).status, 401, 'logout revokes session');
console.log('PASS: login, wrong-password rejection, protected credentials, cookie session, logout, content validation, file validation, conflict protection, persistent save, public data, and restoration.');
