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

      // Calculate how much this trade will cost the current user
      let thisTradeDebit = 0;
      
      if (trade.listing_type === 'Sell' || trade.listing_type === 'Buy') {
        // For buy/sell, determine if current user is the buyer
        const isBuyer = participant.role === 'buyer';
        if (isBuyer) {
          thisTradeDebit = parseFloat(trade.agreed_price);
        }
      } else if (trade.listing_type === 'Exchange') {
        // For exchange, check if current user needs to pay
        const isListingOwner = session.user_id === trade.seller_id;
        const agreedPrice = parseFloat(trade.agreed_price);
        
        if ((agreedPrice > 0 && !isListingOwner) || (agreedPrice < 0 && isListingOwner)) {
          // Current user is the payer
          thisTradeDebit = Math.abs(agreedPrice);
        }
      }

      // Check user's current balance and pending confirmed trades
      if (thisTradeDebit > 0) {
        // Get user's current balance
        const userBalanceResult = await client.query(
          `SELECT balance FROM "USER" WHERE user_id = $1`,
          [session.user_id]
        );
        const currentBalance = parseFloat(userBalanceResult.rows[0].balance);

        // Calculate total pending debits from other confirmed but incomplete trades
        const pendingDebitsResult = await client.query(
          `SELECT 
            t.trade_id,
            t.agreed_price,
            t.status,
            l.type as listing_type,
            l.user_id as listing_owner_id,
            tp.role,
            tp.confirmed
           FROM trade t
           JOIN listing l ON t.listing_id = l.listing_id
           JOIN trade_participant tp ON t.trade_id = tp.trade_id
           WHERE tp.user_id = $1 
             AND t.status = 'Pending'
             AND tp.confirmed = TRUE
             AND t.trade_id != $2`,
          [session.user_id, tradeId]
        );

        let totalPendingDebits = 0;
        for (const pendingTrade of pendingDebitsResult.rows) {
          const agreedPrice = parseFloat(pendingTrade.agreed_price);
          const listingType = pendingTrade.listing_type;
          const isListingOwner = session.user_id === pendingTrade.listing_owner_id;

          if (listingType === 'Sell' || listingType === 'Buy') {
            if (pendingTrade.role === 'buyer') {
              totalPendingDebits += agreedPrice;
            }
          } else if (listingType === 'Exchange') {
            if ((agreedPrice > 0 && !isListingOwner) || (agreedPrice < 0 && isListingOwner)) {
              totalPendingDebits += Math.abs(agreedPrice);
            }
          }
        }

        // Check if user has enough balance for all pending trades plus this one
        const totalRequired = totalPendingDebits + thisTradeDebit;
        if (currentBalance < totalRequired) {
          throw new Error(
            `Insufficient balance. You have $${currentBalance.toFixed(2)} but need $${totalRequired.toFixed(2)} ` +
            `(including $${totalPendingDebits.toFixed(2)} from other pending confirmed trades)`
          );
        }
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
        // Validate agreed_price against original ticket prices before completing
        if (trade.listing_type === 'Sell' || trade.listing_type === 'Buy') {
          // Get seller's tickets (from_user determines who is giving tickets)
          const sellerTicketsResult = await client.query(
            `SELECT t.price, tt.from_user_id
             FROM trade_ticket tt
             JOIN ticket t ON tt.ticket_id = t.ticket_id
             WHERE tt.trade_id = $1`,
            [tradeId]
          );

          // Calculate total original price of tickets being sold
          let sellerTicketsPriceTotal = 0;
          for (const row of sellerTicketsResult.rows) {
            // For Sell listings, seller is listing owner (trade.seller_id)
            // For Buy listings, seller is the other participant
            const isSeller = (trade.listing_type === 'Sell' && row.from_user_id === trade.seller_id) ||
                           (trade.listing_type === 'Buy' && row.from_user_id !== trade.seller_id);
            
            if (isSeller) {
              sellerTicketsPriceTotal += parseFloat(row.price);
            }
          }

          // Validate agreed_price does not exceed original ticket prices
          const agreedPriceValue = parseFloat(trade.agreed_price);
          if (sellerTicketsPriceTotal > 0 && agreedPriceValue > sellerTicketsPriceTotal) {
            throw new Error(
              `售價 ($${agreedPriceValue.toFixed(2)}) 不能超過票的原價總和 ($${sellerTicketsPriceTotal.toFixed(2)})`
            );
          }
        }

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

          // Transfer ownership (keep status as Active)
          await client.query(
            `UPDATE ticket
             SET owner_id = $1, status = 'Active'
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

            const priceAmount = Math.abs(parseFloat(trade.agreed_price));

            // For exchange transactions, we need to handle balance transfers atomically
            // agreed_price > 0: listing owner receives, trade initiator pays
            // agreed_price < 0: listing owner pays, trade initiator receives
            const transferAmount = parseFloat(trade.agreed_price);
            const payerId = transferAmount > 0 ? tradeInitiator.user_id : listingOwner.user_id;
            const paymentAmount = Math.abs(transferAmount);

            // Atomic check and update payer balance: only deduct if sufficient balance
            const payerUpdateResult = await client.query(
              `UPDATE "USER"
               SET balance = balance - $1
               WHERE user_id = $2 AND balance >= $1
               RETURNING balance`,
              [paymentAmount, payerId]
            );

            if (payerUpdateResult.rowCount === 0) {
              throw new Error('Insufficient balance to complete trade');
            }

            // Now perform the receiver balance update
            const receiverId = transferAmount > 0 ? listingOwner.user_id : tradeInitiator.user_id;
            await client.query(
              `UPDATE "USER" SET balance = balance + $1 WHERE user_id = $2`,
              [paymentAmount, receiverId]
            );

            // Log balance changes
            await client.query(
              `INSERT INTO user_balance_log (user_id, trade_id, change, reason)
               VALUES ($1, $2, $3, 'TRADE_PRICE_DIFFERENCE'), ($4, $2, $5, 'TRADE_PRICE_DIFFERENCE')`,
              [listingOwner.user_id, tradeId, transferAmount, tradeInitiator.user_id, -transferAmount]
            );

          } else {
            // Regular buy/sell transaction
            if (!buyerId || !sellerId) {
              throw new Error('Invalid trade participants');
            }

            const tradeAmount = parseFloat(trade.agreed_price);

            // Atomic check and update buyer balance: only deduct if sufficient balance
            const buyerUpdateResult = await client.query(
              `UPDATE "USER"
               SET balance = balance - $1
               WHERE user_id = $2 AND balance >= $1
               RETURNING balance`,
              [tradeAmount, buyerId]
            );

            if (buyerUpdateResult.rowCount === 0) {
              throw new Error('Insufficient balance to complete trade');
            }

            // Now perform the seller balance update (safe since buyer balance was validated)
            await client.query(
              `UPDATE "USER" SET balance = balance + $1 WHERE user_id = $2`,
              [tradeAmount, sellerId]
            );

            // Log balance changes
            await client.query(
              `INSERT INTO user_balance_log (user_id, trade_id, change, reason)
               VALUES ($1, $2, $3, 'TRADE_PAYMENT'), ($4, $2, $5, 'TRADE_PAYMENT')`,
              [sellerId, tradeId, tradeAmount, buyerId, -tradeAmount]
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

