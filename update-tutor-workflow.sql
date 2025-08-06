-- Update Tutor Workflow: Require both application approval AND ID verification approval
-- This script updates the existing database to implement the new two-step approval process

-- Add columns to profiles table for tutor feature control
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "tutor_features_enabled" boolean DEFAULT false;

-- Add columns to tutor_applications table for full activation tracking
ALTER TABLE "public"."tutor_applications" 
ADD COLUMN IF NOT EXISTS "fully_activated" boolean DEFAULT false;

ALTER TABLE "public"."tutor_applications" 
ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;

-- Create function to enable full tutor features when both application and ID verification are approved
CREATE OR REPLACE FUNCTION enable_full_tutor_features(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    app_record public.tutor_applications%ROWTYPE;
    verification_record public.id_verifications%ROWTYPE;
BEGIN
    -- Get the tutor application
    SELECT * INTO app_record 
    FROM public.tutor_applications 
    WHERE user_id = user_id_param 
    AND application_status = 'approved';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No approved tutor application found for user';
    END IF;
    
    -- Get the ID verification
    SELECT * INTO verification_record 
    FROM public.id_verifications 
    WHERE user_id = user_id_param 
    AND verification_status = 'approved'
    ORDER BY submitted_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No approved ID verification found for user';
    END IF;
    
    -- Update the user's profile to enable full tutor features
    UPDATE public.profiles 
    SET 
        is_active = true,
        tutor_features_enabled = true,
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    -- Update the tutor application to mark as fully activated
    UPDATE public.tutor_applications 
    SET 
        fully_activated = true,
        activated_at = NOW(),
        updated_at = NOW()
    WHERE user_id = user_id_param;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error enabling full tutor features: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically enable full tutor features when ID verification is approved
CREATE OR REPLACE FUNCTION trigger_enable_full_tutor_features()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when verification status changes to 'approved'
    IF NEW.verification_status = 'approved' AND OLD.verification_status != 'approved' THEN
        -- Call the function to enable full tutor features
        PERFORM enable_full_tutor_features(NEW.user_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enable full tutor features when ID verification is approved
DROP TRIGGER IF EXISTS enable_full_tutor_features_trigger ON id_verifications;
CREATE TRIGGER enable_full_tutor_features_trigger
    AFTER UPDATE ON id_verifications
    FOR EACH ROW EXECUTE FUNCTION trigger_enable_full_tutor_features();

-- Update existing approved applications to disable tutor features until ID verification is approved
UPDATE public.profiles 
SET tutor_features_enabled = false
WHERE role = 'tutor' AND tutor_features_enabled IS NULL;

-- For existing tutors who already have approved applications, check if they have approved ID verification
-- If they do, enable their features; if not, disable them
UPDATE public.profiles 
SET tutor_features_enabled = (
    EXISTS (
        SELECT 1 FROM public.id_verifications iv
        WHERE iv.user_id = profiles.user_id 
        AND iv.verification_status = 'approved'
    )
)
WHERE role = 'tutor';

-- Update tutor applications to mark as fully activated if both conditions are met
UPDATE public.tutor_applications 
SET 
    fully_activated = (
        EXISTS (
            SELECT 1 FROM public.id_verifications iv
            WHERE iv.user_id = tutor_applications.user_id 
            AND iv.verification_status = 'approved'
        )
    ),
    activated_at = CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.id_verifications iv
            WHERE iv.user_id = tutor_applications.user_id 
            AND iv.verification_status = 'approved'
        ) THEN NOW()
        ELSE NULL
    END
WHERE application_status = 'approved';

-- Verify the setup
SELECT 'Tutor workflow updated successfully' as status;
SELECT COUNT(*) as tutors_with_features_enabled FROM profiles WHERE role = 'tutor' AND tutor_features_enabled = true;
SELECT COUNT(*) as tutors_without_features FROM profiles WHERE role = 'tutor' AND tutor_features_enabled = false; 