-- =====================================================
-- DIAGNOSE TUTOR_CLASSES RELATIONSHIP ISSUES
-- =====================================================

-- 1. Check the current structure of tutor_classes table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_classes'
ORDER BY ordinal_position;

-- 2. Check all existing foreign key constraints for tutor_classes
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
    AND tc.table_name = 'tutor_classes';

-- 3. Check if there are any data issues with tutor_id values
SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN tutor_id IS NULL THEN 1 END) as null_tutor_ids,
    COUNT(CASE WHEN tutor_id NOT IN (SELECT user_id FROM profiles) THEN 1 END) as invalid_tutor_ids
FROM tutor_classes;

-- 4. Show sample tutor_id values that might be causing issues
SELECT DISTINCT 
    tc.tutor_id,
    p.full_name,
    p.email
FROM tutor_classes tc
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
LIMIT 10;

-- 5. Test the exact query that's failing in the app
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
ORDER BY tc.date ASC, tc.start_time ASC
LIMIT 5;

-- 6. Check if the profiles table has the expected user_id values
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN user_id = '0cff9583-0932-4781-824f-19eb56b8770f' THEN 1 END) as target_tutor_exists
FROM profiles;

-- 7. Show the specific tutor profile
SELECT 
    user_id,
    full_name,
    email,
    role
FROM profiles 
WHERE user_id = '0cff9583-0932-4781-824f-19eb56b8770f'; 