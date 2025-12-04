import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole('Operator');

    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { status } = body;

    if (!status || !['Active', 'Suspended', 'Warning'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be Active, Suspended, or Warning' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE "USER" SET status = $1 WHERE user_id = $2 RETURNING user_id, username, email, status`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User status updated successfully',
      user: result.rows[0],
    });

  } catch (error: any) {
    console.error('Update user status error:', error);
    
    if (error.message.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}

