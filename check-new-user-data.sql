-- Check and create data for the new user gaurava.dev.yt@gmail.com
-- User ID: d0712563-03bb-4436-974b-fd49c8417d49

-- 1. Check if the user exists in profiles
SELECT 
  id,
  user_id,
  full_name,
  email,
  role,
  date_of_birth
FROM public.profiles 
WHERE user_id = 'a2dfdacc-4a1c-4353-8b0a-bd2d02a3dca9' 
OR id = 'd0712563-03bb-4436-974b-fd49c8417d49';

-- 2. Check if the user has any tutor applications
SELECT 
  id,
  user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
WHERE user_id = 'a2dfdacc-4a1c-4353-8b0a-bd2d02a3dca9'
ORDER BY submitted_at DESC;

-- 3. Check if there are any id_verifications for this user
SELECT 
  id,
  user_id,
  application_id,
  verification_status,
  submitted_at
FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49'
ORDER BY submitted_at DESC;

-- 4. Create id_verifications record for this user (if they have an approved application)
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
    gen_random_uuid(),
    'd0712563-03bb-4436-974b-fd49c8417d49',
    (SELECT id FROM public.tutor_applications WHERE user_id = 'a2dfdacc-4a1c-4353-8b0a-bd2d02a3dca9' ORDER BY submitted_at DESC LIMIT 1),
    'national_id',
    'TEST123',
    'Gaurava Bandaranayaka',
    '1990-01-01',
    'pending',
    now()
) ON CONFLICT DO NOTHING;

-- 5. Verify the insert worked
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 6. Test the exact query that's failing in the frontend
SELECT * FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 7. Show all records in id_verifications
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