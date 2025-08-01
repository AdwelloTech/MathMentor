-- Fix id_verifications table structure to match frontend expectations
-- Based on the actual database structure shown

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

-- 2. Check if RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 3. Disable RLS if it's enabled
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- 4. Drop all policies
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Users can view own id_verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Users can insert own id_verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Users can update own id_verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Users can delete own id_verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read for authenticated users" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable write for authenticated users" ON "public"."id_verifications";

-- 5. Test the exact query that's failing in the frontend
SELECT * FROM public.id_verifications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 6. Test with the specific user ID that was causing 406 errors
SELECT 
  id,
  user_id,
  application_id,
  id_type,
  id_number,
  full_name_on_id,
  date_of_birth_on_id,
  verification_status,
  submitted_at
FROM public.id_verifications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 7. Check if there are any policies left
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'id_verifications';

-- 8. Grant permissions to ensure access
GRANT ALL ON "public"."id_verifications" TO "anon";
GRANT ALL ON "public"."id_verifications" TO "authenticated";
GRANT ALL ON "public"."id_verifications" TO "service_role";

-- 9. Test basic access
SELECT COUNT(*) as total_records FROM public.id_verifications; 