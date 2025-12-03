const { query } = require('./lib/db.ts');

async function checkTickets() {
  try {
    console.log('Ticket ownership mapping:');
    const result = await query(`
      SELECT t.ticket_id, t.owner_id, u.username, t.seat_area, t.seat_number, et.event_id, e.event_name
      FROM ticket t
      JOIN "USER" u ON t.owner_id = u.user_id
      JOIN eventtime et ON t.eventtime_id = et.eventtime_id
      JOIN event e ON et.event_id = e.event_id
      ORDER BY t.ticket_id
    `);

    // Group by user
    const userTickets = {};
    result.rows.forEach(row => {
      if (!userTickets[row.owner_id]) {
        userTickets[row.owner_id] = {
          username: row.username,
          tickets: []
        };
      }
      userTickets[row.owner_id].tickets.push({
        id: row.ticket_id,
        event: row.event_name.substring(0, 10) + '...',
        seat: `${row.seat_area} ${row.seat_number}`
      });
    });

    Object.keys(userTickets).sort((a,b) => parseInt(a) - parseInt(b)).forEach(userId => {
      const user = userTickets[userId];
      console.log(`\nUser ${userId} (${user.username}) owns tickets:`);
      user.tickets.forEach(ticket => {
        console.log(`  ${ticket.id}: ${ticket.event} - ${ticket.seat}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTickets().then(() => process.exit(0));
