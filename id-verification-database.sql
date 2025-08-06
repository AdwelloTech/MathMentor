-- ID Verification Database Schema
-- This handles ID verification for tutors after application submission

-- Create ID verification table
CREATE TABLE IF NOT EXISTS "public"."id_verifications" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" uuid NOT NULL REFERENCES "public"."profiles"("user_id") ON DELETE CASCADE,
    "application_id" uuid REFERENCES "public"."tutor_applications"("id") ON DELETE CASCADE,
    "id_type" text NOT NULL CHECK (id_type IN ('national_id', 'passport', 'drivers_license', 'student_id', 'other')),
    "id_number" text NOT NULL,
    "full_name_on_id" text NOT NULL,
    "date_of_birth_on_id" date,
    "expiry_date" date,
    "issuing_country" text,
    "issuing_authority" text,
    "front_image_url" text,
    "back_image_url" text,
    "selfie_with_id_url" text,
    "verification_status" text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
    "admin_notes" text,
    "rejection_reason" text,
    "verified_at" timestamp with time zone,
    "verified_by" uuid REFERENCES "public"."profiles"("id"),
    "submitted_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_id_verifications_user_id" ON "public"."id_verifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_id_verifications_application_id" ON "public"."id_verifications"("application_id");
CREATE INDEX IF NOT EXISTS "idx_id_verifications_status" ON "public"."id_verifications"("verification_status");
CREATE INDEX IF NOT EXISTS "idx_id_verifications_submitted_at" ON "public"."id_verifications"("submitted_at");

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_id_verifications_updated_at 
    BEFORE UPDATE ON "public"."id_verifications" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for id_verifications table (like tutor_applications)
ALTER TABLE "public"."id_verifications" DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies since RLS is disabled
DROP POLICY IF EXISTS "Enable read access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for users to their own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read access for admins and own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for admins and own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for admins and own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for own id verifications" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable read access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable update access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable insert access for users and admins" ON "public"."id_verifications";
DROP POLICY IF EXISTS "Enable delete access for users and admins" ON "public"."id_verifications";

-- Create storage bucket for ID verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'id-verification-documents',
    'id-verification-documents',
    false,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for ID verification documents
-- Allow users to upload their own ID verification documents
CREATE POLICY "Users can upload their own ID verification documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'id-verification-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to view their own ID verification documents
CREATE POLICY "Users can view their own ID verification documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'id-verification-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow admins to view all ID verification documents
CREATE POLICY "Admins can view all ID verification documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'id-verification-documents' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow users to update their own ID verification documents
CREATE POLICY "Users can update their own ID verification documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'id-verification-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow users to delete their own ID verification documents
CREATE POLICY "Users can delete their own ID verification documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'id-verification-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Add ID verification status to tutor_applications table
ALTER TABLE "public"."tutor_applications" 
ADD COLUMN IF NOT EXISTS "id_verification_status" text DEFAULT 'not_submitted' 
CHECK (id_verification_status IN ('not_submitted', 'pending', 'approved', 'rejected'));

-- Add ID verification required flag
ALTER TABLE "public"."tutor_applications" 
ADD COLUMN IF NOT EXISTS "id_verification_required" boolean DEFAULT true;

-- Create function to update application status when ID verification is submitted
CREATE OR REPLACE FUNCTION update_application_id_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the tutor application's ID verification status
    UPDATE tutor_applications 
    SET id_verification_status = NEW.verification_status
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Create trigger to automatically update application status and enable features
CREATE TRIGGER update_application_id_verification_trigger
    AFTER INSERT OR UPDATE ON id_verifications
    FOR EACH ROW EXECUTE FUNCTION update_application_id_verification_status();

-- Create trigger to enable full tutor features when ID verification is approved
CREATE TRIGGER enable_full_tutor_features_trigger
    AFTER UPDATE ON id_verifications
    FOR EACH ROW EXECUTE FUNCTION trigger_enable_full_tutor_features();

-- Add columns to profiles table for tutor feature control
ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "tutor_features_enabled" boolean DEFAULT false;

-- Add columns to tutor_applications table for full activation tracking
ALTER TABLE "public"."tutor_applications" 
ADD COLUMN IF NOT EXISTS "fully_activated" boolean DEFAULT false;

ALTER TABLE "public"."tutor_applications" 
ADD COLUMN IF NOT EXISTS "activated_at" timestamp with time zone;

-- Sample data for testing (optional)
INSERT INTO "public"."id_verifications" (
    "user_id", 
    "application_id", 
    "id_type", 
    "id_number", 
    "full_name_on_id", 
    "date_of_birth_on_id", 
    "expiry_date", 
    "issuing_country", 
    "issuing_authority", 
    "verification_status"
) VALUES (
    '0cff9583-0932-4781-824f-19eb56b8770f', -- Existing tutor user_id from profiles table
    '14be570e-46ee-435e-8d5a-73d161e76727', -- Existing application_id for this user_id
    'national_id',
    'NIC123456789',
    'Gaurava Teacher',
    '2002-04-24', -- Date of birth for Gaurava Bandaranayakaa
    '2030-12-31',
    'Sri Lanka',
    'Department of Registration of Persons',
    'pending'
) ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'ID verification table created successfully' as status;
SELECT COUNT(*) as verification_count FROM public.id_verifications;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'id_verifications'; 