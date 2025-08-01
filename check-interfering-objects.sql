-- Check for any objects that might be interfering with id_verifications table access

-- 1. Check for triggers on the table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'id_verifications'
AND trigger_schema = 'public';

-- 2. Check for functions that might be called by triggers
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition LIKE '%id_verifications%';

-- 3. Check for any views that might be interfering
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
AND view_definition LIKE '%id_verifications%';

-- 4. Check for any foreign key constraints that might be causing issues
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'id_verifications';

-- 5. Check table permissions for all roles
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'id_verifications'
AND table_schema = 'public';

-- 6. Check if there are any row security policies at the database level
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
WHERE tablename = 'id_verifications';

-- 7. Check the current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'id_verifications'; 