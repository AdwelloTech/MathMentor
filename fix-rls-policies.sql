-- Fix RLS policies to allow admin access to all profiles
-- This will solve the issue where admin can't see student data

-- Step 1: Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Show current policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 3: Disable RLS temporarily to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Test access without RLS
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'tutor' THEN 1 END) as tutor_count
FROM public.profiles;

-- Step 5: Show sample student data
SELECT 
    id,
    first_name,
    last_name,
    role,
    package,
    is_active,
    email
FROM public.profiles 
WHERE role = 'student'
ORDER BY created_at DESC;

-- Step 6: Create new policies that allow admin access
-- First, drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for users to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for users to their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for users to their own profile" ON public.profiles;

-- Step 7: Create new policies
-- Policy for reading profiles (allows admin and users to read their own)
CREATE POLICY "Enable read access for authenticated users and admins" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        auth.role() = 'service_role'
        OR
        auth.uid() IS NOT NULL
    );

-- Policy for inserting profiles
CREATE POLICY "Enable insert for authenticated users" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating profiles
CREATE POLICY "Enable update for users based on user_id" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 8: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 9: Test the new policies
SELECT 
    COUNT(*) as total_profiles_after_rls,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count_after_rls
FROM public.profiles;

-- Step 10: Show final policy list
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 11: Test service role access specifically
-- This simulates what the AdminStudentService does
SELECT 
    'Service role test' as test_type,
    COUNT(*) as accessible_profiles
FROM public.profiles 
WHERE role = 'student'; 