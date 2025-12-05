import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
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
    const tradeId = parseInt(id);

    if (isNaN(tradeId)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    // Get trade details
    const tradeResult = await query(
      `SELECT 
        t.*,
        l.type as listing_type,
        l.content as listing_content,
        l.event_date,
        e.event_name,
        e.venue,
        e.description as event_description
       FROM trade t
       JOIN listing l ON t.listing_id = l.listing_id
       JOIN event e ON l.event_id = e.event_id
       WHERE t.trade_id = $1`,
      [tradeId]
    );

    if (tradeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Trade not found' },
        { status: 404 }
      );
    }

    const trade = tradeResult.rows[0];

    // Get participants
    const participantsResult = await query(
      `SELECT 
        tp.user_id,
        tp.role,
        tp.confirmed,
        tp.confirmed_at,
        u.username,
        u.email
       FROM trade_participant tp
       JOIN "USER" u ON tp.user_id = u.user_id
       WHERE tp.trade_id = $1`,
      [tradeId]
    );

    const participants = participantsResult.rows;

    // Check if user is a participant
    const isParticipant = participants.some(p => p.user_id === session.user_id);
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this trade' },
        { status: 403 }
      );
    }

    // Get tickets involved in the trade
    const ticketsResult = await query(
      `SELECT 
        tt.*,
        t.seat_area,
        t.seat_number,
        t.price,
        t.status as ticket_status,
        et.start_time,
        et.end_time,
        e.event_name as ticket_event_name,
        e.venue as ticket_venue,
        u_from.username as from_username,
        u_to.username as to_username
       FROM trade_ticket tt
       JOIN ticket t ON tt.ticket_id = t.ticket_id
       JOIN eventtime et ON t.eventtime_id = et.eventtime_id
       JOIN event e ON et.event_id = e.event_id
       JOIN "USER" u_from ON tt.from_user_id = u_from.user_id
       JOIN "USER" u_to ON tt.to_user_id = u_to.user_id
       WHERE tt.trade_id = $1
       ORDER BY tt.from_user_id, t.seat_area, t.seat_number`,
      [tradeId]
    );

    const tickets = ticketsResult.rows.map(row => ({
      ...row,
      price: parseFloat(row.price),
    }));

    // Get balance logs related to this trade
    const balanceLogsResult = await query(
      `SELECT 
        ubl.*,
        u.username
       FROM user_balance_log ubl
       JOIN "USER" u ON ubl.user_id = u.user_id
       WHERE ubl.trade_id = $1
       ORDER BY ubl.created_at ASC`,
      [tradeId]
    );

    const balanceLogs = balanceLogsResult.rows.map(row => ({
      ...row,
      change: parseFloat(row.change),
    }));

    // Find current user's info in this trade
    const myParticipant = participants.find(p => p.user_id === session.user_id);

    return NextResponse.json({
      trade: {
        ...trade,
        agreed_price: parseFloat(trade.agreed_price),
        participants,
        tickets,
        balance_logs: balanceLogs,
        my_role: myParticipant?.role,
        my_confirmed: myParticipant?.confirmed,
        my_confirmed_at: myParticipant?.confirmed_at,
      },
    });

  } catch (error) {
    console.error('Get trade error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trade details' },
      { status: 500 }
    );
  }
}

