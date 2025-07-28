-- =====================================================
-- FIX TUTOR_CLASSES FOREIGN KEY CONSTRAINT
-- =====================================================

-- First, let's check the current structure of tutor_classes table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tutor_classes'
ORDER BY ordinal_position;

-- Check existing foreign key constraints
SELECT 
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

-- Add the missing foreign key constraint for tutor_id
ALTER TABLE tutor_classes 
ADD CONSTRAINT tutor_classes_tutor_id_fkey 
FOREIGN KEY (tutor_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Verify the foreign key was added
SELECT 
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

-- Test the relationship by running a simple join query
SELECT 
    tc.id,
    tc.title,
    tc.tutor_id,
    p.full_name as tutor_name,
    p.email as tutor_email
FROM tutor_classes tc
LEFT JOIN profiles p ON tc.tutor_id = p.user_id
LIMIT 5; 