import { handler } from '@/server/http';
import { deleteActivity, updateActivity } from '@/server/controllers/activityController';

export const PUT = handler<{ id: string }>(async (req, { params }) => updateActivity(req, (await params).id));
export const DELETE = handler<{ id: string }>(async (req, { params }) => deleteActivity(req, (await params).id));
