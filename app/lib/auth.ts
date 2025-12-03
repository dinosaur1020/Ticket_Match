import bcrypt from 'bcrypt';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';

const SALT_ROUNDS = 10;

export interface SessionData {
  user_id: number;
  username: string;
  email: string;
  roles: string[];
  isLoggedIn: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const sessionSecret = process.env.SESSION_SECRET;
  
  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not set in environment variables');
  }

  return await getIronSession<SessionData>(await cookies(), {
    password: sessionSecret,
    cookieName: 'ticket_match_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    },
  });
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session.isLoggedIn || !session.user_id) {
    throw new Error('Unauthorized');
  }
  
  return session as SessionData;
}

export async function requireRole(role: string): Promise<SessionData> {
  const session = await requireAuth();

  if (!session.roles.includes(role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return session;
}

export async function requireRoles(allowedRoles: string[]): Promise<SessionData> {
  const session = await requireAuth();

  const hasRequiredRole = allowedRoles.some(role => session.roles.includes(role));
  if (!hasRequiredRole) {
    throw new Error(`Forbidden: Requires one of: ${allowedRoles.join(', ')}`);
  }

  return session;
}

