-- Test script using the valid user ID we found
-- Using user_id: 91627bcb-00e0-4cff-8d54-def1c8ab88b0 (Gaurava Bandaranayaka)

-- 1. First, let's check if this user has any tutor applications
SELECT 
  user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
WHERE user_id = '91627bcb-00e0-4cff-8d54-def1c8ab88b0';

-- 2. Test the exact query that's failing in the frontend with the valid user ID
SELECT * FROM public.id_verifications 
WHERE user_id = '91627bcb-00e0-4cff-8d54-def1c8ab88b0' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 3. Test insert capability with the valid user ID (if they have a tutor application)
-- First, let's get their application ID
SELECT 
  id as application_id,
  user_id,
  application_status
FROM public.tutor_applications 
WHERE user_id = '91627bcb-00e0-4cff-8d54-def1c8ab88b0'
ORDER BY submitted_at DESC 
LIMIT 1;

-- 4. If they have an application, test inserting a record (uncomment and replace APPLICATION_ID_HERE)
-- INSERT INTO public.id_verifications (
--     user_id,
--     application_id,
--     id_type,
--     id_number,
--     full_name,
--     date_of_birth,
--     verification_status
-- ) VALUES (
--     '91627bcb-00e0-4cff-8d54-def1c8ab88b0',
--     'APPLICATION_ID_HERE',
--     'passport',
--     'TEST123456',
--     'Gaurava Bandaranayaka',
--     '1990-01-01',
--     'pending'
-- );

-- 5. Test the query again after insert
-- SELECT * FROM public.id_verifications 
-- WHERE user_id = '91627bcb-00e0-4cff-8d54-def1c8ab88b0' 
-- ORDER BY submitted_at DESC 
-- LIMIT 1;

-- 6. Also test with the user ID that was causing the 406 errors
SELECT * FROM public.id_verifications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f' 
ORDER BY submitted_at DESC 
LIMIT 1; 