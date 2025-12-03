/**
 * Initialize MongoDB indexes for user activity collection
 * Run this script to create indexes for better query performance
 * 
 * Usage: node scripts/init-mongodb-indexes.js
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket_match';

async function createIndexes() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('user_activity_log');
    
    // Create indexes
    console.log('Creating indexes...');
    
    await collection.createIndex({ user_id: 1, timestamp: -1 });
    console.log('✓ Created index: user_id + timestamp');
    
    await collection.createIndex({ action: 1, timestamp: -1 });
    console.log('✓ Created index: action + timestamp');
    
    await collection.createIndex({ event_id: 1 });
    console.log('✓ Created index: event_id');
    
    await collection.createIndex({ listing_id: 1 });
    console.log('✓ Created index: listing_id');
    
    await collection.createIndex({ timestamp: -1 });
    console.log('✓ Created index: timestamp');
    
    console.log('\nAll indexes created successfully!');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('\nCurrent indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, JSON.stringify(index.key));
    });
    
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed');
  }
}

createIndexes();

