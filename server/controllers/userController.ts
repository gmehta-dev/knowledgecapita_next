import 'server-only';
import type { NextRequest } from 'next/server';
import User from '../models/User';
import { ApiError } from '../errors';
import { json, readBody, validate } from '../http';
import { requireUser } from '../auth';
import { profileSchema } from '../validators/profileValidator';

// GET /user/profile
export async function getProfile(req: NextRequest) {
  const authUser = await requireUser(req);

  const user = await User.findById(authUser._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return json({ data: user });
}

// POST /user/profile
export async function updateProfile(req: NextRequest) {
  const authUser = await requireUser(req);
  const body = await readBody(req);
  validate(profileSchema, body);

  const {
    name,
    designation,
    area_of_specialization,
    industry,
    experience,
    calendar,
    scheduling_assistance,
    brief_bio,
    detailed_bio,
    profile_image,
    name_visibility,
    profile_visibility,
    brief_bio_visibility,
    experience_visibility,
    calender_visibility,
    scheduling_visibility,
    detailed_bio_visibility
  } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    name,
    designation,
    area_of_specialization,
    industry,
    brief_bio
  };

  // Optional fields
  if (experience !== undefined) updateData.experience = experience;
  if (calendar !== undefined) updateData.calendar = calendar;
  if (scheduling_assistance !== undefined) updateData.scheduling_assistance = scheduling_assistance;
  if (detailed_bio !== undefined) updateData.detailed_bio = detailed_bio;
  if (profile_image !== undefined) updateData.profile_image = profile_image;

  // Visibility fields
  if (name_visibility !== undefined) updateData.name_visibility = name_visibility;
  if (profile_visibility !== undefined) updateData.profile_visibility = profile_visibility;
  if (brief_bio_visibility !== undefined) updateData.brief_bio_visibility = brief_bio_visibility;
  if (experience_visibility !== undefined) updateData.experience_visibility = experience_visibility;
  if (calender_visibility !== undefined) updateData.calender_visibility = calender_visibility;
  if (scheduling_visibility !== undefined) updateData.scheduling_visibility = scheduling_visibility;
  if (detailed_bio_visibility !== undefined) updateData.detailed_bio_visibility = detailed_bio_visibility;

  await User.findByIdAndUpdate(authUser._id, updateData, {
    new: true,
    runValidators: true
  });

  return json({ message: 'Profile updated successfully' });
}
