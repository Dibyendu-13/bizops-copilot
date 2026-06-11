import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (globalThis as typeof globalThis & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = (globalThis as typeof globalThis & { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  if (cached?.conn) return cached.conn;
  if (!cached?.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI);
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}
