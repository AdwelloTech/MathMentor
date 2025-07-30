-- TUTOR APPLICATION FORM ENHANCEMENTS
-- Run this script in your Supabase SQL Editor

-- Step 1: Add new fields WITHOUT NOT NULL constraints first
ALTER TABLE public.tutor_applications 
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS past_experience TEXT,
ADD COLUMN IF NOT EXISTS weekly_availability TEXT,
ADD COLUMN IF NOT EXISTS employment_status TEXT,
ADD COLUMN IF NOT EXISTS education_level TEXT,
ADD COLUMN IF NOT EXISTS average_weekly_hours INTEGER,
ADD COLUMN IF NOT EXISTS expected_hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS based_in_country TEXT;

-- Step 2: Remove sensitive fields (if they exist)
-- Note: These columns might not exist, so we'll use IF EXISTS
ALTER TABLE public.tutor_applications 
DROP COLUMN IF EXISTS nationality,
DROP COLUMN IF EXISTS original_education_format;

-- Step 3: Update existing records with default values for required fields
UPDATE public.tutor_applications 
SET postcode = 'N/A', based_in_country = 'Not specified'
WHERE postcode IS NULL OR based_in_country IS NULL;

-- Step 4: Make CV upload mandatory by adding a constraint
-- First, let's ensure existing records have CV data
UPDATE public.tutor_applications 
SET cv_file_name = 'Legacy CV', cv_url = 'legacy-cv-url'
WHERE cv_file_name IS NULL OR cv_url IS NULL;

-- Add NOT NULL constraint for CV fields
ALTER TABLE public.tutor_applications 
ALTER COLUMN cv_file_name SET NOT NULL,
ALTER COLUMN cv_url SET NOT NULL;

-- Step 5: Now add NOT NULL constraints for required fields
ALTER TABLE public.tutor_applications 
ALTER COLUMN postcode SET NOT NULL,
ALTER COLUMN based_in_country SET NOT NULL;

-- Step 6: Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_tutor_applications_postcode ON public.tutor_applications(postcode);
CREATE INDEX IF NOT EXISTS idx_tutor_applications_employment_status ON public.tutor_applications(employment_status) WHERE employment_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tutor_applications_education_level ON public.tutor_applications(education_level) WHERE education_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tutor_applications_based_in_country ON public.tutor_applications(based_in_country) WHERE based_in_country IS NOT NULL;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.tutor_applications.postcode IS 'Postcode for assessing tutor''s local availability';
COMMENT ON COLUMN public.tutor_applications.past_experience IS 'Description of past teaching/tutoring experience';
COMMENT ON COLUMN public.tutor_applications.weekly_availability IS 'Weekly availability schedule';
COMMENT ON COLUMN public.tutor_applications.employment_status IS 'Current employment status (Full-time, Part-time, etc.)';
COMMENT ON COLUMN public.tutor_applications.education_level IS 'Highest level of education (Bachelor''s, Master''s, PhD, etc.)';
COMMENT ON COLUMN public.tutor_applications.average_weekly_hours IS 'Average weekly hours available for tutoring';
COMMENT ON COLUMN public.tutor_applications.expected_hourly_rate IS 'Expected hourly rate for tutoring sessions';
COMMENT ON COLUMN public.tutor_applications.based_in_country IS 'Country where tutor is based';

-- Success message
SELECT 'Tutor application enhancements completed successfully!' as message; 