-- =====================================================
-- REFRESH SUPABASE SCHEMA CACHE
-- =====================================================

-- 1. First, let's verify the foreign key constraint exists and is correct
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tutor_classes'
    AND kcu.column_name = 'tutor_id';

-- 2. Drop and recreate the foreign key constraint to refresh the schema cache
ALTER TABLE tutor_classes 
DROP CONSTRAINT IF EXISTS tutor_classes_tutor_id_fkey;

ALTER TABLE tutor_classes 
ADD CONSTRAINT tutor_classes_tutor_id_fkey 
FOREIGN KEY (tutor_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- 3. Verify the constraint was recreated
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tutor_classes'
    AND kcu.column_name = 'tutor_id';

-- 4. Test the exact query that was failing in the app
SELECT 
    tc.id,
    tc.title,
    tc.tutor_id,
    tc.date,
    tc.start_time,
    tc.status,
    p.full_name as tutor_name,
    p.email as tutor_email
FROM tutor_classes tc
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
WHERE tc.tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
  AND tc.date >= '2025-07-25'
  AND tc.status = 'scheduled'
ORDER BY tc.date ASC, tc.start_time ASC;

-- 5. Test with the class_types join as well (from the original error)
SELECT 
    tc.id,
    tc.title,
    tc.tutor_id,
    tc.date,
    tc.start_time,
    tc.status,
    ct.name as class_type_name,
    p.full_name as tutor_name,
    p.email as tutor_email
FROM tutor_classes tc
LEFT JOIN class_types ct ON tc.class_type_id = ct.id
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
WHERE tc.tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
  AND tc.date >= '2025-07-25'
  AND tc.status = 'scheduled'
ORDER BY tc.date ASC, tc.start_time ASC;

-- 6. Check if there are any RLS policies that might be blocking the relationship
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
WHERE tablename IN ('tutor_classes', 'profiles')
ORDER BY tablename, policyname; 