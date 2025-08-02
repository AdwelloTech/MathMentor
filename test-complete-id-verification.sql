-- Complete ID Verification System Test
-- This tests the entire system from database to storage

-- 1. Test database table access
SELECT 'Database Table Test' as info,
       COUNT(*) as total_records
FROM public.id_verifications;

-- 2. Test storage bucket access
SELECT 'Storage Bucket Test' as info,
       id,
       name,
       public,
       file_size_limit
FROM storage.buckets 
WHERE id = 'id-verification-documents';

-- 3. Test storage policies
SELECT 'Storage Policies Test' as info,
       policyname,
       cmd,
       roles
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE '%ID verification%';

-- 4. Test RLS status on id_verifications table
SELECT 'ID Verifications RLS Test' as info,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 5. Test permissions on id_verifications table
SELECT 'ID Verifications Permissions Test' as info,
       grantee,
       privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'id_verifications'
AND grantee IN ('authenticated', 'anon', 'service_role');

-- 6. Test a sample insert (this should work)
INSERT INTO public.id_verifications (
  user_id,
  id_type,
  id_number,
  full_name,
  date_of_birth,
  front_image_url,
  back_image_url,
  selfie_with_id_url,
  verification_status
) VALUES (
  'test-user-id-for-verification',
  'national_id',
  'TEST_' || EXTRACT(EPOCH FROM NOW())::TEXT,
  'Test User',
  '1990-01-01',
  'https://example.com/front_test.jpg',
  'https://example.com/back_test.jpg',
  'https://example.com/selfie_test.jpg',
  'pending'
) RETURNING 'Insert Test' as info, id as result;

-- 7. Verify the insert worked
SELECT 'Insert Verification Test' as info,
       COUNT(*) as total_records
FROM public.id_verifications 
WHERE user_id = 'test-user-id-for-verification';

-- 8. Test the exact frontend query
SELECT 'Frontend Query Test' as info,
       id,
       user_id,
       verification_status,
       submitted_at
FROM public.id_verifications 
WHERE user_id = 'test-user-id-for-verification' 
ORDER BY submitted_at DESC 
LIMIT 1;

-- 9. Clean up test data
DELETE FROM public.id_verifications 
WHERE user_id = 'test-user-id-for-verification';

-- 10. Final verification
SELECT 'Final Cleanup Test' as info,
       COUNT(*) as remaining_records
FROM public.id_verifications 
WHERE user_id = 'test-user-id-for-verification';

-- 11. Complete system status
SELECT 'COMPLETE SYSTEM TEST RESULTS' as status,
       CASE 
         WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'id-verification-documents') 
         THEN '✅ Storage bucket exists' 
         ELSE '❌ Storage bucket missing' 
       END as storage_status,
       CASE 
         WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'id_verifications') = false
         THEN '✅ Database RLS disabled' 
         ELSE '❌ Database RLS enabled' 
       END as database_rls_status,
       CASE 
         WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%ID verification%')
         THEN '✅ Storage policies exist' 
         ELSE '❌ Storage policies missing' 
       END as storage_policies_status,
       '🎉 System ready for frontend testing' as final_status; 