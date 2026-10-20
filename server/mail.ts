import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Outgoing email over SMTP (Gmail: smtp.gmail.com, port 465, an App Password).
 * Not configured (no SMTP_HOST) -> nothing is sent and a warning is logged, so
 * every feature that sends mail keeps working without it.
 */
let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  });
  return transporter;
}

function mailFrom() {
  if (process.env.MAIL_FROM) return process.env.MAIL_FROM;
  // Gmail only sends as the authenticated account (or a verified alias).
  return `"KNOWLEDGE CAPITA" <${process.env.SMTP_USER || 'no-reply@knowledgecapita.com'}>`;
}

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

/** Sends a message; never throws. Returns whether it was handed to the SMTP server. */
export async function sendMail(msg: MailMessage): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] SMTP not configured, not sent: "${msg.subject}"`);
    return false;
  }
  try {
    await t.sendMail({ from: mailFrom(), ...msg });
    return true;
  } catch (err) {
    console.error(`[mail] sending "${msg.subject}" failed:`, (err as Error).message);
    return false;
  }
}

/** Escape text for inclusion in an HTML email body. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Header-safe single line (subject lines built from user input). */
export function oneLine(value: string, max = 100) {
  return value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}
