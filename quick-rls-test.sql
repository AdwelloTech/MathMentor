-- Quick RLS Test for profiles table
-- Run this to quickly check RLS status and test access

-- 1. Check if RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Count total policies
SELECT 
    COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. List all policies
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Test direct access (this will show if RLS is blocking)
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'tutor' THEN 1 END) as tutor_count
FROM public.profiles;

-- 5. Check if service role can access
-- (This simulates what the admin service would do)
SELECT 
    'Service role test' as test_type,
    COUNT(*) as accessible_profiles
FROM public.profiles 
WHERE role = 'student';

-- 6. Show sample data if accessible
SELECT 
    id,
    first_name,
    last_name,
    role,
    package,
    is_active
FROM public.profiles 
WHERE role = 'student'
LIMIT 3; 