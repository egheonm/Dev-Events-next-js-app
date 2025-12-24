import mongoose from 'mongoose';

// Define the MONGODB_URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;


// Define the cached connection type
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type to include our mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize the cache on the global object to persist across hot reloads in development
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes a connection to MongoDB using Mongoose.
 * Caches the connection to prevent multiple connections during development hot reloads.
 * 
 * @returns {Promise<typeof mongoose>} The Mongoose instance
 */
async function dbConnect(): Promise<typeof mongoose> {
// Validate that MONGODB_URI exists
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}
  // Return existing connection if already established
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection promise exists, create a new one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable command buffering to throw errors immediately
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    // Await the connection promise and cache the result
    cached.conn = await cached.promise;
  } catch (error) {
    // Reset the promise on error so the next call can retry
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
