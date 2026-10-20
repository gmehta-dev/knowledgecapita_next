import { handler } from '@/server/http';
import { deleteUser, getUser, updateUser } from '@/server/controllers/adminController';

export const GET = handler<{ id: string }>(async (req, { params }) => getUser(req, (await params).id));
export const PUT = handler<{ id: string }>(async (req, { params }) => updateUser(req, (await params).id));
export const DELETE = handler<{ id: string }>(async (req, { params }) => deleteUser(req, (await params).id));
