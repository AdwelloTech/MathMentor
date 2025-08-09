-- Fix Quiz Foreign Key References
-- This script fixes the foreign key references in quiz tables to use profiles(user_id) instead of profiles(id)

-- Drop existing foreign key constraints
ALTER TABLE quizzes DROP CONSTRAINT IF EXISTS quizzes_tutor_id_fkey;
ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_student_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE quizzes
ADD CONSTRAINT quizzes_tutor_id_fkey
FOREIGN KEY (tutor_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE quiz_attempts
ADD CONSTRAINT quiz_attempts_student_id_fkey
FOREIGN KEY (student_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

-- Update the quiz service queries to use the correct join
-- The queries should use profiles!tutor_id(user_id, full_name, email) instead of profiles(id, full_name, email) 