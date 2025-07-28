-- Check RLS policies for profiles table
-- This script will show you all current RLS policies

-- 1. Check if RLS is enabled on the profiles table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Get all RLS policies for the profiles table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check the actual policy definitions
SELECT 
    p.policyname,
    p.cmd,
    p.permissive,
    p.roles,
    p.qual,
    p.with_check
FROM pg_policies p
WHERE p.tablename = 'profiles'
ORDER BY p.policyname;

-- 4. Check if there are any policies that might be blocking admin access
SELECT 
    policyname,
    cmd,
    qual,
    CASE 
        WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid()'
        WHEN qual LIKE '%auth.jwt()%' THEN 'Uses auth.jwt()'
        WHEN qual LIKE '%auth.role()%' THEN 'Uses auth.role()'
        ELSE 'Other condition'
    END as auth_type
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Check current user and session info
SELECT 
    current_user as current_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 6. Test if we can read from profiles table
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 7. Test if we can read students specifically
SELECT COUNT(*) as total_students FROM public.profiles WHERE role = 'student';

-- 8. Check if there are any policies that might allow admin access
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND (
    qual LIKE '%admin%' 
    OR qual LIKE '%service_role%' 
    OR qual LIKE '%auth.role()%'
); 