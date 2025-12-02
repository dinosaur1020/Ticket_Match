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

export default clientPromise;

