/**
 * Email features end to end: welcome email, password reset by email link and contact form
 * notifications (Next.js only). Runs a throwaway SMTP server that captures the
 * mail the app sends, so no real email leaves the machine.
 *
 * Start the app against the *_test database with:
 *   SMTP_HOST=127.0.0.1 SMTP_PORT=2525 CONTACT_NOTIFY_TO=owner@example.com SITE_URL=https://knowledgecapita.com
 * then:
 *   API_BASE=http://localhost:4110/api node --test tests/contract/email.test.mjs
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

const API = (process.env.API_BASE || 'http://localhost:3000/api').replace(/\/$/, '');
const SITE = API.replace(/\/api$/, '');
const SINK_PORT = Number(process.env.SMTP_SINK_PORT || 2525);
const NOTIFY_TO = process.env.CONTACT_NOTIFY_TO || 'owner@example.com';
const PUBLIC_SITE = process.env.SITE_URL || 'https://knowledgecapita.com';
const TEST_URI = process.env.TEST_URI || 'mongodb://localhost:27017/sharecom_contract_test';

// --- capturing SMTP server -------------------------------------------------
const mails = [];
const sink = net.createServer((sock) => {
  sock.setEncoding('utf8');
  let buf = '';
  let data = null;
  sock.write('220 sink ESMTP\r\n');
  sock.on('data', (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (data !== null) {
        if (line === '.') { mails.push(parseMail(data)); data = null; sock.write('250 OK\r\n'); }
        else data += (line.startsWith('..') ? line.slice(1) : line) + '\r\n';
        continue;
      }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250 sink\r\n');
      else if (cmd === 'DATA') { data = ''; sock.write('354 go\r\n'); }
      else if (cmd === 'QUIT') sock.end('221 bye\r\n');
      else sock.write('250 OK\r\n');
    }
  });
});

function parseMail(raw) {
  const [head] = raw.split('\r\n\r\n');
  const headers = {};
  for (const l of head.replace(/\r\n[ \t]+/g, ' ').split('\r\n')) {
    const m = l.match(/^([\w-]+):\s*(.*)$/);
    if (m) headers[m[1].toLowerCase()] = m[2];
  }
  const decoded = raw.replace(/=\r\n/g, '').replace(/=([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return { raw, headers, body: decoded };
}

async function nextMail(count, ms = 5000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (mails.length > count) return mails[count];
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

// --- helpers ---------------------------------------------------------------
const call = (method, path, body) =>
  fetch(API + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    .then(async (r) => ({ status: r.status, json: await r.json() }));

const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const USER = {
  name: `<b>Tester</b> Reset ${uniq}`, // first name holds HTML: must be escaped in emails
  email: `reset.${uniq}@example.com`,
  phone_number: `7${uniq.slice(-9)}`,
  password: 'old-password-1'
};
let db;
const tokenOf = (mail) => mail.body.match(/reset-password\?token=([a-f0-9]{64})/)?.[1];

before(async () => {
  const u = new URL(TEST_URI);
  assert.ok(['localhost', '127.0.0.1'].includes(u.hostname) && u.pathname.endsWith('_test'), 'test DB only');
  await new Promise((r) => sink.listen(SINK_PORT, '127.0.0.1', r));
  db = await mongoose.createConnection(TEST_URI).asPromise();
});

after(async () => {
  sink.close();
  await db?.close();
});

describe('welcome email', () => {
  it('sign-up -> 201 and a welcome email to the new member', async () => {
    const n = mails.length;
    assert.equal((await call('POST', '/auth/sign-up', USER)).status, 201);
    const mail = await nextMail(n);
    assert.ok(mail, 'email received');
    assert.match(mail.headers.to, new RegExp(USER.email));
    assert.equal(mail.headers.subject, 'Welcome to KNOWLEDGE CAPITA');
    assert.ok(mail.body.includes(`${PUBLIC_SITE}/login`));
    assert.ok(mail.body.includes('&lt;b&gt;Tester&lt;/b&gt;'), 'name is HTML-escaped');
    assert.ok(!mail.body.includes(USER.password), 'password never emailed');
  });

  it('a failed sign-up (duplicate) sends nothing', async () => {
    const n = mails.length;
    assert.equal((await call('POST', '/auth/sign-up', USER)).status, 400);
    assert.equal(await nextMail(n, 800), null);
  });
});

describe('password reset email', () => {
  let token;

  it('unknown email -> same 200 message, no email sent', async () => {
    const n = mails.length;
    const r = await call('POST', '/auth/pass-reset', { email: `nobody.${uniq}@example.com` });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Reset link sent to your email');
    assert.equal(await nextMail(n, 800), null);
  });

  it('known email -> 200 and an email with a one-time link', async () => {
    const n = mails.length;
    const r = await call('POST', '/auth/pass-reset', { email: USER.email.toUpperCase() });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Reset link sent to your email');
    const mail = await nextMail(n);
    assert.ok(mail, 'email received');
    assert.match(mail.headers.to, new RegExp(USER.email));
    assert.equal(mail.headers.subject, 'Reset your KNOWLEDGE CAPITA password');
    assert.ok(mail.body.includes(`${PUBLIC_SITE}/reset-password?token=`), 'link uses the public site address');
    assert.ok(!mail.body.includes('localhost'), 'no internal host in the email');
    assert.ok(mail.body.includes('&lt;b&gt;Tester&lt;/b&gt;'), 'name is HTML-escaped');
    token = tokenOf(mail);
    assert.ok(token);
  });

  it('only a hash of the token is stored, with a ~1 hour expiry', async () => {
    const doc = await db.collection('users').findOne({ email: USER.email });
    assert.equal(doc.password_reset_token, crypto.createHash('sha256').update(token).digest('hex'));
    const mins = (doc.password_reset_expires.getTime() - Date.now()) / 60000;
    assert.ok(mins > 58 && mins <= 60, `expires in ${mins} min`);
  });

  it('a second request right away sends nothing (2 minute throttle)', async () => {
    const n = mails.length;
    const r = await call('POST', '/auth/pass-reset', { email: USER.email });
    assert.equal(r.status, 200);
    assert.equal(await nextMail(n, 800), null);
  });

  it('confirm validation -> 422', async () => {
    let r = await call('POST', '/auth/pass-reset/confirm', { token, password: 'new-password-1', password_confirmation: 'different-1' });
    assert.equal(r.status, 422);
    assert.ok(r.json.errors.password_confirmation);
    r = await call('POST', '/auth/pass-reset/confirm', { token: 'abc', password: 'new-password-1', password_confirmation: 'new-password-1' });
    assert.equal(r.status, 422);
    assert.ok(r.json.errors.token);
    r = await call('POST', '/auth/pass-reset/confirm', { token, password: 'short', password_confirmation: 'short' });
    assert.equal(r.status, 422);
  });

  it('wrong token -> 400, password unchanged', async () => {
    const r = await call('POST', '/auth/pass-reset/confirm', { token: 'f'.repeat(64), password: 'new-password-1', password_confirmation: 'new-password-1' });
    assert.equal(r.status, 400);
    assert.equal((await call('POST', '/auth/sign-in', { emailOrphone: USER.email, password: USER.password })).status, 200);
  });

  it('valid token -> 200, new password works, old one does not', async () => {
    const r = await call('POST', '/auth/pass-reset/confirm', { token, password: 'new-password-1', password_confirmation: 'new-password-1' });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Password has been reset. You can now log in.');
    assert.equal((await call('POST', '/auth/sign-in', { emailOrphone: USER.email, password: USER.password })).status, 401);
    assert.equal((await call('POST', '/auth/sign-in', { emailOrphone: USER.email, password: 'new-password-1' })).status, 200);
    const doc = await db.collection('users').findOne({ email: USER.email });
    assert.equal(doc.password_reset_token, undefined);
    assert.equal(doc.password_reset_expires, undefined);
  });

  it('the same link cannot be used twice', async () => {
    const r = await call('POST', '/auth/pass-reset/confirm', { token, password: 'another-pass-2', password_confirmation: 'another-pass-2' });
    assert.equal(r.status, 400);
  });

  it('an expired link is rejected', async () => {
    const n = mails.length;
    assert.equal((await call('POST', '/auth/pass-reset', { email: USER.email })).status, 200);
    const t2 = tokenOf(await nextMail(n));
    await db.collection('users').updateOne({ email: USER.email }, { $set: { password_reset_expires: new Date(Date.now() - 1000) } });
    const r = await call('POST', '/auth/pass-reset/confirm', { token: t2, password: 'another-pass-2', password_confirmation: 'another-pass-2' });
    assert.equal(r.status, 400);
    assert.equal((await call('POST', '/auth/sign-in', { emailOrphone: USER.email, password: 'new-password-1' })).status, 200);
  });

  it('reset page is noindex and sends no referrer', async () => {
    const r = await fetch(`${SITE}/reset-password?token=${'a'.repeat(64)}`);
    assert.equal(r.status, 200);
    const html = await r.text();
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
    assert.match(html, /<meta name="referrer" content="no-referrer"/);
  });
});

describe('contact form notification', () => {
  it('saves the message and emails the owner with Reply-To set to the sender', async () => {
    const n = mails.length;
    const r = await call('POST', '/contact', { name: `Contact Tester ${uniq}`, email: `sender.${uniq}@example.com`, contact_no: '9876543210', query: `Hello from ${uniq}` });
    assert.equal(r.status, 200);
    assert.equal(r.json.message, 'Message sent successfully');
    const mail = await nextMail(n);
    assert.ok(mail, 'email received');
    assert.match(mail.headers.to, new RegExp(NOTIFY_TO));
    assert.match(mail.headers['reply-to'], new RegExp(`sender.${uniq}@example.com`));
    assert.equal(mail.headers.subject, `New contact message from Contact Tester ${uniq}`);
    assert.ok(mail.body.includes(`Hello from ${uniq}`));
    assert.ok(mail.body.includes('9876543210'));
    assert.ok(await db.collection('contactmessages').findOne({ query: `Hello from ${uniq}` }), 'saved in the database');
  });

  it('message HTML is escaped, line breaks kept, text version included', async () => {
    const n = mails.length;
    const query = `Line one <script>alert(1)</script>\nLine two ${uniq}`;
    assert.equal((await call('POST', '/contact', { name: 'Html Tester', email: `h.${uniq}@example.com`, contact_no: '9876543210', query })).status, 200);
    const mail = await nextMail(n);
    assert.ok(mail);
    const html = mail.body.slice(mail.body.indexOf('text/html'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'escaped in HTML');
    assert.ok(!html.includes('<script>'), 'no raw script in HTML');
    assert.ok(html.includes('white-space:pre-wrap'), 'line breaks preserved');
    assert.ok(mail.body.includes('text/plain'), 'has a plain-text part');
  });

  it('a name with line breaks cannot add email headers', async () => {
    const n = mails.length;
    const r = await call('POST', '/contact', { name: `Evil\r\nBcc: victim@example.com\r\nX: ${uniq}`, email: `e.${uniq}@example.com`, contact_no: '9876543210', query: 'hi' });
    assert.equal(r.status, 200);
    const mail = await nextMail(n);
    assert.ok(mail);
    assert.ok(!/^bcc:/im.test(mail.raw.split('\r\n\r\n')[0]), 'no Bcc header');
    assert.ok(!mail.headers.x, 'no injected header');
  });
});
