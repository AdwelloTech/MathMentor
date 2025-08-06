-- Final restore id_verifications data with all required columns
-- Based on the NOT NULL constraint error, we need to include full_name

-- 1. Check the actual column names
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if the user and application exist
SELECT 
  id as user_id,
  full_name
FROM public.profiles 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f';

SELECT 
  id as application_id,
  user_id,
  application_status
FROM public.tutor_applications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f'
ORDER BY submitted_at DESC 
LIMIT 1;

-- 3. Insert with all required columns including full_name
INSERT INTO "public"."id_verifications" (
    "id",
    "user_id", 
    "application_id",
    "id_type",
    "id_number",
    "full_name",
    "verification_status",
    "submitted_at"
) VALUES (
    '49867985-ec68-4e4b-b7fe-0c60994745db',
    '0cff9583-0932-4781-824f-19eb56b8770f',
    '14be570e-46ee-435e-8d5a-73d161e76727',
    'national_id',
    'TEST789',
    'Gaurava Bandaranayakaa',
    'pending',
    '2025-08-01 12:35:52.917834+00'
) ON CONFLICT (id) DO NOTHING;

-- 4. Verify the insert worked
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 5. Test the exact query that was failing in the frontend
SELECT * FROM public.id_verifications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 6. Show the inserted record
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