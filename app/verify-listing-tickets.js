const { Client } = require('pg');
const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

client.connect().then(async () => {
  console.log('🔍 驗證Sell/Exchange貼文中的票券狀態...\n');

  // 檢查Sell貼文中的票券
  const sellResult = await client.query(`
    SELECT l.listing_id, l.type, l.offered_ticket_ids, t.ticket_id, t.status
    FROM listing l
    JOIN ticket t ON t.ticket_id = ANY(l.offered_ticket_ids)
    WHERE l.type = 'Sell' AND l.offered_ticket_ids IS NOT NULL
    LIMIT 20
  `);

  console.log('📝 Sell貼文中的票券狀態:');
  let sellNonActiveCount = 0;
  sellResult.rows.forEach(row => {
    if (row.status !== 'Active') {
      console.log(`❌ Listing ${row.listing_id}: 票券 ${row.ticket_id} 狀態為 ${row.status}`);
      sellNonActiveCount++;
    }
  });
  if (sellNonActiveCount === 0) {
    console.log('✅ 所有Sell貼文中的票券都是Active狀態');
  }

  // 檢查Exchange貼文中的票券
  const exchangeResult = await client.query(`
    SELECT l.listing_id, l.type, l.offered_ticket_ids, t.ticket_id, t.status
    FROM listing l
    JOIN ticket t ON t.ticket_id = ANY(l.offered_ticket_ids)
    WHERE l.type = 'Exchange' AND l.offered_ticket_ids IS NOT NULL
    LIMIT 20
  `);

  console.log('\n🔄 Exchange貼文中的票券狀態:');
  let exchangeNonActiveCount = 0;
  exchangeResult.rows.forEach(row => {
    if (row.status !== 'Active') {
      console.log(`❌ Listing ${row.listing_id}: 票券 ${row.ticket_id} 狀態為 ${row.status}`);
      exchangeNonActiveCount++;
    }
  });
  if (exchangeNonActiveCount === 0) {
    console.log('✅ 所有Exchange貼文中的票券都是Active狀態');
  }

  // 統計票券狀態分佈
  const statusResult = await client.query(`
    SELECT status, COUNT(*) as count
    FROM ticket
    GROUP BY status
    ORDER BY count DESC
  `);

  console.log('\n📊 票券狀態分佈:');
  statusResult.rows.forEach(row => {
    console.log(`  ${row.status}: ${row.count} 張`);
  });

  await client.end();
}).catch(console.error);
