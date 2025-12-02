import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { listing_id, agreed_price, ticket_ids } = body;

    // Validation
    if (!listing_id || !agreed_price) {
      return NextResponse.json(
        { error: 'Listing ID and agreed price are required' },
        { status: 400 }
      );
    }

    if (!ticket_ids || !Array.isArray(ticket_ids)) {
      return NextResponse.json(
        { error: 'Ticket IDs must be an array' },
        { status: 400 }
      );
    }

    // Use transaction for atomicity
    const result = await transaction(async (client) => {
      // Get listing details
      const listingResult = await client.query(
        `SELECT l.*, u.balance as seller_balance
         FROM listing l
         JOIN "USER" u ON l.user_id = u.user_id
         WHERE l.listing_id = $1 AND l.status = 'Active'`,
        [listing_id]
      );

      if (listingResult.rows.length === 0) {
        throw new Error('Listing not found or not active');
      }

      const listing = listingResult.rows[0];

      // Cannot trade with yourself
      if (listing.user_id === session.user_id) {
        throw new Error('Cannot create trade with your own listing');
      }

      // Create trade
      const tradeResult = await client.query(
        `INSERT INTO trade (listing_id, status, agreed_price)
         VALUES ($1, 'Pending', $2)
         RETURNING *`,
        [listing_id, agreed_price]
      );

      const trade = tradeResult.rows[0];

      // Add participants (seller and buyer)
      await client.query(
        `INSERT INTO trade_participant (trade_id, user_id, role, confirmed)
         VALUES ($1, $2, 'seller', FALSE), ($1, $3, 'buyer', FALSE)`,
        [trade.trade_id, listing.user_id, session.user_id]
      );

      // For Sell listings, automatically find seller's tickets if not provided
      let finalTicketIds = ticket_ids;
      if (listing.type === 'Sell' && ticket_ids.length === 0) {
        const sellerTicketsResult = await client.query(
          `SELECT t.ticket_id 
           FROM ticket t
           JOIN eventtime et ON t.eventtime_id = et.eventtime_id
           WHERE t.owner_id = $1 
             AND et.event_id = $2 
             AND t.status = 'Active'
           LIMIT 10`,
          [listing.user_id, listing.event_id]
        );
        
        if (sellerTicketsResult.rows.length === 0) {
          throw new Error('Seller has no available tickets for this event');
        }
        
        finalTicketIds = sellerTicketsResult.rows.map(row => row.ticket_id);
      }

      if (finalTicketIds.length === 0) {
        throw new Error('At least one ticket must be included in the trade');
      }

      // Verify tickets belong to the appropriate party and are active
      for (const ticket_id of finalTicketIds) {
        const ticketResult = await client.query(
          `SELECT owner_id, status FROM ticket WHERE ticket_id = $1`,
          [ticket_id]
        );

        if (ticketResult.rows.length === 0) {
          throw new Error(`Ticket ${ticket_id} not found`);
        }

        const ticket = ticketResult.rows[0];

        // For sell listings, seller should own the tickets
        // For buy listings, buyer should own the tickets
        const expectedOwner = listing.type === 'Sell' ? listing.user_id : session.user_id;
        
        if (ticket.owner_id !== expectedOwner) {
          throw new Error(`Ticket ${ticket_id} not owned by correct party`);
        }

        if (ticket.status !== 'Active') {
          throw new Error(`Ticket ${ticket_id} is not available (status: ${ticket.status})`);
        }

        // Add ticket to trade
        const from_user = listing.type === 'Sell' ? listing.user_id : session.user_id;
        const to_user = listing.type === 'Sell' ? session.user_id : listing.user_id;

        await client.query(
          `INSERT INTO trade_ticket (trade_id, ticket_id, from_user_id, to_user_id)
           VALUES ($1, $2, $3, $4)`,
          [trade.trade_id, ticket_id, from_user, to_user]
        );
      }

      return trade;
    });

    return NextResponse.json({
      message: 'Trade created successfully',
      trade: result,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create trade error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create trade' },
      { status: 400 }
    );
  }
}

