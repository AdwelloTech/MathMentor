-- Check available users in profiles table
-- This will help us find valid user IDs to use in our tests

-- 1. Check all users in profiles table
SELECT 
  id,
  full_name,
  email,
  created_at
FROM public.profiles 
ORDER BY created_at DESC;

-- 2. Count total users
SELECT COUNT(*) as total_users FROM public.profiles;

-- 3. Check if the specific user ID exists
SELECT 
  id,
  full_name,
  email,
  created_at
FROM public.profiles 
WHERE id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 4. Get a few sample user IDs for testing
SELECT 
  id as user_id,
  full_name
FROM public.profiles 
LIMIT 5;

-- 5. Check tutor applications to see what user IDs are used there
SELECT 
  user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
ORDER BY submitted_at DESC 
LIMIT 10; 