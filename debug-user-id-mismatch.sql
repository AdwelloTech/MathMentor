-- Debug user ID mismatch causing 406 errors
-- The frontend is using a different user ID than expected

-- 1. Check all profiles to see what user IDs exist
SELECT 
  id as profile_id,
  user_id as auth_user_id,
  full_name,
  email,
  role,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 2. Check if the problematic user ID exists in profiles
-- The error shows: dbdf7c8b-13fb-... (truncated)
SELECT 
  id as profile_id,
  user_id as auth_user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE id::text LIKE 'dbdf7c8b-13fb-%'
   OR user_id::text LIKE 'dbdf7c8b-13fb-%';

-- 3. Check auth.users table for this user
SELECT 
  id as auth_user_id,
  email,
  created_at
FROM auth.users 
WHERE id::text LIKE 'dbdf7c8b-13fb-%'
   OR email = 'gaurava.dev.yt@gmail.com';

-- 4. Test the exact query that's failing
-- Replace 'dbdf7c8b-13fb-...' with the actual full user ID from step 2
SELECT 'Testing exact frontend query' as test_name,
       COUNT(*) as result
FROM public.id_verifications 
WHERE user_id = 'dbdf7c8b-13fb-0000-0000-000000000000' -- Replace with actual ID
ORDER BY submitted_at DESC 
LIMIT 1;

-- 5. Check if there are any id_verifications records at all
SELECT 'Total id_verifications records' as test_name,
       COUNT(*) as total_records
FROM public.id_verifications;

-- 6. Show the current user's profile (based on email)
SELECT 'Current user profile' as test_name,
       id as profile_id,
       user_id as auth_user_id,
       full_name,
       email,
       role
FROM public.profiles 
WHERE email = 'gaurava.dev.yt@gmail.com';

-- 7. Test insert with the correct user ID (replace with actual profile_id from step 6)
-- INSERT INTO public.id_verifications (
--   user_id,
--   id_type,
--   id_number,
--   full_name,
--   date_of_birth,
--   front_image_url,
--   back_image_url,
--   selfie_with_id_url,
--   verification_status
-- ) VALUES (
--   'ACTUAL_PROFILE_ID_FROM_STEP_6', -- Replace with actual profile_id
--   'national_id',
--   'DEBUG_TEST_123',
--   'Gaurava Bandaranayaka',
--   '2002-04-24',
--   'https://example.com/front_debug.jpg',
--   'https://example.com/back_debug.jpg',
--   'https://example.com/selfie_debug.jpg',
--   'pending'
-- ) RETURNING 'Debug insert test' as test_name, id as result; 