import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT eventtime_id, event_id, start_time, end_time
       FROM eventtime
       WHERE event_id = $1
       ORDER BY start_time ASC`,
      [parseInt(event_id)]
    );

    return NextResponse.json({
      eventTimes: result.rows,
    });

  } catch (error) {
    console.error('Get event times error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event times' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, start_time, end_time } = body;

    // Validation
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
      eventTime: result.rows[0],
    }, { status: 201 });

  } catch (error) {
    console.error('Create event time error:', error);
    return NextResponse.json(
      { error: 'Failed to create event time' },
      { status: 500 }
    );
  }
}
