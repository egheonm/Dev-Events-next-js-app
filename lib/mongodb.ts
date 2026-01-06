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
const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

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

  // If no connection promise exists, create a new one.
  // We set a short server selection timeout so failures surface quickly
  // and disable buffering so commands fail fast instead of queuing.
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // fail quickly if server is unreachable
    } as const;

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    // Await the connection promise and cache the result
    cached.conn = await cached.promise;
  } catch (error: unknown) {
    // Reset the promise on error so the next call can retry
    cached.promise = null;

    // Provide a clearer error when DNS SRV resolution fails. A common
    // runtime error looks like:
    //   "querySrv ECONNREFUSED _mongodb._tcp.<your-cluster>.mongodb.net"
    // This usually means one of the following:
    // - The `MONGODB_URI` uses the SRV form (`mongodb+srv://`) but the
    //   environment cannot resolve SRV DNS records (corporate network, DNS
    //   restrictions, or missing DNS support).
    // - The cluster host name in the URI is incorrect or the Atlas cluster
    //   is down / network access is blocked by a firewall.
    // Suggested fixes:
    // - Verify `MONGODB_URI` is correct and reachable from this machine.
    // - If DNS SRV is blocked, try using the standard connection string
    //   (non-SRV) form from the Atlas UI (hosts + port list), or ensure
    //   your DNS/network allows SRV lookups to `mongodb.net`.
    // - Check IP whitelist / VPC rules in your Atlas project.
    if (
      error instanceof Error &&
      /querySrv|ECONNREFUSED|ENOTFOUND/i.test(error.message)
    ) {
      const isSrv = (MONGODB_URI || '').startsWith('mongodb+srv://');
      const extra = isSrv
        ? 'The URI uses mongodb+srv:// — DNS SRV lookup failed. Try a non-SRV connection string or fix DNS/network.'
        : 'Network error while connecting to MongoDB. Check that the host is reachable and credentials are correct.';

      const wrapped = new Error(
        `MongoDB connection error: ${error.message}. ${extra} See MONGODB_URI and network settings.`
      );
      // Preserve original stack for debugging
      wrapped.stack = error.stack;
      throw wrapped;
    }

    // Re-throw the original error if it doesn't match known SRV/network patterns
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
