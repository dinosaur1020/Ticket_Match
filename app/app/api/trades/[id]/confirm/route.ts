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

    // Use transaction for atomicity and consistency
    const result = await transaction(async (client) => {
      // Get trade details
      const tradeResult = await client.query(
        `SELECT t.*, l.listing_id, l.type as listing_type, l.user_id as seller_id
         FROM trade t
         JOIN listing l ON t.listing_id = l.listing_id
         WHERE t.trade_id = $1 AND t.status = 'Pending'
         FOR UPDATE`,  // Lock the trade row
        [tradeId]
      );

      if (tradeResult.rows.length === 0) {
        throw new Error('Trade not found or not pending');
      }

      const trade = tradeResult.rows[0];

      // Verify user is a participant
      const participantResult = await client.query(
        `SELECT role, confirmed FROM trade_participant
         WHERE trade_id = $1 AND user_id = $2`,
        [tradeId, session.user_id]
      );

      if (participantResult.rows.length === 0) {
        throw new Error('You are not a participant in this trade');
      }

      const participant = participantResult.rows[0];

      if (participant.confirmed) {
        throw new Error('You have already confirmed this trade');
      }

      // Mark this user as confirmed
      await client.query(
        `UPDATE trade_participant
         SET confirmed = TRUE, confirmed_at = NOW()
         WHERE trade_id = $1 AND user_id = $2`,
        [tradeId, session.user_id]
      );

      // Immediately lock the tickets this user is offering in the trade
      const userTicketsResult = await client.query(
        `SELECT ticket_id FROM trade_ticket
         WHERE trade_id = $1 AND from_user_id = $2`,
        [tradeId, session.user_id]
      );

      // Lock user's tickets immediately upon confirmation
      for (const ticketRow of userTicketsResult.rows) {
        const lockResult = await client.query(
          `UPDATE ticket
           SET status = 'Locked'
           WHERE ticket_id = $1 AND owner_id = $2 AND status = 'Active'
           RETURNING ticket_id`,
          [ticketRow.ticket_id, session.user_id]
        );

        if (lockResult.rowCount === 0) {
          throw new Error(
            `Ticket ${ticketRow.ticket_id} is no longer available (may have been traded concurrently)`
          );
        }
      }

      // Check if all participants have confirmed
      const allParticipantsResult = await client.query(
        `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE confirmed = TRUE) as confirmed_count
         FROM trade_participant
         WHERE trade_id = $1`,
        [tradeId]
      );

      const { total, confirmed_count } = allParticipantsResult.rows[0];

      // If all confirmed, complete the trade
      if (parseInt(confirmed_count) === parseInt(total)) {
        // Get all tickets involved in this trade
        const ticketsResult = await client.query(
          `SELECT ticket_id, from_user_id, to_user_id FROM trade_ticket
           WHERE trade_id = $1`,
          [tradeId]
        );

        // Transfer tickets (they should already be locked from when users confirmed)
        for (const ticketRow of ticketsResult.rows) {
          // Verify ticket is still locked and owned by the correct user
          const ticketCheckResult = await client.query(
            `SELECT status, owner_id FROM ticket WHERE ticket_id = $1`,
            [ticketRow.ticket_id]
          );

          if (ticketCheckResult.rows.length === 0) {
            throw new Error(`Ticket ${ticketRow.ticket_id} not found`);
          }

          const ticket = ticketCheckResult.rows[0];

          if (ticket.owner_id !== ticketRow.from_user_id) {
            throw new Error(`Ticket ${ticketRow.ticket_id} ownership changed unexpectedly`);
          }

          if (ticket.status !== 'Locked') {
            throw new Error(`Ticket ${ticketRow.ticket_id} is not in locked state (status: ${ticket.status})`);
          }

          // Transfer ownership and mark as completed
          await client.query(
            `UPDATE ticket
             SET owner_id = $1, status = 'Completed'
             WHERE ticket_id = $2`,
            [ticketRow.to_user_id, ticketRow.ticket_id]
          );
        }

        // Get participants info
        const participantsResult = await client.query(
          `SELECT user_id, role FROM trade_participant WHERE trade_id = $1`,
          [tradeId]
        );

        let buyerId: number | null = null;
        let sellerId: number | null = null;
        let isExchange = false;

        for (const p of participantsResult.rows) {
          if (p.role === 'buyer') buyerId = p.user_id;
          if (p.role === 'seller') sellerId = p.user_id;
          if (p.role === 'exchanger') isExchange = true;
        }

        // Handle balance changes only if not an exchange or if there's a price difference
        if (trade.agreed_price !== 0) {
          if (isExchange) {
            // For exchange with price difference
            // The agreed_price can be positive or negative:
            // - Positive: listing owner receives money (trade initiator pays)
            // - Negative: listing owner pays money (trade initiator receives)
            const participants = participantsResult.rows;
            const listingOwner = participants.find((p: any) => p.user_id === trade.seller_id);
            const tradeInitiator = participants.find((p: any) => p.user_id !== trade.seller_id);
            
            if (!listingOwner || !tradeInitiator) {
              throw new Error('Invalid trade participants');
            }

            const priceAmount = parseFloat(trade.agreed_price);
            
            // Update balances based on price direction
            await client.query(
              `UPDATE "USER" SET balance = balance + $1 WHERE user_id = $2`,
              [priceAmount, listingOwner.user_id]
            );

            await client.query(
              `UPDATE "USER" SET balance = balance - $1 WHERE user_id = $2`,
              [priceAmount, tradeInitiator.user_id]
            );

            // Check if payer has sufficient balance
            const payerId = priceAmount > 0 ? tradeInitiator.user_id : listingOwner.user_id;
            const payerBalanceResult = await client.query(
              `SELECT balance FROM "USER" WHERE user_id = $1`,
              [payerId]
            );

            if (parseFloat(payerBalanceResult.rows[0].balance) < 0) {
              throw new Error('Insufficient balance to complete trade');
            }

            // Log balance changes
            await client.query(
              `INSERT INTO user_balance_log (user_id, trade_id, change, reason)
               VALUES ($1, $2, $3, 'TRADE_PRICE_DIFFERENCE'), ($4, $2, $5, 'TRADE_PRICE_DIFFERENCE')`,
              [listingOwner.user_id, tradeId, priceAmount, tradeInitiator.user_id, -priceAmount]
            );
            
          } else {
            // Regular buy/sell transaction
            if (!buyerId || !sellerId) {
              throw new Error('Invalid trade participants');
            }

            // Update balances
            await client.query(
              `UPDATE "USER" SET balance = balance + $1 WHERE user_id = $2`,
              [trade.agreed_price, sellerId]
            );

            await client.query(
              `UPDATE "USER" SET balance = balance - $1 WHERE user_id = $2`,
              [trade.agreed_price, buyerId]
            );

            // Check buyer has sufficient balance
            const buyerBalanceResult = await client.query(
              `SELECT balance FROM "USER" WHERE user_id = $1`,
              [buyerId]
            );

            if (parseFloat(buyerBalanceResult.rows[0].balance) < 0) {
              throw new Error('Insufficient balance to complete trade');
            }

            // Log balance changes
            await client.query(
              `INSERT INTO user_balance_log (user_id, trade_id, change, reason)
               VALUES ($1, $2, $3, 'TRADE_PAYMENT'), ($4, $2, $5, 'TRADE_PAYMENT')`,
              [sellerId, tradeId, trade.agreed_price, buyerId, -trade.agreed_price]
            );
          }
        }
        // If agreed_price is 0, no balance changes needed (pure ticket exchange)

        // Complete trade and listing
        await client.query(
          `UPDATE trade SET status = 'Completed', updated_at = NOW()
           WHERE trade_id = $1`,
          [tradeId]
        );

        await client.query(
          `UPDATE listing SET status = 'Completed'
           WHERE listing_id = $1`,
          [trade.listing_id]
        );

        return {
          trade_id: tradeId,
          status: 'Completed',
          message: 'Trade completed successfully! Tickets transferred and balances updated.',
        };
      } else {
        return {
          trade_id: tradeId,
          status: 'Pending',
          message: 'Your confirmation recorded. Waiting for other party to confirm.',
          confirmed: parseInt(confirmed_count),
          total: parseInt(total),
        };
      }
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Confirm trade error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to confirm trade' },
      { status: 400 }
    );
  }
}

