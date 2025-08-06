-- Complete RLS disable for id_verifications table
-- This script will aggressively disable RLS and remove all policies

-- 1. Disable RLS on the table
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- 2. Drop all possible RLS policies that might exist
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

-- 3. Drop any function-based policies
DROP POLICY IF EXISTS "id_verifications_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_select_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_insert_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_update_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_delete_policy" ON "public"."id_verifications";

-- 4. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 5. Test access to the table
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 6. Get a valid user ID from profiles table (run this first)
SELECT 
  id as user_id,
  full_name
FROM public.profiles 
LIMIT 1;

-- 7. Test a specific query that was failing (replace USER_ID_HERE with actual user ID)
-- SELECT * FROM public.id_verifications 
-- WHERE user_id = 'USER_ID_HERE' 
-- ORDER BY submitted_at DESC 
-- LIMIT 1;

-- 8. Show all policies on the table (should be empty)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'id_verifications'; 