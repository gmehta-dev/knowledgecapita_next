/**
 * Super admin user management (Next.js only - not part of the legacy API).
 *
 *   API_BASE=http://localhost:3000/api node --test tests/contract/admin.test.mjs
 *
 * Must point at a server connected to the *_test database (see setup-test-db.mjs).
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ADMIN, SUPER_ADMIN } from './fixtures.mjs';

const BASE = (process.env.API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const TEST_URI = process.env.TEST_URI || 'mongodb://localhost:27017/sharecom_contract_test';

async function call(method, path, { body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : undefined };
}

const signIn = async (emailOrphone, password) =>
  call('POST', '/auth/sign-in', { body: { emailOrphone, password } });

const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const makeUser = (n) => ({
  name: `Admin Target ${n} ${uniq}`,
  email: `admin.target${n}.${uniq}@example.com`,
  phone_number: `7${n}${uniq.slice(-8)}`,
  password: 'password123'
});
const T1 = makeUser(1);
const T2 = makeUser(2);
const s = {};

before(async () => {
  for (const u of [T1, T2]) {
    const r = await call('POST', '/auth/sign-up', { body: u });
    assert.equal(r.status, 201);
  }
  const t1 = await signIn(T1.email, T1.password);
  s.userToken = t1.json.token;
  s.t1 = t1.json.user.id;
  s.t2 = (await signIn(T2.email, T2.password)).json.user.id;
  s.activitiesAdminToken = (await signIn(ADMIN.email, ADMIN.password)).json.token;
  const sa = await signIn(SUPER_ADMIN.email, SUPER_ADMIN.password);
  s.superToken = sa.json.token;
  s.superId = sa.json.user.id;
  s.superRole = sa.json.user.role;
});

describe('roles', () => {
  it('sign-in reports role', async () => {
    assert.equal(s.superRole, 'super_admin');
    const r = await signIn(T1.email, T1.password);
    assert.equal(r.json.user.role, 'user');
  });

  it('existing documents without a role field read as "user"', async () => {
    const r = await call('GET', '/admin/users?size=100', { token: s.superToken });
    assert.ok(r.json.data.every((u) => u.role === 'user' || u.role === 'super_admin'));
  });

  it('cannot self-assign role via sign-up', async () => {
    const r = await call('POST', '/auth/sign-up', { body: { ...makeUser(9), role: 'super_admin' } });
    assert.equal(r.status, 422);
    assert.ok(r.json.errors.role);
  });

  it('cannot self-assign role via profile update', async () => {
    const r = await call('POST', '/user/profile', {
      token: s.userToken,
      body: { name: 'x', designation: 'CTO', industry: 'Aviation', area_of_specialization: 'Strategy', brief_bio: 'b', role: 'super_admin' }
    });
    assert.equal(r.status, 422);
    assert.ok(r.json.errors.role);
  });
});

describe('only super admin can manage users', () => {
  for (const [label, key, status] of [
    ['anonymous', null, 401],
    ['regular user', 'userToken', 403],
    ['activities admin (AUTHORIZED_EMAILS)', 'activitiesAdminToken', 403]
  ]) {
    it(`${label} -> ${status} on every admin endpoint`, async () => {
      const token = key ? s[key] : undefined;
      const results = await Promise.all([
        call('GET', '/admin/users', { token }),
        call('GET', `/admin/users/${s.t2}`, { token }),
        call('PUT', `/admin/users/${s.t2}`, { token, body: { name: 'hacked' } }),
        call('DELETE', `/admin/users/${s.t2}`, { token })
      ]);
      for (const r of results) assert.equal(r.status, status);
    });
  }
});

describe('list / get', () => {
  it('lists all users including hidden profiles, with contact details', async () => {
    const r = await call('GET', `/admin/users?searching=${encodeURIComponent(SUPER_ADMIN.email)}`, { token: s.superToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.total, 1); // profile_visibility 0, still listed
    const u = r.json.data[0];
    assert.equal(u.email, SUPER_ADMIN.email);
    assert.equal(u.phone_number, SUPER_ADMIN.phone_number);
    assert.equal(u.id, s.superId);
    assert.equal(u.password, undefined);
  });

  it('search by phone; regex characters are treated literally', async () => {
    const r = await call('GET', `/admin/users?searching=${T1.phone_number}`, { token: s.superToken });
    assert.equal(r.json.total, 1);
    const weird = await call('GET', `/admin/users?searching=${encodeURIComponent('(.*[')}`, { token: s.superToken });
    assert.equal(weird.status, 200);
    assert.equal(weird.json.total, 0);
  });

  it('pagination size is capped', async () => {
    const r = await call('GET', '/admin/users?size=1000&page=1', { token: s.superToken });
    assert.ok(r.json.data.length <= 100);
  });

  it('get one user', async () => {
    const r = await call('GET', `/admin/users/${s.t1}`, { token: s.superToken });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.email, T1.email);
    assert.equal(r.json.data.password, undefined);
  });

  it('invalid / unknown id', async () => {
    assert.equal((await call('GET', '/admin/users/nope', { token: s.superToken })).status, 400);
    assert.equal((await call('GET', '/admin/users/000000000000000000000000', { token: s.superToken })).status, 404);
  });
});

describe('update', () => {
  it('updates profile fields', async () => {
    const r = await call('PUT', `/admin/users/${s.t1}`, {
      token: s.superToken,
      body: { name: 'Renamed By Admin', designation: 'CEO', industry: 'Aviation', area_of_specialization: 'Strategy', brief_bio: '<p>by admin</p>', profile_visibility: 0 }
    });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { message: 'User updated successfully' });
    const g = await call('GET', `/admin/users/${s.t1}`, { token: s.superToken });
    assert.equal(g.json.data.name, 'Renamed By Admin');
    assert.equal(g.json.data.designation, 'CEO');
    assert.equal(g.json.data.profile_visibility, 0);
  });

  it('validation: empty body, bad enum, unknown field', async () => {
    const a = await call('PUT', `/admin/users/${s.t1}`, { token: s.superToken, body: {} });
    const b = await call('PUT', `/admin/users/${s.t1}`, { token: s.superToken, body: { designation: 'Wizard' } });
    const c = await call('PUT', `/admin/users/${s.t1}`, { token: s.superToken, body: { _id: 'x' } });
    for (const r of [a, b, c]) assert.equal(r.status, 422);
  });

  it('duplicate email / phone -> 400 like sign-up', async () => {
    const r = await call('PUT', `/admin/users/${s.t1}`, { token: s.superToken, body: { email: T2.email.toUpperCase(), phone_number: T2.phone_number } });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, {
      message: 'Validation failed',
      errors: { email: ['Email is already taken'], phone_number: ['Phone number is already taken'] }
    });
  });

  it('changes email and resets password (hashed, old one stops working)', async () => {
    const newEmail = `moved.${uniq}@example.com`;
    const r = await call('PUT', `/admin/users/${s.t1}`, { token: s.superToken, body: { email: newEmail, password: 'reset-by-admin' } });
    assert.equal(r.status, 200);
    assert.equal((await signIn(T1.email, T1.password)).status, 401);
    const ok = await signIn(newEmail, 'reset-by-admin');
    assert.equal(ok.status, 200);
    T1.email = newEmail;
  });

  it('can promote and demote another user', async () => {
    assert.equal((await call('PUT', `/admin/users/${s.t2}`, { token: s.superToken, body: { role: 'super_admin' } })).status, 200);
    const t2 = await signIn(T2.email, T2.password);
    assert.equal(t2.json.user.role, 'super_admin');
    assert.equal((await call('GET', '/admin/users', { token: t2.json.token })).status, 200);
    assert.equal((await call('PUT', `/admin/users/${s.t2}`, { token: s.superToken, body: { role: 'user' } })).status, 200);
    // Same token, role re-read from DB on every request -> access revoked immediately
    assert.equal((await call('GET', '/admin/users', { token: t2.json.token })).status, 403);
  });

  it('cannot demote yourself', async () => {
    const r = await call('PUT', `/admin/users/${s.superId}`, { token: s.superToken, body: { role: 'user' } });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'You cannot remove your own super admin role' });
  });
});

describe('delete', () => {
  it('cannot delete yourself', async () => {
    const r = await call('DELETE', `/admin/users/${s.superId}`, { token: s.superToken });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'You cannot delete your own account' });
  });

  it('deletes user and their calendar entries', async () => {
    const t2 = await signIn(T2.email, T2.password);
    const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const c = await call('POST', '/calender', {
      token: t2.json.token,
      body: { city: 'Pune', from_date: day(2), to_date: day(3), time: '09:00', interested_to_meet: 'All' }
    });
    assert.equal(c.status, 201);

    const r = await call('DELETE', `/admin/users/${s.t2}`, { token: s.superToken });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { message: 'User deleted successfully' });

    assert.equal((await signIn(T2.email, T2.password)).status, 401);
    assert.equal((await call('GET', `/dashboard/${s.t2}`)).status, 404);
    // Their old token no longer works
    assert.equal((await call('GET', '/calender', { token: t2.json.token })).status, 401);
    assert.equal((await call('DELETE', `/admin/users/${s.t2}`, { token: s.superToken })).status, 404);

    const db = await mongoose.createConnection(TEST_URI).asPromise();
    const left = await db.db.collection('calendarentries').countDocuments({ user_id: new mongoose.Types.ObjectId(s.t2) });
    await db.close();
    assert.equal(left, 0);
  });
});

describe('profile dropdowns (Next.js fix: legacy API rejected 20 UI options)', () => {
  it('every option offered by public/content.json can be saved', async () => {
    const { readFileSync } = await import('node:fs');
    const dd = JSON.parse(readFileSync(new URL('../../public/content.json', import.meta.url))).dropdowns;
    const longest = Math.max(dd.designation.length, dd.industry.length, dd.area_of_specialization.length);
    const failures = [];
    for (let i = 0; i < longest; i++) {
      const body = {
        name: 'Dropdown Check',
        designation: dd.designation[i % dd.designation.length],
        industry: dd.industry[i % dd.industry.length],
        area_of_specialization: dd.area_of_specialization[i % dd.area_of_specialization.length],
        brief_bio: '<p>x</p>'
      };
      const r = await call('POST', '/user/profile', { token: s.userToken, body });
      if (r.status !== 200) failures.push(`${JSON.stringify(body)} -> ${r.status} ${JSON.stringify(r.json?.errors)}`);
    }
    assert.deepEqual(failures, []);
  });
});

describe('uploaded files saved with a type prefix (Next.js fix)', () => {
  it('serves /storage/profile/profile/<file> and /storage/bioFile/bioFile/<file>', async () => {
    const { PNG_1PX } = await import('./fixtures.mjs');
    for (const [type, bytes, name, mime] of [
      ['profile', PNG_1PX, 'p.png', 'image/png'],
      ['bioFile', Buffer.from('%PDF-1.4\n%%EOF'), 'cv.pdf', 'application/pdf']
    ]) {
      const form = new FormData();
      form.append('type', type);
      form.append('file', new Blob([bytes], { type: mime }), name);
      const up = await fetch(BASE + '/upload-image', { method: 'POST', headers: { Authorization: `Bearer ${s.userToken}` }, body: form }).then((r) => r.json());
      assert.match(up.image, new RegExp(`^${type}/`));
      // exactly how the UI builds the URL: mediaUrl ('/storage/<type>/') + stored value
      const res = await fetch(`${BASE}/storage/${type}/${up.image}`);
      assert.equal(res.status, 200, `${type}/${up.image}`);
      assert.deepEqual(Buffer.from(await res.arrayBuffer()), Buffer.from(bytes));
    }
    // other path tricks still rejected
    assert.equal((await fetch(`${BASE}/storage/profile/bioFile/x.pdf`)).status, 404);
    assert.equal((await fetch(`${BASE}/storage/profile/profile/..%2F..%2F.env`)).status, 404);
  });
});
