-- Final test to verify everything is working correctly
-- This will confirm that the 406 errors should be resolved

-- 1. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 2. Verify no policies exist
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'id_verifications';

-- 3. Test the exact query that was failing for the new user
SELECT * FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 4. Test the query for the previous user
SELECT * FROM public.id_verifications 
WHERE user_id = '95a40416-6498-4a70-b9f8-df465242c035' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 5. Check total records
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 6. Show all records with user details
SELECT 
  iv.id,
  iv.user_id,
  p.full_name,
  p.email,
  iv.application_id,
  iv.id_type,
  iv.id_number,
  iv.verification_status,
  iv.submitted_at
FROM public.id_verifications iv
LEFT JOIN public.profiles p ON iv.user_id = p.id
ORDER BY iv.submitted_at DESC;

-- 7. Verify the new user's profile exists
SELECT 
  id,
  user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE id = 'd0712563-03bb-4436-974b-fd49c8417d49';

-- 8. Check if the new user has tutor applications
SELECT 
  id,
  user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
WHERE user_id = 'a2dfdacc-4a1c-4353-8b0a-bd2d02a3dca9'
ORDER BY submitted_at DESC; 