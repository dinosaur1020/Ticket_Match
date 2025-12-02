import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const userResult = await query(
      `SELECT u.user_id, u.username, u.email, u.password_hash, u.status, u.balance,
              array_agg(ur.role) as roles
       FROM "USER" u
       LEFT JOIN user_role ur ON u.user_id = ur.user_id
       WHERE u.username = $1
       GROUP BY u.user_id`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Check if account is suspended
    if (user.status === 'Suspended') {
      return NextResponse.json(
        { error: 'Account is suspended' },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getSession();
    session.user_id = user.user_id;
    session.username = user.username;
    session.email = user.email;
    session.roles = user.roles.filter((role: string | null) => role !== null);
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        balance: user.balance,
        roles: session.roles,
        status: user.status,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}

