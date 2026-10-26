import 'server-only';
import type { NextRequest } from 'next/server';
import ContactMessage from '../models/ContactMessage';
import { json, readBody, validate } from '../http';
import { contactSchema } from '../validators/contactValidator';
import { sendMail } from '../mail';
import { contactNotificationEmail } from '../emailTemplates';

// POST /contact
export async function submitContact(req: NextRequest) {
  const body = await readBody(req);
  validate(contactSchema, body);
  const { name, email, contact_no, query } = body;

  await ContactMessage.create({ name, email, contact_no, query });

  // Notify the site owner (the message is already saved, so a mail failure loses nothing).
  const notifyTo = process.env.CONTACT_NOTIFY_TO || process.env.SMTP_USER;
  if (notifyTo) {
    void sendMail({ to: notifyTo, replyTo: email, ...contactNotificationEmail({ name, email, contact_no, query }) });
  }

  return json({ message: 'Message sent successfully' });
}
