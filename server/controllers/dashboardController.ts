import 'server-only';
import type { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import User from '../models/User';
import CalendarEntry from '../models/CalendarEntry';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: Record<string, any> = {
    id: user._id,
    name: user.name,
    email: user.email,
    designation: user.designation,
    industry: user.industry,
    area_of_specialization: user.area_of_specialization,
    profile_image: user.profile_image
  };

  // Add fields based on visibility
  if (user.brief_bio_visibility === 1) {
    data.brief_bio = user.brief_bio;
  }
  if (user.experience_visibility === 1) {
    data.experience = user.experience;
  }
  if (user.detailed_bio_visibility === 1) {
    data.detailed_bio = user.detailed_bio;
  }
  if (user.scheduling_visibility === 1) {
    data.scheduling_assistance = user.scheduling_assistance;
  }

  data.calender_visibility = user.calender_visibility;

  // Include calendar entries if visible
  if (user.calender_visibility === 1) {
    const calendarEntries = await CalendarEntry.find({ user_id: user._id }).lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.user_calender = calendarEntries.map((entry: any) => ({
      id: entry._id,
      city: entry.city,
      time: entry.time,
      from_date: entry.from_date,
      to_date: entry.to_date,
      interested_to_meet: entry.interested_to_meet
    }));
  }

  return json({ data });
}
