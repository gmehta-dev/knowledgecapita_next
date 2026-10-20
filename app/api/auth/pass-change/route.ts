import { handler } from '@/server/http';
import { passChange } from '@/server/controllers/authController';

export const POST = handler(passChange);
