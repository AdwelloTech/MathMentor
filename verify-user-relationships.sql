-- Verify user relationships and data connections
-- This will help us understand the complete user data flow

-- 1. Check the complete user profile information
SELECT 
  id as profile_id,
  user_id as auth_user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE email = 'gaurava.dev.yt@gmail.com';

-- 2. Check tutor applications for this user
SELECT 
  id as application_id,
  user_id as auth_user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
WHERE user_id = '02651022-77e2-400e-8f6f-5323101bbb0e'
ORDER BY submitted_at DESC;

-- 3. Check id_verifications for this user (using profile_id)
SELECT 
  id as verification_id,
  user_id as profile_id,
  application_id,
  verification_status,
  submitted_at
FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49'
ORDER BY submitted_at DESC;

-- 4. Test the complete relationship
SELECT 
  p.id as profile_id,
  p.user_id as auth_user_id,
  p.full_name,
  p.email,
  ta.id as application_id,
  ta.application_status,
  iv.id as verification_id,
  iv.verification_status,
  iv.submitted_at
FROM public.profiles p
LEFT JOIN public.tutor_applications ta ON p.user_id = ta.user_id
LEFT JOIN public.id_verifications iv ON p.id = iv.user_id
WHERE p.email = 'gaurava.dev.yt@gmail.com'
ORDER BY iv.submitted_at DESC;

-- 5. Test the exact query that the frontend is making
SELECT * FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 6. Check if there are any foreign key constraint issues
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'id_verifications'
AND kcu.column_name = 'user_id';

-- 7. Verify RLS is still disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 8. Show all id_verifications records with user details
SELECT 
  iv.id,
  iv.user_id as profile_id,
  p.user_id as auth_user_id,
  p.full_name,
  p.email,
  iv.verification_status,
  iv.submitted_at
FROM public.id_verifications iv
LEFT JOIN public.profiles p ON iv.user_id = p.id
ORDER BY iv.submitted_at DESC; 