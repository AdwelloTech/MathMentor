// Test admin login functionality
// Run this in browser console to test admin authentication

async function testAdminLogin() {
  console.log('Testing admin login...');
  
  try {
    // Test 1: Check if admin tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('admin_credentials')
      .select('count')
      .limit(1);
    
    console.log('Admin tables check:', { tables, tablesError });
    
    // Test 2: Check if admin user exists
    const { data: adminUser, error: userError } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('email', 'admin@mathmentor.com')
      .single();
    
    console.log('Admin user check:', { adminUser, userError });
    
    // Test 3: Test verify_admin_credentials function
    const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_admin_credentials', {
      p_email: 'admin@mathmentor.com',
      p_password: 'admin123'
    });
    
    console.log('Verify credentials result:', { verifyResult, verifyError });
    
    // Test 4: Test create_admin_session function
    if (verifyResult && verifyResult[0] && verifyResult[0].success) {
      const { data: sessionResult, error: sessionError } = await supabase.rpc('create_admin_session', {
        p_admin_id: verifyResult[0].admin_id,
        p_ip_address: '127.0.0.1',
        p_user_agent: 'Test Browser'
      });
      
      console.log('Create session result:', { sessionResult, sessionError });
      
      // Test 5: Test validate_admin_session function
      if (sessionResult && sessionResult[0] && sessionResult[0].success) {
        const { data: validateResult, error: validateError } = await supabase.rpc('validate_admin_session', {
          p_session_token: sessionResult[0].session_token
        });
        
        console.log('Validate session result:', { validateResult, validateError });
      }
    }
    
    console.log('Admin login test completed!');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the test
testAdminLogin(); 