/**
 * Rich-text bios (brief_bio, experience, detailed_bio) can't carry scripts
 * (Next.js only). Checks saving through the profile form and the admin edit,
 * and bios already stored before sanitizing existed.
 *
 *   API_BASE=http://localhost:4110/api node --test tests/contract/sanitize.test.mjs
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { SUPER_ADMIN } from './fixtures.mjs';

const API = (process.env.API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const SITE = API.replace(/\/api$/, '');
const TEST_URI = process.env.TEST_URI || 'mongodb://localhost:27017/sharecom_contract_test';

const call = (method, path, body, token) =>
  fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  }).then(async (r) => ({ status: r.status, json: await r.json() }));

const ATTACK = [
  '<p>Hi<script>alert("s1")</script></p>',
  '<img src=x onerror="alert(\'s2\')">',
  '<a href="javascript:alert(\'s3\')">click</a>',
  '<a href="data:text/html,<script>alert(\'s4\')</script>">data</a>',
  '<p onclick="alert(\'s5\')" style="background:url(javascript:alert(\'s6\'))">p</p>',
  '<iframe src="https://evil.example"></iframe>',
  '<svg onload="alert(\'s7\')"><circle/></svg>',
  '<span style="color: expression(alert(\'s8\'))">e</span>',
  '<form action="https://evil.example"><input name="q"></form>',
  '<style>body{display:none}</style>',
  '<a href="//evil.example">proto-relative</a>'
].join('');

// Formatting real bios use, which must survive unchanged in meaning.
const LEGIT =
  '<p class="ql-align-justify"><strong>Bold</strong> <em>italic</em> <u>under</u> <s>strike</s></p>' +
  '<p><span style="color: rgb(0, 0, 255);">blue</span> <a href="https://example.com/x" target="_blank">link</a> <a href="mailto:a@example.com">mail</a></p>' +
  '<ul><li>one</li></ul><ol><li>two</li></ol><h2>Heading</h2><p><br></p>';

function assertClean(html, label) {
  assert.ok(typeof html === 'string', `${label}: is a string`);
  for (const bad of [/<script/i, /<img/i, /<iframe/i, /<svg/i, /<form/i, /<input/i, /<style/i, /\son\w+=/i, /javascript:/i, /data:text/i, /expression\(/i, /url\(/i, /href="\/\//i]) {
    assert.ok(!bad.test(html), `${label}: must not contain ${bad} — got ${html}`);
  }
}

function assertLegitKept(html, label) {
  for (const good of [
    '<p class="ql-align-justify"><strong>Bold</strong> <em>italic</em> <u>under</u> <s>strike</s></p>',
    '<span style="color:rgb(0, 0, 255)">blue</span>',
    'href="https://example.com/x"',
    'href="mailto:a@example.com"',
    'rel="noopener noreferrer nofollow"',
    '<ul><li>one</li></ul><ol><li>two</li></ol><h2>Heading</h2>'
  ]) {
    assert.ok(html.includes(good), `${label}: keeps ${good} — got ${html}`);
  }
}

const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const USER = { name: `Sanitize Tester ${uniq}`, email: `san.${uniq}@example.com`, phone_number: `5${uniq.slice(-9)}`, password: 'password123' };
const s = {};
let db;

before(async () => {
  const u = new URL(TEST_URI);
  assert.ok(['localhost', '127.0.0.1'].includes(u.hostname) && u.pathname.endsWith('_test'), 'test DB only');
  db = await mongoose.createConnection(TEST_URI).asPromise();
  assert.equal((await call('POST', '/auth/sign-up', USER)).status, 201);
  const login = await call('POST', '/auth/sign-in', { emailOrphone: USER.email, password: USER.password });
  s.token = login.json.token;
  s.id = login.json.user.id;
  s.super = (await call('POST', '/auth/sign-in', { emailOrphone: SUPER_ADMIN.email, password: SUPER_ADMIN.password })).json.token;
});

after(async () => {
  await db?.close();
});

describe('profile form', () => {
  before(async () => {
    const r = await call('POST', '/user/profile', {
      name: USER.name,
      designation: 'Professor',
      industry: 'Academia',
      area_of_specialization: 'Physics',
      brief_bio: LEGIT + ATTACK,
      experience: ATTACK,
      detailed_bio: ATTACK
    }, s.token);
    assert.equal(r.status, 200);
  });

  it('stores cleaned HTML, keeping real formatting', async () => {
    const doc = await db.collection('users').findOne({ email: USER.email });
    assertClean(doc.brief_bio, 'stored brief_bio');
    assertClean(doc.experience, 'stored experience');
    assertClean(doc.detailed_bio, 'stored detailed_bio');
    assertLegitKept(doc.brief_bio, 'stored brief_bio');
    assert.ok(doc.brief_bio.includes('Hi') && doc.brief_bio.includes('click'), 'text content kept');
  });

  it('public profile API serves clean HTML', async () => {
    const r = await call('GET', `/dashboard/${s.id}`);
    assert.equal(r.status, 200);
    assertClean(r.json.data.brief_bio, 'API brief_bio');
    assertClean(r.json.data.experience, 'API experience');
    assertLegitKept(r.json.data.brief_bio, 'API brief_bio');
  });

  it('own profile API serves clean HTML', async () => {
    const r = await call('GET', '/user/profile', null, s.token);
    assert.equal(r.status, 200);
    assertClean(r.json.data.brief_bio, 'own brief_bio');
    assert.equal(r.json.data.password, undefined);
  });
});

describe('bios stored before sanitizing existed', () => {
  before(async () => {
    // Simulate legacy data written by the old app: raw HTML straight into the database.
    await db.collection('users').updateOne({ email: USER.email }, { $set: { brief_bio: LEGIT + ATTACK, experience: ATTACK, detailed_bio: ATTACK } });
  });

  it('public profile API cleans them on the way out', async () => {
    const r = await call('GET', `/dashboard/${s.id}`);
    assertClean(r.json.data.brief_bio, 'legacy API brief_bio');
    assertClean(r.json.data.experience, 'legacy API experience');
    assertClean(r.json.data.detailed_bio, 'legacy API detailed_bio');
    assertLegitKept(r.json.data.brief_bio, 'legacy API brief_bio');
  });

  it('server-rendered profile page contains no injected script', async () => {
    const first = await fetch(`${SITE}/profile/${s.id}`, { redirect: 'manual' });
    const page = await fetch(new URL(first.headers.get('location'), SITE));
    assert.equal(page.status, 200);
    const html = await page.text();
    for (const marker of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8']) {
      assert.ok(!html.includes(`alert("${marker}")`) && !html.includes(`alert('${marker}')`) && !html.includes(`alert(\\"${marker}\\")`) && !html.includes(`alert(\\u0027${marker}\\u0027)`), `no payload ${marker} in page`);
    }
    assert.ok(!html.includes('evil.example'), 'no attacker URLs');
  });

  it('admin view of the user is clean too', async () => {
    const r = await call('GET', `/admin/users/${s.id}`, null, s.super);
    assert.equal(r.status, 200);
    assertClean(r.json.data.brief_bio, 'admin brief_bio');
    assertClean(r.json.data.experience, 'admin experience');
  });
});

describe('admin edit', () => {
  it('stores cleaned HTML', async () => {
    const r = await call('PUT', `/admin/users/${s.id}`, { brief_bio: LEGIT + ATTACK, experience: ATTACK }, s.super);
    assert.equal(r.status, 200);
    const doc = await db.collection('users').findOne({ email: USER.email });
    assertClean(doc.brief_bio, 'admin-stored brief_bio');
    assertClean(doc.experience, 'admin-stored experience');
    assertLegitKept(doc.brief_bio, 'admin-stored brief_bio');
  });
});
