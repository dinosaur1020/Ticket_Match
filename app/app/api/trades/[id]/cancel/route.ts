import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const tradeId = parseInt(id);

    if (isNaN(tradeId)) {
      return NextResponse.json(
        { error: 'Invalid trade ID' },
        { status: 400 }
      );
    }

    // Use transaction for atomicity
    const result = await transaction(async (client) => {
      // Get trade details and verify user is a participant
      const tradeResult = await client.query(
        `SELECT t.*, tp.role
         FROM trade t
         JOIN trade_participant tp ON t.trade_id = tp.trade_id
         WHERE t.trade_id = $1 AND tp.user_id = $2 AND t.status = 'Pending'`,
        [tradeId, session.user_id]
      );

      if (tradeResult.rows.length === 0) {
        throw new Error('Trade not found, not pending, or you are not a participant');
      }

      // Get all tickets involved in this trade
      const ticketsResult = await client.query(
        `SELECT ticket_id FROM trade_ticket WHERE trade_id = $1`,
        [tradeId]
      );

      // Unlock all tickets involved in the trade
      for (const ticketRow of ticketsResult.rows) {
        await client.query(
          `UPDATE ticket
           SET status = 'Active'
           WHERE ticket_id = $1 AND status = 'Locked'`,
          [ticketRow.ticket_id]
        );
      }

      // Cancel the trade
      await client.query(
        `UPDATE trade SET status = 'Canceled', updated_at = NOW()
         WHERE trade_id = $1`,
        [tradeId]
      );

      return {
        trade_id: tradeId,
        status: 'Canceled',
        message: 'Trade canceled successfully. All tickets have been unlocked.',
      };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Cancel trade error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to cancel trade' },
      { status: 400 }
    );
  }
}
