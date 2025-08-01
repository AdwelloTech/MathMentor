-- Fix foreign key issue with id_verifications table
-- The user_id should reference the id column in profiles, not user_id

-- 1. Check the profiles table structure to understand the relationship
SELECT 
  id,
  user_id,
  full_name,
  date_of_birth
FROM public.profiles 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 2. Check the foreign key constraint
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

-- 3. Check what the correct user_id should be (the id from profiles table)
SELECT 
  id as correct_user_id_for_fk,
  user_id as auth_user_id,
  full_name,
  date_of_birth
FROM public.profiles 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 4. Check the application with the correct user_id
SELECT 
  id as application_id,
  user_id,
  application_status
FROM public.tutor_applications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f'
ORDER BY submitted_at DESC 
LIMIT 1;

-- 5. Now insert with the correct user_id (the id from profiles table)
-- We'll use the id from profiles table, not the user_id
INSERT INTO "public"."id_verifications" (
    "id",
    "user_id", 
    "application_id",
    "id_type",
    "id_number",
    "full_name",
    "date_of_birth",
    "verification_status",
    "submitted_at"
) VALUES (
    '49867985-ec68-4e4b-b7fe-0c60994745db',
    (SELECT id FROM public.profiles WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f'),
    '14be570e-46ee-435e-8d5a-73d161e76727',
    'national_id',
    'TEST789',
    'Gaurava Bandaranayakaa',
    '2002-04-24',
    'pending',
    '2025-08-01 12:35:52.917834+00'
) ON CONFLICT (id) DO NOTHING;

-- 6. Verify the insert worked
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 7. Test the exact query that was failing in the frontend
SELECT * FROM public.id_verifications 
WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f')
ORDER BY submitted_at DESC 
LIMIT 1; 