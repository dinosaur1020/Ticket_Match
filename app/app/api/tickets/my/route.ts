import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await requireAuth();

    const result = await query(
      `SELECT 
        t.*,
        e.event_name,
        e.venue,
        et.start_time,
        et.end_time,
        et.eventtime_id
       FROM ticket t
       JOIN eventtime et ON t.eventtime_id = et.eventtime_id
       JOIN event e ON et.event_id = e.event_id
       WHERE t.owner_id = $1
       ORDER BY et.start_time ASC`,
      [session.user_id]
    );

    return NextResponse.json({
      tickets: result.rows.map(row => ({
        ...row,
        price: parseFloat(row.price),
      })),
    });

  } catch (error: any) {
    console.error('Get my tickets error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

