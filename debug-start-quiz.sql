-- Debug Quiz Start Issue
-- Check if the student profile exists and what ID should be used

-- 1. Check if the student profile exists
SELECT 
    id,
    user_id,
    full_name,
    email,
    role
FROM profiles 
WHERE user_id = 'fc4c0a94-06b5-44aa-ad16-1daf71df0142'
OR id = 'fc4c0a94-06b5-44aa-ad16-1daf71df0142';

-- 2. Check the quiz_attempts table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
ORDER BY ordinal_position;

-- 3. Check foreign key constraints for quiz_attempts
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
    AND tc.table_name = 'quiz_attempts';

-- 4. Check if there are any existing quiz attempts
SELECT COUNT(*) as existing_attempts FROM quiz_attempts;

-- 5. Try to manually insert a test quiz attempt to see the exact error
-- (This will help identify the specific constraint violation)
INSERT INTO quiz_attempts (quiz_id, student_id, status) 
VALUES (
    (SELECT id FROM quizzes LIMIT 1),
    'fc4c0a94-06b5-44aa-ad16-1daf71df0142',
    'in_progress'
); 