const { Client } = require('pg');
const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function testCancelTrade() {
  try {
    await client.connect();
    console.log('🧪 Testing Trade Cancellation\n');

    // Find a pending trade and get one of its participants
    const tradeResult = await client.query(
      `SELECT t.trade_id, tp.user_id, tp.role, u.username
       FROM trade t
       JOIN trade_participant tp ON t.trade_id = tp.trade_id
       JOIN "USER" u ON tp.user_id = u.user_id
       WHERE t.status = 'Pending'
       ORDER BY t.trade_id
       LIMIT 1`
    );

    if (tradeResult.rows.length === 0) {
      console.log('❌ No pending trades found');
      return;
    }

    const trade = tradeResult.rows[0];
    console.log(`📋 Testing cancellation of trade #${trade.trade_id} by user ${trade.username} (${trade.role})`);

    // Check ticket statuses before cancellation
    const ticketsBefore = await client.query(
      `SELECT tt.ticket_id, t.status, t.owner_id
       FROM trade_ticket tt
       JOIN ticket t ON tt.ticket_id = t.ticket_id
       WHERE tt.trade_id = $1`,
      [trade.trade_id]
    );

    console.log('🎫 Ticket statuses before cancellation:');
    ticketsBefore.rows.forEach(ticket => {
      console.log(`  Ticket ${ticket.ticket_id}: ${ticket.status}`);
    });

    // Simulate the cancel logic
    console.log(`\n🔄 Simulating cancellation by user ${trade.user_id}...`);

    // Get all tickets involved in this trade
    const ticketsResult = await client.query(
      `SELECT ticket_id FROM trade_ticket WHERE trade_id = $1`,
      [trade.trade_id]
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
      [trade.trade_id]
    );

    console.log('✅ Trade canceled successfully');

    // Check ticket statuses after cancellation
    const ticketsAfter = await client.query(
      `SELECT tt.ticket_id, t.status, t.owner_id
       FROM trade_ticket tt
       JOIN ticket t ON tt.ticket_id = t.ticket_id
       WHERE tt.trade_id = $1`,
      [trade.trade_id]
    );

    console.log('🎫 Ticket statuses after cancellation:');
    ticketsAfter.rows.forEach(ticket => {
      console.log(`  Ticket ${ticket.ticket_id}: ${ticket.status}`);
    });

    // Verify trade status
    const tradeStatus = await client.query(
      `SELECT status FROM trade WHERE trade_id = $1`,
      [trade.trade_id]
    );

    console.log(`📊 Trade status: ${tradeStatus.rows[0].status}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.end();
  }
}

testCancelTrade();
