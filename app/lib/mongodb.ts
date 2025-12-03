import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticket_match';
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI not found in environment variables, using default: mongodb://localhost:27017/ticket_match');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the MongoClient across hot reloads
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, create a new client
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export async function getUserActivityCollection(): Promise<Collection> {
  const db = await getDatabase();
  return db.collection('user_activity_log');
}

// Log user activity to MongoDB
export async function logUserActivity(data: {
  user_id?: number;
  action: 'search' | 'click' | 'view_event' | 'view_listing';
  keyword?: string;
  listing_id?: number;
  event_id?: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const collection = await getUserActivityCollection();
    await collection.insertOne({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
    // Don't throw - activity logging should not break the main flow
  }
}

// Get browsing trends data with time grouping
export async function getBrowsingTrends(
  days?: number
): Promise<any[]> {
  try {
    const collection = await getUserActivityCollection();
    
    // Build match filter
    const matchFilter: any = {
      action: { $in: ['view_event', 'view_listing'] }
    };
    
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      matchFilter.timestamp = { $gte: startDate };
    }
    
    const results = await collection
      .aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
              },
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } },
        {
          $group: {
            _id: '$_id.date',
            views: {
              $push: {
                action: '$_id.action',
                count: '$count'
              }
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();
    
    return results;
  } catch (error) {
    console.error('Failed to get browsing trends:', error);
    return [];
  }
}

// Get popular content (most viewed events and listings)
export async function getPopularContent(
  contentType: 'event' | 'listing',
  limit: number = 10
): Promise<any[]> {
  try {
    const collection = await getUserActivityCollection();
    
    const action = contentType === 'event' ? 'view_event' : 'view_listing';
    const idField = contentType === 'event' ? 'event_id' : 'listing_id';
    
    const results = await collection
      .aggregate([
        { 
          $match: { 
            action,
            [idField]: { $exists: true, $ne: null }
          } 
        },
        {
          $group: {
            _id: `$${idField}`,
            view_count: { $sum: 1 },
            unique_users: { $addToSet: '$user_id' }
          }
        },
        {
          $project: {
            _id: 0,
            content_id: '$_id',
            view_count: 1,
            unique_users: { $size: '$unique_users' }
          }
        },
        { $sort: { view_count: -1 } },
        { $limit: limit }
      ])
      .toArray();
    
    return results;
  } catch (error) {
    console.error('Failed to get popular content:', error);
    return [];
  }
}

// Get user browsing history
export async function getUserBrowsingHistory(
  userId: number,
  limit: number = 50
): Promise<any[]> {
  try {
    const collection = await getUserActivityCollection();
    
    const results = await collection
      .find({
        user_id: userId,
        action: { $in: ['view_event', 'view_listing'] }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return results;
  } catch (error) {
    console.error('Failed to get user browsing history:', error);
    return [];
  }
}

// Create indexes for better query performance
export async function createIndexes(): Promise<void> {
  try {
    const collection = await getUserActivityCollection();
    
    await collection.createIndex({ user_id: 1, timestamp: -1 });
    await collection.createIndex({ action: 1, timestamp: -1 });
    await collection.createIndex({ event_id: 1 });
    await collection.createIndex({ listing_id: 1 });
    await collection.createIndex({ timestamp: -1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Failed to create indexes:', error);
  }
}

export default clientPromise;

