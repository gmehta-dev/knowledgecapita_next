import { handler } from '@/server/http';
import { signUp } from '@/server/controllers/authController';

export const POST = handler(signUp);
