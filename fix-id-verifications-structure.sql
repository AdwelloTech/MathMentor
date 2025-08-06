-- Fix ID verifications table structure
-- Remove unnecessary application_id column and simplify the table

-- 1. First, let's see the current table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Remove the application_id column (it's not needed for ID verification)
ALTER TABLE public.id_verifications 
DROP COLUMN IF EXISTS application_id;

-- 3. Verify the new structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Show the simplified table structure
SELECT 
  'id_verifications' as table_name,
  string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public';

-- 5. Test inserting a new verification record (this should work automatically)
-- This simulates what happens when a user submits ID verification
INSERT INTO public.id_verifications (
  user_id,
  id_type,
  id_number,
  full_name,
  date_of_birth,
  front_image_url,
  back_image_url,
  verification_status,
  submitted_at
) VALUES (
  'd0712563-03bb-4436-974b-fd49c8417d49', -- profile_id
  'national_id',
  'AUTO_TEST_123',
  'Gaurava Bandaranayaka',
  '2002-04-24',
  'https://example.com/front.jpg',
  'https://example.com/back.jpg',
  'pending',
  NOW()
) ON CONFLICT DO NOTHING;

-- 6. Verify the insert worked
SELECT 
  id,
  user_id,
  id_type,
  id_number,
  full_name,
  verification_status,
  submitted_at
FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49'
ORDER BY submitted_at DESC;

-- 7. Show all verification records with user details
SELECT 
  iv.id,
  iv.user_id as profile_id,
  p.full_name,
  p.email,
  iv.id_type,
  iv.id_number,
  iv.verification_status,
  iv.submitted_at
FROM public.id_verifications iv
LEFT JOIN public.profiles p ON iv.user_id = p.id
ORDER BY iv.submitted_at DESC; 