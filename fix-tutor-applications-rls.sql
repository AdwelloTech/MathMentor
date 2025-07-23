-- Fix RLS policies for tutor_applications table
-- This script will disable RLS on the tutor_applications table to allow admin access

-- First, let's check if the table exists and its current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'tutor_applications';

-- Disable RLS on tutor_applications table
ALTER TABLE "public"."tutor_applications" DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies on tutor_applications table
DROP POLICY IF EXISTS "Enable read access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable insert access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable update access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable delete access for users to their own tutor applications" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable update access for admins" ON "public"."tutor_applications";
DROP POLICY IF EXISTS "Enable delete access for admins" ON "public"."tutor_applications";

-- Verify RLS is disabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'tutor_applications';

-- Test access to tutor_applications table
SELECT
  'RLS disabled successfully' as status,
  COUNT(*) as application_count
FROM public.tutor_applications;

-- Show sample data to verify access
SELECT 
  id,
  full_name,
  applicant_email,
  application_status,
  created_at
FROM public.tutor_applications
LIMIT 5; 