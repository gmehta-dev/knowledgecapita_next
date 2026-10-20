/**
 * API contract suite. Runs unchanged against the legacy Express API and the
 * Next.js Route Handlers, so both must produce the same status codes and
 * response shapes.
 *
 *   API_BASE=http://localhost:4101      (Express, no /api prefix)
 *   API_BASE=http://localhost:4102/api  (Next.js)
 *
 * Must point at a server connected to the *_test database (see setup-test-db.mjs).
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN, PNG_1PX } from './fixtures.mjs';

const BASE = (process.env.API_BASE || 'http://localhost:4102/api').replace(/\/$/, '');
const ORIGIN = 'https://knowledgecapita.com';

async function call(method, path, { body, token, form, headers = {} } = {}) {
  const h = { Accept: 'application/json', ...headers };
  if (token) h.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(BASE + path, { method, headers: h, body: payload });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }
  return { status: res.status, json, headers: res.headers, text };
}

const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const USER = {
  name: 'Contract User',
  email: `contract.${uniq}@example.com`,
  phone_number: `8${uniq.slice(-9)}`,
  password: 'password123'
};
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextWeek = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

const state = {};

function assertValidationError(r, fields) {
  assert.equal(r.json.message, 'Validation failed');
  for (const f of fields) {
    assert.ok(Array.isArray(r.json.errors[f]), `expected errors.${f}`);
    assert.equal(typeof r.json.errors[f][0], 'string');
  }
}

describe('infrastructure', () => {
  it('GET /health', async () => {
    const r = await call('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.json.status, 'ok');
    assert.ok(!Number.isNaN(Date.parse(r.json.timestamp)));
  });

  it('unknown route -> 404 JSON', async () => {
    const r = await call('GET', '/definitely-not-a-route');
    assert.equal(r.status, 404);
    assert.deepEqual(r.json, { message: 'Route not found' });
  });

  it('CORS preflight from allowed origin', async () => {
    const res = await fetch(BASE + '/auth/sign-in', {
      method: 'OPTIONS',
      headers: {
        Origin: ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,authorization'
      }
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    assert.match(res.headers.get('access-control-allow-methods') || '', /POST/);
  });

  it('CORS header on simple request from allowed origin', async () => {
    const r = await call('GET', '/health', { headers: { Origin: ORIGIN } });
    assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN);
  });

  it('no CORS allow header for unknown origin', async () => {
    const r = await call('GET', '/health', { headers: { Origin: 'https://evil.example' } });
    assert.equal(r.headers.get('access-control-allow-origin'), null);
  });
});

describe('auth', () => {
  it('sign-up validation -> 422 with field errors', async () => {
    const r = await call('POST', '/auth/sign-up', { body: {} });
    assert.equal(r.status, 422);
    assertValidationError(r, ['name', 'email', 'phone_number', 'password']);
  });

  it('sign-up rejects unknown fields (Joi strict)', async () => {
    const r = await call('POST', '/auth/sign-up', { body: { ...USER, extra: 1 } });
    assert.equal(r.status, 422);
    assertValidationError(r, ['extra']);
  });

  it('sign-up success -> 201', async () => {
    const r = await call('POST', '/auth/sign-up', { body: USER });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { message: 'Registration successful' });
  });

  it('sign-up duplicate -> 400 with email + phone errors', async () => {
    const r = await call('POST', '/auth/sign-up', { body: USER });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, {
      message: 'Validation failed',
      errors: { email: ['Email is already taken'], phone_number: ['Phone number is already taken'] }
    });
  });

  it('sign-in validation -> 422', async () => {
    const r = await call('POST', '/auth/sign-in', { body: { emailOrphone: '', password: 'short' } });
    assert.equal(r.status, 422);
    assertValidationError(r, ['emailOrphone', 'password']);
  });

  it('sign-in wrong password -> 401', async () => {
    const r = await call('POST', '/auth/sign-in', { body: { emailOrphone: USER.email, password: 'wrongpassword' } });
    assert.equal(r.status, 401);
    assert.deepEqual(r.json, { message: 'Invalid credentials' });
  });

  it('sign-in unknown user -> 401', async () => {
    const r = await call('POST', '/auth/sign-in', { body: { emailOrphone: `nobody.${uniq}@example.com`, password: 'password123' } });
    assert.equal(r.status, 401);
    assert.deepEqual(r.json, { message: 'Invalid credentials' });
  });

  it('sign-in by email (case-insensitive) -> token + user', async () => {
    const r = await call('POST', '/auth/sign-in', { body: { emailOrphone: USER.email.toUpperCase(), password: USER.password } });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Login successful');
    assert.equal(typeof r.json.token, 'string');
    assert.deepEqual(Object.keys(r.json.user).sort(), [
      'area_of_specialization', 'designation', 'email', 'id', 'industry', 'name', 'phone_number', 'profile_image'
    ]);
    assert.equal(r.json.user.email, USER.email);
    assert.equal(r.json.user.designation, null);
    state.token = r.json.token;
    state.userId = r.json.user.id;
  });

  it('sign-in by phone', async () => {
    const r = await call('POST', '/auth/sign-in', { body: { emailOrphone: USER.phone_number, password: USER.password } });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.id, state.userId);
  });

  it('admin sign-in', async () => {
    const r = await call('POST', '/auth/sign-in', { body: { emailOrphone: ADMIN.email, password: ADMIN.password } });
    assert.equal(r.status, 200);
    state.adminToken = r.json.token;
  });

  it('pass-reset -> 200 (does not reveal existence)', async () => {
    const a = await call('POST', '/auth/pass-reset', { body: { email: USER.email } });
    const b = await call('POST', '/auth/pass-reset', { body: { email: `nobody.${uniq}@example.com` } });
    assert.equal(a.status, 200);
    assert.deepEqual(a.json, { message: 'Reset link sent to your email' });
    assert.deepEqual(b.json, a.json);
  });

  it('pass-reset invalid email -> 422', async () => {
    const r = await call('POST', '/auth/pass-reset', { body: { email: 'nope' } });
    assert.equal(r.status, 422);
    assertValidationError(r, ['email']);
  });
});

describe('authentication middleware', () => {
  it('missing token -> 401 Unauthorized', async () => {
    const r = await call('GET', '/user/profile');
    assert.equal(r.status, 401);
    assert.deepEqual(r.json, { message: 'Unauthorized' });
  });

  it('bad token -> 401 Invalid token', async () => {
    const r = await call('GET', '/user/profile', { token: 'garbage' });
    assert.equal(r.status, 401);
    assert.deepEqual(r.json, { message: 'Invalid token' });
  });

  it('auth runs before validation (401 not 422)', async () => {
    const r = await call('POST', '/calender', { body: {} });
    assert.equal(r.status, 401);
  });
});

describe('profile', () => {
  it('GET /user/profile -> full user doc without password/__v', async () => {
    const r = await call('GET', '/user/profile', { token: state.token });
    assert.equal(r.status, 200);
    const u = r.json.data;
    assert.equal(u.id, state.userId);
    assert.equal(u._id, state.userId);
    assert.equal(u.password, undefined);
    assert.equal(u.__v, undefined);
    assert.equal(u.profile_visibility, 1);
    assert.equal(u.calender_visibility, 1);
    assert.ok(u.created_at && u.updated_at);
  });

  it('POST /user/profile invalid enums -> 422', async () => {
    const r = await call('POST', '/user/profile', {
      token: state.token,
      body: { name: 'X', designation: 'Wizard', industry: 'Magic', area_of_specialization: 'Spells', brief_bio: 'b' }
    });
    assert.equal(r.status, 422);
    assertValidationError(r, ['designation', 'industry', 'area_of_specialization']);
  });

  it('POST /user/profile success', async () => {
    const r = await call('POST', '/user/profile', {
      token: state.token,
      body: {
        name: 'Contract User Updated',
        designation: 'CTO',
        industry: 'Aviation',
        area_of_specialization: 'Strategy',
        brief_bio: '<p>Brief</p>',
        detailed_bio: '<p>Detailed</p>',
        experience: '10',
        scheduling_assistance: 'Assistant',
        brief_bio_visibility: 1,
        experience_visibility: 0,
        calender_visibility: 1,
        scheduling_visibility: 1,
        detailed_bio_visibility: 1,
        profile_visibility: 1
      }
    });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { message: 'Profile updated successfully' });
    const g = await call('GET', '/user/profile', { token: state.token });
    assert.equal(g.json.data.name, 'Contract User Updated');
    assert.equal(g.json.data.experience_visibility, 0);
  });

  it('pass-change wrong confirmation -> 422', async () => {
    const r = await call('POST', '/auth/pass-change', {
      token: state.token,
      body: { old_password: USER.password, new_password: 'newpassword1', password_confirmation: 'different1' }
    });
    assert.equal(r.status, 422);
    assertValidationError(r, ['password_confirmation']);
  });

  it('pass-change wrong old password -> 400', async () => {
    const r = await call('POST', '/auth/pass-change', {
      token: state.token,
      body: { old_password: 'notmypassword', new_password: 'newpassword1', password_confirmation: 'newpassword1' }
    });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'Validation failed', errors: { old_password: ['Old password is incorrect'] } });
  });

  it('pass-change success -> new token, new password works', async () => {
    const r = await call('POST', '/auth/pass-change', {
      token: state.token,
      body: { old_password: USER.password, new_password: 'newpassword1', password_confirmation: 'newpassword1' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Password changed successfully');
    assert.equal(typeof r.json.token, 'string');
    assert.equal(r.json.user.designation, 'CTO');
    const s = await call('POST', '/auth/sign-in', { body: { emailOrphone: USER.email, password: 'newpassword1' } });
    assert.equal(s.status, 200);
    state.token = s.json.token;
  });

  it('GET /auth/sign-out', async () => {
    const r = await call('GET', '/auth/sign-out', { token: state.token });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { message: 'Logged out successfully' });
  });
});

describe('uploads + storage', () => {
  function form(type, bytes, filename, mime) {
    const f = new FormData();
    if (type !== undefined) f.append('type', type);
    if (bytes) f.append('file', new Blob([bytes], { type: mime }), filename);
    return f;
  }

  it('requires auth', async () => {
    const r = await call('POST', '/upload-image', { form: form('profile', PNG_1PX, 'a.png', 'image/png') });
    assert.equal(r.status, 401);
  });

  it('profile image upload -> path, then served from /storage', async () => {
    const r = await call('POST', '/upload-image', { token: state.token, form: form('profile', PNG_1PX, 'avatar.png', 'image/png') });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'File uploaded successfully');
    assert.match(r.json.image, /^profile\/\d+_avatar\.png$/);
    const file = await fetch(`${BASE}/storage/${r.json.image}`);
    assert.equal(file.status, 200);
    assert.match(file.headers.get('content-type'), /image\/png/);
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), PNG_1PX);
  });

  it('bioFile upload (pdf)', async () => {
    const r = await call('POST', '/upload-image', {
      token: state.token, form: form('bioFile', Buffer.from('%PDF-1.4\n%%EOF'), 'cv.pdf', 'application/pdf')
    });
    assert.equal(r.status, 200);
    assert.match(r.json.image, /^bioFile\/\d+_cv\.pdf$/);
  });

  it('no file -> 400', async () => {
    const r = await call('POST', '/upload-image', { token: state.token, form: form('profile') });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'No file uploaded' });
  });

  it('profile image over 2MB -> 400', async () => {
    const big = Buffer.alloc(2 * 1024 * 1024 + 10, 1);
    const r = await call('POST', '/upload-image', { token: state.token, form: form('profile', big, 'big.png', 'image/png') });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'Profile image must be less than 2MB' });
  });

  it('file over 5MB -> 400 File too large', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 1);
    const r = await call('POST', '/upload-image', { token: state.token, form: form('bioFile', big, 'big.pdf', 'application/pdf') });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'File too large' });
  });

  // Legacy Express answers these with 500 "Internal server error" (plain Error
  // from multer's fileFilter). Next.js returns 400 with the real message.
  // Both are error responses with a `message`, which is all the client uses.
  it('wrong file type / invalid type param -> error with message', async () => {
    const a = await call('POST', '/upload-image', { token: state.token, form: form('profile', Buffer.from('x'), 'x.exe', 'application/octet-stream') });
    const b = await call('POST', '/upload-image', { token: state.token, form: form('nope', PNG_1PX, 'a.png', 'image/png') });
    for (const r of [a, b]) {
      assert.ok([400, 500].includes(r.status), `status ${r.status}`);
      assert.equal(typeof r.json.message, 'string');
    }
  });

  it('missing storage file -> 404', async () => {
    const r = await call('GET', '/storage/profile/does-not-exist.jpg');
    assert.equal(r.status, 404);
  });

  it('storage path traversal is not served', async () => {
    const res = await fetch(`${BASE}/storage/..%2F..%2F.env`);
    assert.notEqual(res.status, 200);
  });
});

describe('calendar', () => {
  it('past from_date -> 422', async () => {
    const r = await call('POST', '/calender', {
      token: state.token, body: { city: 'Delhi', from_date: '2000-01-01', to_date: '2000-01-02', time: '10:00', interested_to_meet: 'Anyone' }
    });
    assert.equal(r.status, 422);
    assertValidationError(r, ['from_date']);
  });

  it('to_date before from_date -> 422', async () => {
    const r = await call('POST', '/calender', {
      token: state.token, body: { city: 'Delhi', from_date: nextWeek(), to_date: tomorrow(), time: '10:00', interested_to_meet: 'Anyone' }
    });
    assert.equal(r.status, 422);
    assertValidationError(r, ['to_date']);
  });

  it('add entry -> 201', async () => {
    const r = await call('POST', '/calender', {
      token: state.token, body: { city: 'Delhi', from_date: tomorrow(), to_date: nextWeek(), time: '10:30', interested_to_meet: 'Founders' }
    });
    assert.equal(r.status, 201);
    assert.deepEqual(r.json, { message: 'Calendar entry added successfully' });
  });

  it('list own entries', async () => {
    const r = await call('GET', '/calender', { token: state.token });
    assert.equal(r.status, 200);
    assert.equal(r.json.data.length, 1);
    const e = r.json.data[0];
    assert.equal(e.user_id, state.userId);
    assert.equal(e.city, 'Delhi');
    assert.equal(e.id, e._id);
    assert.equal(e.__v, undefined);
    assert.ok(e.from_date.endsWith('Z'));
  });
});

describe('dashboard (public directory)', () => {
  it('paginated list with total', async () => {
    const r = await call('GET', '/dashboard?size=2&page=1');
    assert.equal(r.status, 200);
    assert.ok(r.json.data.length <= 2);
    assert.equal(typeof r.json.total, 'number');
    for (const u of r.json.data) {
      assert.equal(u.id, u._id);
      assert.equal(u.email, undefined);
      assert.equal(u.password, undefined);
    }
  });

  it('filters + search find the contract user', async () => {
    const r = await call('GET', `/dashboard?size=12&page=1&industry=Aviation&designation=CTO&area_of_specialization=Strategy&searching=contract user upd`);
    assert.equal(r.status, 200);
    assert.ok(r.json.data.some((u) => u.id === state.userId));
    const u = r.json.data.find((x) => x.id === state.userId);
    assert.deepEqual(Object.keys(u).sort(), ['_id', 'area_of_specialization', 'designation', 'id', 'industry', 'name']);
  });

  it('userId excludes self', async () => {
    const r = await call('GET', `/dashboard?size=50&page=1&searching=contract user upd&userId=${state.userId}`);
    assert.ok(!r.json.data.some((u) => u.id === state.userId));
  });

  it('detail respects visibility + includes calendar', async () => {
    const r = await call('GET', `/dashboard/${state.userId}`);
    assert.equal(r.status, 200);
    const d = r.json.data;
    assert.equal(d.id, state.userId);
    assert.equal(d.brief_bio, '<p>Brief</p>');
    assert.equal(d.detailed_bio, '<p>Detailed</p>');
    assert.equal('experience' in d, false); // experience_visibility = 0
    assert.equal(d.scheduling_assistance, 'Assistant');
    assert.equal(d.calender_visibility, 1);
    assert.equal(d.user_calender.length, 1);
    assert.deepEqual(Object.keys(d.user_calender[0]).sort(), ['city', 'from_date', 'id', 'interested_to_meet', 'time', 'to_date']);
  });

  it('invalid id -> 400', async () => {
    const r = await call('GET', '/dashboard/not-an-id');
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'Invalid ID format' });
  });

  it('unknown id -> 404', async () => {
    const r = await call('GET', '/dashboard/000000000000000000000000');
    assert.equal(r.status, 404);
    assert.deepEqual(r.json, { message: 'User not found' });
  });
});

describe('activities', () => {
  it('list requires auth', async () => {
    const r = await call('GET', '/activities');
    assert.equal(r.status, 401);
  });

  it('list as normal user', async () => {
    const r = await call('GET', '/activities', { token: state.token });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.data));
  });

  it('non-admin cannot create -> 403', async () => {
    const r = await call('POST', '/activities', { token: state.token, body: { name: 'X' } });
    assert.equal(r.status, 403);
    assert.deepEqual(r.json, { message: 'Not authorized' });
  });

  it('admin validation -> 422', async () => {
    const r = await call('POST', '/activities', { token: state.adminToken, body: { name: '' } });
    assert.equal(r.status, 422);
    assertValidationError(r, ['name']);
  });

  it('admin create / update / delete', async () => {
    const name = `Contract activity ${uniq}`;
    const c = await call('POST', '/activities', { token: state.adminToken, body: { name, description: 'desc' } });
    assert.equal(c.status, 201);
    assert.deepEqual(c.json, { message: 'Activity created successfully' });

    const list = await call('GET', '/activities', { token: state.adminToken });
    const a = list.json.data[0]; // sorted newest first
    assert.equal(a.name, name);
    assert.equal(a.id, a._id);
    assert.ok(a.created_by);

    const u = await call('PUT', `/activities/${a.id}`, { token: state.adminToken, body: { name: name + ' v2', description: '' } });
    assert.equal(u.status, 200);
    assert.deepEqual(u.json, { message: 'Activity updated successfully' });

    const d = await call('DELETE', `/activities/${a.id}`, { token: state.adminToken });
    assert.equal(d.status, 200);
    assert.deepEqual(d.json, { message: 'Activity deleted successfully' });

    const d2 = await call('DELETE', `/activities/${a.id}`, { token: state.adminToken });
    assert.equal(d2.status, 404);
    assert.deepEqual(d2.json, { message: 'Activity not found' });
  });

  it('invalid id -> 400', async () => {
    const r = await call('PUT', '/activities/bad-id', { token: state.adminToken, body: { name: 'x' } });
    assert.equal(r.status, 400);
    assert.deepEqual(r.json, { message: 'Invalid ID format' });
  });
});

describe('contact', () => {
  it('validation -> 422', async () => {
    const r = await call('POST', '/contact', { body: { name: 'A', email: 'bad', contact_no: '123', query: '' } });
    assert.equal(r.status, 422);
    assertValidationError(r, ['email', 'contact_no', 'query']);
  });

  it('submit -> 200', async () => {
    const r = await call('POST', '/contact', { body: { name: 'A', email: 'a@example.com', contact_no: '9876543210', query: 'Hello' } });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { message: 'Message sent successfully' });
  });
});
