#!/usr/bin/env node

/**
 * Database initialization script
 * Applies schema and seed data to PostgreSQL
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables if .env.local exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !line.startsWith('#')) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'ticket_match',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Initializing database...\n');
    
    // Read schema.sql from parent directory
    const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    console.log('📋 Applying schema...');
    await client.query(schema);
    console.log('✅ Schema applied successfully\n');
    
    // Load seed data
    const args = process.argv.slice(2);
    if (args.includes('--seed')) {
      // Check if a custom seed file is provided
      const seedIndex = args.indexOf('--seed');
      let seedPath = path.join(__dirname, 'seed-data.sql');

      if (seedIndex + 1 < args.length && !args[seedIndex + 1].startsWith('--')) {
        // Custom seed file provided
        seedPath = path.resolve(args[seedIndex + 1]);
      }

      if (fs.existsSync(seedPath)) {
        console.log(`🌱 Loading seed data from ${path.basename(seedPath)}...`);
        const seedData = fs.readFileSync(seedPath, 'utf-8');
        await client.query(seedData);

        // Reset sequences to match the maximum IDs in the data
        console.log('🔄 Resetting sequences...');
        const sequences = [
          { seq: 'event_event_id_seq', table: 'event', column: 'event_id' },
          { seq: 'eventtime_eventtime_id_seq', table: 'eventtime', column: 'eventtime_id' },
          { seq: 'ticket_ticket_id_seq', table: 'ticket', column: 'ticket_id' },
          { seq: 'listing_listing_id_seq', table: 'listing', column: 'listing_id' },
          { seq: 'trade_trade_id_seq', table: 'trade', column: 'trade_id' },
          { seq: 'user_balance_log_log_id_seq', table: 'user_balance_log', column: 'log_id' }
        ];

        for (const { seq, table, column } of sequences) {
          try {
            const result = await client.query(`SELECT MAX(${column}) as max_id FROM ${table}`);
            const maxId = result.rows[0].max_id;
            if (maxId) {
              await client.query(`SELECT setval('${seq}', ${maxId})`);
              console.log(`  ✅ Reset ${seq} to ${maxId}`);
            }
          } catch (err) {
            // Ignore errors for tables that don't exist or are empty
            console.log(`  ⚠️  Skipped ${seq}: ${err.message}`);
          }
        }

        console.log('✅ Seed data loaded and sequences reset successfully\n');
      } else {
        console.warn(`⚠️  Seed data file not found: ${seedPath}, skipping...\n`);
      }
    }
    
    // Show database stats
    console.log('📊 Database Statistics:');
    const tables = [
      'USER', 'user_role', 'event', 'eventtime', 'event_performer',
      'ticket', 'listing', 'trade', 'trade_participant', 'trade_ticket',
      'user_balance_log'
    ];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      console.log(`  ${table}: ${result.rows[0].count} rows`);
    }
    
    console.log('\n🎉 Database initialization complete!');
    console.log('\n💡 Next steps:');
    console.log('  1. Copy .env.local.example to .env.local and configure');
    console.log('  2. Run: npm run dev');
    console.log('  3. Open http://localhost:3000\n');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
    console.error('\n💡 Make sure:');
    console.error('  - PostgreSQL is running');
    console.error('  - Database exists (create with: createdb ticket_match)');
    console.error('  - Credentials in .env.local are correct\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Handle command line help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Initialization Script

Usage:
  node init-db.js [options]

Options:
  --seed    Load seed data after applying schema
  --help    Show this help message

Examples:
  node init-db.js           Apply schema only
  node init-db.js --seed    Apply schema and load seed data
`);
  process.exit(0);
}

initDatabase();

