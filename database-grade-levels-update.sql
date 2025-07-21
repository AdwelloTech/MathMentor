-- GRADE LEVELS DATABASE UPDATE
-- Create grade_levels table and update profiles table to use proper foreign key relationships
-- Run this script in your Supabase SQL Editor

-- Step 1: Create grade_levels table
CREATE TABLE IF NOT EXISTS public.grade_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    category TEXT NOT NULL DEFAULT 'school' CHECK (category IN ('preschool', 'elementary', 'middle', 'high', 'college', 'graduate')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Insert grade level data
INSERT INTO public.grade_levels (code, display_name, sort_order, category) VALUES
-- Preschool
('preschool', 'Preschool', 1, 'preschool'),
('kindergarten', 'Kindergarten', 2, 'preschool'),

-- Elementary School
('grade-1', 'Grade 1', 3, 'elementary'),
('grade-2', 'Grade 2', 4, 'elementary'),
('grade-3', 'Grade 3', 5, 'elementary'),
('grade-4', 'Grade 4', 6, 'elementary'),
('grade-5', 'Grade 5', 7, 'elementary'),

-- Middle School
('grade-6', 'Grade 6', 8, 'middle'),
('grade-7', 'Grade 7', 9, 'middle'),
('grade-8', 'Grade 8', 10, 'middle'),

-- High School
('grade-9', 'Grade 9 (Freshman)', 11, 'high'),
('grade-10', 'Grade 10 (Sophomore)', 12, 'high'),
('grade-11', 'Grade 11 (Junior)', 13, 'high'),
('grade-12', 'Grade 12 (Senior)', 14, 'high'),

-- College
('college-freshman', 'College Freshman', 15, 'college'),
('college-sophomore', 'College Sophomore', 16, 'college'),
('college-junior', 'College Junior', 17, 'college'),
('college-senior', 'College Senior', 18, 'college'),

-- Graduate
('graduate', 'Graduate Student', 19, 'graduate'),
('postgraduate', 'Postgraduate', 20, 'graduate')

ON CONFLICT (code) DO NOTHING;

-- Step 3: Add grade_level_id column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS grade_level_id UUID REFERENCES public.grade_levels(id);

-- Step 4: Migrate existing grade_level data to use IDs
-- Update existing profiles that have grade_level set to use the new grade_level_id
UPDATE public.profiles 
SET grade_level_id = (
    SELECT id FROM public.grade_levels 
    WHERE grade_levels.code = profiles.grade_level
)
WHERE grade_level IS NOT NULL 
AND grade_level_id IS NULL;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grade_levels_code ON public.grade_levels(code);
CREATE INDEX IF NOT EXISTS idx_grade_levels_category ON public.grade_levels(category);
CREATE INDEX IF NOT EXISTS idx_grade_levels_sort_order ON public.grade_levels(sort_order);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level_id ON public.profiles(grade_level_id);

-- Step 6: Enable RLS for grade_levels table
ALTER TABLE public.grade_levels ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for grade_levels (read-only for all authenticated users)
CREATE POLICY "Enable read access for all authenticated users" 
ON public.grade_levels FOR SELECT 
USING (auth.role() = 'authenticated');

-- Step 8: Add updated_at trigger for grade_levels
CREATE TRIGGER handle_updated_at_grade_levels
    BEFORE UPDATE ON public.grade_levels
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 9: Add comments for documentation
COMMENT ON TABLE public.grade_levels IS 'Reference table for student grade levels';
COMMENT ON COLUMN public.grade_levels.code IS 'Unique code identifier for the grade level';
COMMENT ON COLUMN public.grade_levels.display_name IS 'Human-readable name for the grade level';
COMMENT ON COLUMN public.grade_levels.sort_order IS 'Order for displaying grade levels';
COMMENT ON COLUMN public.grade_levels.category IS 'Category grouping for grade levels';
COMMENT ON COLUMN public.profiles.grade_level_id IS 'Foreign key reference to grade_levels table';

-- Step 10: Create a view for easy grade level lookup with profile data
CREATE OR REPLACE VIEW public.profiles_with_grade_level AS
SELECT 
    p.*,
    gl.code as grade_level_code,
    gl.display_name as grade_level_name,
    gl.category as grade_level_category
FROM public.profiles p
LEFT JOIN public.grade_levels gl ON p.grade_level_id = gl.id;

-- Step 11: Grant necessary permissions
GRANT SELECT ON public.grade_levels TO authenticated;
GRANT SELECT ON public.profiles_with_grade_level TO authenticated;

-- Success message
SELECT 'Grade levels database update completed successfully! 
Created grade_levels table with ' || COUNT(*) || ' grade levels.
Updated profiles table to use foreign key relationships.' as message 
FROM public.grade_levels; 