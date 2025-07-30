-- STUDENT CONTACT AND ACADEMIC INFORMATION UPDATES
-- Run this script in your Supabase SQL Editor

-- Step 1: Add parent contact fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS parent_name TEXT,
ADD COLUMN IF NOT EXISTS parent_phone TEXT,
ADD COLUMN IF NOT EXISTS parent_email TEXT;

-- Step 2: Add city and postcode fields (replace full address)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT;

-- Step 3: Add school details field (optional)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS school_name TEXT;

-- Step 4: Add set classification field for students
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS academic_set TEXT CHECK (academic_set IN ('Set 1', 'Set 2', 'Set 3', 'Set 4 (Foundation)'));

-- Step 5: Rename grade_level to current_grade for clarity
-- Rename the existing column
ALTER TABLE public.profiles 
RENAME COLUMN grade_level TO current_grade;

-- Step 6: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_profiles_parent_email ON public.profiles(parent_email) WHERE parent_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_postcode ON public.profiles(postcode) WHERE postcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_academic_set ON public.profiles(academic_set) WHERE academic_set IS NOT NULL;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.profiles.parent_name IS 'Name of student''s parent or guardian';
COMMENT ON COLUMN public.profiles.parent_phone IS 'Phone number of student''s parent or guardian';
COMMENT ON COLUMN public.profiles.parent_email IS 'Email address of student''s parent or guardian';
COMMENT ON COLUMN public.profiles.city IS 'City where student resides';
COMMENT ON COLUMN public.profiles.postcode IS 'Postal code where student resides';
COMMENT ON COLUMN public.profiles.school_name IS 'Name of student''s current school';
COMMENT ON COLUMN public.profiles.academic_set IS 'Academic set classification (Set 1, Set 2, Set 3, Set 4 Foundation)';
COMMENT ON COLUMN public.profiles.current_grade IS 'Current grade level or school year (renamed from grade_level)';

-- Success message
SELECT 'Student contact and academic information updates completed successfully!' as message; 