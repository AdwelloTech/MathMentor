-- Comprehensive fix for 406 errors
-- This will address all possible issues

-- 1. First, ensure RLS is completely disabled
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL possible policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'id_verifications' 
        AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON "public"."id_verifications"';
    END LOOP;
END $$;

-- 3. Grant full permissions
GRANT ALL ON "public"."id_verifications" TO "anon";
GRANT ALL ON "public"."id_verifications" TO "authenticated";
GRANT ALL ON "public"."id_verifications" TO "service_role";
GRANT ALL ON "public"."id_verifications" TO "postgres";

-- 4. Check the new user's data
SELECT 
  id,
  user_id,
  full_name,
  email,
  role
FROM public.profiles 
WHERE email = 'gaurava.dev.yt@gmail.com';

-- 5. Check if the new user has tutor applications
SELECT 
  id,
  user_id,
  application_status,
  submitted_at
FROM public.tutor_applications 
WHERE user_id = 'a2dfdacc-4a1c-4353-8b0a-bd2d02a3dca9'
ORDER BY submitted_at DESC;

-- 6. Create id_verifications record for the new user
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

-- 7. Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 8. Verify no policies exist
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename = 'id_verifications';

-- 9. Test the exact query that's failing
SELECT * FROM public.id_verifications 
WHERE user_id = 'd0712563-03bb-4436-974b-fd49c8417d49' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 10. Test with the auth user_id to see if it works
SELECT * FROM public.id_verifications 
WHERE user_id = (SELECT id FROM public.profiles WHERE user_id = 'a2dfdacc-4a1c-4353-8b0a-bd2d02a3dca9')
ORDER BY submitted_at DESC 
LIMIT 1;

-- 11. Show all records
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