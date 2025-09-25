const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

async function updateIDVerificationStatus(userId, status = 'approved') {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const now = new Date().toISOString();
    const updateData = {
      verification_status: status,
      updated_at: now,
    };

    // Add verification metadata if approving
    if (status === 'approved') {
      updateData.verified_at = now;
      updateData.reviewed_at = now;
      updateData.verified_by = 'admin'; // You can change this to the actual admin ID
      updateData.reviewed_by = 'admin';
    }

    const result = await db.collection('id_verifications').findOneAndUpdate(
      { user_id: userId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      console.log('No ID verification found for user:', userId);
      return null;
    }

    console.log('Updated ID verification status to:', status);
    console.log('Updated document:', result);
    return result;
  } catch (error) {
    console.error('Error updating ID verification status:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// If run directly, update a specific user's verification status
if (require.main === module) {
  const userId = process.argv[2]; // Pass user ID as command line argument
  const status = process.argv[3] || 'approved'; // Default to approved

  if (!userId) {
    console.log('Usage: node update-id-verification.js <userId> [status]');
    console.log('Example: node update-id-verification.js 1234567890 approved');
    process.exit(1);
  }

  updateIDVerificationStatus(userId, status)
    .then(() => {
      console.log('Update completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateIDVerificationStatus };
