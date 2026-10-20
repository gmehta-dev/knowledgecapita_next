import { handler } from '@/server/http';
import { passReset } from '@/server/controllers/authController';

export const POST = handler(passReset);
