-- DATABASE UPDATE SCRIPT FOR TUTOR FUNCTIONALITY
-- Run this script if you already have an existing database and want to add tutor support

-- Add tutor-specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cv_url TEXT,
ADD COLUMN IF NOT EXISTS cv_file_name TEXT,
ADD COLUMN IF NOT EXISTS specializations TEXT[],
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Update RLS policies if needed (this should already be covered by existing policies)
-- The existing policies should allow users to read/update their own profiles

-- Add index for better performance on tutor queries
CREATE INDEX IF NOT EXISTS idx_profiles_role_tutor ON public.profiles(role) WHERE role = 'tutor';
CREATE INDEX IF NOT EXISTS idx_profiles_cv_url ON public.profiles(cv_url) WHERE cv_url IS NOT NULL;

-- Update any existing tutors to have profile_completed = false so they need to upload CV
UPDATE public.profiles 
SET profile_completed = false 
WHERE role = 'tutor' AND cv_url IS NULL;

COMMIT; 