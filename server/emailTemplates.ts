import 'server-only';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import { escapeHtml, oneLine } from './mail';

/**
 * Branded transactional emails. One shared layout, built for email clients:
 * table layout, inline styles, 600px max width, a bulletproof button, a hidden
 * preheader, and a plain-text version of every message.
 * Everything that comes from users is HTML-escaped here.
 */

export interface Email {
  subject: string;
  text: string;
  html: string;
}

const C = {
  brand: '#1e3a5f',
  brandLight: '#2563eb',
  page: '#f1f5f9',
  card: '#ffffff',
  heading: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  border: '#e2e8f0',
  note: '#f8fafc'
};
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const LOGO = `${SITE_URL}/assets/images/logo.png`;

function button(label: string, href: string) {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
  <tr>
    <td align="center" bgcolor="${C.brand}" style="border-radius:8px">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:600;line-height:1.35;color:#ffffff;text-decoration:none;border-radius:8px">${label}</a>
    </td>
  </tr>
</table>`;
}

function note(html: string) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
  <tr>
    <td style="background:${C.note};border:1px solid ${C.border};border-left:4px solid ${C.brand};border-radius:6px;padding:14px 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.body}">${html}</td>
  </tr>
</table>`;
}

const p = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.body}">${html}</p>`;

const small = (html: string) =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted}">${html}</p>`;

/** `preheader` is plain text (escaped here); `heading`, `content` and `footer` are HTML. */
function layout({ preheader, heading, content, footer }: { preheader: string; heading: string; content: string; footer: string }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
        <tr>
          <td style="background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="height:6px;background:${C.brand};font-size:0;line-height:0">&nbsp;</td></tr>
              <tr>
                <td align="center" style="padding:28px 32px 8px">
                  <a href="${SITE_URL}" target="_blank"><img src="${LOGO}" width="120" alt="${SITE_NAME}" style="display:block;width:120px;max-width:120px;height:auto;border:0"></a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px 32px">
                  <h1 style="margin:0 0 20px;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:700;color:${C.heading}">${heading}</h1>
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 16px 0">
            <p style="margin:0 0 6px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted}">${footer}</p>
            <p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted}"><a href="${SITE_URL}" target="_blank" style="color:${C.muted};text-decoration:underline">${SITE_NAME}</a> &middot; Amplifying the knowledge capital of the world</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

const firstName = (name: string) => (name || '').trim().split(/\s+/)[0] || 'there';

/** Sent after a successful sign-up. */
export function welcomeEmail(name: string): Email {
  const first = firstName(name);
  const loginUrl = `${SITE_URL}/login`;
  const step = (n: number, title: string, text: string) => `
<tr>
  <td width="36" valign="top" style="padding:0 0 14px">
    <div style="width:26px;height:26px;border-radius:13px;background:${C.brand};color:#ffffff;font-family:${FONT};font-size:13px;font-weight:700;line-height:26px;text-align:center">${n}</div>
  </td>
  <td valign="top" style="padding:2px 0 14px;font-family:${FONT};font-size:15px;line-height:1.5;color:${C.body}"><strong style="color:${C.heading}">${title}</strong><br>${text}</td>
</tr>`;

  return {
    subject: `Welcome to ${SITE_NAME}`,
    text:
      `Hi ${first},\n\n` +
      `Welcome to ${SITE_NAME}! Your account has been created.\n\n` +
      `Get started:\n` +
      `1. Complete your profile: add your designation, industry, specialization and a short bio.\n` +
      `2. Add a photo, so other members recognise you.\n` +
      `3. Share your travel calendar, so members can meet you in their city.\n\n` +
      `Log in here: ${loginUrl}\n\n` +
      `If you didn't create this account, just reply to this email and let us know.\n\n` +
      `${SITE_NAME}`,
    html: layout({
      preheader: 'Your account is ready. Complete your profile so other members can find you.',
      heading: `Welcome, ${escapeHtml(first)}!`,
      content:
        p(`Thanks for joining <strong>${SITE_NAME}</strong>. Your account has been created and you can log in right away.`) +
        p('A complete profile helps other members find you and connect:') +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 0">` +
        step(1, 'Complete your profile', 'Add your designation, industry, specialization and a short bio.') +
        step(2, 'Add a photo', 'Profiles with a photo are recognised and contacted more often.') +
        step(3, 'Share your calendar', 'Let members know when you are in their city.') +
        `</table>` +
        button('Log in and complete your profile', loginUrl),
      footer: "You're receiving this email because an account was created with this address. If that wasn't you, reply to let us know."
    })
  };
}

