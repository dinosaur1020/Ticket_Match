import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// GET /api/users/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const result = await query(
      `SELECT 
        u.user_id, 
        u.username, 
        u.email, 
        u.status, 
        u.balance, 
        u.user_description,
        u.created_at,
        COALESCE(array_agg(DISTINCT ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}') as roles
       FROM "USER" u
       LEFT JOIN user_role ur ON u.user_id = ur.user_id
       WHERE u.user_id = $1
       GROUP BY u.user_id, u.username, u.email, u.status, u.balance, u.user_description, u.created_at`,
      [session.user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        ...user,
        balance: parseFloat(user.balance),
      },
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error.message && error.message.includes('Account suspended')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/profile - Update current user's profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { user_description } = body;

    // Validate description length (matches database constraint)
    if (user_description && user_description.length > 500) {
      return NextResponse.json(
        { error: 'Description must be 500 characters or less' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE "USER" 
       SET user_description = $1 
       WHERE user_id = $2 
       RETURNING user_id, username, email, status, balance, user_description, created_at`,
      [user_description || null, session.user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        ...result.rows[0],
        balance: parseFloat(result.rows[0].balance),
      },
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error.message && error.message.includes('Account suspended')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

