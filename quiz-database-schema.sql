-- Quiz System Database Schema
-- This script creates the necessary tables for the quiz functionality

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    time_limit_minutes INTEGER DEFAULT 60,
    total_questions INTEGER DEFAULT 4,
    total_points INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer
    points INTEGER DEFAULT 10,
    question_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    answer_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_attempts table to track student attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER,
    max_score INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_answers table to track individual answers
CREATE TABLE IF NOT EXISTS student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_answer_id UUID REFERENCES quiz_answers(id),
    answer_text TEXT, -- For short answer questions
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_tutor_id ON quizzes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers(attempt_id);

-- Disable RLS for quiz tables (similar to tutor_classes)
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_answers DISABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for quizzes table
CREATE TRIGGER update_quizzes_updated_at 
    BEFORE UPDATE ON quizzes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO quizzes (tutor_id, title, description, subject, grade_level, time_limit_minutes, total_questions, total_points) 
VALUES (
    (SELECT id FROM profiles WHERE role = 'tutor' LIMIT 1),
    'Basic Mathematics Quiz',
    'A comprehensive quiz covering fundamental mathematics concepts',
    'Mathematics',
    'Grade 10',
    60,
    4,
    40
);

-- Get the quiz ID for sample questions
DO $$
DECLARE
    quiz_uuid UUID;
BEGIN
    SELECT id INTO quiz_uuid FROM quizzes LIMIT 1;
    
    -- Insert sample questions
    INSERT INTO quiz_questions (quiz_id, question_text, question_type, points, question_order) VALUES
    (quiz_uuid, 'What is the value of 2x + 3 when x = 4?', 'multiple_choice', 10, 1),
    (quiz_uuid, 'Solve for x: 3x - 7 = 8', 'multiple_choice', 10, 2),
    (quiz_uuid, 'What is the area of a circle with radius 5 units?', 'multiple_choice', 10, 3),
    (quiz_uuid, 'Is the statement "All squares are rectangles" true or false?', 'true_false', 10, 4);
    
    -- Insert answers for each question
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, answer_order) VALUES
    -- Question 1 answers
    ((SELECT id FROM quiz_questions WHERE question_order = 1 AND quiz_id = quiz_uuid), '11', false, 1),
    ((SELECT id FROM quiz_questions WHERE question_order = 1 AND quiz_id = quiz_uuid), '10', false, 2),
    ((SELECT id FROM quiz_questions WHERE question_order = 1 AND quiz_id = quiz_uuid), '12', false, 3),
    ((SELECT id FROM quiz_questions WHERE question_order = 1 AND quiz_id = quiz_uuid), '11', true, 4),
    
    -- Question 2 answers
    ((SELECT id FROM quiz_questions WHERE question_order = 2 AND quiz_id = quiz_uuid), 'x = 3', false, 1),
    ((SELECT id FROM quiz_questions WHERE question_order = 2 AND quiz_id = quiz_uuid), 'x = 5', true, 2),
    ((SELECT id FROM quiz_questions WHERE question_order = 2 AND quiz_id = quiz_uuid), 'x = 4', false, 3),
    ((SELECT id FROM quiz_questions WHERE question_order = 2 AND quiz_id = quiz_uuid), 'x = 6', false, 4),
    
    -- Question 3 answers
    ((SELECT id FROM quiz_questions WHERE question_order = 3 AND quiz_id = quiz_uuid), '25π square units', true, 1),
    ((SELECT id FROM quiz_questions WHERE question_order = 3 AND quiz_id = quiz_uuid), '10π square units', false, 2),
    ((SELECT id FROM quiz_questions WHERE question_order = 3 AND quiz_id = quiz_uuid), '50π square units', false, 3),
    ((SELECT id FROM quiz_questions WHERE question_order = 3 AND quiz_id = quiz_uuid), '15π square units', false, 4),
    
    -- Question 4 answers
    ((SELECT id FROM quiz_questions WHERE question_order = 4 AND quiz_id = quiz_uuid), 'True', true, 1),
    ((SELECT id FROM quiz_questions WHERE question_order = 4 AND quiz_id = quiz_uuid), 'False', false, 2);
END $$; 