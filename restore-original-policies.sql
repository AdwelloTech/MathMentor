-- Restore original RLS policies for profiles table
-- This will restore the policies that were working before

-- Step 1: Check current policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 2: Drop the new policies we created
DROP POLICY IF EXISTS "Enable read access for authenticated users and admins" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.profiles;

-- Step 3: Restore original policies
-- Original read policy
CREATE POLICY "Enable read access for users to their own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Original insert policy  
CREATE POLICY "Enable insert access for users to their own profile" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Original update policy
CREATE POLICY "Enable update access for users to their own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Step 4: Verify RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Show restored policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Step 6: Test that policies are working
-- This should show the current user's profile only
SELECT 
    'Current user profiles' as test_type,
    COUNT(*) as accessible_profiles
FROM public.profiles 
WHERE auth.uid() = user_id; 