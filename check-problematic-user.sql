-- Check the problematic user ID that was causing 406 errors
-- This will help us understand why the foreign key constraint failed

-- 1. Check if the user exists in profiles table
SELECT 
  id,
  full_name,
  email,
  created_at
FROM public.profiles 
WHERE id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 2. Check if the user exists in auth.users (Supabase auth table)
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 3. Check all tutor applications for this user
SELECT 
  id,
  user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f'
ORDER BY submitted_at DESC;

-- 4. Check if there are any orphaned tutor applications (user_id not in profiles)
SELECT 
  ta.id,
  ta.user_id,
  ta.application_status,
  ta.submitted_at,
  CASE 
    WHEN p.id IS NULL THEN 'MISSING FROM PROFILES'
    ELSE 'EXISTS IN PROFILES'
  END as profile_status
FROM public.tutor_applications ta
LEFT JOIN public.profiles p ON ta.user_id = p.id
WHERE ta.user_id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 5. Check all users that have tutor applications but might be missing from profiles
SELECT 
  ta.user_id,
  ta.application_status,
  ta.submitted_at,
  CASE 
    WHEN p.id IS NULL THEN 'MISSING FROM PROFILES'
    ELSE 'EXISTS IN PROFILES'
  END as profile_status
FROM public.tutor_applications ta
LEFT JOIN public.profiles p ON ta.user_id = p.id
WHERE p.id IS NULL
ORDER BY ta.submitted_at DESC; 