const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

async function migrateUserToProfile() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Get the approved tutor user
    const approvedUser = await db.collection('users').findOne({
      _id: new ObjectId('68dd75a7ff116e894fa267d6')
    });

    if (!approvedUser) {
      console.log('Approved user not found');
      return;
    }

    // Check if profile already exists
    const existingProfile = await db.collection('profiles').findOne({
      user_id: approvedUser._id.toString()
    });

    if (existingProfile) {
      console.log('Profile already exists for this user');
      return;
    }

    // Create profile from user data
    const profile = {
      user_id: approvedUser._id.toString(),
      first_name: approvedUser.firstName || '',
      last_name: approvedUser.lastName || '',
      full_name: approvedUser.fullName || `${approvedUser.firstName || ''} ${approvedUser.lastName || ''}`.trim(),
      email: approvedUser.email,
      role: approvedUser.role,
      phone: approvedUser.phone,
      avatar_url: null,
      address: null,
      date_of_birth: null,
      gender: null,
      is_active: approvedUser.isActive !== false, // default to true
      last_login: approvedUser.lastLogin,
      created_at: approvedUser.createdAt || new Date().toISOString(),
      updated_at: approvedUser.updatedAt || new Date().toISOString(),
      cv_url: null,
      cv_file_name: null,
      specializations: approvedUser.specializations || [],
      hourly_rate: null,
      availability: null,
      bio: null,
      certifications: approvedUser.certifications || [],
      languages: approvedUser.languages || [],
      profile_completed: approvedUser.profileCompleted || false,
      qualification: approvedUser.qualification,
      experience_years: approvedUser.experienceYears,
      subjects: approvedUser.subjects || []
    };

    // Insert the profile
    const result = await db.collection('profiles').insertOne(profile);
    console.log('Profile created successfully!');
    console.log('Profile ID:', result.insertedId);
    console.log('Profile data:', JSON.stringify(profile, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

migrateUserToProfile();
