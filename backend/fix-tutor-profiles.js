const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

async function fixTutorProfiles() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('🔧 Fixing tutor profiles for approved applications...\n');

    // Get all approved applications
    const approvedApplications = await db.collection('tutor_applications')
      .find({ application_status: 'approved' })
      .toArray();

    console.log(`📋 Found ${approvedApplications.length} approved applications`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const application of approvedApplications) {
      const userId = application.user_id;

      // Check if profile already exists with tutor role
      const existingProfile = await db.collection('profiles').findOne({
        user_id: userId,
        role: 'tutor'
      });

      if (existingProfile) {
        console.log(`⏭️  Profile for ${application.full_name} (${application.applicant_email}) already exists as tutor`);
        skippedCount++;
        continue;
      }

      // Check if profile exists but with different role
      const existingProfileOtherRole = await db.collection('profiles').findOne({
        user_id: userId
      });

      if (existingProfileOtherRole) {
        // Update existing profile to tutor role
        await db.collection('profiles').updateOne(
          { user_id: userId },
          {
            $set: {
              role: 'tutor',
              updated_at: new Date().toISOString()
            }
          }
        );
        console.log(`✅ Updated existing profile for ${application.full_name} (${application.applicant_email}) to tutor role`);
      } else {
        // Create new tutor profile
        const newProfile = {
          user_id: userId,
          email: application.applicant_email,
          first_name: application.full_name.split(' ')[0] || '',
          last_name: application.full_name.split(' ').slice(1).join(' ') || '',
          full_name: application.full_name,
          role: 'tutor',
          phone: application.phone_number || null,
          address: null,
          date_of_birth: null,
          gender: null,
          is_active: true,
          last_login: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          qualification: null,
          experience_years: null,
          hourly_rate: application.expected_hourly_rate || null,
          availability: application.weekly_availability || null,
          bio: null,
          subjects: application.subjects || [],
          specializations: null,
          languages: null,
          certifications: null,
          profile_completed: false,
          profile_image_url: null,
          // Additional fields from application
          postcode: application.postcode || null,
          past_experience: application.past_experience || null,
          employment_status: application.employment_status || null,
          education_level: application.education_level || null,
          average_weekly_hours: application.average_weekly_hours || null,
          based_in_country: application.based_in_country || null
        };

        await db.collection('profiles').insertOne(newProfile);
        console.log(`✅ Created new tutor profile for ${application.full_name} (${application.applicant_email})`);
      }

      updatedCount++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Updated/Created: ${updatedCount} profiles`);
    console.log(`   ⏭️  Skipped: ${skippedCount} profiles`);
    console.log(`   📋 Total processed: ${approvedApplications.length} approved applications`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const tutorProfilesAfter = await db.collection('profiles').find({ role: 'tutor' }).toArray();
    console.log(`👥 Tutor profiles now: ${tutorProfilesAfter.length}`);

    if (tutorProfilesAfter.length === approvedApplications.length) {
      console.log('✅ Fix successful! All approved applications now have tutor profiles.');
    } else {
      console.log('⚠️  Some discrepancies remain. Please check the logs above.');
    }

  } catch (error) {
    console.error('❌ Error fixing tutor profiles:', error);
  } finally {
    await client.close();
  }
}

fixTutorProfiles();
