import 'server-only';
import type { NextRequest } from 'next/server';
import Activity from '../models/Activity';
import { ApiError } from '../errors';
import { assertObjectId, json, readBody, validate } from '../http';
import { assertCanManageActivities, requireUser } from '../auth';
import { activitySchema } from '../validators/activityValidator';

// GET /activities
export async function getActivities(req: NextRequest) {
  await requireUser(req);
  const activities = await Activity.find().sort({ created_at: -1 });
  return json({ data: activities });
}

// POST /activities
export async function createActivity(req: NextRequest) {
  const user = await requireUser(req);
  assertCanManageActivities(user);
  const body = await readBody(req);
  validate(activitySchema, body);
  const { name, description } = body;

  await Activity.create({
    name,
    description,
    created_by: user._id
  });

  return json({ message: 'Activity created successfully' }, 201);
}

// PUT /activities/:id
export async function updateActivity(req: NextRequest, id: string) {
  const user = await requireUser(req);
  assertCanManageActivities(user);
  assertObjectId(id);
  const body = await readBody(req);
  validate(activitySchema, body);
  const { name, description } = body;

  const activity = await Activity.findByIdAndUpdate(
    id,
    { name, description },
    { new: true, runValidators: true }
  );

  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  return json({ message: 'Activity updated successfully' });
}

// DELETE /activities/:id
export async function deleteActivity(req: NextRequest, id: string) {
  const user = await requireUser(req);
  assertCanManageActivities(user);
  assertObjectId(id);

  const activity = await Activity.findByIdAndDelete(id);
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  return json({ message: 'Activity deleted successfully' });
}
