import { handler } from '@/server/http';
import { getUserById } from '@/server/controllers/dashboardController';

export const GET = handler<{ pid: string }>(async (req, { params }) => getUserById(req, (await params).pid));
