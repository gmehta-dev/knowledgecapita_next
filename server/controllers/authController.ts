import 'server-only';
import type { NextRequest } from 'next/server';
import User from '../models/User';
import { ApiError } from '../errors';
import { json, readBody, validate } from '../http';
import { generateToken, requireUser } from '../auth';
import { signUpSchema, signInSchema, passResetSchema, passChangeSchema } from '../validators/authValidator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatUserResponse = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone_number: user.phone_number,
  designation: user.designation || null,
  industry: user.industry || null,
  area_of_specialization: user.area_of_specialization || null,
  profile_image: user.profile_image || null,
  role: user.role || 'user'
});

// POST /auth/sign-up
export async function signUp(req: NextRequest) {
  const body = await readBody(req);
  validate(signUpSchema, body);
  const { name, email, phone_number, password } = body;

  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { phone_number }]
  });

  if (existingUser) {
    const errors: Record<string, string[]> = {};
    if (existingUser.email === email.toLowerCase()) {
      errors.email = ['Email is already taken'];
    }
    if (existingUser.phone_number === phone_number) {
      errors.phone_number = ['Phone number is already taken'];
    }
    return json({ message: 'Validation failed', errors }, 400);
  }

  await User.create({ name, email, phone_number, password });

  return json({ message: 'Registration successful' }, 201);
}

// POST /auth/sign-in
export async function signIn(req: NextRequest) {
  const body = await readBody(req);
  validate(signInSchema, body);
  const { emailOrphone, password } = body;

  // Determine if input is email or phone
  const isEmail = emailOrphone.includes('@');
  const query = isEmail
    ? { email: emailOrphone.toLowerCase() }
    : { phone_number: emailOrphone };

  const user = await User.findOne(query).select('+password');

  if (!user) {
    return json({ message: 'Invalid credentials' }, 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return json({ message: 'Invalid credentials' }, 401);
  }

  const token = generateToken(user);

  return json({
    token,
    user: formatUserResponse(user),
    message: 'Login successful'
  });
}

// POST /auth/pass-reset
export async function passReset(req: NextRequest) {
  const body = await readBody(req);
  validate(passResetSchema, body);
  const { email } = body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Don't reveal whether email exists
    return json({ message: 'Reset link sent to your email' });
  }

  // TODO: Implement actual email sending with reset token (not implemented in the legacy API either)
  return json({ message: 'Reset link sent to your email' });
}

// POST /auth/pass-change
export async function passChange(req: NextRequest) {
  const authUser = await requireUser(req);
  const body = await readBody(req);
  validate(passChangeSchema, body);
  const { old_password, new_password } = body;

  const user = await User.findById(authUser._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isMatch = await user.comparePassword(old_password);
  if (!isMatch) {
    return json({
      message: 'Validation failed',
      errors: { old_password: ['Old password is incorrect'] }
    }, 400);
  }

  user.password = new_password;
  await user.save();

  const token = generateToken(user);

  return json({
    token,
    user: formatUserResponse(user),
    message: 'Password changed successfully'
  });
}

// GET /auth/sign-out
export async function signOut(req: NextRequest) {
  await requireUser(req);
  // With JWT, logout is handled client-side by removing the token.
  return json({ message: 'Logged out successfully' });
}
