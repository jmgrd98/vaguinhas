import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env");
}

const uri = process.env.MONGODB_URI;
let cachedClient: MongoClient;
let cachedDb: Db;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.DB_NAME);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export async function getAllSubscribers(page: number, pageSize: number) {
  try {
    const { db } = await connectToDatabase();
    const subscribersCollection = db.collection("users");

    const total = await subscribersCollection.countDocuments();
    const subscribers = await subscribersCollection.find(
      {},
      { projection: { email: 1, _id: 0 } }
    )
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return { subscribers, total };
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return { subscribers: [], total: 0 };
  }
}

// lib/mongodb.ts
export async function getSubscribersWithoutStacks(page: number, pageSize: number) {
  try {
    const { db } = await connectToDatabase();
    const subscribersCollection = db.collection("users");

    const total = await subscribersCollection.countDocuments();
    const subscribers = await subscribersCollection.find(
      { stacks: { $exists: false } }, // MongoDB query filter
      { projection: { email: 1, _id: 0 } }
    )
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

    return { subscribers, total };
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return { subscribers: [], total: 0 };
  }
}

export async function getAllConfirmedSubscribers() {
  try {
    const { db } = await connectToDatabase();
    const subscribersCollection = db.collection("users");
    
    return await subscribersCollection.find(
      { confirmed: true }, 
      { projection: { email: 1, _id: 0 } }
    ).toArray();
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return [];
  }
}
