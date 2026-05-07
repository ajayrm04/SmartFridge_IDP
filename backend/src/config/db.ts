import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/intellifridge';

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[DB] Connected to MongoDB');
  } catch (error) {
    console.error('[DB] Connection failed', error);
    process.exit(1);
  }
}
