import { handler } from '@/server/http';
import { passResetConfirm } from '@/server/controllers/authController';

export const POST = handler(passResetConfirm);
