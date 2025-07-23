// Test script to verify admin access to student data
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://tspzdsawiabtdoaupymk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcHpkc2F3aWFidGRvYXVweW1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMDY1NDYsImV4cCI6MjA2Nzg4MjU0Nn0.5IyKqbv8sWUkte-XAeLqpIabczGNHH9w7ua2Q9zRXow'
);

async function testAdminStudentAccess() {
  console.log('Testing admin access to student data...\n');

  try {
    // Test 1: Check if we can read profiles table
    console.log('Test 1: Reading profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error reading profiles:', profilesError);
    } else {
      console.log('✅ Successfully read profiles table');
      console.log(`Found ${profiles?.length || 0} profiles`);
      if (profiles && profiles.length > 0) {
        console.log('Sample profile:', {
          id: profiles[0].id,
          email: profiles[0].email,
          role: profiles[0].role,
          full_name: profiles[0].full_name
        });
      }
    }

    // Test 2: Check if we can read student profiles specifically
    console.log('\nTest 2: Reading student profiles...');
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .limit(5);

    if (studentsError) {
      console.error('❌ Error reading students:', studentsError);
    } else {
      console.log('✅ Successfully read student profiles');
      console.log(`Found ${students?.length || 0} students`);
      if (students && students.length > 0) {
        console.log('Sample student:', {
          id: students[0].id,
          email: students[0].email,
          student_id: students[0].student_id,
          package: students[0].package
        });
      }
    }

    // Test 3: Check RLS policies
    console.log('\nTest 3: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies', { table_name: 'profiles' });

    if (policiesError) {
      console.log('⚠️  Could not check RLS policies (function may not exist)');
    } else {
      console.log('✅ RLS policies found:', policies);
    }

    // Test 4: Check if is_admin_user function exists
    console.log('\nTest 4: Testing is_admin_user function...');
    const { data: adminCheck, error: adminCheckError } = await supabase
      .rpc('is_admin_user');

    if (adminCheckError) {
      console.log('⚠️  is_admin_user function not accessible or not found');
    } else {
      console.log('✅ is_admin_user function works:', adminCheck);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAdminStudentAccess(); 