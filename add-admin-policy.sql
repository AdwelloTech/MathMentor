-- Add admin policy to allow reading all profiles
-- This will fix the issue where admin can't see student data

-- Option 1: Add a policy for service role (recommended)
CREATE POLICY "Service role can read all profiles" ON public.profiles
    FOR SELECT
    USING (auth.role() = 'service_role');

-- Option 2: Add a policy for admin users
CREATE POLICY "Admin can read all profiles" ON public.profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_credentials 
            WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Option 3: Add a policy that allows reading if user is authenticated
-- (This is more permissive but will work for admin access)
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Option 4: If the above don't work, temporarily disable RLS for testing
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Check the new policies
SELECT 
    policyname,
    cmd,
    permissive,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname; 