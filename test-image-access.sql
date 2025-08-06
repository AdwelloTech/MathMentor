-- Test Image Access for ID Verification
-- This script verifies that the storage bucket is public and accessible

-- 1. Check if the bucket is public
SELECT 'Bucket Public Status' as info,
       id,
       name,
       public,
       file_size_limit
FROM storage.buckets 
WHERE id = 'id-verification-documents';

-- 2. Check for any files in the bucket
SELECT 'Files in Bucket' as info,
       name,
       bucket_id,
       created_at,
       updated_at
FROM storage.objects 
WHERE bucket_id = 'id-verification-documents'
ORDER BY created_at DESC;

-- 3. Check storage policies
SELECT 'Storage Policies' as info,
       policyname,
       permissive,
       roles,
       cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%ID verification%'
OR policyname LIKE '%Public Access%';

-- 4. Test public access policy
SELECT 'Public Access Test' as info,
       'Bucket should be public' as expected_status,
       CASE 
         WHEN (SELECT public FROM storage.buckets WHERE id = 'id-verification-documents') = true
         THEN '✅ Bucket is public'
         ELSE '❌ Bucket is not public'
       END as bucket_status,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%Public Access%')
         THEN '✅ Public access policy exists'
         ELSE '❌ Public access policy missing'
       END as policy_status;

-- 5. Check for any ID verification records with image URLs
SELECT 'ID Verification Records with Images' as info,
       id,
       user_id,
       front_image_url,
       back_image_url,
       selfie_with_id_url,
       verification_status,
       submitted_at
FROM public.id_verifications
WHERE front_image_url IS NOT NULL 
   OR back_image_url IS NOT NULL 
   OR selfie_with_id_url IS NOT NULL
ORDER BY submitted_at DESC;

-- 6. Final verification
SELECT 'IMAGE ACCESS TEST COMPLETED' as status,
       CASE 
         WHEN (SELECT public FROM storage.buckets WHERE id = 'id-verification-documents') = true
         THEN '✅ Bucket is public'
         ELSE '❌ Bucket is not public'
       END as bucket_public_status,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%Public Access%')
         THEN '✅ Public access policy exists'
         ELSE '❌ Public access policy missing'
       END as public_policy_status,
       CASE 
         WHEN EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'id-verification-documents')
         THEN '✅ Files exist in bucket'
         ELSE '❌ No files in bucket'
       END as files_status,
       'Images should now be accessible' as final_status; 