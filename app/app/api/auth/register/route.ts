import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, email } = body;

    // Validation
    if (!username || !password || !email) {
      return NextResponse.json(
        { error: 'Username, password, and email are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await query(
      'SELECT user_id FROM "USER" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await query(
      `INSERT INTO "USER" (username, password_hash, email, status, balance)
       VALUES ($1, $2, $3, 'Active', 10000)
       RETURNING user_id, username, email, balance, created_at`,
      [username, passwordHash, email]
    );

    const user = result.rows[0];

    // Add default user role
    await query(
      'INSERT INTO user_role (user_id, role) VALUES ($1, $2)',
      [user.user_id, 'User']
    );

    // Create session
    const session = await getSession();
    session.user_id = user.user_id;
    session.username = user.username;
    session.email = user.email;
    session.roles = ['User'];
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        balance: user.balance,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}

