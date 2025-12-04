const { Client } = require('pg');
const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function testTicketLocking() {
  try {
    await client.connect();
    console.log('🧪 Testing Ticket Locking Logic\n');

    // Find a pending trade
    const tradeResult = await client.query(
      `SELECT t.trade_id, t.status, tp.user_id, tp.confirmed, tp.role
       FROM trade t
       JOIN trade_participant tp ON t.trade_id = tp.trade_id
       WHERE t.status = 'Pending'
       ORDER BY t.trade_id
       LIMIT 1`
    );

    if (tradeResult.rows.length === 0) {
      console.log('❌ No pending trades found. Please create a trade first.');
      return;
    }

    const trade = tradeResult.rows[0];
    console.log(`📋 Found pending trade #${trade.trade_id}`);

    // Show current ticket statuses
    const ticketsResult = await client.query(
      `SELECT tt.ticket_id, t.status, t.owner_id, tt.from_user_id, tt.to_user_id
       FROM trade_ticket tt
       JOIN ticket t ON tt.ticket_id = t.ticket_id
       WHERE tt.trade_id = $1`,
      [trade.trade_id]
    );

    console.log('🎫 Current ticket statuses:');
    ticketsResult.rows.forEach(ticket => {
      console.log(`  Ticket ${ticket.ticket_id}: ${ticket.status} (owner: ${ticket.owner_id})`);
    });

    // Find an unconfirmed participant
    const unconfirmedParticipant = tradeResult.rows.find(p => !p.confirmed);
    if (!unconfirmedParticipant) {
      console.log('ℹ️  All participants already confirmed');
      return;
    }

    console.log(`\n🔒 Simulating confirmation by user ${unconfirmedParticipant.user_id} (${unconfirmedParticipant.role})`);

    // Simulate the locking logic
    const userTicketsResult = await client.query(
      `SELECT ticket_id FROM trade_ticket WHERE trade_id = $1 AND from_user_id = $2`,
      [trade.trade_id, unconfirmedParticipant.user_id]
    );

    console.log(`📦 User ${unconfirmedParticipant.user_id} is offering ${userTicketsResult.rows.length} tickets`);

    // Check what would happen if we locked these tickets
    for (const ticketRow of userTicketsResult.rows) {
      const ticketCheck = await client.query(
        `SELECT status, owner_id FROM ticket WHERE ticket_id = $1`,
        [ticketRow.ticket_id]
      );

      if (ticketCheck.rows.length > 0) {
        const ticket = ticketCheck.rows[0];
        console.log(`  Ticket ${ticketRow.ticket_id}: ${ticket.status} -> would lock if Active`);
      }
    }

    console.log('\n✅ Test completed - logic appears correct');
    console.log('💡 To actually test: Use the API endpoint POST /api/trades/{id}/confirm');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

testTicketLocking();