/** Sent for POST /auth/pass-reset. `link` contains the one-time token. */
export function passwordResetEmail(name: string, link: string): Email {
  const first = firstName(name);
  return {
    subject: `Reset your ${SITE_NAME} password`,
    text:
      `Hi ${first},\n\n` +
      `We received a request to reset the password for your ${SITE_NAME} account.\n\n` +
      `Set a new password here (the link works once and expires in 1 hour):\n${link}\n\n` +
      `If you didn't ask for this, you can ignore this email. Your password stays the same.\n\n` +
      `${SITE_NAME}`,
    html: layout({
      preheader: 'Use this link within 1 hour to choose a new password.',
      heading: 'Reset your password',
      content:
        p(`Hi ${escapeHtml(first)},`) +
        p(`We received a request to reset the password for your <strong>${SITE_NAME}</strong> account. Click the button below to choose a new one.`) +
        button('Set a new password', link) +
        note('<strong>This link expires in 1 hour</strong> and can only be used once. Need a new one? Use <em>Forgot password</em> on the login page again.') +
        p("If you didn't ask for this, you can safely ignore this email. Your password won't change.") +
        small(`Button not working? Copy this address into your browser:<br><a href="${link}" target="_blank" style="color:${C.brandLight};word-break:break-all">${link}</a>`),
      footer: 'For your security, we never ask for your password by email.'
    })
  };
}

/** Sent to the site owner for each contact form submission. */
export function contactNotificationEmail(msg: { name: string; email: string; contact_no: string; query: string }): Email {
  const subjectName = oneLine(msg.name);
  const row = (label: string, value: string) => `
<tr>
  <td width="90" valign="top" style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:13px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.5px">${label}</td>
  <td valign="top" style="padding:10px 0;border-bottom:1px solid ${C.border};font-family:${FONT};font-size:15px;line-height:1.5;color:${C.heading}">${value}</td>
</tr>`;
  const email = escapeHtml(msg.email);
  const phone = escapeHtml(msg.contact_no);
  const replyHref = `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(`Re: your message to ${SITE_NAME}`)}`;

  return {
    subject: `New contact message from ${subjectName}`,
    text:
      `New message from the ${SITE_NAME} contact form.\n\n` +
      `Name:  ${msg.name}\nEmail: ${msg.email}\nPhone: ${msg.contact_no}\n\n` +
      `Message:\n${msg.query}\n\n` +
      `(Reply to this email to answer ${subjectName} directly.)`,
    html: layout({
      preheader: `${subjectName}: ${oneLine(msg.query, 90)}`,
      heading: 'New contact message',
      content:
        p(`Someone sent a message through the <strong>${SITE_NAME}</strong> contact form.`) +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border-top:1px solid ${C.border}">` +
        row('Name', escapeHtml(msg.name)) +
        row('Email', `<a href="mailto:${email}" style="color:${C.brandLight};text-decoration:none">${email}</a>`) +
        row('Phone', `<a href="tel:${phone}" style="color:${C.brandLight};text-decoration:none">${phone}</a>`) +
        `</table>` +
        `<p style="margin:0 0 8px;font-family:${FONT};font-size:13px;font-weight:600;color:${C.muted};text-transform:uppercase;letter-spacing:0.5px">Message</p>` +
        note(`<span style="white-space:pre-wrap">${escapeHtml(msg.query)}</span>`) +
        button(`Reply to ${escapeHtml(firstName(msg.name))}`, replyHref) +
        small('You can also just press Reply: the reply goes straight to the sender.'),
      footer: `Sent automatically by the contact form on ${SITE_URL.replace(/^https?:\/\//, '')}. The message is also saved in the database.`
    })
  };
}
