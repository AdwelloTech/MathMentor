-- REMOVE PROBLEMATIC CONSTRAINT AND FIX THE ISSUE
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the problematic unique constraint
ALTER TABLE public.profile_images 
DROP CONSTRAINT IF EXISTS profile_images_user_id_is_active_key;

-- Step 2: Create a better constraint that only applies when is_active = true
-- This prevents the race condition during activation
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_images_user_active 
ON public.profile_images (user_id) 
WHERE is_active = true;

-- Step 3: Create an improved activation function that handles this properly
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
    
    -- Simple approach: First deactivate ALL images for this user
    UPDATE public.profile_images 
    SET is_active = false, updated_at = now()
    WHERE user_id = image_user_id;
    
    -- Then activate only the selected image
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
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Clean up any existing data issues
UPDATE public.profile_images 
SET is_active = false 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id
    FROM public.profile_images 
    WHERE is_active = true
    ORDER BY user_id, uploaded_at DESC
);

-- Step 5: Alternative approach - if you want to completely remove profile images and start fresh
-- Uncomment the lines below if you want to delete all existing profile images:

-- DELETE FROM public.profile_images;
-- UPDATE public.profiles SET profile_image_id = NULL, profile_image_url = NULL;

-- Step 6: Verify the fix
SELECT 
    'Constraint fix applied successfully!' as message,
    COUNT(DISTINCT user_id) as users_with_active_images,
    COUNT(*) as total_active_images
FROM public.profile_images 
WHERE is_active = true; 