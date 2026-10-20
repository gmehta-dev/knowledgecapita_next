import 'server-only';
import type { NextRequest } from 'next/server';
import ContactMessage from '../models/ContactMessage';
import { json, readBody, validate } from '../http';
import { contactSchema } from '../validators/contactValidator';

// POST /contact
export async function submitContact(req: NextRequest) {
  const body = await readBody(req);
  validate(contactSchema, body);
  const { name, email, contact_no, query } = body;

  await ContactMessage.create({ name, email, contact_no, query });

  return json({ message: 'Message sent successfully' });
}
