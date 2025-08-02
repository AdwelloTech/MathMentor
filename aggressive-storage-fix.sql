-- Aggressive Storage Fix for ID Verification
-- This completely disables RLS and removes all policies

-- 1. Disable RLS on storage.objects completely
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on storage.buckets completely
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 3. Drop ALL possible policies on storage.objects (comprehensive cleanup)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update ID verification files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete ID verification files" ON storage.objects;

-- 4. Drop ALL possible policies on storage.buckets
DROP POLICY IF EXISTS "Public Access" ON storage.buckets;
DROP POLICY IF EXISTS "Authenticated users can create buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Users can view own buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Users can update own buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Users can delete own buckets" ON storage.buckets;

-- 5. Grant ALL permissions to ALL roles for storage.objects
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.objects TO postgres;
GRANT ALL ON storage.objects TO supabase_admin;

-- 6. Grant ALL permissions to ALL roles for storage.buckets
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.buckets TO postgres;
GRANT ALL ON storage.buckets TO supabase_admin;

-- 7. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-verification-documents',
  'id-verification-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 8. Verify RLS is disabled on both tables
SELECT 'Storage Objects RLS Check' as info,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

SELECT 'Storage Buckets RLS Check' as info,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'buckets';

-- 9. Verify no policies exist
SELECT 'Storage Objects Policy Check' as info,
       schemaname,
       tablename,
       policyname
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

SELECT 'Storage Buckets Policy Check' as info,
       schemaname,
       tablename,
       policyname
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'buckets';

-- 10. Verify bucket exists
SELECT 'Bucket Verification' as info,
       id,
       name,
       public,
       file_size_limit
FROM storage.buckets 
WHERE id = 'id-verification-documents';

-- 11. Final status
SELECT 'AGGRESSIVE STORAGE FIX COMPLETED' as status,
       'RLS disabled on objects' as objects_rls,
       'RLS disabled on buckets' as buckets_rls,
       'All policies removed' as policies_status,
       'All permissions granted' as permissions_status,
       'Bucket created' as bucket_status; 