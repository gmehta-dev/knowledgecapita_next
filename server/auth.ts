import 'server-only';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User from './models/User';
import { ApiError } from './errors';
import { AUTHORIZED_EMAILS } from './constants';

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateToken(user: any): string {
  return jwt.sign({ id: user._id, email: user.email }, jwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn']
  });
}

/** Port of `authMiddleware`: returns the authenticated user document or throws 401. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireUser(req: NextRequest): Promise<any> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Unauthorized');
  }

  const token = authHeader.split(' ')[1];

  let user;
  try {
    const decoded = jwt.verify(token, jwtSecret()) as jwt.JwtPayload;
    user = await User.findById(decoded.id);
  } catch {
    throw new ApiError(401, 'Invalid token');
  }

  if (!user) {
    throw new ApiError(401, 'User not found');
  }

  return user;
}

/** Port of `canManageActivities`. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertCanManageActivities(user: any): void {
  if (!AUTHORIZED_EMAILS.includes(user.email)) {
    throw new ApiError(403, 'Not authorized');
  }
}

export const SUPER_ADMIN = 'super_admin';

/** Only users with role `super_admin` may manage other users. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertSuperAdmin(user: any): void {
  if (user.role !== SUPER_ADMIN) {
    throw new ApiError(403, 'Not authorized');
  }
}
