import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession, requireAuth } from '@/lib/auth';
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

    // Fetch offered tickets using LISTING_TICKET junction table
    const ticketsResult = await query(
      `SELECT 
        t.*,
        e.event_name,
        e.venue,
        et.start_time,
        et.end_time
       FROM listing_ticket lt
       JOIN ticket t ON lt.ticket_id = t.ticket_id
       JOIN eventtime et ON t.eventtime_id = et.eventtime_id
       JOIN event e ON et.event_id = e.event_id
       WHERE lt.listing_id = $1
       ORDER BY et.start_time ASC`,
      [listingId]
    );
    
    const offeredTickets = ticketsResult.rows.map(row => ({
      ...row,
      price: parseFloat(row.price),
    }));
    
    const offeredTicketIds = ticketsResult.rows.map(row => row.ticket_id);

    return NextResponse.json({
      listing: {
        ...listing,
        offered_tickets: offeredTickets,
        offered_ticket_ids: offeredTicketIds, // For backward compatibility
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
    const session = await requireAuth();

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

    // Allow if user owns the listing OR user is an operator (admin)
    const isOwner = checkResult.rows[0].user_id === session.user_id;
    const isOperator = session.roles.includes('Operator');
    
    if (!isOwner && !isOperator) {
      return NextResponse.json(
        { error: 'Forbidden: You can only modify your own listings' },
        { status: 403 }
      );
    }

    // Don't allow modification of completed listings (unless operator)
    if (checkResult.rows[0].current_status === 'Completed' && !isOperator) {
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
      // Operators can use all statuses, regular users can only use Active or Canceled
      const allowedStatuses = isOperator 
        ? ['Active', 'Canceled', 'Expired', 'Completed']
        : ['Active', 'Canceled'];
      
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${allowedStatuses.join(', ')}` },
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

  } catch (error: any) {
    console.error('Update listing error:', error);
    
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
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();

    const { id } = await params;
    const listingId = parseInt(id);

    // Check if listing exists and belongs to user
    const checkResult = await query(
      'SELECT user_id, status FROM listing WHERE listing_id = $1',
      [listingId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Allow if user owns the listing OR user is an operator (admin)
    const isOwner = checkResult.rows[0].user_id === session.user_id;
    const isOperator = session.roles.includes('Operator');
    
    if (!isOwner && !isOperator) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own listings' },
        { status: 403 }
      );
    }

    // Check if there are any active trades associated with this listing
    const tradesResult = await query(
      'SELECT COUNT(*) as count FROM trade WHERE listing_id = $1 AND status IN ($2, $3)',
      [listingId, 'Pending', 'Disputed']
    );

    if (parseInt(tradesResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete listing with active or disputed trades. Please cancel the trades first.' },
        { status: 400 }
      );
    }

    // Delete listing_ticket relationships first
    await query(
      'DELETE FROM listing_ticket WHERE listing_id = $1',
      [listingId]
    );

    // Delete the listing
    await query(
      'DELETE FROM listing WHERE listing_id = $1',
      [listingId]
    );

    return NextResponse.json({
      message: 'Listing deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete listing error:', error);
    
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
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}

