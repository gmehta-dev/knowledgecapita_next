import 'server-only';
import mongoose from 'mongoose';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

// One connection (pool) per server process, reused across requests and hot reloads.
const globalForMongoose = globalThis as unknown as { _mongoose?: Cache };
const cache: Cache = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cache;

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');

    cache.promise = mongoose
      .connect(uri, {
        // Never build/alter indexes on the shared production database from this app.
        // Set MONGODB_AUTO_INDEX=true only for a fresh local/dev database.
        autoIndex: process.env.MONGODB_AUTO_INDEX === 'true',
        maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10),
        serverSelectionTimeoutMS: 10000
      })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((error) => {
        cache.promise = null;
        console.error(`MongoDB Connection Error: ${error.message}`);
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
