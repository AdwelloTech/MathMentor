-- Check if all admin functions exist and are working
-- This will help diagnose the admin authentication issues

-- Step 1: Check if admin tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('admin_credentials', 'admin_sessions')
ORDER BY table_name;

-- Step 2: Check admin_credentials table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_credentials' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check admin_sessions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admin_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check if admin functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN (
    'verify_admin_credentials',
    'create_admin_session',
    'validate_admin_session',
    'logout_admin_session',
    'clean_expired_sessions'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- Step 5: Check if admin user exists
SELECT 
    id,
    email,
    full_name,
    is_active,
    last_login
FROM admin_credentials 
WHERE email = 'admin@mathmentor.com';

-- Step 6: Test verify_admin_credentials function
SELECT 
    'Testing verify_admin_credentials' as test_name,
    verify_admin_credentials('admin@mathmentor.com', 'admin123') as result;

-- Step 7: Check for any existing sessions
SELECT 
    COUNT(*) as active_sessions,
    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as valid_sessions
FROM admin_sessions;

-- Step 8: Show function definitions
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'verify_admin_credentials',
    'create_admin_session',
    'validate_admin_session'
)
AND routine_schema = 'public'; 