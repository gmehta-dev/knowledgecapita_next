import 'server-only';
import type { NextRequest } from 'next/server';
import User from '../models/User';
import CalendarEntry from '../models/CalendarEntry';
import { ApiError } from '../errors';
import { assertObjectId, json, readBody, validate } from '../http';
import { assertSuperAdmin, requireUser, SUPER_ADMIN } from '../auth';
import { adminUserUpdateSchema } from '../validators/adminValidator';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function requireSuperAdmin(req: NextRequest) {
  const user = await requireUser(req);
  assertSuperAdmin(user);
  return user;
}

// GET /admin/users?page=&size=&searching=
// All users, including hidden profiles. `searching` matches name, email or phone.
export async function listUsers(req: NextRequest) {
  await requireSuperAdmin(req);

  const params = req.nextUrl.searchParams;
  const page = Math.max(parseInt(params.get('page') || '1') || 1, 1);
  const size = Math.min(Math.max(parseInt(params.get('size') || '20') || 20, 1), 100);
  const searching = params.get('searching')?.trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: Record<string, any> = {};
  if (searching) {
    const pattern = { $regex: escapeRegex(searching), $options: 'i' };
    query.$or = [{ name: pattern }, { email: pattern }, { phone_number: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('name email phone_number designation industry area_of_specialization profile_image profile_visibility role created_at')
      .sort({ created_at: -1, _id: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean(),
    User.countDocuments(query)
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = users.map((u: any) => ({ ...u, id: u._id, role: u.role || 'user' }));

  return json({ data, total });
}

// GET /admin/users/:id
export async function getUser(req: NextRequest, id: string) {
  await requireSuperAdmin(req);
  assertObjectId(id);

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return json({ data: user });
}

// PUT /admin/users/:id
export async function updateUser(req: NextRequest, id: string) {
  const admin = await requireSuperAdmin(req);
  assertObjectId(id);
  const body = await readBody(req);
  validate(adminUserUpdateSchema, body);

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // A super admin cannot remove their own access (avoids locking everyone out).
  if (String(user._id) === String(admin._id) && body.role && body.role !== SUPER_ADMIN) {
    throw new ApiError(400, 'You cannot remove your own super admin role');
  }

  // Same uniqueness errors as sign-up.
  const errors: Record<string, string[]> = {};
  if (body.email && body.email.toLowerCase() !== user.email) {
    if (await User.exists({ email: body.email.toLowerCase(), _id: { $ne: user._id } })) {
      errors.email = ['Email is already taken'];
    }
  }
  if (body.phone_number && body.phone_number !== user.phone_number) {
    if (await User.exists({ phone_number: body.phone_number, _id: { $ne: user._id } })) {
      errors.phone_number = ['Phone number is already taken'];
    }
  }
  if (Object.keys(errors).length) {
    return json({ message: 'Validation failed', errors }, 400);
  }

  // `save()` (not findByIdAndUpdate) so the password is hashed by the pre-save hook.
  user.set(body);
  await user.save();

  const changed = Object.keys(body).map((k) => (k === 'password' ? 'password(reset)' : k)).join(', ');
  console.log(`[admin] user ${id} updated by ${admin.email}: ${changed}`);

  return json({ message: 'User updated successfully' });
}

// DELETE /admin/users/:id
// Removes the user and their calendar entries. Uploaded files and activities they created are kept.
export async function deleteUser(req: NextRequest, id: string) {
  const admin = await requireSuperAdmin(req);
  assertObjectId(id);

  if (id === String(admin._id)) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await CalendarEntry.deleteMany({ user_id: user._id });

  console.log(`[admin] user ${id} (${user.email}) deleted by ${admin.email}`);
  return json({ message: 'User deleted successfully' });
}
