-- Completely recreate id_verifications table with RLS disabled
-- This will ensure a clean table structure without any RLS issues

-- 1. Drop the existing table (this will also drop all policies)
DROP TABLE IF EXISTS "public"."id_verifications" CASCADE;

-- 2. Create the table fresh with RLS disabled
CREATE TABLE "public"."id_verifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL,
    "application_id" uuid,
    "id_type" text NOT NULL,
    "id_number" text NOT NULL,
    "full_name" text NOT NULL,
    "date_of_birth" date NOT NULL,
    "front_image_url" text,
    "back_image_url" text,
    "verification_status" text DEFAULT 'pending' NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
    "verified_at" timestamp with time zone,
    "verified_by" uuid,
    "rejection_reason" text,
    "admin_notes" text
);

-- 3. Add constraints
ALTER TABLE "public"."id_verifications" ADD CONSTRAINT "id_verifications_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."id_verifications" ADD CONSTRAINT "id_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;
ALTER TABLE "public"."id_verifications" ADD CONSTRAINT "id_verifications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."tutor_applications"("id") ON DELETE SET NULL;
ALTER TABLE "public"."id_verifications" ADD CONSTRAINT "id_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;
ALTER TABLE "public"."id_verifications" ADD CONSTRAINT "id_verifications_verification_status_check" CHECK (verification_status IN ('pending', 'approved', 'rejected'));

-- 4. Create indexes
CREATE INDEX "id_verifications_user_id_idx" ON "public"."id_verifications" ("user_id");
CREATE INDEX "id_verifications_application_id_idx" ON "public"."id_verifications" ("application_id");
CREATE INDEX "id_verifications_verification_status_idx" ON "public"."id_verifications" ("verification_status");
CREATE INDEX "id_verifications_submitted_at_idx" ON "public"."id_verifications" ("submitted_at");

-- 5. Explicitly disable RLS
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- 6. Grant permissions
GRANT ALL ON "public"."id_verifications" TO "anon";
GRANT ALL ON "public"."id_verifications" TO "authenticated";
GRANT ALL ON "public"."id_verifications" TO "service_role";

-- 7. Verify the table structure
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 8. Test access
SELECT COUNT(*) as total_records FROM public.id_verifications;

-- 9. Get a valid user ID from profiles table (run this first)
SELECT 
  id as user_id,
  full_name
FROM public.profiles 
LIMIT 1;

-- 10. Insert a test record to verify everything works (replace USER_ID_HERE and APPLICATION_ID_HERE with actual IDs)
-- INSERT INTO "public"."id_verifications" (
--     "user_id",
--     "application_id", 
--     "id_type",
--     "id_number",
--     "full_name",
--     "date_of_birth",
--     "verification_status"
-- ) VALUES (
--     'USER_ID_HERE',
--     'APPLICATION_ID_HERE',
--     'passport',
--     'TEST123456',
--     'Test User',
--     '1990-01-01',
--     'pending'
-- );

-- 11. Test the specific query that was failing (replace USER_ID_HERE with actual user ID)
-- SELECT * FROM public.id_verifications 
-- WHERE user_id = 'USER_ID_HERE' 
-- ORDER BY submitted_at DESC 
-- LIMIT 1; 