-- Test the exact frontend query to verify 406 errors are resolved
-- This simulates what the frontend is trying to do

-- 1. Test the exact query that was failing in the frontend
-- The frontend uses the auth user_id to query, but we need to find the corresponding profiles.id
SELECT * FROM public.id_verifications 
WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f')
ORDER BY submitted_at DESC 
LIMIT 1;

-- 2. Test with the actual profiles.id that was inserted
SELECT * FROM public.id_verifications 
WHERE user_id = '95a40416-6498-4a70-b9f8-df465242c035'
ORDER BY submitted_at DESC 
LIMIT 1;

-- 3. Verify the data is accessible
SELECT 
  id,
  user_id,
  application_id,
  id_type,
  id_number,
  full_name,
  verification_status,
  submitted_at
FROM public.id_verifications 
ORDER BY submitted_at DESC;

-- 4. Check that RLS is still disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 5. Verify no policies exist
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'id_verifications';

-- 6. Test the relationship between profiles and id_verifications
SELECT 
  p.id as profiles_id,
  p.user_id as auth_user_id,
  p.full_name,
  iv.id as verification_id,
  iv.verification_status,
  iv.submitted_at
FROM public.profiles p
LEFT JOIN public.id_verifications iv ON p.id = iv.user_id
WHERE p.user_id = '0cff9583-0932-4781-824f-19eb56b8770f'; 