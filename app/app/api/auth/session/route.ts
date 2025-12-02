import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();

    if (!session.isLoggedIn || !session.user_id) {
      return NextResponse.json(
        { isLoggedIn: false },
        { status: 401 }
      );
    }

    // Get fresh user data including balance
    const userResult = await query(
      `SELECT u.user_id, u.username, u.email, u.balance, u.status,
              array_agg(ur.role) as roles
       FROM "USER" u
       LEFT JOIN user_role ur ON u.user_id = ur.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id`,
      [session.user_id]
    );

    if (userResult.rows.length === 0) {
      session.destroy();
      return NextResponse.json(
        { isLoggedIn: false },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        balance: parseFloat(user.balance),
        roles: user.roles.filter((role: string | null) => role !== null),
        status: user.status,
      },
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { isLoggedIn: false },
      { status: 500 }
    );
  }
}

