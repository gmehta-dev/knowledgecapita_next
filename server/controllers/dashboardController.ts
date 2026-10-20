import 'server-only';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import User from '../models/User';
import { buildPublicProfile } from '../profiles';
import { assertObjectId, json } from '../http';

// GET /dashboard
export async function getUsers(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = params.get('page') || '1';
  const size = params.get('size') || '12';
  const industry = params.get('industry');
  const designation = params.get('designation');
  const area_of_specialization = params.get('area_of_specialization');
  const searching = params.get('searching');
  const userId = params.get('userId');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = { profile_visibility: 1 };

  // Exclude current user if provided
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query._id = { $ne: userId };
  }

  // Apply filters
  if (industry) query.industry = industry;
  if (designation) query.designation = designation;
  if (area_of_specialization) query.area_of_specialization = area_of_specialization;

  // Search by name (case-insensitive)
  if (searching) {
    query.name = { $regex: searching, $options: 'i' };
  }

  const skip = (parseInt(page) - 1) * parseInt(size);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name designation industry area_of_specialization profile_image')
      .skip(skip)
      .limit(parseInt(size))
      .lean(),
    User.countDocuments(query)
  ]);

  // Add id field for frontend compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = users.map((u: any) => ({ ...u, id: u._id }));

  return json({ data, total });
}

// GET /dashboard/:pid
export async function getUserById(_req: NextRequest, pid: string) {
  assertObjectId(pid);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = await User.findById(pid).lean();
  if (!user) {
    return json({ message: 'User not found' }, 404);
  }

  // Build response respecting visibility settings
  const data = await buildPublicProfile(user);

  return json({ data });
}
