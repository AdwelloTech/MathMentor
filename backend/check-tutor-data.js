const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mathmentor';
const DB_NAME = process.env.DB_NAME || 'mathmentor';

async function checkTutorData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    console.log('🔍 Checking tutor data in database...\n');

    // Check tutor applications
    const applications = await db.collection('tutor_applications').find({}).toArray();
    console.log(`📋 Tutor Applications: ${applications.length}`);

    const approvedApps = applications.filter(app => app.application_status === 'approved');
    const pendingApps = applications.filter(app => app.application_status === 'pending');
    const rejectedApps = applications.filter(app => app.application_status === 'rejected');

    console.log(`   ✅ Approved: ${approvedApps.length}`);
    console.log(`   ⏳ Pending: ${pendingApps.length}`);
    console.log(`   ❌ Rejected: ${rejectedApps.length}`);

    // Show some approved applications
    if (approvedApps.length > 0) {
      console.log('\n📝 Sample approved applications:');
      approvedApps.slice(0, 3).forEach((app, i) => {
        console.log(`   ${i + 1}. ${app.full_name} (${app.applicant_email}) - User ID: ${app.user_id}`);
      });
    }

    // Check profiles with tutor role
    const tutorProfiles = await db.collection('profiles').find({ role: 'tutor' }).toArray();
    console.log(`\n👥 Tutor Profiles: ${tutorProfiles.length}`);

    const activeTutors = tutorProfiles.filter(profile => profile.is_active === true);
    const inactiveTutors = tutorProfiles.filter(profile => profile.is_active === false);

    console.log(`   ✅ Active: ${activeTutors.length}`);
    console.log(`   ❌ Inactive: ${inactiveTutors.length}`);

    // Show some tutor profiles
    if (tutorProfiles.length > 0) {
      console.log('\n👤 Sample tutor profiles:');
      tutorProfiles.slice(0, 3).forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.full_name} (${profile.email}) - User ID: ${profile.user_id}, Active: ${profile.is_active}`);
      });
    }

    // Check for approved applications without corresponding tutor profiles
    console.log('\n🔍 Checking for approved applications without tutor profiles...');

    const approvedUserIds = new Set(approvedApps.map(app => app.user_id));
    const tutorUserIds = new Set(tutorProfiles.map(profile => profile.user_id));

    const missingProfiles = [];
    for (const userId of approvedUserIds) {
      if (!tutorUserIds.has(userId)) {
        const app = approvedApps.find(app => app.user_id === userId);
        missingProfiles.push({
          userId,
          name: app.full_name,
          email: app.applicant_email
        });
      }
    }

    if (missingProfiles.length > 0) {
      console.log(`❌ Found ${missingProfiles.length} approved applications without tutor profiles:`);
      missingProfiles.forEach((missing, i) => {
        console.log(`   ${i + 1}. ${missing.name} (${missing.email}) - User ID: ${missing.userId}`);
      });
    } else {
      console.log('✅ All approved applications have corresponding tutor profiles.');
    }

    // Check for tutor profiles without approved applications
    console.log('\n🔍 Checking for tutor profiles without approved applications...');

    const profilesWithoutApps = [];
    for (const profile of tutorProfiles) {
      if (!approvedUserIds.has(profile.user_id)) {
        profilesWithoutApps.push({
          userId: profile.user_id,
          name: profile.full_name,
          email: profile.email
        });
      }
    }

    if (profilesWithoutApps.length > 0) {
      console.log(`⚠️ Found ${profilesWithoutApps.length} tutor profiles without approved applications:`);
      profilesWithoutApps.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.name} (${profile.email}) - User ID: ${profile.userId}`);
      });
    } else {
      console.log('✅ All tutor profiles have approved applications.');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Total Applications: ${applications.length} (Approved: ${approvedApps.length}, Pending: ${pendingApps.length}, Rejected: ${rejectedApps.length})`);
    console.log(`   Total Tutor Profiles: ${tutorProfiles.length} (Active: ${activeTutors.length}, Inactive: ${inactiveTutors.length})`);
    console.log(`   Discrepancies: ${missingProfiles.length} missing profiles, ${profilesWithoutApps.length} profiles without apps`);

  } catch (error) {
    console.error('❌ Error checking tutor data:', error);
  } finally {
    await client.close();
  }
}

checkTutorData();



