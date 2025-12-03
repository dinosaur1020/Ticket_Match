import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

// POST /api/tickets - 讓使用者新增票券
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { eventtime_id, seat_area, seat_number, price } = body;

    // Validation
    if (!eventtime_id || !seat_area || !seat_number || price === undefined) {
      return NextResponse.json(
        { error: 'EventTime ID, seat area, seat number, and price are required' },
        { status: 400 }
      );
    }

    if (parseFloat(price) < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      );
    }

    // Verify eventtime exists
    const eventtimeResult = await query(
      `SELECT et.eventtime_id, e.event_name, e.venue, et.start_time
       FROM eventtime et
       JOIN event e ON et.event_id = e.event_id
       WHERE et.eventtime_id = $1`,
      [eventtime_id]
    );

    if (eventtimeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event time not found' },
        { status: 404 }
      );
    }

    const eventInfo = eventtimeResult.rows[0];

    // Check for duplicate seat
    const duplicateCheck = await query(
      `SELECT ticket_id FROM ticket
       WHERE eventtime_id = $1 
         AND seat_area = $2 
         AND seat_number = $3 
         AND status != 'Canceled'`,
      [eventtime_id, seat_area, seat_number]
    );

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'This seat already exists for this event time' },
        { status: 400 }
      );
    }

    // Create ticket
    const result = await query(
      `INSERT INTO ticket (eventtime_id, owner_id, seat_area, seat_number, price, status)
       VALUES ($1, $2, $3, $4, $5, 'Active')
       RETURNING *`,
      [eventtime_id, session.user_id, seat_area, seat_number, price]
    );

    const ticket = result.rows[0];

    return NextResponse.json({
      message: 'Ticket created successfully',
      ticket: {
        ...ticket,
        event_name: eventInfo.event_name,
        venue: eventInfo.venue,
        start_time: eventInfo.start_time,
        price: parseFloat(ticket.price),
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create ticket error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

