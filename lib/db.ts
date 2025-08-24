import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGO_URI environment variable");
}

let cached = (global as any)._mongoose;
if (!cached) {
  cached = (global as any)._mongoose = { conn: null, promise: null };
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
