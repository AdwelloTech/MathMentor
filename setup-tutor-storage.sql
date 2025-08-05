-- Setup storage bucket for tutor materials
-- This creates a storage bucket for tutor-uploaded study materials

-- Create the storage bucket for tutor materials
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tutor-materials',
  'tutor-materials',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the storage bucket
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