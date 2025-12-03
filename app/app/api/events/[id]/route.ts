import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { logUserActivity } from '@/lib/mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Log view activity
    const session = await getSession();
    if (session.isLoggedIn) {
      await logUserActivity({
        user_id: session.user_id,
        action: 'view_event',
        event_id: eventId,
      });
    }

    // Get event details
    const eventResult = await query(
      `SELECT e.*, array_agg(DISTINCT ep.performer) as performers
       FROM event e
       LEFT JOIN event_performer ep ON e.event_id = ep.event_id
       WHERE e.event_id = $1
       GROUP BY e.event_id`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get event times
    const timesResult = await query(
      `SELECT * FROM eventtime
       WHERE event_id = $1
       ORDER BY start_time`,
      [eventId]
    );

    // Get active listings for this event
    const listingsResult = await query(
      `SELECT l.*, u.username
       FROM listing l
       JOIN "USER" u ON l.user_id = u.user_id
       WHERE l.event_id = $1 AND l.status = 'Active'
       ORDER BY l.created_at DESC`,
      [eventId]
    );

    // Fetch ticket details for each listing with offered_ticket_ids
    const listingsWithTickets = await Promise.all(
      listingsResult.rows.map(async (listing) => {
        let offeredTickets = [];
        
        if (listing.offered_ticket_ids && listing.offered_ticket_ids.length > 0) {
          const ticketsResult = await query(
            `SELECT 
              t.ticket_id,
              t.seat_area,
              t.seat_number,
              t.price,
              t.status
             FROM ticket t
             WHERE t.ticket_id = ANY($1)
             ORDER BY t.seat_area, t.seat_number`,
            [listing.offered_ticket_ids]
          );
          
          offeredTickets = ticketsResult.rows.map(row => ({
            ...row,
            price: parseFloat(row.price),
          }));
        }
        
        return {
          ...listing,
          offered_tickets: offeredTickets,
        };
      })
    );

    const event = eventResult.rows[0];

    return NextResponse.json({
      event: {
        ...event,
        performers: event.performers.filter((p: string | null) => p !== null),
      },
      event_times: timesResult.rows,
      listings: listingsWithTickets,
    });

  } catch (error) {
    console.error('Get event details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Forbidden: Only business operators can update events' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const eventId = parseInt(id);
    const body = await request.json();
    const { event_name, venue, description } = body;

    if (!event_name && !venue && description === undefined) {
      return NextResponse.json(
        { error: 'At least one field must be provided' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (event_name) {
      updates.push(`event_name = $${paramIndex++}`);
      values.push(event_name);
    }
    if (venue) {
      updates.push(`venue = $${paramIndex++}`);
      values.push(venue);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    values.push(eventId);

    const result = await query(
      `UPDATE event SET ${updates.join(', ')}
       WHERE event_id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event updated successfully',
      event: result.rows[0],
    });

  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Forbidden: Only business operators can delete events' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const eventId = parseInt(id);

    const result = await query(
      'DELETE FROM event WHERE event_id = $1 RETURNING *',
      [eventId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Event deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete event error:', error);
    
    // Check for foreign key constraint violation
    if (error.code === '23503') {
      return NextResponse.json(
        { error: 'Cannot delete event with existing tickets or listings' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

