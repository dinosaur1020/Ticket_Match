import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { listing_id, agreed_price, ticket_ids, listing_owner_ticket_ids } = body;

    // Validation
    if (!listing_id) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      );
    }

    if (agreed_price === undefined) {
      return NextResponse.json(
        { error: 'Agreed price is required' },
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
        `SELECT l.*, u.balance as listing_owner_balance
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

      // Determine roles and ticket handling based on listing type
      let user1Role: string = '';
      let user2Role: string = '';
      let user1TicketIds: number[] = [];
      let user2TicketIds: number[] = [];

      if (listing.type === 'Sell') {
        // Listing owner is seller, initiator is buyer
        user1Role = 'seller';
        user2Role = 'buyer';
        
        // Seller's tickets: auto-find if not provided
        if (listing_owner_ticket_ids && listing_owner_ticket_ids.length > 0) {
          user1TicketIds = listing_owner_ticket_ids;
        } else if (ticket_ids.length === 0) {
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
          
          user1TicketIds = sellerTicketsResult.rows.map(row => row.ticket_id);
        }
        
        user2TicketIds = []; // Buyer doesn't provide tickets
        
      } else if (listing.type === 'Buy') {
        // Listing owner is buyer, initiator is seller
        user1Role = 'buyer';
        user2Role = 'seller';
        
        user1TicketIds = []; // Buyer doesn't provide tickets
        user2TicketIds = ticket_ids; // Seller provides tickets
        
      } else if (listing.type === 'Exchange') {
        // Both are exchangers
        user1Role = 'exchanger';
        user2Role = 'exchanger';
        
        // Both parties provide tickets
        if (!listing_owner_ticket_ids || listing_owner_ticket_ids.length === 0) {
          throw new Error('Listing owner must specify tickets to exchange');
        }
        
        if (ticket_ids.length === 0) {
          throw new Error('You must provide tickets to exchange');
        }
        
        user1TicketIds = listing_owner_ticket_ids;
        user2TicketIds = ticket_ids;
      } else {
        throw new Error('Invalid listing type');
      }

      // Add participants
      await client.query(
        `INSERT INTO trade_participant (trade_id, user_id, role, confirmed)
         VALUES ($1, $2, $3, FALSE), ($1, $4, $5, FALSE)`,
        [trade.trade_id, listing.user_id, user1Role, session.user_id, user2Role]
      );

      // Verify and add listing owner's tickets (user1)
      for (const ticket_id of user1TicketIds) {
        const ticketResult = await client.query(
          `SELECT owner_id, status FROM ticket WHERE ticket_id = $1`,
          [ticket_id]
        );

        if (ticketResult.rows.length === 0) {
          throw new Error(`Ticket ${ticket_id} not found`);
        }

        const ticket = ticketResult.rows[0];

        if (ticket.owner_id !== listing.user_id) {
          throw new Error(`Ticket ${ticket_id} not owned by listing owner`);
        }

        if (ticket.status !== 'Active') {
          throw new Error(`Ticket ${ticket_id} is not available (status: ${ticket.status})`);
        }

        // Add ticket to trade (from listing owner to initiator)
        await client.query(
          `INSERT INTO trade_ticket (trade_id, ticket_id, from_user_id, to_user_id)
           VALUES ($1, $2, $3, $4)`,
          [trade.trade_id, ticket_id, listing.user_id, session.user_id]
        );
      }

      // Verify and add initiator's tickets (user2)
      for (const ticket_id of user2TicketIds) {
        const ticketResult = await client.query(
          `SELECT owner_id, status FROM ticket WHERE ticket_id = $1`,
          [ticket_id]
        );

        if (ticketResult.rows.length === 0) {
          throw new Error(`Ticket ${ticket_id} not found`);
        }

        const ticket = ticketResult.rows[0];

        if (ticket.owner_id !== session.user_id) {
          throw new Error(`Ticket ${ticket_id} not owned by you`);
        }

        if (ticket.status !== 'Active') {
          throw new Error(`Ticket ${ticket_id} is not available (status: ${ticket.status})`);
        }

        // Add ticket to trade (from initiator to listing owner)
        await client.query(
          `INSERT INTO trade_ticket (trade_id, ticket_id, from_user_id, to_user_id)
           VALUES ($1, $2, $3, $4)`,
          [trade.trade_id, ticket_id, session.user_id, listing.user_id]
        );
      }

      // Ensure at least one ticket is involved
      if (user1TicketIds.length === 0 && user2TicketIds.length === 0) {
        throw new Error('At least one ticket must be included in the trade');
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

