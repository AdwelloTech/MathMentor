-- Verify Quiz System Setup
-- Run this in Supabase SQL editor to check everything is working

-- 1. Check quiz tables exist and have correct structure
SELECT 'quizzes' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quizzes' 
ORDER BY ordinal_position;

SELECT 'quiz_questions' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quiz_questions' 
ORDER BY ordinal_position;

SELECT 'quiz_attempts' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
ORDER BY ordinal_position;

-- 2. Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('quizzes', 'quiz_attempts');

-- 3. Check if note_subjects table exists (for subject dropdown)
SELECT 'note_subjects' as table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'note_subjects' 
ORDER BY ordinal_position;

-- 4. Check sample data in note_subjects
SELECT * FROM note_subjects LIMIT 5;

-- 5. Check if any quizzes exist
SELECT COUNT(*) as quiz_count FROM quizzes;

-- 6. Check if any quiz attempts exist
SELECT COUNT(*) as attempt_count FROM quiz_attempts; 