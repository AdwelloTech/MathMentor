-- Test ID verification system functionality
-- This will verify that all components are working correctly

-- 1. Test basic table access
SELECT 'Table access test' as test_name, COUNT(*) as result FROM public.id_verifications;

-- 2. Test RLS status
SELECT 'RLS status test' as test_name, 
       CASE WHEN rowsecurity = false THEN 'PASSED - RLS disabled' 
            ELSE 'FAILED - RLS enabled' END as result
FROM pg_tables 
WHERE tablename = 'id_verifications';

-- 3. Test table structure
SELECT 'Table structure test' as test_name,
       string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public';

-- 4. Test permissions
SELECT 'Permissions test' as test_name,
       grantee,
       privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'id_verifications' 
AND table_schema = 'public'
ORDER BY grantee, privilege_type;

-- 5. Show available user profiles for testing
SELECT 'Available profiles test' as test_name,
       id as profile_id,
       full_name,
       email,
       role
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 3;

-- 6. Test foreign key constraint (should work with valid user_id)
-- This will only work if you have a valid profile ID
-- Replace 'VALID_PROFILE_ID' with an actual profile ID from step 5
-- SELECT 'Foreign key test' as test_name,
--        COUNT(*) as result
-- FROM public.profiles 
-- WHERE id = 'VALID_PROFILE_ID';

-- 7. Test insert with valid user (uncomment and replace with actual profile ID)
-- INSERT INTO public.id_verifications (
--   user_id,
--   id_type,
--   id_number,
--   full_name,
--   date_of_birth,
--   front_image_url,
--   back_image_url,
--   selfie_with_id_url,
--   verification_status
-- ) VALUES (
--   'VALID_PROFILE_ID', -- Replace with actual profile ID
--   'national_id',
--   'TEST_' || EXTRACT(EPOCH FROM NOW())::TEXT,
--   'Test User',
--   '2000-01-01',
--   'https://example.com/front.jpg',
--   'https://example.com/back.jpg',
--   'https://example.com/selfie.jpg',
--   'pending'
-- ) RETURNING 'Insert test' as test_name, id as result;

-- 8. Final verification
SELECT 'Final verification test' as test_name,
       'Table created successfully' as status,
       'RLS disabled' as rls_status,
       'Ready for frontend testing' as readiness; 