// Script to activate all user accounts
import { MongoClient } from 'mongodb';

async function activateAllUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('mathmentor_prod');
    
    // Update all users to be active
    const result = await db.collection('users').updateMany(
      {}, // Empty filter matches all documents
      { $set: { isActive: true } }
    );

    console.log(`✅ Activated ${result.modifiedCount} user accounts`);
    console.log(`Total users processed: ${result.matchedCount}`);

  } catch (error) {
    console.error('❌ Error activating users:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

activateAllUsers();
