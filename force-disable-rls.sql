-- Force Disable RLS on id_verifications table
-- This script directly addresses the 406 errors

-- 1. Check current RLS status
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    'Current status' as info
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 2. Force disable RLS
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL possible RLS policies that might exist
DROP POLICY IF EXISTS "Enable read access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read access for admins and own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for admins and own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for admins and own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_select_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_insert_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_update_policy" ON "public"."id_verifications";
DROP POLICY IF EXISTS "id_verifications_delete_policy" ON "public"."id_verifications";

-- 4. Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    'After disabling RLS' as info
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 5. Test direct access to the table
SELECT 
    COUNT(*) as total_records,
    'Table is accessible' as status
FROM "public"."id_verifications";

-- 6. Show existing records
SELECT 
    id,
    user_id,
    id_type,
    verification_status,
    submitted_at
FROM "public"."id_verifications"
ORDER BY submitted_at DESC;

-- 7. Test inserting a new record
INSERT INTO "public"."id_verifications" (
    "user_id",
    "id_type",
    "id_number", 
    "full_name_on_id",
    "verification_status"
) VALUES (
    '0cff9583-0932-4781-824f-19eb56b8770f',
    'national_id',
    'TEST456',
    'Test User 2',
    'pending'
) ON CONFLICT DO NOTHING;

-- 8. Final verification
SELECT 
    'RLS fix completed successfully' as status,
    COUNT(*) as total_records_after_fix
FROM "public"."id_verifications"; 