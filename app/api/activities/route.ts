import { handler } from '@/server/http';
import { createActivity, getActivities } from '@/server/controllers/activityController';

export const GET = handler(getActivities);
export const POST = handler(createActivity);
