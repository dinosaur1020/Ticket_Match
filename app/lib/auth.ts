import bcrypt from 'bcrypt';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { query } from './db';

const SALT_ROUNDS = 10;

export interface SessionData {
  user_id: number;
  username: string;
  email: string;
  roles: string[];
  isLoggedIn: boolean;
  status?: string;
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
  
  // Check user status in database
  const userResult = await query(
    `SELECT status FROM "USER" WHERE user_id = $1`,
    [session.user_id]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  
  const userStatus = userResult.rows[0].status;
  
  if (userStatus === 'Suspended') {
    throw new Error('Account suspended: Your account has been suspended by an administrator');
  }
  
  // Update session with current status
  session.status = userStatus;
  
  return session as SessionData;
}

export async function requireRole(role: string): Promise<SessionData> {
  const session = await requireAuth(); // This already checks for suspension

  if (!session.roles.includes(role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return session;
}

export async function requireRoles(allowedRoles: string[]): Promise<SessionData> {
  const session = await requireAuth(); // This already checks for suspension

  const hasRequiredRole = allowedRoles.some(role => session.roles.includes(role));
  if (!hasRequiredRole) {
    throw new Error(`Forbidden: Requires one of: ${allowedRoles.join(', ')}`);
  }

  return session;
}

