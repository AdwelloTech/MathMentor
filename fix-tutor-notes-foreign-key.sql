-- =====================================================
-- FIX TUTOR_NOTES FOREIGN KEY CONSTRAINT
-- =====================================================

-- The issue is that the tutor_notes.created_by field should reference profiles(user_id)
-- but currently it references profiles(id). We need to fix this.

-- First, let's check the current constraint
SELECT 
    tc.constraint_name,
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
    AND tc.table_name = 'tutor_notes'
    AND kcu.column_name = 'created_by';

-- Drop the existing foreign key constraint
ALTER TABLE tutor_notes 
DROP CONSTRAINT IF EXISTS tutor_notes_created_by_fkey;

-- Add the correct foreign key constraint
ALTER TABLE tutor_notes 
ADD CONSTRAINT tutor_notes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Verify the constraint was fixed
SELECT 
    tc.constraint_name,
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
    AND tc.table_name = 'tutor_notes'
    AND kcu.column_name = 'created_by';

-- Test the relationship by running a simple join query
SELECT 
    tn.id,
    tn.title,
    tn.created_by,
    p.full_name as creator_name,
    p.email as creator_email
FROM tutor_notes tn
LEFT JOIN profiles p ON tn.created_by = p.user_id
LIMIT 5; 