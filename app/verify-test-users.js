const { Client } = require('pg');
const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || '5432',
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

client.connect().then(async () => {
  console.log('🔍 驗證測試帳號:\n');

  const testUsers = ['alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'operator', 'admin'];

  for (const username of testUsers) {
    const result = await client.query('SELECT username, email, balance FROM "USER" WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`✅ ${user.username}: ${user.email} ($${user.balance.toLocaleString()})`);
    } else {
      console.log(`❌ ${username}: 未找到`);
    }
  }

  console.log('\n🔍 檢查用戶角色:');
  const roleResult = await client.query('SELECT u.username, ur.role FROM "USER" u JOIN user_role ur ON u.user_id = ur.user_id WHERE u.username IN ($1, $2, $3, $4)', ['operator', 'admin', 'alice', 'bob']);
  roleResult.rows.forEach(row => {
    console.log(`👤 ${row.username}: ${row.role}`);
  });

  await client.end();
}).catch(console.error);
