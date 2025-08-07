-- Add missing columns to quiz_attempts table
-- This will fix the "0/0 Questions Correct" display issue

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS correct_answers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;

-- Update existing attempts to calculate correct answers and total questions
-- This is for any existing quiz attempts that don't have these values
UPDATE quiz_attempts 
SET 
  correct_answers = (
    SELECT COUNT(*) 
    FROM student_answers sa 
    WHERE sa.attempt_id = quiz_attempts.id 
    AND sa.is_correct = true
  ),
  total_questions = (
    SELECT COUNT(DISTINCT sa.question_id) 
    FROM student_answers sa 
    WHERE sa.attempt_id = quiz_attempts.id
  )
WHERE quiz_attempts.status = 'completed';