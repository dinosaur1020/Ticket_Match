#!/usr/bin/env node

/**
 * Data Integrity Check Script
 * 檢查資料庫的資料完整性和約束條件
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
});

async function checkDataIntegrity() {
  const client = await pool.connect();

  try {
    console.log('🔍 檢查資料完整性...\n');

    // 1. 檢查孤立記錄 (Orphaned Records)
    console.log('1. 檢查孤立記錄:');

    const orphanedTickets = await client.query(`
      SELECT t.ticket_id, t.eventtime_id
      FROM ticket t
      LEFT JOIN eventtime et ON t.eventtime_id = et.eventtime_id
      WHERE et.eventtime_id IS NULL
    `);

    if (orphanedTickets.rows.length > 0) {
      console.log('   ❌ 發現孤立的票券記錄:', orphanedTickets.rows.length);
      orphanedTickets.rows.forEach(row => {
        console.log(`      - 票券 ID ${row.ticket_id} 參考不存在的場次 ${row.eventtime_id}`);
      });
    } else {
      console.log('   ✅ 無孤立票券記錄');
    }

    const orphanedListings = await client.query(`
      SELECT l.listing_id, l.event_id
      FROM listing l
      LEFT JOIN event e ON l.event_id = e.event_id
      WHERE e.event_id IS NULL
    `);

    if (orphanedListings.rows.length > 0) {
      console.log('   ❌ 發現孤立的貼文記錄:', orphanedListings.rows.length);
    } else {
      console.log('   ✅ 無孤立貼文記錄');
    }

    // 2. 檢查業務邏輯完整性
    console.log('\n2. 檢查業務邏輯完整性:');

    // 檢查是否有票券被重複交易
    const doubleBookedTickets = await client.query(`
      SELECT ticket_id, COUNT(*) as trade_count
      FROM trade_ticket
      GROUP BY ticket_id
      HAVING COUNT(*) > 1
    `);

    if (doubleBookedTickets.rows.length > 0) {
      console.log('   ❌ 發現票券重複交易:', doubleBookedTickets.rows.length);
    } else {
      console.log('   ✅ 無票券重複交易');
    }

    // 檢查交易狀態一致性
    const inconsistentTrades = await client.query(`
      SELECT t.trade_id, t.status,
             COUNT(tp.confirmed) filter (where tp.confirmed = true) as confirmed_count,
             COUNT(tp.*) as total_participants
      FROM trade t
      JOIN trade_participant tp ON t.trade_id = tp.trade_id
      WHERE t.status = 'Completed'
      GROUP BY t.trade_id, t.status
      HAVING COUNT(tp.confirmed) filter (where tp.confirmed = true) < COUNT(tp.*)
    `);

    if (inconsistentTrades.rows.length > 0) {
      console.log('   ❌ 發現狀態不一致的交易:', inconsistentTrades.rows.length);
    } else {
      console.log('   ✅ 交易狀態一致');
    }

    // 3. 檢查餘額一致性
    console.log('\n3. 檢查餘額一致性:');

    const balanceInconsistencies = await client.query(`
      SELECT u.user_id, u.username, u.balance as current_balance,
             COALESCE(SUM(ubl.change), 0) as calculated_balance
      FROM "USER" u
      LEFT JOIN user_balance_log ubl ON u.user_id = ubl.user_id
      GROUP BY u.user_id, u.username, u.balance
      HAVING u.balance != COALESCE(SUM(ubl.change), 0)
    `);

    if (balanceInconsistencies.rows.length > 0) {
      console.log('   ❌ 發現餘額不一致:', balanceInconsistencies.rows.length);
      balanceInconsistencies.rows.forEach(row => {
        console.log(`      - 用戶 ${row.username}: 當前 ${row.current_balance}, 計算 ${row.calculated_balance}`);
      });
    } else {
      console.log('   ✅ 餘額一致');
    }

    // 4. 檢查外鍵約束
    console.log('\n4. 檢查外鍵約束:');

    // 檢查外鍵約束數量
    const fkConstraints = await client.query(`
      SELECT COUNT(*) as fk_count
      FROM information_schema.table_constraints tc
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    `);

    console.log(`   📋 發現 ${fkConstraints.rows[0].fk_count} 個外鍵約束`);

    // 5. 檢查資料品質
    console.log('\n5. 檢查資料品質:');

    const userStats = await client.query('SELECT COUNT(*) as user_count FROM "USER"');
    const activeUsers = await client.query('SELECT COUNT(*) as active_count FROM "USER" WHERE status = \'Active\'');
    const eventStats = await client.query('SELECT COUNT(*) as event_count FROM event');
    const ticketStats = await client.query('SELECT COUNT(*) as ticket_count FROM ticket');
    const tradeStats = await client.query('SELECT COUNT(*) as trade_count FROM trade WHERE status = \'Completed\'');

    console.log(`   👥 用戶: ${userStats.rows[0].user_count} 總計, ${activeUsers.rows[0].active_count} 活躍`);
    console.log(`   🎭 活動: ${eventStats.rows[0].event_count}`);
    console.log(`   🎫 票券: ${ticketStats.rows[0].ticket_count}`);
    console.log(`   💰 完成交易: ${tradeStats.rows[0].trade_count}`);

    console.log('\n✅ 資料完整性檢查完成');

  } catch (error) {
    console.error('❌ 檢查過程中發生錯誤:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  checkDataIntegrity();
}

module.exports = { checkDataIntegrity };
