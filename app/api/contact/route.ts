import { handler } from '@/server/http';
import { submitContact } from '@/server/controllers/contactController';

export const POST = handler(submitContact);
