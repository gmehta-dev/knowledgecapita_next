import { handler } from '@/server/http';
import { listUsers } from '@/server/controllers/adminController';

export const GET = handler(listUsers);
