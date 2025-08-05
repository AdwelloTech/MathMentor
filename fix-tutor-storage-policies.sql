-- =====================================================
-- FIX TUTOR STORAGE POLICIES
-- =====================================================

-- The current storage policies are too restrictive and don't match the file path structure
-- We need to update them to allow tutors to upload files properly

-- First, let's check if the bucket exists
SELECT * FROM storage.buckets WHERE id = 'tutor-materials';

-- Drop existing policies for tutor-materials bucket
DROP POLICY IF EXISTS "Tutors can upload tutor materials" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can view their own tutor materials" ON storage.objects;
DROP POLICY IF EXISTS "Students can view public tutor materials" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can update their own tutor materials" ON storage.objects;
DROP POLICY IF EXISTS "Tutors can delete their own tutor materials" ON storage.objects;

-- Create new, more flexible policies for tutor materials

-- Policy: Tutors can upload files to the tutor-materials bucket
CREATE POLICY "Tutors can upload tutor materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tutor-materials' AND
    auth.role() = 'authenticated'
  );

-- Policy: Tutors can view files in the tutor-materials bucket
CREATE POLICY "Tutors can view tutor materials" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'tutor-materials' AND
    auth.role() = 'authenticated'
  );

-- Policy: Tutors can update files in the tutor-materials bucket
CREATE POLICY "Tutors can update tutor materials" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tutor-materials' AND
    auth.role() = 'authenticated'
  );

-- Policy: Tutors can delete files in the tutor-materials bucket
CREATE POLICY "Tutors can delete tutor materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tutor-materials' AND
    auth.role() = 'authenticated'
  );

-- Verify the policies were created
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
WHERE tablename = 'objects' 
  AND policyname LIKE '%tutor materials%'
ORDER BY policyname; 