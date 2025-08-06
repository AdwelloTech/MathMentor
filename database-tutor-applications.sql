-- TUTOR APPLICATION SYSTEM DATABASE SETUP
-- Run this script after the main database setup to add tutor application functionality

-- Step 1: Create tutor_applications table
CREATE TABLE IF NOT EXISTS public.tutor_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    applicant_email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    subjects TEXT[] NOT NULL DEFAULT '{}',
    specializes_learning_disabilities BOOLEAN DEFAULT FALSE,
    cv_file_name TEXT,
    cv_url TEXT,
    cv_file_size INTEGER,
    additional_notes TEXT,
    application_status TEXT DEFAULT 'pending' CHECK (application_status IN ('pending', 'approved', 'rejected', 'under_review')),
    admin_notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS tutor_applications_user_id_idx ON public.tutor_applications(user_id);
CREATE INDEX IF NOT EXISTS tutor_applications_status_idx ON public.tutor_applications(application_status);
CREATE INDEX IF NOT EXISTS tutor_applications_submitted_at_idx ON public.tutor_applications(submitted_at);
CREATE INDEX IF NOT EXISTS tutor_applications_email_idx ON public.tutor_applications(applicant_email);

-- Step 3: Enable RLS
ALTER TABLE public.tutor_applications ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Users can view their own applications
CREATE POLICY "Users can view their own tutor applications" 
ON public.tutor_applications FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own applications
CREATE POLICY "Users can submit tutor applications" 
ON public.tutor_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending applications
CREATE POLICY "Users can update their pending applications" 
ON public.tutor_applications FOR UPDATE 
USING (auth.uid() = user_id AND application_status = 'pending');

-- Admins can view and manage all applications
CREATE POLICY "Admins can manage all tutor applications" 
ON public.tutor_applications FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'principal', 'hr')
  )
);

-- Step 5: Create trigger for updated_at
CREATE TRIGGER handle_updated_at_tutor_applications
    BEFORE UPDATE ON public.tutor_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 6: Create function to handle application approval
CREATE OR REPLACE FUNCTION public.approve_tutor_application(
    application_id UUID,
    admin_user_id UUID,
    admin_notes_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    app_record public.tutor_applications%ROWTYPE;
    profile_record public.profiles%ROWTYPE;
BEGIN
    -- Get the application record
    SELECT * INTO app_record 
    FROM public.tutor_applications 
    WHERE id = application_id AND application_status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or not pending';
    END IF;
    
    -- Get the user's profile
    SELECT * INTO profile_record 
    FROM public.profiles 
    WHERE user_id = app_record.user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Update the application status
    UPDATE public.tutor_applications 
    SET 
        application_status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = admin_user_id,
        approved_by = admin_user_id,
        admin_notes = admin_notes_text,
        updated_at = NOW()
    WHERE id = application_id;
    
    -- Update the user's profile to tutor role and add application data
    -- Note: tutor_features_enabled will be set to true only after ID verification is approved
    UPDATE public.profiles 
    SET 
        role = 'tutor',
        full_name = app_record.full_name,
        phone = app_record.phone_number,
        subjects = app_record.subjects,
        specializations = CASE 
            WHEN app_record.specializes_learning_disabilities THEN ARRAY['Learning Disabilities']
            ELSE ARRAY[]::TEXT[]
        END,
        cv_url = app_record.cv_url,
        cv_file_name = app_record.cv_file_name,
        profile_completed = true,
        tutor_features_enabled = false, -- Will be enabled after ID verification approval
        updated_at = NOW()
    WHERE user_id = app_record.user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error approving application: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create function to handle application rejection
CREATE OR REPLACE FUNCTION public.reject_tutor_application(
    application_id UUID,
    admin_user_id UUID,
    rejection_reason_text TEXT,
    admin_notes_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the application status
    UPDATE public.tutor_applications 
    SET 
        application_status = 'rejected',
        reviewed_at = NOW(),
        reviewed_by = admin_user_id,
        rejection_reason = rejection_reason_text,
        admin_notes = admin_notes_text,
        updated_at = NOW()
    WHERE id = application_id AND application_status IN ('pending', 'under_review');
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or cannot be rejected';
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error rejecting application: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to get application statistics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_tutor_application_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_applications', (SELECT COUNT(*) FROM public.tutor_applications),
        'pending_applications', (SELECT COUNT(*) FROM public.tutor_applications WHERE application_status = 'pending'),
        'approved_applications', (SELECT COUNT(*) FROM public.tutor_applications WHERE application_status = 'approved'),
        'rejected_applications', (SELECT COUNT(*) FROM public.tutor_applications WHERE application_status = 'rejected'),
        'under_review_applications', (SELECT COUNT(*) FROM public.tutor_applications WHERE application_status = 'under_review'),
        'applications_this_month', (
            SELECT COUNT(*) FROM public.tutor_applications 
            WHERE submitted_at >= date_trunc('month', CURRENT_DATE)
        ),
        'applications_this_week', (
            SELECT COUNT(*) FROM public.tutor_applications 
            WHERE submitted_at >= date_trunc('week', CURRENT_DATE)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Insert sample subjects for reference (optional)
COMMENT ON TABLE public.tutor_applications IS 'Stores tutor application submissions with review workflow';
COMMENT ON COLUMN public.tutor_applications.subjects IS 'Array of subjects the applicant can teach (e.g., Mathematics, Physics, Chemistry, etc.)';
COMMENT ON COLUMN public.tutor_applications.application_status IS 'Application status: pending, under_review, approved, or rejected';
COMMENT ON COLUMN public.tutor_applications.cv_url IS 'URL to the uploaded CV file in Supabase storage';

-- Success message
SELECT 'Tutor application system database setup completed successfully!' as message; 