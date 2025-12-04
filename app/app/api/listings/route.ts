import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const event_id = searchParams.get('event_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'Active';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        l.*,
        u.username,
        e.event_name,
        e.venue
      FROM listing l
      JOIN "USER" u ON l.user_id = u.user_id
      JOIN event e ON l.event_id = e.event_id
      WHERE l.status = $1
    `;

    const params: any[] = [status];
    let paramIndex = 2;

    if (event_id) {
      sql += ` AND l.event_id = $${paramIndex++}`;
      params.push(parseInt(event_id));
    }

    if (type) {
      sql += ` AND l.type = $${paramIndex++}`;
      params.push(type);
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Get total count for pagination
    let countSql = `
      SELECT COUNT(*) as total
      FROM listing l
      WHERE l.status = $1
    `;
    const countParams: any[] = [status];
    let countParamIndex = 2;
    
    if (event_id) {
      countSql += ` AND l.event_id = $${countParamIndex++}`;
      countParams.push(parseInt(event_id));
    }
    
    if (type) {
      countSql += ` AND l.type = $${countParamIndex}`;
      countParams.push(type);
    }
    
    const countResult = await query(countSql, countParams);
    const total = parseInt(countResult.rows[0].total);

    // Fetch ticket details for each listing using LISTING_TICKET junction table
    const listingsWithTickets = await Promise.all(
      result.rows.map(async (listing) => {
        let offeredTickets = [];
        let offeredTicketIds = [];
        
        // Query the junction table for offered tickets
        const ticketsResult = await query(
          `SELECT 
            t.ticket_id,
            t.seat_area,
            t.seat_number,
            t.price,
            t.status
           FROM listing_ticket lt
           JOIN ticket t ON lt.ticket_id = t.ticket_id
           WHERE lt.listing_id = $1
           ORDER BY t.seat_area, t.seat_number`,
          [listing.listing_id]
        );
        
        offeredTickets = ticketsResult.rows.map(row => ({
          ...row,
          price: parseFloat(row.price),
        }));
        
        offeredTicketIds = ticketsResult.rows.map(row => row.ticket_id);
        
        return {
          ...listing,
          offered_tickets: offeredTickets,
          offered_ticket_ids: offeredTicketIds, // For backward compatibility
        };
      })
    );

    return NextResponse.json({
      listings: listingsWithTickets,
      pagination: {
        limit,
        offset,
        count: listingsWithTickets.length,
        total,
      },
    });

  } catch (error) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_id, event_date, content, type, offered_ticket_ids } = body;

    // Validation
    if (!event_id || !event_date || !type) {
      return NextResponse.json(
        { error: 'Event ID, event date, and type are required' },
        { status: 400 }
      );
    }

    if (!['Sell', 'Buy', 'Exchange'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be Sell, Buy, or Exchange' },
        { status: 400 }
      );
    }

    // For Exchange and Sell listings, offered_ticket_ids is recommended
    if ((type === 'Exchange' || type === 'Sell') && (!offered_ticket_ids || offered_ticket_ids.length === 0)) {
      return NextResponse.json(
        { error: 'Exchange and Sell listings should specify offered tickets' },
        { status: 400 }
      );
    }

    // Verify tickets belong to user and are active
    if (offered_ticket_ids && offered_ticket_ids.length > 0) {
      const ticketCheck = await query(
        `SELECT ticket_id, owner_id, status FROM ticket WHERE ticket_id = ANY($1)`,
        [offered_ticket_ids]
      );

      if (ticketCheck.rows.length !== offered_ticket_ids.length) {
        return NextResponse.json(
          { error: 'Some tickets do not exist' },
          { status: 400 }
        );
      }

      for (const ticket of ticketCheck.rows) {
        if (ticket.owner_id !== session.user_id) {
          return NextResponse.json(
            { error: 'You can only list your own tickets' },
            { status: 403 }
          );
        }
        if (ticket.status !== 'Active') {
          return NextResponse.json(
            { error: `Ticket ${ticket.ticket_id} is not active (status: ${ticket.status})` },
            { status: 400 }
          );
        }
      }
    }

    // Insert the listing
    const result = await query(
      `INSERT INTO listing (user_id, event_id, event_date, content, type, status)
       VALUES ($1, $2, $3, $4, $5, 'Active')
       RETURNING *`,
      [session.user_id, event_id, event_date, content || null, type]
    );

    const newListing = result.rows[0];

    // Insert offered tickets into LISTING_TICKET junction table
    if (offered_ticket_ids && offered_ticket_ids.length > 0) {
      const values = offered_ticket_ids.map((ticketId: number, index: number) => 
        `($1, $${index + 2})`
      ).join(', ');
      
      await query(
        `INSERT INTO listing_ticket (listing_id, ticket_id) VALUES ${values}`,
        [newListing.listing_id, ...offered_ticket_ids]
      );
    }

    return NextResponse.json({
      message: 'Listing created successfully',
      listing: newListing,
    }, { status: 201 });

  } catch (error) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

