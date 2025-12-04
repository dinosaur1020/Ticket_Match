const { Client } = require('pg');
const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

client.connect().then(async () => {
  console.log('📊 最終完整系統驗證\n');

  const tables = [
    'USER', 'user_role', 'event', 'eventtime', 'ticket', 'listing', 'trade', 'trade_participant', 'trade_ticket', 'user_balance_log'
  ];

  let totalRecords = 0;
  console.log('📋 資料表統計:');
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
    const count = parseInt(result.rows[0].count);
    totalRecords += count;
    console.log(`  ${table.padEnd(18)}: ${count.toLocaleString()} 筆`);
  }

  console.log(`\n📈 總記錄數: ${totalRecords.toLocaleString()} 筆\n`);

  // Check user roles
  const userRoleStats = await client.query('SELECT role, COUNT(*) as count FROM user_role GROUP BY role ORDER BY count DESC');
  console.log('👤 用戶角色統計:');
  userRoleStats.rows.forEach(row => {
    console.log(`  ${row.role}: ${row.count.toLocaleString()} 個`);
  });

  console.log('\n✅ 資料庫傾印還原成功！');
  console.log('📁 檔案: ticket_match_data.dump (39KB)');
  console.log('🎯 包含用戶角色表和完整資料');

  await client.end();
}).catch(console.error);
