-- Test script to verify id_verifications table access
-- Run this to check if the table is working correctly
-- IMPORTANT: Replace 'YOUR_ACTUAL_USER_ID' with a real user ID from your profiles table

-- 1. Check if table exists and RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check for any policies (should be empty)
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'id_verifications';

-- 4. Test basic access
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 5. Get a valid user ID from profiles table (run this first)
SELECT 
  id as user_id,
  full_name
FROM public.profiles 
LIMIT 1;

-- 6. Test the exact query that's failing in the frontend (replace USER_ID_HERE with actual user ID)
-- SELECT * FROM public.id_verifications 
-- WHERE user_id = 'USER_ID_HERE' 
-- ORDER BY submitted_at DESC 
-- LIMIT 1;

-- 7. Test insert capability (replace USER_ID_HERE and APPLICATION_ID_HERE with actual IDs)
-- INSERT INTO public.id_verifications (
--     user_id,
--     application_id,
--     id_type,
--     id_number,
--     full_name,
--     date_of_birth,
--     verification_status
-- ) VALUES (
--     'USER_ID_HERE',
--     'APPLICATION_ID_HERE',
--     'passport',
--     'TEST123456',
--     'Test User',
--     '1990-01-01',
--     'pending'
-- ) ON CONFLICT DO NOTHING;

-- 8. Verify the insert worked
SELECT COUNT(*) as total_records_after_insert FROM public.id_verifications;

-- 9. Test the query again (replace USER_ID_HERE with actual user ID)
-- SELECT * FROM public.id_verifications 
-- WHERE user_id = 'USER_ID_HERE' 
-- ORDER BY submitted_at DESC 
-- LIMIT 1; 