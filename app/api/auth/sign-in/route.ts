import { handler } from '@/server/http';
import { signIn } from '@/server/controllers/authController';

export const POST = handler(signIn);
