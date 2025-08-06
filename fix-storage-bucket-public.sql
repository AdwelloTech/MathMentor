-- Fix Storage Bucket to be Public
-- This makes the ID verification images publicly accessible

-- 1. Update the storage bucket to be public
UPDATE storage.buckets 
SET public = true
WHERE id = 'id-verification-documents';

-- 2. Verify the bucket is now public
SELECT 'Storage Bucket Public Status' as info,
       id,
       name,
       public,
       file_size_limit,
       allowed_mime_types
FROM storage.buckets 
WHERE id = 'id-verification-documents';

-- 3. Create public access policy for the bucket
CREATE POLICY "Public Access to ID Verification Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'id-verification-documents');

-- 4. Verify the policy was created
SELECT 'Public Access Policy Check' as info,
       policyname,
       permissive,
       roles,
       cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%Public Access%';

-- 5. Final status
SELECT 'STORAGE BUCKET FIX COMPLETED' as status,
       'Bucket is now public' as bucket_status,
       'Public access policy created' as policy_status,
       'Images should be accessible' as accessibility_status; 