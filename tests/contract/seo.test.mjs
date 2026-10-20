/**
 * SEO URLs and server-rendered profile pages (Next.js only).
 *
 *   API_BASE=http://localhost:3000/api node --test tests/contract/seo.test.mjs
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { SUPER_ADMIN } from './fixtures.mjs';

const API = (process.env.API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const SITE = API.replace(/\/api$/, '');

const json = (method, path, body, token) =>
  fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined
  }).then(async (r) => ({ status: r.status, json: await r.json() }));

const get = (path) => fetch(SITE + path, { redirect: 'manual' });

const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const USER = {
  name: `Dr. Ana María Seo-Test ${uniq}`,
  email: `seo.${uniq}@example.com`,
  phone_number: `6${uniq.slice(-9)}`,
  password: 'password123'
};
const s = {};

before(async () => {
  assert.equal((await json('POST', '/auth/sign-up', USER)).status, 201);
  const login = await json('POST', '/auth/sign-in', { emailOrphone: USER.email, password: USER.password });
  s.id = login.json.user.id;
  const upd = await json('POST', '/user/profile', {
    name: USER.name,
    designation: 'Professor',
    industry: 'Academia',
    area_of_specialization: 'Physics',
    brief_bio: '<p>Researcher in <b>quantum</b> materials.</p>'
  }, login.json.token);
  assert.equal(upd.status, 200);
  s.slug = `dr-ana-maria-seo-test-${uniq}-${s.id}`;
  s.hiddenId = (await json('POST', '/auth/sign-in', { emailOrphone: SUPER_ADMIN.email, password: SUPER_ADMIN.password })).json.user.id;
});

describe('profile URLs', () => {
  it('legacy /profile-detail?pid= -> 308 to /profile/<slug>-<id>', async () => {
    const r = await get(`/profile-detail?pid=${s.id}`);
    assert.equal(r.status, 308);
    // hop 1: /profile/<id>, hop 2: canonical slug (both permanent)
    const hop = new URL(r.headers.get('location'), SITE).pathname;
    assert.equal(hop, `/profile/${s.id}`);
    const r2 = await get(hop);
    assert.equal(r2.status, 308);
    assert.equal(new URL(r2.headers.get('location'), SITE).pathname, `/profile/${s.slug}`);
  });

  it('legacy /profile-detail without pid -> home (as before)', async () => {
    const r = await get('/profile-detail');
    assert.ok([307, 308].includes(r.status));
    assert.equal(new URL(r.headers.get('location'), SITE).pathname, '/');
  });

  it('wrong or outdated slug -> 308 to canonical slug', async () => {
    for (const bad of [`old-name-${s.id}`, s.id]) {
      const r = await get(`/profile/${bad}`);
      assert.equal(r.status, 308, bad);
      assert.equal(new URL(r.headers.get('location'), SITE).pathname, `/profile/${s.slug}`);
    }
  });

  it('unknown or malformed id -> 404', async () => {
    assert.equal((await get('/profile/nobody-000000000000000000000000')).status, 404);
    assert.equal((await get('/profile/not-a-profile')).status, 404);
  });
});

describe('server-rendered profile page', () => {
  let html;
  before(async () => {
    const r = await get(`/profile/${s.slug}`);
    assert.equal(r.status, 200);
    html = await r.text();
  });

  it('content is in the HTML (no JavaScript needed)', () => {
    assert.match(html, new RegExp(`<h1 class="profile-name">${USER.name}</h1>`));
    assert.match(html, /Researcher in <b>quantum<\/b> materials/);
  });

  it('title, description, canonical, Open Graph', () => {
    assert.match(html, new RegExp(`<title>${USER.name} – Professor \\| KNOWLEDGE CAPITA</title>`));
    assert.match(html, /<meta name="description" content="[^"]*Professor · Academia · Physics\. Researcher in quantum materials\./);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://knowledgecapita.com/profile/${s.slug}"`));
    assert.match(html, /<meta property="og:type" content="profile"/);
    assert.ok(!/noindex/.test(html));
  });

  it('JSON-LD Person', () => {
    const m = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/);
    const ld = JSON.parse(m[1]);
    assert.equal(ld['@type'], 'Person');
    assert.equal(ld.name, USER.name);
    assert.equal(ld.jobTitle, 'Professor');
  });

  it('email is not exposed in the HTML', () => {
    assert.ok(!html.includes(USER.email));
  });

  it('hidden profile (profile_visibility 0) is noindex', async () => {
    const r = await get(`/profile/x-${s.hiddenId}`);
    const page = await get(new URL(r.headers.get('location'), SITE).pathname);
    assert.match(await page.text(), /<meta name="robots" content="noindex, nofollow"/);
  });
});

describe('sitemap.xml / robots.txt', () => {
  it('sitemap lists main pages and visible profiles only', async () => {
    const r = await get('/sitemap.xml');
    assert.equal(r.status, 200);
    const xml = await r.text();
    assert.ok(xml.includes('<loc>https://knowledgecapita.com/about-us</loc>'));
    assert.ok(xml.includes(`<loc>https://knowledgecapita.com/profile/${s.slug}</loc>`));
    assert.ok(!xml.includes(s.hiddenId));
    assert.ok(!xml.includes('/myaccount'));
  });

  it('robots.txt keeps private pages out and points to the sitemap', async () => {
    const txt = await (await get('/robots.txt')).text();
    for (const line of ['Disallow: /api/', 'Disallow: /admin/', 'Disallow: /myaccount', 'Allow: /api/storage/profile/', 'Sitemap: https://knowledgecapita.com/sitemap.xml']) {
      assert.ok(txt.includes(line), line);
    }
    assert.ok(!txt.includes('/profile-detail'));
  });
});
