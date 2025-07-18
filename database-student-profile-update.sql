-- STUDENT PROFILE DATABASE UPDATE
-- Add age and grade_level fields to support student profile functionality
-- Run this script in your Supabase SQL Editor

-- Step 1: Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age >= 0 AND age <= 150),
ADD COLUMN IF NOT EXISTS grade_level TEXT,
ADD COLUMN IF NOT EXISTS has_learning_disabilities BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS learning_needs_description TEXT;

-- Step 2: Add check constraint for grade_level values
ALTER TABLE public.profiles 
ADD CONSTRAINT check_grade_level 
CHECK (grade_level IS NULL OR grade_level IN (
    'kindergarten',
    'grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6',
    'grade-7', 'grade-8', 'grade-9', 'grade-10', 'grade-11', 'grade-12',
    'college-freshman', 'college-sophomore', 'college-junior', 'college-senior',
    'graduate', 'postgraduate'
));

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_age ON public.profiles(age) WHERE age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON public.profiles(grade_level) WHERE grade_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_learning_disabilities ON public.profiles(has_learning_disabilities) WHERE has_learning_disabilities = true;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN public.profiles.age IS 'Student age in years';
COMMENT ON COLUMN public.profiles.grade_level IS 'Current grade level of the student';
COMMENT ON COLUMN public.profiles.has_learning_disabilities IS 'Whether the student has declared learning disabilities or special needs';
COMMENT ON COLUMN public.profiles.learning_needs_description IS 'Detailed description of learning needs and accommodations required';

-- Step 5: Update RLS policies to ensure students can update their profile data
-- The existing policies should cover this, but let's make sure

-- Verify the update policy exists for profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Enable update access for users to their own profile'
    ) THEN
        CREATE POLICY "Enable update access for users to their own profile" 
        ON public.profiles FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Success message
SELECT 'Student profile database update completed successfully! 
Added fields: age, grade_level, has_learning_disabilities, learning_needs_description' as message; 