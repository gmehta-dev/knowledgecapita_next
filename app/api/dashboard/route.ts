import { handler } from '@/server/http';
import { getUsers } from '@/server/controllers/dashboardController';

export const GET = handler(getUsers);
