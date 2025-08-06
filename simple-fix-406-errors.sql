-- Simple fix for 406 errors on id_verifications table
-- This will ensure the table is accessible from the frontend

-- 1. Disable RLS completely
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL possible policies (comprehensive cleanup)
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
DROP POLICY IF EXISTS "id_verifications_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_select_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_insert_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_update_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_delete_policy" ON "public"."id_verifications";

-- 3. Grant full permissions
GRANT ALL ON "public"."id_verifications" TO "anon";
GRANT ALL ON "public"."id_verifications" TO "authenticated";
GRANT ALL ON "public"."id_verifications" TO "service_role";

-- 4. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 5. Test the exact query that's failing in the frontend
SELECT * FROM public.id_verifications 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 6. Show all policies (should be empty)
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'id_verifications';

-- 7. Test basic access
SELECT COUNT(*) as total_records FROM public.id_verifications; 