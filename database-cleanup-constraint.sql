-- PROFILE IMAGES CONSTRAINT CLEANUP & FIX
-- This script fixes existing data conflicts and applies the updated function
-- Run this in your Supabase SQL Editor

-- Step 1: Check current duplicate issues
SELECT 
    user_id,
    COUNT(*) as active_images_count
FROM public.profile_images 
WHERE is_active = true 
GROUP BY user_id 
HAVING COUNT(*) > 1
ORDER BY active_images_count DESC;

-- Step 2: Fix duplicate active images by keeping only the most recent one per user
WITH ranked_images AS (
    SELECT 
        id,
        user_id,
        is_active,
        uploaded_at,
        ROW_NUMBER() OVER (
            PARTITION BY user_id 
            ORDER BY uploaded_at DESC, created_at DESC
        ) as rn
    FROM public.profile_images 
    WHERE is_active = true
),
images_to_deactivate AS (
    SELECT id 
    FROM ranked_images 
    WHERE rn > 1
)
UPDATE public.profile_images 
SET is_active = false, updated_at = now()
WHERE id IN (SELECT id FROM images_to_deactivate);

-- Step 3: Verify the cleanup worked
SELECT 
    user_id,
    COUNT(*) as active_images_count
FROM public.profile_images 
WHERE is_active = true 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 4: Apply the updated activate_profile_image function
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
            
            -- Small delay to avoid race conditions
            PERFORM pg_sleep(0.1);
            
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

-- Step 5: Update profiles table to match the cleaned data
UPDATE public.profiles 
SET 
    profile_image_id = pi.id,
    profile_image_url = pi.file_path,
    updated_at = now()
FROM public.profile_images pi 
WHERE profiles.user_id = pi.user_id 
AND pi.is_active = true
AND (profiles.profile_image_id IS NULL OR profiles.profile_image_id != pi.id);

-- Step 6: Final verification
SELECT 
    'Cleanup completed! Each user now has at most 1 active profile image.' as message,
    COUNT(DISTINCT user_id) as users_with_active_images,
    COUNT(*) as total_active_images
FROM public.profile_images 
WHERE is_active = true; 