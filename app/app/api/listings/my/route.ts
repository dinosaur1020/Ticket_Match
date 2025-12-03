import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    const result = await query(
      `SELECT 
        l.*,
        e.event_name,
        e.venue
       FROM listing l
       JOIN event e ON l.event_id = e.event_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [session.user_id]
    );

    return NextResponse.json({
      listings: result.rows,
    });

  } catch (error: any) {
    console.error('Get my listings error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

