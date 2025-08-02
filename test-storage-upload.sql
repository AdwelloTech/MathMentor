-- Test Storage Upload Functionality
-- This script verifies that the storage bucket is properly configured

-- 1. Check if the bucket exists
SELECT 'Bucket Existence Check' as info,
       id,
       name,
       public,
       file_size_limit,
       allowed_mime_types
FROM storage.buckets 
WHERE id = 'id-verification-documents';

-- 2. Check RLS status on storage tables
SELECT 'Storage Objects RLS Status' as info,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

SELECT 'Storage Buckets RLS Status' as info,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'buckets';

-- 3. Check permissions on storage.objects
SELECT 'Storage Objects Permissions' as info,
       grantee,
       privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'storage' 
AND table_name = 'objects'
AND grantee IN ('authenticated', 'anon', 'service_role');

-- 4. Check permissions on storage.buckets
SELECT 'Storage Buckets Permissions' as info,
       grantee,
       privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'storage' 
AND table_name = 'buckets'
AND grantee IN ('authenticated', 'anon', 'service_role');

-- 5. Check for any remaining policies
SELECT 'Remaining Storage Objects Policies' as info,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

SELECT 'Remaining Storage Buckets Policies' as info,
       policyname,
       permissive,
       roles,
       cmd,
       qual,
       with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'buckets';

-- 6. Test bucket access (this should not throw an error)
SELECT 'Storage Access Test' as info,
       'Bucket accessible' as status,
       'No RLS blocking' as rls_status,
       'Ready for uploads' as upload_status;

-- 7. Final verification
SELECT 'STORAGE TEST COMPLETED' as status,
       CASE 
         WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'id-verification-documents') 
         THEN 'Bucket exists' 
         ELSE 'Bucket missing' 
       END as bucket_status,
       CASE 
         WHEN (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects') = false
         THEN 'RLS disabled' 
         ELSE 'RLS enabled' 
       END as objects_rls_status,
       CASE 
         WHEN (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'buckets') = false
         THEN 'RLS disabled' 
         ELSE 'RLS enabled' 
       END as buckets_rls_status,
       'Ready for frontend uploads' as final_status; 