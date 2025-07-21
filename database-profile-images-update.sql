-- PROFILE IMAGES DATABASE UPDATE
-- Add profile image functionality with proper file management
-- Run this script in your Supabase SQL Editor

-- Step 1: Create profile_images table for managing uploaded images
CREATE TABLE IF NOT EXISTS public.profile_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    is_active BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Ensure only one active profile image per user
    UNIQUE(user_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Step 2: Add profile image reference to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profile_image_id UUID REFERENCES public.profile_images(id),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Step 3: Create storage bucket for profile images (if not exists)
-- Note: This needs to be run with proper permissions or via Supabase dashboard
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-images',
    'profile-images', 
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_images_user_id ON public.profile_images(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_images_profile_id ON public.profile_images(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_images_is_active ON public.profile_images(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_profile_image_id ON public.profiles(profile_image_id);

-- Step 5: Enable RLS for profile_images table
ALTER TABLE public.profile_images ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for profile_images
-- Users can view their own profile images
CREATE POLICY "Users can view their own profile images" 
ON public.profile_images FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own profile images
CREATE POLICY "Users can upload their own profile images" 
ON public.profile_images FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile images
CREATE POLICY "Users can update their own profile images" 
ON public.profile_images FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own profile images
CREATE POLICY "Users can delete their own profile images" 
ON public.profile_images FOR DELETE 
USING (auth.uid() = user_id);

-- Allow public read access for profile images (for displaying in app)
CREATE POLICY "Public read access for active profile images" 
ON public.profile_images FOR SELECT 
USING (is_active = true);

-- Step 7: Create function to handle profile image activation
CREATE OR REPLACE FUNCTION public.activate_profile_image(image_id UUID)
RETURNS VOID AS $$
DECLARE
    image_user_id UUID;
    image_profile_id UUID;
    image_url TEXT;
BEGIN
    -- Get image details
    SELECT user_id, profile_id, file_path 
    INTO image_user_id, image_profile_id, image_url
    FROM public.profile_images 
    WHERE id = image_id;
    
    -- Check if image exists and user has permission
    IF image_user_id IS NULL THEN
        RAISE EXCEPTION 'Image not found';
    END IF;
    
    IF image_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- Use a transaction block to ensure atomicity
    BEGIN
        -- First, deactivate all other profile images for this user
        UPDATE public.profile_images 
        SET is_active = false, updated_at = now()
        WHERE user_id = image_user_id AND id != image_id AND is_active = true;
        
        -- Then activate the selected image
        UPDATE public.profile_images 
        SET is_active = true, updated_at = now()
        WHERE id = image_id;
        
        -- Update profile table with the new image reference
        UPDATE public.profiles 
        SET 
            profile_image_id = image_id,
            profile_image_url = image_url,
            updated_at = now()
        WHERE user_id = image_user_id;
        
    EXCEPTION
        WHEN unique_violation THEN
            -- Handle the unique constraint violation by retrying once
            RAISE NOTICE 'Unique constraint violation detected, retrying...';
            
            -- Force deactivate all images for this user
            UPDATE public.profile_images 
            SET is_active = false, updated_at = now()
            WHERE user_id = image_user_id;
            
            -- Now activate the selected image
            UPDATE public.profile_images 
            SET is_active = true, updated_at = now()
            WHERE id = image_id;
            
            -- Update profile table
            UPDATE public.profiles 
            SET 
                profile_image_id = image_id,
                profile_image_url = image_url,
                updated_at = now()
            WHERE user_id = image_user_id;
    END;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to handle profile image deletion
CREATE OR REPLACE FUNCTION public.delete_profile_image(image_id UUID)
RETURNS VOID AS $$
DECLARE
    image_user_id UUID;
    is_current_active BOOLEAN;
BEGIN
    -- Get image details
    SELECT user_id, is_active 
    INTO image_user_id, is_current_active
    FROM public.profile_images 
    WHERE id = image_id;
    
    -- Check permissions
    IF image_user_id IS NULL THEN
        RAISE EXCEPTION 'Image not found';
    END IF;
    
    IF image_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;
    
    -- If this was the active image, clear it from profile
    IF is_current_active THEN
        UPDATE public.profiles 
        SET 
            profile_image_id = NULL,
            profile_image_url = NULL,
            updated_at = now()
        WHERE user_id = image_user_id;
    END IF;
    
    -- Delete the image record
    DELETE FROM public.profile_images WHERE id = image_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Add updated_at trigger for profile_images
CREATE TRIGGER handle_updated_at_profile_images
    BEFORE UPDATE ON public.profile_images
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Step 10: Create a view for profiles with active profile images
CREATE OR REPLACE VIEW public.profiles_with_images AS
SELECT 
    p.*,
    pi.id as profile_image_id_detail,
    pi.file_name,
    pi.original_name,
    pi.file_path as image_file_path,
    pi.file_size,
    pi.mime_type,
    pi.width as image_width,
    pi.height as image_height,
    pi.uploaded_at as image_uploaded_at
FROM public.profiles p
LEFT JOIN public.profile_images pi ON p.profile_image_id = pi.id AND pi.is_active = true;

-- Step 11: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_images TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_profile_image(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_profile_image(UUID) TO authenticated;
GRANT SELECT ON public.profiles_with_images TO authenticated;

-- Step 12: Add comments for documentation
COMMENT ON TABLE public.profile_images IS 'Stores uploaded profile images for users';
COMMENT ON COLUMN public.profile_images.file_path IS 'Storage path for the uploaded image file';
COMMENT ON COLUMN public.profile_images.is_active IS 'Whether this is the currently active profile image';
COMMENT ON COLUMN public.profiles.profile_image_id IS 'Reference to the active profile image';
COMMENT ON COLUMN public.profiles.profile_image_url IS 'Direct URL to the profile image for quick access';

-- Step 13: Insert default storage policies (if needed)
-- Note: Storage policies need to be configured via Supabase dashboard or API

-- Success message
SELECT 'Profile images database update completed successfully! 
Created profile_images table and updated profiles table.
Storage bucket "profile-images" configured with 5MB limit.
Added RLS policies and helper functions.' as message; 