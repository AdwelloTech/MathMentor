-- Fix RLS policies for tutor_classes table to resolve 400 errors
-- This will ensure proper access for class creation and management

-- First, let's check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tutor_classes';

-- Drop all existing policies on tutor_classes table
DROP POLICY IF EXISTS "Enable read access for users to their own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable insert access for users to their own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable update access for users to their own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable delete access for users to their own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable read access for admins and own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable update access for admins and own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable insert access for admins and own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable delete access for admins" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable update access for own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable insert access for own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable delete access for own tutor classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable read access for users and admins" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable update access for users and admins" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable insert access for users and admins" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Enable delete access for users and admins" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Tutors can create their own classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Tutors can update their own classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Tutors can view their own classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Students can view available classes" ON "public"."tutor_classes";
DROP POLICY IF EXISTS "Admins can manage all classes" ON "public"."tutor_classes";

-- Temporarily disable RLS to ensure access
ALTER TABLE "public"."tutor_classes" DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'tutor_classes';

-- Test access to tutor_classes table
SELECT 
  'RLS disabled successfully' as status,
  COUNT(*) as class_count
FROM public.tutor_classes;

-- Show sample data to verify access
SELECT 
  id,
  title,
  tutor_id,
  date,
  start_time,
  status,
  created_at
FROM public.tutor_classes
LIMIT 5;

-- Now let's create proper RLS policies for tutor_classes
-- Re-enable RLS
ALTER TABLE "public"."tutor_classes" ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for tutor_classes
-- Policy 1: Tutors can create their own classes
CREATE POLICY "Tutors can create their own classes" ON "public"."tutor_classes"
FOR INSERT WITH CHECK (
  auth.uid() = tutor_id
);

-- Policy 2: Tutors can view their own classes
CREATE POLICY "Tutors can view their own classes" ON "public"."tutor_classes"
FOR SELECT USING (
  auth.uid() = tutor_id
);

-- Policy 3: Tutors can update their own classes
CREATE POLICY "Tutors can update their own classes" ON "public"."tutor_classes"
FOR UPDATE USING (
  auth.uid() = tutor_id
);

-- Policy 4: Tutors can delete their own classes
CREATE POLICY "Tutors can delete their own classes" ON "public"."tutor_classes"
FOR DELETE USING (
  auth.uid() = tutor_id
);

-- Policy 5: Students can view available classes (for booking)
CREATE POLICY "Students can view available classes" ON "public"."tutor_classes"
FOR SELECT USING (
  status = 'scheduled' AND date >= CURRENT_DATE
);

-- Policy 6: Admins can manage all classes
CREATE POLICY "Admins can manage all classes" ON "public"."tutor_classes"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Verify policies were created
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
WHERE tablename = 'tutor_classes';

-- Test access again
SELECT 
  'RLS policies created successfully' as status,
  COUNT(*) as class_count
FROM public.tutor_classes;

-- Show final sample data
SELECT 
  id,
  title,
  tutor_id,
  date,
  start_time,
  status,
  created_at
FROM public.tutor_classes
LIMIT 5; 