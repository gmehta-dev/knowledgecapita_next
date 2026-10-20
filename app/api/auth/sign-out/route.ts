import { handler } from '@/server/http';
import { signOut } from '@/server/controllers/authController';

export const GET = handler(signOut);
