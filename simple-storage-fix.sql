-- Simple Storage Fix for ID Verification
-- This creates a more permissive policy for the ID verification bucket

-- 1. Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-verification-documents',
  'id-verification-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Drop any existing policies for this bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access to ID verification files" ON storage.objects;

-- 3. Create simple, permissive policies for the ID verification bucket
CREATE POLICY "Allow authenticated users to upload to ID verification bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'id-verification-documents');

CREATE POLICY "Allow authenticated users to view ID verification bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'id-verification-documents');

CREATE POLICY "Allow authenticated users to update ID verification bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'id-verification-documents');

CREATE POLICY "Allow authenticated users to delete from ID verification bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'id-verification-documents');

-- 4. Create service role policy for admin access
CREATE POLICY "Service role full access to ID verification bucket"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'id-verification-documents');

-- 5. Verify the bucket exists
SELECT 'Bucket Check' as info,
       id,
       name,
       public,
       file_size_limit
FROM storage.buckets 
WHERE id = 'id-verification-documents';

-- 6. Verify policies were created
SELECT 'Policies Check' as info,
       policyname,
       cmd,
       roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%ID verification%';

-- 7. Final status
SELECT 'SIMPLE STORAGE FIX COMPLETED' as status,
       'Bucket ready' as bucket_status,
       'Policies created' as policies_status,
       'Uploads should work' as upload_status; 