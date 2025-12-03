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
    const listingId = parseInt(id);

    if (isNaN(listingId)) {
      return NextResponse.json(
        { error: 'Invalid listing ID' },
        { status: 400 }
      );
    }

    // Log view activity
    const session = await getSession();
    if (session.isLoggedIn) {
      await logUserActivity({
        user_id: session.user_id,
        action: 'view_listing',
        listing_id: listingId,
      });
    }

    const result = await query(
      `SELECT 
        l.*,
        u.username,
        u.user_id as seller_id,
        e.event_name,
        e.venue,
        e.description as event_description
       FROM listing l
       JOIN "USER" u ON l.user_id = u.user_id
       JOIN event e ON l.event_id = e.event_id
       WHERE l.listing_id = $1`,
      [listingId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const listing = result.rows[0];

    // If listing has offered tickets, fetch ticket details
    let offeredTickets = [];
    if (listing.offered_ticket_ids && listing.offered_ticket_ids.length > 0) {
      const ticketsResult = await query(
        `SELECT 
          t.*,
          e.event_name,
          e.venue,
          et.start_time,
          et.end_time
         FROM ticket t
         JOIN eventtime et ON t.eventtime_id = et.eventtime_id
         JOIN event e ON et.event_id = e.event_id
         WHERE t.ticket_id = ANY($1)
         ORDER BY et.start_time ASC`,
        [listing.offered_ticket_ids]
      );
      offeredTickets = ticketsResult.rows.map(row => ({
        ...row,
        price: parseFloat(row.price),
      }));
    }

    return NextResponse.json({
      listing: {
        ...listing,
        offered_tickets: offeredTickets,
      },
    });

  } catch (error) {
    console.error('Get listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
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

    const { id } = await params;
    const listingId = parseInt(id);
    const body = await request.json();
    const { content, status } = body;

    // Check if listing exists and belongs to user
    const checkResult = await query(
      'SELECT user_id, status as current_status FROM listing WHERE listing_id = $1',
      [listingId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].user_id !== session.user_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only modify your own listings' },
        { status: 403 }
      );
    }

    // Don't allow modification of completed listings
    if (checkResult.rows[0].current_status === 'Completed') {
      return NextResponse.json(
        { error: 'Cannot modify completed listings' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(content);
    }
    if (status) {
      if (!['Active', 'Canceled'].includes(status)) {
        return NextResponse.json(
          { error: 'Status must be Active or Canceled' },
          { status: 400 }
        );
      }
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(listingId);

    const result = await query(
      `UPDATE listing SET ${updates.join(', ')}
       WHERE listing_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return NextResponse.json({
      message: 'Listing updated successfully',
      listing: result.rows[0],
    });

  } catch (error) {
    console.error('Update listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

