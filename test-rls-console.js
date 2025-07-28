// Test RLS policies from browser console
// Copy and paste this into your browser console while on the admin dashboard

// Test 1: Check if we can access profiles with regular client
async function testRegularAccess() {
  console.log('Testing regular Supabase client access...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .eq('role', 'student');
    
  console.log('Regular client result:', { data, error });
  return { data, error };
}

// Test 2: Check current user session
async function checkUserSession() {
  console.log('Checking user session...');
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  console.log('User:', user);
  console.log('Session:', session);
  console.log('User error:', userError);
  console.log('Session error:', sessionError);
  
  return { user, session, userError, sessionError };
}

// Test 3: Check if we can read profiles
async function testProfilesAccess() {
  console.log('Testing profiles table access...');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, package')
    .eq('role', 'student')
    .limit(3);
    
  console.log('Profiles access result:', { data, error });
  return { data, error };
}

// Test 4: Check RLS policies (if accessible)
async function checkRLSPolicies() {
  console.log('Checking RLS policies...');
  
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');
      
    console.log('RLS policies:', { data, error });
    return { data, error };
  } catch (e) {
    console.log('Cannot access pg_policies table:', e);
    return { data: null, error: e };
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== RLS Policy Tests ===');
  
  await checkUserSession();
  await testRegularAccess();
  await testProfilesAccess();
  await checkRLSPolicies();
  
  console.log('=== Tests Complete ===');
}

// Run the tests
runAllTests(); 