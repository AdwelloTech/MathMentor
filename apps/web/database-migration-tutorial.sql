-- Migration: Add tutorial system fields to profiles table
-- These fields track tutorial completion, dismissals, and display logic

-- Add the tutorial_completed column with a default value of false
ALTER TABLE profiles 
ADD COLUMN tutorial_completed BOOLEAN DEFAULT FALSE;

-- Add tutorial_dismissed_count to track how many times user dismissed tutorial
ALTER TABLE profiles 
ADD COLUMN tutorial_dismissed_count INTEGER DEFAULT 0;

-- Add tutorial_last_shown to track when tutorial was last displayed
ALTER TABLE profiles 
ADD COLUMN tutorial_last_shown TIMESTAMP WITH TIME ZONE;

-- Update existing users to have tutorial_completed = false
-- This ensures all existing users will see the tutorial on their next visit
UPDATE profiles 
SET tutorial_completed = FALSE 
WHERE tutorial_completed IS NULL;

-- Add comments to document the fields
COMMENT ON COLUMN profiles.tutorial_completed IS 'Indicates whether the user has completed the onboarding tutorial';
COMMENT ON COLUMN profiles.tutorial_dismissed_count IS 'Number of times user has dismissed the tutorial';
COMMENT ON COLUMN profiles.tutorial_last_shown IS 'Timestamp when tutorial was last shown to user';

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('tutorial_completed', 'tutorial_dismissed_count', 'tutorial_last_shown')
ORDER BY column_name;
