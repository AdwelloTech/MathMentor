-- Check all required (NOT NULL) columns in id_verifications table
-- This will help us create a complete insert statement

-- 1. Show all columns with their nullable status
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show only the NOT NULL columns (required columns)
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 3. Get the user's date of birth from profiles table
SELECT 
  id as user_id,
  full_name,
  date_of_birth
FROM public.profiles 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f';

-- 4. Check what other required columns we might need
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND column_name NOT IN ('id', 'user_id', 'id_type', 'id_number', 'full_name', 'verification_status', 'submitted_at')
ORDER BY ordinal_position; 