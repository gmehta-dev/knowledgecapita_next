import 'server-only';
import mongoose from 'mongoose';
import User from './models/User';
import CalendarEntry from './models/CalendarEntry';
import { connectDB } from './db';

/**
 * Public profile as returned by GET /dashboard/:pid (legacy visibility rules).
 * Shared by the API and the server-rendered /profile/[slug] page.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildPublicProfile(user: any) {
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

  return data;
}

/** For server-rendered pages: plain JSON-safe profile, without email, or null. */
export async function getProfileForPage(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = await User.findById(id).lean();
  if (!user) return null;

  const data = await buildPublicProfile(user);
  delete data.email; // not shown on the page; keep it out of crawlable HTML
  return {
    profile: JSON.parse(JSON.stringify(data)),
    indexable: user.profile_visibility !== 0,
    updatedAt: user.updated_at as Date | undefined
  };
}

/** Profiles listed in the public directory (same filter as GET /dashboard). */
export async function getSitemapProfiles(): Promise<{ id: string; name: string; updatedAt?: Date }[]> {
  await connectDB();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: any[] = await User.find({ profile_visibility: 1 }).select('name updated_at').lean();
  return users.map((u) => ({ id: String(u._id), name: u.name, updatedAt: u.updated_at }));
}
