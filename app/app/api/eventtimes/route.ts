import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!session.roles.includes('BusinessOperator') && !session.roles.includes('Admin')) {
      return NextResponse.json(
        { error: 'Forbidden: Only business operators can create event times' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { event_id, start_time, end_time } = body;

    if (!event_id || !start_time) {
      return NextResponse.json(
        { error: 'Event ID and start time are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO eventtime (event_id, start_time, end_time)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [event_id, start_time, end_time || null]
    );

    return NextResponse.json({
      message: 'Event time created successfully',
      eventtime: result.rows[0],
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create event time error:', error);
    
    // Check for unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Event time already exists for this event and start time' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create event time' },
      { status: 500 }
    );
  }
}

