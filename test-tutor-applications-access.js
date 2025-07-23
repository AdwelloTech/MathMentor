// Test script to debug tutor applications access
const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const supabaseUrl = 'https://tspzdsawiabtdoaupymk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcHpkc2F3aWFidGRvYXVweW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDY1NDYsImV4cCI6MjA2Nzg4MjU0Nn0.5IyKqbv8sWUkte-XAeLqpIabczGNHH9w7ua2Q9zRXow';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTutorApplicationsAccess() {
  console.log('🔍 Testing tutor applications access...\n');

  try {
    // Test 1: Check if table exists
    console.log('1. Checking if tutor_applications table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('tutor_applications')
      .select('count(*)')
      .limit(1);

    if (tableError) {
      console.log('❌ Table access error:', tableError.message);
      console.log('Error details:', tableError);
    } else {
      console.log('✅ Table exists and is accessible');
    }

    // Test 2: Try to get all applications
    console.log('\n2. Fetching all tutor applications...');
    const { data: applications, error: fetchError } = await supabase
      .from('tutor_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.log('❌ Fetch error:', fetchError.message);
      console.log('Error details:', fetchError);
    } else {
      console.log(`✅ Successfully fetched ${applications?.length || 0} applications`);
      
      if (applications && applications.length > 0) {
        console.log('\n📋 Sample application data:');
        console.log(JSON.stringify(applications[0], null, 2));
      }
    }

    // Test 3: Check table structure
    console.log('\n3. Checking table structure...');
    const { data: structure, error: structureError } = await supabase
      .from('tutor_applications')
      .select('*')
      .limit(0);

    if (structureError) {
      console.log('❌ Structure check error:', structureError.message);
    } else {
      console.log('✅ Table structure is accessible');
    }

    // Test 4: Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'tutor_applications' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

    if (policiesError) {
      console.log('❌ RLS policy check error:', policiesError.message);
    } else {
      console.log('✅ RLS policies check completed');
    }

    // Test 5: Try with different query approach
    console.log('\n5. Testing alternative query approach...');
    const { data: altData, error: altError } = await supabase
      .from('tutor_applications')
      .select('id, full_name, applicant_email, application_status')
      .limit(5);

    if (altError) {
      console.log('❌ Alternative query error:', altError.message);
    } else {
      console.log(`✅ Alternative query successful: ${altData?.length || 0} records`);
    }

    // Test 6: Check if there are any applications at all
    console.log('\n6. Checking total count...');
    const { count, error: countError } = await supabase
      .from('tutor_applications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Count error:', countError.message);
    } else {
      console.log(`✅ Total applications in database: ${count || 0}`);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    console.log('Error details:', error);
  }
}

// Run the test
testTutorApplicationsAccess().then(() => {
  console.log('\n🏁 Test completed');
}).catch((error) => {
  console.log('❌ Test failed:', error);
}); 