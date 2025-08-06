-- Restore id_verifications data
-- Based on the data shown in the user's database

-- 1. First, let's check if the user and application exist
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

-- 2. Insert the id_verifications record that was shown in the data
INSERT INTO "public"."id_verifications" (
    "id",
    "user_id", 
    "application_id",
    "id_type",
    "id_number",
    "full_name_on_id",
    "date_of_birth_on_id",
    "expiry_date",
    "issuing_country",
    "issuing_authority",
    "front_image_url",
    "back_image_url",
    "selfie_with_id_url",
    "verification_status",
    "admin_notes",
    "rejection_reason",
    "verified_at",
    "verified_by",
    "submitted_at",
    "updated_at"
) VALUES (
    '49867985-ec68-4e4b-b7fe-0c60994745db',
    '0cff9583-0932-4781-824f-19eb56b8770f',
    '14be570e-46ee-435e-8d5a-73d161e76727',
    'national_id',
    'TEST789',
    'Test User 3',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'pending',
    null,
    null,
    null,
    null,
    '2025-08-01 12:35:52.917834+00',
    '2025-08-01 12:35:52.917834+00'
) ON CONFLICT (id) DO NOTHING;

-- 3. Verify the insert worked
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 4. Test the exact query that was failing in the frontend
SELECT * FROM public.id_verifications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 5. Check all records in the table
SELECT 
  id,
  user_id,
  application_id,
  id_type,
  id_number,
  full_name_on_id,
  verification_status,
  submitted_at
FROM public.id_verifications 
ORDER BY submitted_at DESC; 