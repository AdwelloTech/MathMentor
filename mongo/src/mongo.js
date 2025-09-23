import mongoose from 'mongoose';
let isConnected = false;
export async function connectMongo() {
  if (isConnected) return mongoose.connection;
  const uri = process.env.MONGO_URL;
  if (!uri) { console.error('Missing MONGO_URL'); process.exit(1); }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { autoIndex: true });
  isConnected = true;
  console.log('[mathmentor-mongo] connected');
  return mongoose.connection;
}
