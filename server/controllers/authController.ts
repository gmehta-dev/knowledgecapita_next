import 'server-only';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { NextRequest } from 'next/server';
import User from '../models/User';
import { ApiError } from '../errors';
import { json, readBody, validate } from '../http';
import { generateToken, requireUser } from '../auth';
import { signUpSchema, signInSchema, passResetSchema, passResetConfirmSchema, passChangeSchema } from '../validators/authValidator';
import { sendMail } from '../mail';
import { welcomeEmail, passwordResetEmail } from '../emailTemplates';
import { SITE_URL } from '@/lib/site';

const RESET_TTL_MS = 60 * 60 * 1000; // reset links work for 1 hour
const RESET_RESEND_MS = 2 * 60 * 1000; // at most one reset email per account every 2 minutes
const RESET_SENT = 'Reset link sent to your email';

const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

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

  const user = await User.create({ name, email, phone_number, password });

  // Welcome email. Not awaited: sign-up must not wait for (or fail on) the mail server.
  void sendMail({ to: user.email, ...welcomeEmail(user.name) });

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

  // Same response whether or not the account exists, so emails can't be probed.
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password_reset_expires');
  if (!user) {
    return json({ message: RESET_SENT });
  }

  const expires: Date | undefined = user.password_reset_expires;
  if (expires && expires.getTime() > Date.now() + RESET_TTL_MS - RESET_RESEND_MS) {
    return json({ message: RESET_SENT }); // a link was just sent
  }

  // One-time token: only its hash is stored, the token itself goes in the email.
  const token = crypto.randomBytes(32).toString('hex');
  await User.updateOne(
    { _id: user._id },
    { $set: { password_reset_token: hashResetToken(token), password_reset_expires: new Date(Date.now() + RESET_TTL_MS) } },
    { timestamps: false }
  );

  const link = `${SITE_URL}/reset-password?token=${token}`;
  // Not awaited: the response time must not depend on the mail server.
  void sendMail({ to: user.email, ...passwordResetEmail(user.name, link) });

  return json({ message: RESET_SENT });
}

// POST /auth/pass-reset/confirm
export async function passResetConfirm(req: NextRequest) {
  const body = await readBody(req);
  validate(passResetConfirmSchema, body);
  const { token, password } = body;

  // Atomic: the token is consumed in the same update that sets the password,
  // so a link can never be used twice.
  const user = await User.findOneAndUpdate(
    { password_reset_token: hashResetToken(token), password_reset_expires: { $gt: new Date() } },
    {
      $set: { password: await bcrypt.hash(password, 12) },
      $unset: { password_reset_token: 1, password_reset_expires: 1 }
    }
  );
  if (!user) {
    return json({ message: 'This reset link is invalid or has expired. Please request a new one.' }, 400);
  }

  console.log(`[auth] password reset via email link for user ${user._id}`);
  return json({ message: 'Password has been reset. You can now log in.' });
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
