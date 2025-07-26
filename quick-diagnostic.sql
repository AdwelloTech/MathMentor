-- =====================================================
-- QUICK DIAGNOSTIC FOR TUTOR_CLASSES RELATIONSHIP
-- =====================================================

-- 1. Check tutor_id data type
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_classes'
  AND column_name = 'tutor_id';

-- 2. Check user_id data type in profiles
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'user_id';

-- 3. Check foreign key constraint
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

-- 4. Check if there are any classes for this tutor
SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f' THEN 1 END) as classes_for_this_tutor
FROM tutor_classes;

-- 5. Show sample classes for this tutor
SELECT 
    id,
    title,
    tutor_id,
    date,
    start_time,
    status
FROM tutor_classes 
WHERE tutor_id = '0cff9583-0932-4781-824f-19eb56b8770f'
LIMIT 5; 