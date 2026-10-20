import { handler } from '@/server/http';
import { getProfile, updateProfile } from '@/server/controllers/userController';

export const GET = handler(getProfile);
export const POST = handler(updateProfile);
